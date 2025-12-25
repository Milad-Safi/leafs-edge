from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional, Tuple

import math


def _safe_div(a: float, b: float) -> Optional[float]:
    if b == 0:
        return None
    return a / b


def _linear_slope(values: List[float]) -> float:
    """
    Simple least-squares slope over x = 1..N.
    Returns 0.0 if N < 2 or variance is zero.
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


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def window_features(
    rows_desc: List[Dict[str, Any]],
    *,
    # Option B: provide opponent baselines "as of" a date (strictly before that date).
    # Signature: provider(opponent_team, as_of_date_iso) -> dict with:
    #   gf_pg, ga_pg, sf_pg, sa_pg, pp_pct, pk_pct, games_used (int), optional fallback
    opp_baseline_provider: Optional[Callable[[str, str], Dict[str, Any]]] = None,
    # If opponent has fewer than this many prior games, treat baseline as unstable.
    min_opp_games: int = 5,
    # Optional league baseline dict for neutral fallback when opponent baseline is unstable.
    league_baseline: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, float], Dict[str, Any]]:
    """
    Input is last-N rows in DESC order (newest first).
    Returns: (features, meta)

    IMPORTANT:
      - We keep the same return contract as your original file.
      - We DO NOT use goalie_sv_pct or any save% feature (by your rule).
      - If opp_baseline_provider is None, features are just your "raw" window stats (minus sv%).
      - If opp_baseline_provider is provided, we add relative-to-opponent features (Option B).
    """
    if not rows_desc:
        return {}, {"range": None, "n_used": 0}

    # chronological order (oldest -> newest) for slopes
    rows = list(reversed(rows_desc))
    n = len(rows)

    gf = sum(float(r.get("goals_for") or 0) for r in rows)
    ga = sum(float(r.get("goals_against") or 0) for r in rows)
    sf = sum(float(r.get("shots_for") or 0) for r in rows)
    sa = sum(float(r.get("shots_against") or 0) for r in rows)

    pp_goals = sum(float(r.get("pp_goals") or 0) for r in rows)
    pp_opps = sum(float(r.get("pp_opps") or 0) for r in rows)
    pk_ga = sum(float(r.get("pk_goals_against") or 0) for r in rows)
    pk_opps = sum(float(r.get("pk_opps") or 0) for r in rows)

    gd_vals = [float(r.get("goals_for") or 0) - float(r.get("goals_against") or 0) for r in rows]
    shot_diff_vals = [float(r.get("shots_for") or 0) - float(r.get("shots_against") or 0) for r in rows]

    pp_pct = _safe_div(pp_goals, pp_opps)
    pk_pct = (1.0 - _safe_div(pk_ga, pk_opps)) if pk_opps > 0 else None

    home_count = sum(1 for r in rows if bool(r.get("is_home")))
    home_rate = home_count / n

    newest = str(max(r.get("game_date") for r in rows))
    oldest = str(min(r.get("game_date") for r in rows))

    feats: Dict[str, float] = {
        "gd_pg": (gf - ga) / n,
        "gf_pg": gf / n,
        "ga_pg": ga / n,
        "sf_pg": sf / n,
        "sa_pg": sa / n,
        "shot_diff_pg": (sf - sa) / n,
        "shot_share": (sf / (sf + sa)) if (sf + sa) > 0 else 0.0,
        # Keep your sentinel convention for missing special teams
        "pp_pct": float(pp_pct) if pp_pct is not None else -1.0,
        "pk_pct": float(pk_pct) if pk_pct is not None else -1.0,
        "home_rate": float(home_rate),
        "gd_slope": float(_linear_slope(gd_vals)),
        "shot_diff_slope": float(_linear_slope(shot_diff_vals)),
    }

    # ----------------------------
    # Option B: relative-to-opponent features (quality of competition)
    # ----------------------------
    if opp_baseline_provider is not None:
        lf = league_baseline or {}

        rel_gf_vals: List[float] = []
        rel_ga_vals: List[float] = []
        rel_sf_vals: List[float] = []
        rel_sa_vals: List[float] = []
        rel_share_vals: List[float] = []
        rel_pp_delta_vals: List[float] = []
        rel_pk_delta_vals: List[float] = []
        opp_strength_vals: List[float] = []

        for r in rows:
            opp = str(r.get("opponent") or "")
            game_date = str(r.get("game_date") or "")

            b = opp_baseline_provider(opp, game_date) or {}
            games_used = int(b.get("games_used") or 0)

            # 0..1 "confidence-like" score for context strength
            opp_strength_vals.append(_clamp(games_used / float(max(1, min_opp_games)), 0.0, 1.0))

            # If opponent baseline is unstable, optionally fallback to league averages (neutral)
            use = b
            if games_used < min_opp_games and lf:
                use = {
                    "gf_pg": lf.get("gf_pg"),
                    "ga_pg": lf.get("ga_pg"),
                    "sf_pg": lf.get("sf_pg"),
                    "sa_pg": lf.get("sa_pg"),
                    "pp_pct": lf.get("pp_pct"),
                    "pk_pct": lf.get("pk_pct"),
                }

            # Expectations:
            # - opponent ga_pg/sa_pg are "allowed" -> expected your gf/sf
            # - opponent gf_pg/sf_pg are "generated" -> expected your ga/sa
            exp_gf = use.get("ga_pg")
            exp_ga = use.get("gf_pg")
            exp_sf = use.get("sa_pg")
            exp_sa = use.get("sf_pg")

            team_gf = float(r.get("goals_for") or 0)
            team_ga = float(r.get("goals_against") or 0)
            team_sf = float(r.get("shots_for") or 0)
            team_sa = float(r.get("shots_against") or 0)

            rel_gf_vals.append(team_gf - float(exp_gf) if exp_gf is not None else 0.0)
            rel_ga_vals.append(team_ga - float(exp_ga) if exp_ga is not None else 0.0)
            rel_sf_vals.append(team_sf - float(exp_sf) if exp_sf is not None else 0.0)
            rel_sa_vals.append(team_sa - float(exp_sa) if exp_sa is not None else 0.0)

            # Relative shot share vs expected shot share
            rel_share = 0.0
            if exp_sf is not None and exp_sa is not None:
                denom = float(exp_sf) + float(exp_sa)
                if denom > 0:
                    exp_share = float(exp_sf) / denom
                    obs_share = (team_sf / (team_sf + team_sa)) if (team_sf + team_sa) > 0 else 0.0
                    rel_share = obs_share - exp_share
            rel_share_vals.append(rel_share)

            # Game-level PP/PK deltas vs opponent baseline (no signed_sqrt here; keep as clean deltas)
            g_pp_goals = float(r.get("pp_goals") or 0)
            g_pp_opps = float(r.get("pp_opps") or 0)
            g_pk_ga = float(r.get("pk_goals_against") or 0)
            g_pk_opps = float(r.get("pk_opps") or 0)

            g_pp_pct = _safe_div(g_pp_goals, g_pp_opps)
            g_pk_pct = (1.0 - _safe_div(g_pk_ga, g_pk_opps)) if g_pk_opps > 0 else None

            opp_pk = use.get("pk_pct")
            opp_pp = use.get("pp_pct")

            rel_pp_delta_vals.append(
                (float(g_pp_pct) - float(opp_pk))
                if (g_pp_pct is not None and opp_pk is not None)
                else 0.0
            )
            rel_pk_delta_vals.append(
                (float(g_pk_pct) - float(opp_pp))
                if (g_pk_pct is not None and opp_pp is not None)
                else 0.0
            )

        rel_gf_pg = sum(rel_gf_vals) / n
        rel_ga_pg = sum(rel_ga_vals) / n
        rel_sf_pg = sum(rel_sf_vals) / n
        rel_sa_pg = sum(rel_sa_vals) / n

        feats.update(
            {
                "rel_gf_pg": float(rel_gf_pg),
                "rel_ga_pg": float(rel_ga_pg),
                "rel_gd_pg": float(rel_gf_pg - rel_ga_pg),
                "rel_shot_diff_pg": float((rel_sf_pg - rel_sa_pg)),
                "rel_shot_share": float(sum(rel_share_vals) / n) if rel_share_vals else 0.0,
                "rel_pp_delta": float(sum(rel_pp_delta_vals) / n) if rel_pp_delta_vals else 0.0,
                "rel_pk_delta": float(sum(rel_pk_delta_vals) / n) if rel_pk_delta_vals else 0.0,
                "opp_ctx_strength": float(sum(opp_strength_vals) / n) if opp_strength_vals else 0.0,
            }
        )

    meta = {"range": {"newest": newest, "oldest": oldest}, "n_used": n}
    return feats, meta


def window_goal_diff_avg(rows: List[Dict[str, Any]]) -> Optional[float]:
    """
    Kept for compatibility with your existing training code (if it's still imported).
    """
    if not rows:
        return None
    vals = [float(r.get("goals_for") or 0) - float(r.get("goals_against") or 0) for r in rows]
    return sum(vals) / len(vals)
