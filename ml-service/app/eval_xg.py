from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Tuple

import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    log_loss,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from xgboost import XGBClassifier

from .xg_types import (
    CATEGORICAL_FEATURE_COLUMNS,
    MODEL_FEATURE_COLUMNS,
    TARGET_COLUMN,
)


def _read_input_table(path: str | Path) -> pd.DataFrame:
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")

    suffix = path.suffix.lower()

    if suffix == ".csv":
        return pd.read_csv(path)

    if suffix in {".parquet", ".pq"}:
        return pd.read_parquet(path)

    raise ValueError(f"Unsupported input file type: {suffix}")


def _load_metadata(path: str | Path) -> Dict[str, Any]:
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(f"Metadata file not found: {path}")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_model(path: str | Path) -> XGBClassifier:
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")

    model = XGBClassifier()
    model.load_model(str(path))
    return model


def _require_columns(df: pd.DataFrame, required: list[str]) -> None:
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def _prepare_eval_frame(
    df: pd.DataFrame,
    active_base_feature_columns: list[str],
    include_empty_net: bool,
) -> pd.DataFrame:
    df = df.copy()

    required = ["game_id", TARGET_COLUMN] + active_base_feature_columns
    _require_columns(df, required)

    df[TARGET_COLUMN] = pd.to_numeric(df[TARGET_COLUMN], errors="coerce")
    df = df[df[TARGET_COLUMN].isin([0, 1])].copy()
    df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(int)

    if not include_empty_net:
        if "is_empty_net" in df.columns:
            df = df[df["is_empty_net"] == 0].copy()

        if "strength_state" in df.columns:
            df = df[df["strength_state"] != "empty-net"].copy()

    return df.reset_index(drop=True)


def _split_by_game(
    df: pd.DataFrame,
    test_size: float,
    random_state: int,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    if "game_id" not in df.columns or df["game_id"].nunique() < 2:
        train_df, valid_df = train_test_split(
            df,
            test_size=test_size,
            random_state=random_state,
            stratify=df[TARGET_COLUMN],
        )
        return train_df.reset_index(drop=True), valid_df.reset_index(drop=True)

    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=test_size,
        random_state=random_state,
    )

    groups = df["game_id"]
    train_idx, valid_idx = next(splitter.split(df, df[TARGET_COLUMN], groups=groups))

    train_df = df.iloc[train_idx].reset_index(drop=True)
    valid_df = df.iloc[valid_idx].reset_index(drop=True)

    return train_df, valid_df


def _encode_features(
    df: pd.DataFrame,
    active_base_feature_columns: list[str],
    encoded_feature_columns: list[str],
) -> pd.DataFrame:
    X = df[active_base_feature_columns].copy()

    categorical_cols = [col for col in CATEGORICAL_FEATURE_COLUMNS if col in X.columns]
    for col in categorical_cols:
        X[col] = X[col].astype("string").fillna("other")

    X = pd.get_dummies(
        X,
        columns=categorical_cols,
        dummy_na=False,
        dtype=int,
    )

    for col in encoded_feature_columns:
        if col not in X.columns:
            X[col] = 0

    X = X[encoded_feature_columns].copy()

    for col in X.columns:
        if X[col].dtype == bool:
            X[col] = X[col].astype(int)

    return X


def _safe_metric(fn, *args, **kwargs) -> float | None:
    try:
        return float(fn(*args, **kwargs))
    except Exception:
        return None


def _compute_metrics(
    y_true: pd.Series,
    y_prob: np.ndarray,
) -> Dict[str, float | None]:
    y_pred = (y_prob >= 0.5).astype(int)
    accuracy = float((y_pred == y_true.to_numpy()).mean())

    return {
        "accuracy_at_0_5": accuracy,
        "roc_auc": _safe_metric(roc_auc_score, y_true, y_prob),
        "average_precision": _safe_metric(average_precision_score, y_true, y_prob),
        "log_loss": _safe_metric(log_loss, y_true, y_prob, labels=[0, 1]),
        "brier_score": _safe_metric(brier_score_loss, y_true, y_prob),
    }


def _logit_from_prob(prob: np.ndarray) -> np.ndarray:
    clipped = np.clip(prob.astype(float), 1e-6, 1.0 - 1e-6)
    return np.log(clipped / (1.0 - clipped))


def _apply_probability_calibrator(
    raw_prob: np.ndarray,
    calibration: Dict[str, Any] | None,
) -> np.ndarray:
    if not calibration:
        return raw_prob.astype(float)

    coef = float(calibration["coef"])
    intercept = float(calibration["intercept"])

    raw_logit = _logit_from_prob(raw_prob)
    calibrated_logit = (coef * raw_logit) + intercept
    calibrated_prob = 1.0 / (1.0 + np.exp(-calibrated_logit))

    return calibrated_prob.astype(float)


def _build_reliability_table(
    y_true: pd.Series,
    y_prob: np.ndarray,
    n_bins: int = 10,
) -> pd.DataFrame:
    df = pd.DataFrame(
        {
            "y_true": y_true.to_numpy(),
            "y_prob": y_prob,
        }
    )

    edges = np.linspace(0.0, 1.0, n_bins + 1)
    labels = [f"{edges[i]:.2f}-{edges[i + 1]:.2f}" for i in range(n_bins)]

    df["prob_bin"] = pd.cut(
        df["y_prob"],
        bins=edges,
        labels=labels,
        include_lowest=True,
        right=True,
    )

    grouped = (
        df.groupby("prob_bin", observed=False)
        .agg(
            shots=("y_true", "size"),
            goals=("y_true", "sum"),
            avg_pred_prob=("y_prob", "mean"),
            actual_goal_rate=("y_true", "mean"),
        )
        .reset_index()
    )

    grouped["goals"] = grouped["goals"].fillna(0).astype(int)
    grouped["shots"] = grouped["shots"].fillna(0).astype(int)
    grouped["avg_pred_prob"] = grouped["avg_pred_prob"].astype(float)
    grouped["actual_goal_rate"] = grouped["actual_goal_rate"].astype(float)
    grouped["calibration_gap"] = grouped["avg_pred_prob"] - grouped["actual_goal_rate"]

    return grouped


def _build_game_totals_table(valid_df: pd.DataFrame) -> pd.DataFrame:
    rows = []

    for game_id, game_df in valid_df.groupby("game_id", dropna=False):
        teams = (
            game_df.groupby("team", dropna=False)["pred_xg"]
            .sum()
            .sort_values(ascending=False)
        )

        total_xg = float(game_df["pred_xg"].sum())
        goal_count = int(game_df[TARGET_COLUMN].sum())
        shot_count = int(len(game_df))

        row: Dict[str, Any] = {
            "game_id": int(game_id),
            "total_pred_xg": total_xg,
            "shot_rows": shot_count,
            "actual_goals": goal_count,
        }

        if "game_date" in game_df.columns:
            row["game_date"] = str(game_df["game_date"].iloc[0])

        if "home_team" in game_df.columns:
            row["home_team"] = str(game_df["home_team"].iloc[0])

        if "away_team" in game_df.columns:
            row["away_team"] = str(game_df["away_team"].iloc[0])

        team_items = list(teams.items())
        for idx, (team_name, xg_value) in enumerate(team_items[:2], start=1):
            row[f"team_{idx}"] = str(team_name)
            row[f"team_{idx}_xg"] = float(xg_value)

        rows.append(row)

    out = pd.DataFrame(rows)

    if out.empty:
        return out

    out = out.sort_values("total_pred_xg", ascending=False).reset_index(drop=True)
    return out


def evaluate_xg_model(
    input_path: str | Path,
    model_path: str | Path = "data/xg/models/xg_shot_model.json",
    metadata_path: str | Path = "data/xg/models/xg_training_metadata.json",
    include_empty_net: bool = False,
    n_bins: int = 10,
) -> Dict[str, Any]:
    df = _read_input_table(input_path)
    metadata = _load_metadata(metadata_path)
    model = _load_model(model_path)

    test_size = float(metadata.get("test_size", 0.2))
    random_state = int(metadata.get("random_state", 42))
    encoded_feature_columns = list(metadata["encoded_feature_columns"])
    active_base_feature_columns = list(
        metadata.get("active_base_feature_columns", MODEL_FEATURE_COLUMNS)
    )

    df = _prepare_eval_frame(
        df=df,
        active_base_feature_columns=active_base_feature_columns,
        include_empty_net=include_empty_net,
    )

    if df.empty:
        raise RuntimeError("Evaluation frame is empty")

    _, valid_df = _split_by_game(
        df=df,
        test_size=test_size,
        random_state=random_state,
    )

    X_valid = _encode_features(
        df=valid_df,
        active_base_feature_columns=active_base_feature_columns,
        encoded_feature_columns=encoded_feature_columns,
    )
    y_valid = valid_df[TARGET_COLUMN].astype(int)

    raw_prob = model.predict_proba(X_valid)[:, 1]
    pred_prob = _apply_probability_calibrator(
        raw_prob=raw_prob,
        calibration=metadata.get("probability_calibration"),
    )

    metrics_raw = _compute_metrics(y_valid, raw_prob)
    metrics_calibrated = _compute_metrics(y_valid, pred_prob)

    scored_valid = valid_df.copy()
    scored_valid["pred_xg_raw"] = raw_prob.astype(float)
    scored_valid["pred_xg"] = pred_prob.astype(float)

    reliability_df = _build_reliability_table(
        y_true=y_valid,
        y_prob=pred_prob,
        n_bins=n_bins,
    )

    game_totals_df = _build_game_totals_table(scored_valid)

    summary = {
        "validation_rows": int(len(scored_valid)),
        "validation_games": int(scored_valid["game_id"].nunique()),
        "validation_goal_rate": float(scored_valid[TARGET_COLUMN].mean()),
        "avg_total_xg_per_game": None,
        "median_total_xg_per_game": None,
        "avg_actual_goals_per_game": None,
    }

    if not game_totals_df.empty:
        summary["avg_total_xg_per_game"] = float(game_totals_df["total_pred_xg"].mean())
        summary["median_total_xg_per_game"] = float(game_totals_df["total_pred_xg"].median())
        summary["avg_actual_goals_per_game"] = float(game_totals_df["actual_goals"].mean())

    return {
        "metrics_raw": metrics_raw,
        "metrics_calibrated": metrics_calibrated,
        "summary": summary,
        "reliability_df": reliability_df,
        "game_totals_df": game_totals_df,
        "scored_valid_df": scored_valid,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to engineered xG CSV or Parquet")
    parser.add_argument("--model-path", default="data/xg/models/xg_shot_model.json")
    parser.add_argument("--metadata-path", default="data/xg/models/xg_training_metadata.json")
    parser.add_argument("--include-empty-net", action="store_true")
    parser.add_argument("--bins", type=int, default=10)
    parser.add_argument("--top-games", type=int, default=10)

    args = parser.parse_args()

    result = evaluate_xg_model(
        input_path=args.input,
        model_path=args.model_path,
        metadata_path=args.metadata_path,
        include_empty_net=args.include_empty_net,
        n_bins=args.bins,
    )

    print("Raw validation metrics")
    for key, value in result["metrics_raw"].items():
        print(f"- {key}: {value}")

    print("\nCalibrated validation metrics")
    for key, value in result["metrics_calibrated"].items():
        print(f"- {key}: {value}")

    print("\nValidation summary")
    for key, value in result["summary"].items():
        print(f"- {key}: {value}")

    print("\nReliability table")
    print(result["reliability_df"].to_string(index=False))

    print("\nTop predicted total xG games on validation split")
    top_games_df = result["game_totals_df"].head(args.top_games)
    if top_games_df.empty:
        print("No validation games found")
    else:
        print(top_games_df.to_string(index=False))


if __name__ == "__main__":
    main()