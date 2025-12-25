from __future__ import annotations

import datetime as dt
from typing import Any, Dict, Optional

from sqlalchemy import text

from .db import engine


def _safe_div(num: Optional[float], den: Optional[float]) -> Optional[float]:
    if num is None or den is None:
        return None
    if den == 0:
        return None
    return float(num) / float(den)


def get_team_season_stats(team: str, through: dt.date) -> Dict[str, Any]:
    """Season-to-date aggregates from team_games.

    Notes:
    - Filters to regular season only using NHL game_id format YYYYTTNNNN,
      where TT == 02 for regular season.
    - Uses game_date <= through.
    """

    q = text(
        """
        WITH filtered AS (
            SELECT
                game_date,
                is_home,
                goals_for, goals_against,
                shots_for, shots_against,
                pp_goals, pp_opps,
                pk_goals_against, pk_opps,
                win
            FROM team_games
            WHERE team = :team
              AND game_date <= :through
              AND ((game_id / 10000) % 100) = 2
        )
        SELECT
            COUNT(*)::int                                         AS gp,
            COALESCE(SUM(CASE WHEN win THEN 1 ELSE 0 END),0)::int  AS wins,
            COALESCE(SUM(goals_for),0)::int                       AS gf,
            COALESCE(SUM(goals_against),0)::int                   AS ga,

            COALESCE(SUM(shots_for),0)::int                       AS sf,
            COALESCE(SUM(shots_against),0)::int                   AS sa,

            COALESCE(SUM(pp_goals),0)::int                        AS pp_goals,
            COALESCE(SUM(pp_opps),0)::int                         AS pp_opps,

            COALESCE(SUM(pk_goals_against),0)::int                AS pk_goals_against,
            COALESCE(SUM(pk_opps),0)::int                         AS pk_opps,

            MAX(game_date)                                        AS newest,
            MIN(game_date)                                        AS oldest,

            -- splits
            COALESCE(SUM(CASE WHEN is_home THEN 1 ELSE 0 END),0)::int                AS home_gp,
            COALESCE(SUM(CASE WHEN is_home AND win THEN 1 ELSE 0 END),0)::int        AS home_wins,
            COALESCE(SUM(CASE WHEN NOT is_home THEN 1 ELSE 0 END),0)::int            AS away_gp,
            COALESCE(SUM(CASE WHEN (NOT is_home) AND win THEN 1 ELSE 0 END),0)::int  AS away_wins
        FROM filtered;
        """
    )

    with engine.connect() as conn:
        row = conn.execute(q, {"team": team, "through": through}).mappings().one()

    gp = int(row["gp"] or 0)
    wins = int(row["wins"] or 0)
    losses = gp - wins

    gf = int(row["gf"] or 0)
    ga = int(row["ga"] or 0)
    sf = int(row["sf"] or 0)
    sa = int(row["sa"] or 0)

    pp_goals = int(row["pp_goals"] or 0)
    pp_opps = int(row["pp_opps"] or 0)
    pk_ga = int(row["pk_goals_against"] or 0)
    pk_opps = int(row["pk_opps"] or 0)

    newest = row["newest"]
    oldest = row["oldest"]

    gf_pg = _safe_div(gf, gp)
    ga_pg = _safe_div(ga, gp)
    sf_pg = _safe_div(sf, gp)
    sa_pg = _safe_div(sa, gp)

    pp_pct = _safe_div(pp_goals, pp_opps)
    pk_pct = (1.0 - _safe_div(pk_ga, pk_opps)) if pk_opps else None

    home_gp = int(row["home_gp"] or 0)
    home_wins = int(row["home_wins"] or 0)
    away_gp = int(row["away_gp"] or 0)
    away_wins = int(row["away_wins"] or 0)

    return {
        "team": team,
        "through": through.isoformat(),
        "range": {
            "newest": str(newest) if newest is not None else None,
            "oldest": str(oldest) if oldest is not None else None,
        },
        "totals": {
            "gp": gp,
            "wins": wins,
            "losses": losses,
            "gf": gf,
            "ga": ga,
            "sf": sf,
            "sa": sa,
            "pp_goals": pp_goals,
            "pp_opps": pp_opps,
            "pk_goals_against": pk_ga,
            "pk_opps": pk_opps,
        },
        "rates": {
            "gf_pg": gf_pg,
            "ga_pg": ga_pg,
            "sf_pg": sf_pg,
            "sa_pg": sa_pg,
            "pp_pct": pp_pct,
            "pk_pct": pk_pct,
        },
        "splits": {
            "home": {"gp": home_gp, "wins": home_wins, "losses": home_gp - home_wins},
            "away": {"gp": away_gp, "wins": away_wins, "losses": away_gp - away_wins},
        },
        "note": (
            "OTL not available (schema only stores win boolean). "
            "If you want W-L-OTL like NHL standings, add an ot_loss boolean or result enum."
        ),
    }
