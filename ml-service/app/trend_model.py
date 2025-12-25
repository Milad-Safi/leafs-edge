from __future__ import annotations

import json
from typing import Any, Dict, Optional, Tuple

import numpy as np

from .trend_db import get_last_n
from .trend_features import window_features


def _softmax1(z: np.ndarray) -> np.ndarray:
    z = z - np.max(z)
    e = np.exp(z)
    return e / np.sum(e)


def load_trend_model(path: str = "app/models/trend_model.json") -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def predict_team_trend(
    team: str,
    as_of: str,
    n: int = 10,
    model_path: str = "app/models/trend_model.json",
) -> Dict[str, Any]:
    model = load_trend_model(model_path)

    rows = get_last_n(team, as_of=as_of, n=n)
    feats, meta = window_features(rows)

    if not feats or meta["n_used"] == 0:
        return {
            "team": team,
            "as_of": as_of,
            "n_requested": n,
            "n_used": 0,
            "range": None,
            "trend": None,
            "confidence": None,
            "probs": None,
            "features": None,
            "note": "Not enough games before as_of to compute trend.",
        }

    feature_names = model["feature_names"]
    x = np.array([float(feats.get(fn, 0.0)) for fn in feature_names], dtype=np.float32)

    mu = np.array(model["standardize"]["mu"], dtype=np.float32)
    sigma = np.array(model["standardize"]["sigma"], dtype=np.float32)
    xs = (x - mu) / sigma

    W = np.array(model["weights"], dtype=np.float32)  # (F, 3)
    b = np.array(model["bias"], dtype=np.float32)     # (3,)

    logits = xs @ W + b
    p = _softmax1(logits)

    labels = model["labels"]
    idx = int(np.argmax(p))
    trend = labels[idx]
    confidence = float(p[idx])

    probs = {labels[i]: float(p[i]) for i in range(len(labels))}

    return {
        "team": team,
        "as_of": as_of,
        "n_requested": n,
        "n_used": meta["n_used"],
        "range": meta["range"],
        "trend": trend,
        "confidence": confidence,
        "probs": probs,
        "features": feats,  # keep this for debug + future "why" UI
        "model_info": {
            "trained_at": model.get("trained_at"),
            "n": model.get("dataset", {}).get("n"),
            "k": model.get("dataset", {}).get("k"),
            "eps": model.get("dataset", {}).get("eps"),
        },
    }
