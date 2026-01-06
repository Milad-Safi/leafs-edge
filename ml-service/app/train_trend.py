from __future__ import annotations

import datetime as dt
import json
from typing import Any, Dict, Optional, Tuple

from .trend_db import get_last_n, get_league_baseline_asof
from .trend_features import window_features


def _softmax1(z):
    z = z - max(z)
    e = [__import__("math").exp(v) for v in z]
    s = sum(e) if sum(e) != 0 else 1.0
    return [v / s for v in e]


def load_trend_model(path: str = "app/models/trend_model.json") -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _predict_proba(model: Dict[str, Any], x: list[float]) -> list[float]:
    mu = model["standardize"]["mu"]
    sigma = model["standardize"]["sigma"]
    W = model["weights"]  # shape (F, 3)
    b = model["bias"]     # shape (3,)

    # standardize
    xs = []
    for i, xv in enumerate(x):
        s = float(sigma[i]) if float(sigma[i]) != 0.0 else 1.0
        xs.append((float(xv) - float(mu[i])) / s)

    # logits = x @ W + b
    z = [float(bj) for bj in b]
    for i in range(len(xs)):
        wi = W[i]
        z[0] += float(xs[i]) * float(wi[0])
        z[1] += float(xs[i]) * float(wi[1])
        z[2] += float(xs[i]) * float(wi[2])

    return _softmax1(z)


def predict_team_trend(
    team: str,
    as_of: str,
    n: int = 10,
    model_path: str = "app/models/trend_model.json",
) -> Dict[str, Any]:
    """
    Runtime endpoint predictor used by /v1/trend/team.

    Fix included:
      - get_league_baseline_asof() MUST NOT be called with m=...
        because the function signature doesn't accept it.
    """
    model = load_trend_model(model_path)

    # Parse date or use today
    if as_of:
        as_of_date = as_of
    else:
        as_of_date = dt.date.today().isoformat()

    rows = get_last_n(team, as_of_date, n=n)

    if not rows or len(rows) == 0:
        return {
            "ok": False,
            "team": team,
            "as_of": as_of_date,
            "error": "Not enough games to compute features.",
        }

    # ✅ FIX: no `m=10` here
    league_baseline = get_league_baseline_asof(as_of_date)

    feats, meta = window_features(
        rows,
        opp_baseline_provider=None,  # keep as your existing design
        league_baseline=league_baseline,
    )

    if not feats:
        return {
            "ok": False,
            "team": team,
            "as_of": as_of_date,
            "error": "Failed to compute features.",
            "meta": meta,
        }

    feature_names = model.get("feature_names", [])
    x = [float(feats.get(fn, 0.0)) for fn in feature_names]

    proba = _predict_proba(model, x)

    labels = model.get("labels", ["DOWN", "FLAT", "UP"])
    best_i = max(range(len(proba)), key=lambda i: proba[i])

    return {
        "ok": True,
        "team": team.upper(),
        "as_of": as_of_date,
        "n": n,
        "prediction": labels[best_i],
        "confidence": float(proba[best_i]),
        "proba": {labels[i]: float(proba[i]) for i in range(len(labels))},
        "meta": meta,
    }
