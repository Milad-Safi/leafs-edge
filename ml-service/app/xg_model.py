from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd
from xgboost import XGBClassifier

from .xg_types import CATEGORICAL_FEATURE_COLUMNS, MODEL_FEATURE_COLUMNS
from .xg_features import engineer_xg_features


def _load_metadata(metadata_path: str | Path) -> Dict[str, Any]:
    metadata_path = Path(metadata_path)

    if not metadata_path.exists():
        raise FileNotFoundError(f"Metadata file not found: {metadata_path}")

    with open(metadata_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_model(model_path: str | Path) -> XGBClassifier:
    model_path = Path(model_path)

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    model = XGBClassifier()
    model.load_model(str(model_path))
    return model


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


def _encode_features_for_inference(
    features_df: pd.DataFrame,
    active_base_feature_columns: list[str],
    encoded_feature_columns: list[str],
) -> pd.DataFrame:
    X = features_df[active_base_feature_columns].copy()

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


def predict_shot_xg(
    raw_shots_df: pd.DataFrame,
    model_path: str | Path = "data/xg/models/xg_shot_model.json",
    metadata_path: str | Path = "data/xg/models/xg_training_metadata.json",
    drop_empty_net: bool = True,
) -> pd.DataFrame:
    metadata = _load_metadata(metadata_path)
    model = _load_model(model_path)

    features_df = engineer_xg_features(
        raw_df=raw_shots_df,
        keep_context_columns=True,
    )

    if drop_empty_net and "strength_state" in features_df.columns:
        features_df = features_df[features_df["strength_state"] != "empty-net"].copy()

    if drop_empty_net and "is_empty_net" in features_df.columns:
        features_df = features_df[features_df["is_empty_net"] == 0].copy()

    if features_df.empty:
        return features_df.assign(xg=pd.Series(dtype=float))

    active_base_feature_columns = metadata.get(
        "active_base_feature_columns",
        list(MODEL_FEATURE_COLUMNS),
    )
    encoded_feature_columns = metadata["encoded_feature_columns"]

    X = _encode_features_for_inference(
        features_df=features_df,
        active_base_feature_columns=active_base_feature_columns,
        encoded_feature_columns=encoded_feature_columns,
    )

    raw_shot_probs = model.predict_proba(X)[:, 1]
    shot_probs = _apply_probability_calibrator(
        raw_prob=raw_shot_probs,
        calibration=metadata.get("probability_calibration"),
    )

    out = features_df.copy()
    out["xg"] = shot_probs.astype(float)
    out["xg_raw"] = raw_shot_probs.astype(float)

    return out


def summarise_game_xg(predicted_shots_df: pd.DataFrame) -> Dict[str, Any]:
    if predicted_shots_df.empty:
        return {
            "teams": [],
            "team_xg": {},
            "total_shots_modelled": 0,
            "total_xg": 0.0,
        }

    grouped = (
        predicted_shots_df.groupby("team", dropna=False)["xg"]
        .sum()
        .sort_values(ascending=False)
    )

    team_xg = {str(team): float(xg) for team, xg in grouped.items()}

    return {
        "teams": list(team_xg.keys()),
        "team_xg": team_xg,
        "total_shots_modelled": int(len(predicted_shots_df)),
        "total_xg": float(predicted_shots_df["xg"].sum()),
    }