from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import numpy as np

from .trend_db import get_last_n
from .trend_features import window_features


def _softmax1(z: np.ndarray) -> np.ndarray:
    z = z - np.max(z)
    e = np.exp(z)
    return e / np.sum(e)


def load_trend_model(path: str | None = None) -> Dict[str, Any]:
    """
    Load the trained trend model JSON in a production-safe way.
    This works locally AND on Render.
    """
    base_dir = Path(__file__).resolve().parent
    model_path = Path(path) if path else base_dir / "models" / "trend_model.json"

    if not model_path.exists():
        raise FileNotFoundError(f"Trend model file not found: {model_path}")

    with open(model_path, "r", encoding="utf-8") as f:
        return json.load(f)


def predict_team_trend(
    team: str,
    as_of: str,
    n: int = 10,
    model_path: str | None = None,
) -> Dict[str, Any]:
    """
    Predict team trend (up / flat / down) using the trained model.
    """

    model = load_trend_model(model_path)

    rows = get_last_n(team, as_of, n)
    if not rows:
        raise ValueError(f"No game data available for team={team}")

    feats = window_features(rows)

    w = np.array(model["weights"], dtype=float)
    b = np.array(model["bias"], dtype=float)

    x = np.array(
        [
            feats["goals_for_pg"],
            feats["goals_against_pg"],
            feats["shots_for_pg"],
            feats["shots_against_pg"],
            feats["pp_pct"],
            feats["pk_pct"],
            feats["goalie_sv_pct_avg"],
            feats["home_rate"],
        ],
        dtype=float,
    )

    logits = x @ w + b
    probs = _softmax1(logits)

    labels = model["labels"]
    idx = int(np.argmax(probs))

    return {
        "team": team,
        "as_of": as_of,
        "n_used": len(rows),
        "prediction": labels[idx],
        "confidence": float(probs[idx]),
        "probs": {
            labels[i]: float(probs[i]) for i in range(len(labels))
        },
        "features": feats,
    }
