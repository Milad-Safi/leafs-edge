from __future__ import annotations

import datetime as dt
import json
import math
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from .trend_db import (
    get_games,
    list_teams,
    get_team_baseline_asof_with_fallback,
    get_league_baseline_asof,
)
from .trend_features import window_features

LABELS = ["DOWN", "FLAT", "UP"]  # class index order


@dataclass
class TrendDataset:
    X: np.ndarray
    y: np.ndarray
    feature_names: List[str]
    meta: Dict[str, Any]


def _softmax(z: np.ndarray) -> np.ndarray:
    z = z - np.max(z, axis=1, keepdims=True)
    e = np.exp(z)
    return e / np.sum(e, axis=1, keepdims=True)


def _train_softmax_lr(
    X: np.ndarray,
    y: np.ndarray,
    steps: int = 3000,
    lr: float = 0.05,
    l2: float = 0.1,
    seed: int = 42,
) -> Dict[str, Any]:
    rng = np.random.default_rng(seed)

    n_samples, n_features = X.shape
    n_classes = 3

    mu = X.mean(axis=0)
    sigma = X.std(axis=0)
    sigma[sigma == 0] = 1.0
    Xs = (X - mu) / sigma

    W = rng.normal(0, 0.01, size=(n_features, n_classes)).astype(np.float32)
    b = np.zeros((n_classes,), dtype=np.float32)

    Y = np.zeros((n_samples, n_classes), dtype=np.float32)
    Y[np.arange(n_samples), y] = 1.0

    for _ in range(steps):
        logits = Xs @ W + b
        P = _softmax(logits)
        gradW = (Xs.T @ (P - Y)) / n_samples + l2 * W
        gradb = np.mean(P - Y, axis=0)
        W -= lr * gradW
        b -= lr * gradb

    logits = Xs @ W + b
    P = _softmax(logits)
    pred = np.argmax(P, axis=1)
    acc = float(np.mean(pred == y))
    nll = -float(np.mean(np.log(P[np.arange(n_samples), y] + 1e-12)))

    return {
        "W": W,
        "b": b,
        "mu": mu.astype(np.float32),
        "sigma": sigma.astype(np.float32),
        "train_acc": acc,
        "train_nll": nll,
    }


# -----------------------------
# Window score for labeling
# -----------------------------
def _clamp(x: float, lo: float, hi: float) -> float:
    return lo if x < lo else hi if x > hi else x


def _signed_sqrt(x: float) -> float:
    return math.copysign(math.sqrt(abs(x)), x) if x != 0 else 0.0


def _shots_extreme_term(shot_diff_pg: float) -> float:
    dead = 8.0
    if -dead <= shot_diff_pg <= dead:
        return 0.0

    over = abs(shot_diff_pg) - dead
    raw = 0.10 * (over / 10.0)
    raw = _clamp(raw, 0.0, 0.30)
    return raw if shot_diff_pg > 0 else -raw


def window_score_from_features(feats: Dict[str, float]) -> float:
    """
    LABELING LOGIC — UNCHANGED.

    We intentionally keep this identical so the *definition*
    of UP / FLAT / DOWN does not drift.
    """
    gd = float(feats.get("gd_pg", 0.0))

    pp = float(feats.get("pp_pct", -1.0))
    pk = float(feats.get("pk_pct", -1.0))

    pp_delta = 0.0 if pp < 0 else (pp - 0.20)
    pk_delta = 0.0 if pk < 0 else (pk - 0.80)

    pp_term = _signed_sqrt(pp_delta)
    pk_term = _signed_sqrt(pk_delta)

    shot_diff_pg = float(feats.get("shot_diff_pg", 0.0))
    shots_term = _shots_extreme_term(shot_diff_pg)

    score = (
        1.00 * gd
        + 0.64 * pp_term
        + 0.47 * pk_term
        + 0.53 * shots_term
    )
    return float(score)


def _build_windows_for_team(
    rows: List[Dict[str, Any]],
    n: int,
    k: int,
    eps: float,
    feature_names: Optional[List[str]] = None,
    *,
    opp_baseline_provider,
    league_baseline,
) -> Tuple[List[List[float]], List[int], List[str]]:
    """
    rows must be chronological ASC.
    For each i where we have past window [i-n, i) and future window [i, i+k),
    label compares future_score vs past_score using the SAME scoring function.
    """
    X_list: List[List[float]] = []
    y_list: List[int] = []
    names: List[str] = feature_names or []

    total = len(rows)
    for i in range(n, total - k + 1):
        past = rows[i - n : i]
        future = rows[i : i + k]

        past_feats, _ = window_features(
            list(reversed(past)),
            opp_baseline_provider=opp_baseline_provider,
            league_baseline=league_baseline,
        )
        future_feats, _ = window_features(
            list(reversed(future)),
            opp_baseline_provider=opp_baseline_provider,
            league_baseline=league_baseline,
        )

        if not past_feats or not future_feats:
            continue

        past_score = window_score_from_features(past_feats)
        future_score = window_score_from_features(future_feats)

        delta = future_score - past_score

        if delta > eps:
            y = 2  # UP
        elif delta < -eps:
            y = 0  # DOWN
        else:
            y = 1  # FLAT

        if not names:
            names = list(past_feats.keys())

        x = [float(past_feats.get(fn, 0.0)) for fn in names]
        X_list.append(x)
        y_list.append(y)

    return X_list, y_list, names


def build_trend_dataset(
    n: int = 10,
    k: int = 5,
    eps: float = 0.13,
    through: Optional[str] = None,
) -> TrendDataset:
    teams = list_teams()
    X_all: List[List[float]] = []
    y_all: List[int] = []
    feature_names: List[str] = []

    # League baseline is computed ONCE per training run
    league_baseline = get_league_baseline_asof(through or dt.date.today().isoformat())

    for t in teams:
        rows = get_games(t, end_date=through)
        if len(rows) < (n + k + 2):
            continue

        # Opponent baseline provider closure
        def opp_provider(opp: str, as_of: str):
            return get_team_baseline_asof_with_fallback(opp, as_of, m=10)

        X_t, y_t, feature_names = _build_windows_for_team(
            rows,
            n=n,
            k=k,
            eps=eps,
            feature_names=feature_names,
            opp_baseline_provider=opp_provider,
            league_baseline=league_baseline,
        )

        X_all.extend(X_t)
        y_all.extend(y_t)

    if not X_all:
        raise RuntimeError("No training samples produced. (Not enough games for windows?)")

    X = np.array(X_all, dtype=np.float32)
    y = np.array(y_all, dtype=np.int64)

    meta = {
        "n": n,
        "k": k,
        "eps": eps,
        "through": through,
        "samples": {"total": int(len(y))},
        "class_counts": {
            "DOWN": int(np.sum(y == 0)),
            "FLAT": int(np.sum(y == 1)),
            "UP": int(np.sum(y == 2)),
        },
        "labeling": {
            "score": "unchanged (gd + PP/PK + shots)",
            "pp_baseline": 0.20,
            "pk_baseline": 0.80,
            "shots_deadzone": 8.0,
            "shots_cap": 0.30,
        },
        "context": {
            "opponent_adjustment": "relative-to-opponent (Option B)",
            "opp_window": 10,
            "neutral_fallback": "league baseline",
        },
    }

    return TrendDataset(X=X, y=y, feature_names=feature_names, meta=meta)


def train_trend(
    n: int = 10,
    k: int = 7,
    eps: float = 0.13,
    through: Optional[str] = None,
    steps: int = 3000,
    lr: float = 0.05,
    l2: float = 0.1,
) -> Dict[str, Any]:
    ds = build_trend_dataset(n=n, k=k, eps=eps, through=through)
    fit = _train_softmax_lr(ds.X, ds.y, steps=steps, lr=lr, l2=l2)

    model = {
        "kind": "softmax_logreg",
        "labels": LABELS,
        "feature_names": ds.feature_names,
        "standardize": {
            "mu": fit["mu"].tolist(),
            "sigma": fit["sigma"].tolist(),
        },
        "weights": fit["W"].tolist(),
        "bias": fit["b"].tolist(),
        "train": {
            "steps": steps,
            "lr": lr,
            "l2": l2,
            "train_acc": fit["train_acc"],
            "train_nll": fit["train_nll"],
        },
        "dataset": ds.meta,
        "trained_at": dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
    }

    os.makedirs("app/models", exist_ok=True)
    path = "app/models/trend_model.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(model, f, indent=2)

    return {"ok": True, "saved_to": path, "model": model}
