from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Tuple

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
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


EXCLUDED_BASE_FEATURE_COLUMNS = {"is_home"}


def _get_active_base_feature_columns(keep_is_home: bool = False) -> list[str]:
    if keep_is_home:
        return list(MODEL_FEATURE_COLUMNS)

    return [col for col in MODEL_FEATURE_COLUMNS if col not in EXCLUDED_BASE_FEATURE_COLUMNS]


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


def _require_columns(df: pd.DataFrame, required: list[str]) -> None:
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def _prepare_training_frame(
    df: pd.DataFrame,
    active_base_feature_columns: list[str],
    include_empty_net: bool = False,
) -> pd.DataFrame:
    df = df.copy()

    required = ["game_id", TARGET_COLUMN] + active_base_feature_columns
    _require_columns(df, required)

    if not include_empty_net:
        if "is_empty_net" in df.columns:
            df = df[df["is_empty_net"] == 0].copy()

        if "strength_state" in df.columns:
            df = df[df["strength_state"] != "empty-net"].copy()

    df = df.dropna(subset=[TARGET_COLUMN]).copy()
    df[TARGET_COLUMN] = pd.to_numeric(df[TARGET_COLUMN], errors="coerce")
    df = df[df[TARGET_COLUMN].isin([0, 1])].copy()
    df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(int)

    return df.reset_index(drop=True)


def _encode_features(
    df: pd.DataFrame,
    active_base_feature_columns: list[str],
    encoded_feature_columns: list[str] | None = None,
) -> Tuple[pd.DataFrame, list[str]]:
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

    for col in X.columns:
        if X[col].dtype == bool:
            X[col] = X[col].astype(int)

    if encoded_feature_columns is not None:
        for col in encoded_feature_columns:
            if col not in X.columns:
                X[col] = 0

        X = X[encoded_feature_columns].copy()
        return X, encoded_feature_columns

    feature_columns = list(X.columns)
    return X, feature_columns


def _split_by_game(
    df: pd.DataFrame,
    test_size: float,
    random_state: int,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    if "game_id" not in df.columns:
        train_df, valid_df = train_test_split(
            df,
            test_size=test_size,
            random_state=random_state,
            stratify=df[TARGET_COLUMN],
        )
        return train_df.reset_index(drop=True), valid_df.reset_index(drop=True)

    n_unique_games = df["game_id"].nunique()

    if n_unique_games < 2:
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


def _build_model(random_state: int) -> XGBClassifier:
    return XGBClassifier(
        objective="binary:logistic",
        eval_metric=["logloss", "auc"],
        n_estimators=800,
        learning_rate=0.03,
        max_depth=3,
        min_child_weight=8,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_alpha=0.75,
        reg_lambda=6.0,
        gamma=0.3,
        max_delta_step=1,
        scale_pos_weight=1.0,
        random_state=random_state,
        n_jobs=-1,
        tree_method="hist",
    )


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


def _save_feature_importance(
    model: XGBClassifier,
    path: str | Path,
) -> None:
    booster = model.get_booster()
    raw_scores = booster.get_score(importance_type="gain")

    rows = []
    for feature_name, gain in raw_scores.items():
        rows.append(
            {
                "feature": feature_name,
                "gain": float(gain),
            }
        )

    imp_df = pd.DataFrame(rows)

    if imp_df.empty:
        imp_df = pd.DataFrame(columns=["feature", "gain"])
    else:
        imp_df = imp_df.sort_values("gain", ascending=False).reset_index(drop=True)

    imp_df.to_csv(path, index=False)


def _logit_from_prob(prob: np.ndarray) -> np.ndarray:
    clipped = np.clip(prob.astype(float), 1e-6, 1.0 - 1e-6)
    return np.log(clipped / (1.0 - clipped))


def _fit_probability_calibrator(
    raw_prob: np.ndarray,
    y_true: pd.Series,
) -> Dict[str, float]:
    raw_logit = _logit_from_prob(raw_prob).reshape(-1, 1)

    calibrator = LogisticRegression(
        solver="lbfgs",
        C=1.0,
        max_iter=1000,
    )
    calibrator.fit(raw_logit, y_true.to_numpy())

    return {
        "method": "platt-logit",
        "coef": float(calibrator.coef_[0][0]),
        "intercept": float(calibrator.intercept_[0]),
    }


def _apply_probability_calibrator(
    raw_prob: np.ndarray,
    calibration: Dict[str, float] | None,
) -> np.ndarray:
    if not calibration:
        return raw_prob.astype(float)

    coef = float(calibration["coef"])
    intercept = float(calibration["intercept"])

    raw_logit = _logit_from_prob(raw_prob)
    calibrated_logit = (coef * raw_logit) + intercept
    calibrated_prob = 1.0 / (1.0 + np.exp(-calibrated_logit))

    return calibrated_prob.astype(float)


def train_xg_model(
    input_path: str | Path,
    out_dir: str | Path = "data/xg/models",
    test_size: float = 0.2,
    random_state: int = 42,
    include_empty_net: bool = False,
    keep_is_home: bool = False,
) -> Dict[str, Any]:
    active_base_feature_columns = _get_active_base_feature_columns(
        keep_is_home=keep_is_home,
    )

    df = _read_input_table(input_path)
    df = _prepare_training_frame(
        df=df,
        active_base_feature_columns=active_base_feature_columns,
        include_empty_net=include_empty_net,
    )

    if df.empty:
        raise RuntimeError("Training frame is empty after preprocessing")

    positives = int(df[TARGET_COLUMN].sum())
    negatives = int(len(df) - positives)

    if positives == 0 or negatives == 0:
        raise RuntimeError("Training data needs both goal and non-goal rows")

    train_df, valid_df = _split_by_game(
        df=df,
        test_size=test_size,
        random_state=random_state,
    )

    X_train, encoded_feature_columns = _encode_features(
        df=train_df,
        active_base_feature_columns=active_base_feature_columns,
    )
    X_valid, _ = _encode_features(
        df=valid_df,
        active_base_feature_columns=active_base_feature_columns,
        encoded_feature_columns=encoded_feature_columns,
    )

    y_train = train_df[TARGET_COLUMN].astype(int)
    y_valid = valid_df[TARGET_COLUMN].astype(int)

    model = _build_model(random_state=random_state)

    fit_kwargs = {
        "X": X_train,
        "y": y_train,
        "eval_set": [(X_valid, y_valid)],
        "verbose": False,
    }

    try:
        model.fit(
            **fit_kwargs,
            early_stopping_rounds=50,
        )
    except TypeError:
        model.fit(**fit_kwargs)

    raw_valid_prob = model.predict_proba(X_valid)[:, 1]
    calibration = _fit_probability_calibrator(
        raw_prob=raw_valid_prob,
        y_true=y_valid,
    )
    calibrated_valid_prob = _apply_probability_calibrator(
        raw_prob=raw_valid_prob,
        calibration=calibration,
    )

    raw_metrics = _compute_metrics(y_valid, raw_valid_prob)
    calibrated_metrics = _compute_metrics(y_valid, calibrated_valid_prob)

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    model_path = out_dir / "xg_shot_model.json"
    metadata_path = out_dir / "xg_training_metadata.json"
    importance_path = out_dir / "xg_feature_importance.csv"

    model.save_model(str(model_path))
    _save_feature_importance(model, importance_path)

    metadata = {
        "input_path": str(input_path),
        "model_path": str(model_path),
        "importance_path": str(importance_path),
        "target_column": TARGET_COLUMN,
        "active_base_feature_columns": active_base_feature_columns,
        "encoded_feature_columns": encoded_feature_columns,
        "categorical_feature_columns": [
            col for col in CATEGORICAL_FEATURE_COLUMNS if col in active_base_feature_columns
        ],
        "include_empty_net": include_empty_net,
        "keep_is_home": keep_is_home,
        "excluded_base_feature_columns": [] if keep_is_home else sorted(EXCLUDED_BASE_FEATURE_COLUMNS),
        "random_state": random_state,
        "test_size": test_size,
        "dataset_summary": {
            "rows_total": int(len(df)),
            "games_total": int(df["game_id"].nunique()) if "game_id" in df.columns else None,
            "goal_rows_total": positives,
            "non_goal_rows_total": negatives,
            "goal_rate_total": float(df[TARGET_COLUMN].mean()),
        },
        "split_summary": {
            "train_rows": int(len(train_df)),
            "valid_rows": int(len(valid_df)),
            "train_games": int(train_df["game_id"].nunique()) if "game_id" in train_df.columns else None,
            "valid_games": int(valid_df["game_id"].nunique()) if "game_id" in valid_df.columns else None,
            "train_goal_rate": float(y_train.mean()),
            "valid_goal_rate": float(y_valid.mean()),
        },
        "metrics_raw": raw_metrics,
        "metrics_calibrated": calibrated_metrics,
        "probability_calibration": calibration,
        "model_params": model.get_params(),
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return {
        "model_path": str(model_path),
        "metadata_path": str(metadata_path),
        "importance_path": str(importance_path),
        "metrics_raw": raw_metrics,
        "metrics_calibrated": calibrated_metrics,
        "encoded_feature_count": len(encoded_feature_columns),
        "active_base_feature_columns": active_base_feature_columns,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to engineered xG CSV or Parquet")
    parser.add_argument("--out-dir", default="data/xg/models")
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--include-empty-net", action="store_true")
    parser.add_argument("--keep-is-home", action="store_true")

    args = parser.parse_args()

    result = train_xg_model(
        input_path=args.input,
        out_dir=args.out_dir,
        test_size=args.test_size,
        random_state=args.random_state,
        include_empty_net=args.include_empty_net,
        keep_is_home=args.keep_is_home,
    )

    print("Training complete")
    print(f"Model -> {result['model_path']}")
    print(f"Metadata -> {result['metadata_path']}")
    print(f"Feature importance -> {result['importance_path']}")
    print(f"Encoded feature count -> {result['encoded_feature_count']}")

    print("\nActive base features")
    for col in result["active_base_feature_columns"]:
        print(f"- {col}")

    print("\nRaw validation metrics")
    for key, value in result["metrics_raw"].items():
        print(f"- {key}: {value}")

    print("\nCalibrated validation metrics")
    for key, value in result["metrics_calibrated"].items():
        print(f"- {key}: {value}")


if __name__ == "__main__":
    main()