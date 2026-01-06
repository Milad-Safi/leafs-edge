from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from sklearn.utils.extmath import softmax

from .trend_db import (
    get_last_n,
    get_team_baseline_asof_with_fallback,
    get_league_baseline_asof,
)
from .trend_features import window_features


def _softmax1(z: list[float]) -> list[float]:
    """Softmax for a single 1D vector.

    Uses scikit-learn's numerically-stable softmax implementation.
    """
    return softmax([z])[0].tolist()


def load_trend_model(path: str = "app/models/trend_model.json") -> Dict[str, Any]:
    """
    Production-safe model loader.

    Keeps the original function signature, but resolves the default path
    relative to this file so it works on Render (cwd may differ).
    """
    p = Path(path)

    # If it's the default "app/models/..." style OR doesn't exist as given,
    # resolve relative to this module's directory: app/models/trend_model.json
    if path == "app/models/trend_model.json" or not p.exists():
        base_dir = Path(__file__).resolve().parent  # .../app
        p = base_dir / "models" / "trend_model.json"

    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def predict_team_trend(
    team: str,
    as_of: str,
    n: int = 10,
    model_path: str = "app/models/trend_model.json",
) -> Dict[str, Any]:
    model = load_trend_model(model_path)

    rows = get_last_n(team, as_of, n=n)
    as_of_date = as_of

    # baselines (team / league)
    league_baseline = get_league_baseline_asof(as_of_date)

    # window_features calls opp_baseline_provider(opp, game_date)
    # so provider must accept (opp, as_of_date)
    #
    # IMPORTANT: your DB helper REQUIRES m, and prod is crashing because it wasn't passed.
    def opp_provider(opp: str, as_of_for_opp: str) -> Dict[str, Any]:
        # Use same m as training to keep behavior consistent
        return get_team_baseline_asof_with_fallback(opp, as_of_for_opp, m=10)

    feats, meta = window_features(
        rows,
        opp_baseline_provider=opp_provider,
        league_baseline=league_baseline,
    )

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
    x = [float(feats.get(fn, 0.0)) for fn in feature_names]

    mu = [float(v) for v in model["standardize"]["mu"]]
    sigma = [float(v) for v in model["standardize"]["sigma"]]
    xs = [(xi - mi) / si for xi, mi, si in zip(x, mu, sigma)]

    # Stored as (F, 3) and (3,) in the JSON
    W = model["weights"]
    b = model["bias"]

    # logits[j] = sum_i xs[i] * W[i][j] + b[j]
    logits = [
        sum(xs[i] * float(W[i][j]) for i in range(len(xs))) + float(b[j])
        for j in range(3)
    ]
    p = _softmax1(logits)

    labels = model["labels"]
    idx = int(max(range(len(p)), key=lambda i: p[i]))
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
        "features": feats,  # debug / explainability
        "model_info": {
            "trained_at": model.get("trained_at"),
            "n": model.get("dataset", {}).get("n"),
            "k": model.get("dataset", {}).get("k"),
            "eps": model.get("dataset", {}).get("eps"),
        },
    }
