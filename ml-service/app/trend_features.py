from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple


def _safe_div(a: float, b: float) -> Optional[float]:
    if b == 0:
        return None
    return a / b


def _linear_slope(values: List[float]) -> float:
    """
    Simple least-squares slope over x = 1..N.
    Returns 0.0 if N < 2 or all variance is zero.
    """
    n = len(values)
    if n < 2:
        return 0.0
    xs = list(range(1, n + 1))
    x_mean = sum(xs) / n
    y_mean = sum(values) / n
    num = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, values))
    den = sum((x - x_mean) ** 2 for x in xs)
    if den == 0:
        return 0.0
    return num / den


def window_features(rows_desc: List[Dict[str, Any]]) -> Tuple[Dict[str, float], Dict[str, Any]]:
    """
    Input is last-N rows in DESC order (newest first) (matches get_last_n).
    We internally flip to chronological for slope features.
    Returns:
      - features dict (float)
      - meta dict (range, n_used)
    """
    if not rows_desc:
        return {}, {"range": None, "n_used": 0}

    # chronological order for slopes
    rows = list(reversed(rows_desc))
    n = len(rows)

    gf = sum(float(r["goals_for"]) for r in rows)
    ga = sum(float(r["goals_against"]) for r in rows)
    sf = sum(float(r["shots_for"] or 0) for r in rows)
    sa = sum(float(r["shots_against"] or 0) for r in rows)

    # special teams totals (ignore None safely)
    pp_goals = sum(float(r["pp_goals"] or 0) for r in rows)
    pp_opps = sum(float(r["pp_opps"] or 0) for r in rows)
    pk_ga = sum(float(r["pk_goals_against"] or 0) for r in rows)
    pk_opps = sum(float(r["pk_opps"] or 0) for r in rows)

    sv_vals = [float(r["goalie_sv_pct"]) for r in rows if r.get("goalie_sv_pct") is not None]
    sv_avg = sum(sv_vals) / len(sv_vals) if sv_vals else 0.0

    gd_vals = [float(r["goals_for"]) - float(r["goals_against"]) for r in rows]
    shot_diff_vals = [float(r["shots_for"] or 0) - float(r["shots_against"] or 0) for r in rows]
    sv_series = [float(r["goalie_sv_pct"]) if r.get("goalie_sv_pct") is not None else sv_avg for r in rows]

    pp_pct = _safe_div(pp_goals, pp_opps)
    pk_pct = (1.0 - _safe_div(pk_ga, pk_opps)) if pk_opps > 0 else None

    # home rate
    home_count = sum(1 for r in rows if bool(r["is_home"]))
    home_rate = home_count / n

    newest = str(max(r["game_date"] for r in rows))
    oldest = str(min(r["game_date"] for r in rows))

    feats: Dict[str, float] = {
        "gd_pg": (gf - ga) / n,
        "gf_pg": gf / n,
        "ga_pg": ga / n,
        "sf_pg": sf / n,
        "sa_pg": sa / n,
        "shot_diff_pg": (sf - sa) / n,
        "shot_share": (sf / (sf + sa)) if (sf + sa) > 0 else 0.0,
        "pp_pct": float(pp_pct) if pp_pct is not None else -1.0,  # sentinel for "unknown"
        "pk_pct": float(pk_pct) if pk_pct is not None else -1.0,
        "sv_pct": float(sv_avg),
        "home_rate": float(home_rate),
        # slope features
        "gd_slope": float(_linear_slope(gd_vals)),
        "shot_diff_slope": float(_linear_slope(shot_diff_vals)),
        "sv_slope": float(_linear_slope(sv_series)),
    }

    meta = {"range": {"newest": newest, "oldest": oldest}, "n_used": n}
    return feats, meta


def window_goal_diff_avg(rows: List[Dict[str, Any]]) -> Optional[float]:
    if not rows:
        return None
    vals = [float(r["goals_for"]) - float(r["goals_against"]) for r in rows]
    return sum(vals) / len(vals)
