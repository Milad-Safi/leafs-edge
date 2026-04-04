from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd

from .xg_types import (
    BOOLEAN_FEATURE_COLUMNS,
    CATEGORICAL_FEATURE_COLUMNS,
    MODEL_FEATURE_COLUMNS,
    NUMERIC_FEATURE_COLUMNS,
    RAW_REQUIRED_COLUMNS,
    SUPPORTED_EVENT_TYPES,
    TARGET_COLUMN,
    map_prev_event_type_group,
    map_shot_type_group,
)


GOAL_X = 89.0
SECONDS_SINCE_LAST_EVENT_CAP = 10.0


def _require_columns(df: pd.DataFrame, required: Iterable[str]) -> None:
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def _read_input_table(path: str | Path) -> pd.DataFrame:
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")

    suffix = path.suffix.lower()

    if suffix == ".csv":
        return pd.read_csv(
            path,
            dtype={"situation_code": "string"},
            low_memory=False,
        )

    if suffix in {".parquet", ".pq"}:
        return pd.read_parquet(path)

    raise ValueError(f"Unsupported input file type: {suffix}")


def _write_output_table(df: pd.DataFrame, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    suffix = path.suffix.lower()

    if suffix == ".csv":
        df.to_csv(path, index=False)
        return

    if suffix in {".parquet", ".pq"}:
        df.to_parquet(path, index=False)
        return

    raise ValueError(f"Unsupported output file type: {suffix}")


def _to_bool_series(series: pd.Series) -> pd.Series:
    if series.dtype == bool:
        return series.fillna(False)

    return (
        series.astype(str)
        .str.strip()
        .str.lower()
        .map(
            {
                "true": True,
                "false": False,
                "1": True,
                "0": False,
                "1.0": True,
                "0.0": False,
                "yes": True,
                "no": False,
                "nan": False,
                "none": False,
                "": False,
            }
        )
        .fillna(False)
        .astype(bool)
    )


def _to_numeric_series(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def _normalise_situation_code_value(value: object) -> str | None:
    if value is None:
        return None

    text = str(value).strip()

    if not text or text.lower() in {"nan", "none", "<na>"}:
        return None

    if text.endswith(".0"):
        text = text[:-2]

    text = "".join(ch for ch in text if ch.isdigit())

    if not text:
        return None

    if len(text) < 4:
        text = text.zfill(4)

    if len(text) > 4:
        text = text[-4:]

    return text


def _parse_situation_code(code: str | None) -> tuple[int, int, int, int] | None:
    if code is None:
        return None

    code = _normalise_situation_code_value(code)
    if code is None or len(code) != 4 or not code.isdigit():
        return None

    away_skaters = int(code[0])
    away_goalie = int(code[1])
    home_skaters = int(code[2])
    home_goalie = int(code[3])

    return away_skaters, away_goalie, home_skaters, home_goalie


def _derive_is_empty_net(
    situation_code: str | None,
    raw_empty_net: bool,
) -> bool:
    parsed = _parse_situation_code(situation_code)

    if parsed is not None:
        _, away_goalie, _, home_goalie = parsed
        if away_goalie == 0 or home_goalie == 0:
            return True

    return bool(raw_empty_net)


def _compute_shooter_relative_strength_state(
    situation_code: str | None,
    is_home: bool,
) -> str:
    parsed = _parse_situation_code(situation_code)

    if parsed is None:
        return "other"

    away_skaters, away_goalie, home_skaters, home_goalie = parsed

    if away_goalie == 0 or home_goalie == 0:
        return "empty-net"

    shooter_skaters = home_skaters if is_home else away_skaters
    opp_skaters = away_skaters if is_home else home_skaters

    if shooter_skaters == opp_skaters:
        return "even"

    if shooter_skaters > opp_skaters:
        return "advantaged"

    if shooter_skaters < opp_skaters:
        return "shorthanded"

    return "other"


def _clean_raw_shot_frame(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    _require_columns(df, RAW_REQUIRED_COLUMNS)

    df["event_type"] = df["event_type"].astype(str).str.strip().str.lower()
    df = df[df["event_type"].isin(SUPPORTED_EVENT_TYPES)].copy()

    numeric_cols = [
        "x_coord",
        "y_coord",
        "abs_game_seconds",
        "seconds_since_last_event",
        "period_number",
    ]
    for col in numeric_cols:
        df[col] = _to_numeric_series(df[col])

    bool_cols = [
        "is_goal",
        "is_home",
        "same_team_as_prev",
        "is_rebound_candidate",
        "empty_net",
    ]
    for col in bool_cols:
        df[col] = _to_bool_series(df[col])

    df["situation_code"] = df["situation_code"].apply(_normalise_situation_code_value)

    string_cols = [
        "game_date",
        "period_type",
        "shot_type",
        "prev_event_type",
        "team",
        "opponent",
        "home_team",
        "away_team",
    ]
    for col in string_cols:
        df[col] = df[col].where(df[col].notna(), None)
        df[col] = df[col].astype("string")

    df["situation_code"] = pd.Series(df["situation_code"], index=df.index, dtype="string")

    df = df[df["x_coord"].notna() & df["y_coord"].notna()].copy()

    subset = ["game_id", "event_index"] if "event_index" in df.columns else ["game_id", "event_id"]
    subset = [col for col in subset if col in df.columns]
    if subset:
        df = df.drop_duplicates(subset=subset, keep="first").copy()

    return df.reset_index(drop=True)


def _add_geometry_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    abs_x = df["x_coord"].abs()
    abs_y = df["y_coord"].abs()

    df["norm_x"] = abs_x
    df["norm_y"] = abs_y

    dx_to_net = (GOAL_X - abs_x).abs()

    df["distance_ft"] = np.sqrt((dx_to_net ** 2) + (abs_y ** 2))
    df["angle_deg"] = np.degrees(np.arctan2(abs_y, np.maximum(dx_to_net, 1e-6)))
    df["abs_angle_deg"] = df["angle_deg"].abs()

    return df


def _add_context_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["is_rebound"] = _to_bool_series(df["is_rebound_candidate"])
    df["is_same_team_as_prev"] = _to_bool_series(df["same_team_as_prev"])
    df["is_overtime"] = df["period_type"].astype(str).str.upper().eq("OT")

    raw_empty_net = _to_bool_series(df["empty_net"])
    df["is_empty_net"] = df.apply(
        lambda row: _derive_is_empty_net(
            None if pd.isna(row["situation_code"]) else str(row["situation_code"]),
            bool(raw_empty_net.loc[row.name]),
        ),
        axis=1,
    ).astype(int)

    seconds = _to_numeric_series(df["seconds_since_last_event"]).fillna(SECONDS_SINCE_LAST_EVENT_CAP)
    seconds = seconds.clip(lower=0.0, upper=SECONDS_SINCE_LAST_EVENT_CAP)
    df["seconds_since_last_event_capped"] = seconds.astype(float)

    df["shot_type_group"] = (
        df["shot_type"]
        .apply(lambda x: map_shot_type_group(None if pd.isna(x) else str(x)))
        .astype("string")
    )

    df["prev_event_type_group"] = (
        df["prev_event_type"]
        .apply(lambda x: map_prev_event_type_group(None if pd.isna(x) else str(x)))
        .astype("string")
    )

    df["strength_state"] = df.apply(
        lambda row: _compute_shooter_relative_strength_state(
            None if pd.isna(row["situation_code"]) else str(row["situation_code"]),
            bool(row["is_home"]),
        ),
        axis=1,
    ).astype("string")

    return df


def _add_target(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df[TARGET_COLUMN] = _to_bool_series(df["is_goal"]).astype(int)
    return df


def _finalise_feature_dtypes(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    for col in NUMERIC_FEATURE_COLUMNS:
        df[col] = _to_numeric_series(df[col]).astype(float)

    for col in BOOLEAN_FEATURE_COLUMNS:
        df[col] = _to_bool_series(df[col]).astype(int)

    for col in CATEGORICAL_FEATURE_COLUMNS:
        df[col] = df[col].astype("string").fillna("other")

    df[TARGET_COLUMN] = _to_numeric_series(df[TARGET_COLUMN]).fillna(0).astype(int)

    return df


def engineer_xg_features(
    raw_df: pd.DataFrame,
    keep_context_columns: bool = True,
) -> pd.DataFrame:
    df = _clean_raw_shot_frame(raw_df)
    df = _add_geometry_features(df)
    df = _add_context_features(df)
    df = _add_target(df)
    df = _finalise_feature_dtypes(df)

    context_cols = [
        "game_id",
        "game_date",
        "event_index",
        "event_id",
        "period_number",
        "period_type",
        "abs_game_seconds",
        "team",
        "opponent",
        "home_team",
        "away_team",
        "event_type",
        "shot_type",
        "x_coord",
        "y_coord",
        "situation_code",
    ]
    context_cols = [col for col in context_cols if col in df.columns]

    if keep_context_columns:
        ordered_cols = context_cols + MODEL_FEATURE_COLUMNS + [TARGET_COLUMN]
    else:
        ordered_cols = MODEL_FEATURE_COLUMNS + [TARGET_COLUMN]

    ordered_cols = [col for col in ordered_cols if col in df.columns]

    df = df[ordered_cols].copy()

    sort_cols = [col for col in ["game_date", "game_id", "abs_game_seconds", "event_index"] if col in df.columns]
    if sort_cols:
        df = df.sort_values(sort_cols, kind="stable").reset_index(drop=True)

    return df


def load_and_engineer_xg_features(
    input_path: str | Path,
    keep_context_columns: bool = True,
) -> pd.DataFrame:
    raw_df = _read_input_table(input_path)
    return engineer_xg_features(raw_df, keep_context_columns=keep_context_columns)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to raw xG shot CSV or Parquet")
    parser.add_argument("--output", default=None, help="Optional path to save engineered features")
    parser.add_argument(
        "--drop-context",
        action="store_true",
        help="Only keep final model feature columns plus target",
    )

    args = parser.parse_args()

    features_df = load_and_engineer_xg_features(
        input_path=args.input,
        keep_context_columns=not args.drop_context,
    )

    print(f"Rows: {len(features_df)}")
    print(f"Cols: {len(features_df.columns)}")
    if TARGET_COLUMN in features_df.columns:
        print(f"Goals: {int(features_df[TARGET_COLUMN].sum())}")
        print(f"Goal rate: {features_df[TARGET_COLUMN].mean():.6f}")

    if "strength_state" in features_df.columns:
        print("\nStrength state counts")
        print(features_df["strength_state"].value_counts(dropna=False).to_string())

    if "is_empty_net" in features_df.columns:
        print("\nEmpty-net rows")
        print(int(features_df["is_empty_net"].sum()))

    print("\nColumns:")
    for col in features_df.columns:
        print(f"- {col}")

    if args.output:
        _write_output_table(features_df, args.output)
        print(f"\nWrote engineered features -> {args.output}")


if __name__ == "__main__":
    main()