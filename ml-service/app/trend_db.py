from __future__ import annotations

from typing import Any, Dict, List, Optional
from sqlalchemy import text

from .db import engine


def _regular_season_condition(alias: str = "tg") -> str:
    # NHL game_id format: YYYYTTNNNN where TT == 02 for regular season
    # Condition: (game_id // 10000) % 100 == 2
    return f"((CAST({alias}.game_id / 10000 AS INTEGER) % 100) = 2)"


def list_teams() -> List[str]:
    q = text(
        f"""
        SELECT DISTINCT team
        FROM team_games tg
        WHERE {_regular_season_condition("tg")}
        ORDER BY team
        """
    )
    with engine.connect() as conn:
        rows = conn.execute(q).mappings().all()
    return [str(r["team"]) for r in rows]


def get_games(
    team: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    where = ["tg.team = :team", _regular_season_condition("tg")]
    params: Dict[str, Any] = {"team": team}

    if start_date:
        where.append("tg.game_date >= :start_date")
        params["start_date"] = start_date
    if end_date:
        where.append("tg.game_date <= :end_date")
        params["end_date"] = end_date

    q = text(
        f"""
        SELECT
            tg.game_id,
            tg.game_date,
            tg.is_home,
            tg.goals_for,
            tg.goals_against,
            tg.shots_for,
            tg.shots_against,
            tg.pp_goals,
            tg.pp_opps,
            tg.pk_goals_against,
            tg.pk_opps,
            tg.goalie_sv_pct,
            tg.win
        FROM team_games tg
        WHERE {" AND ".join(where)}
        ORDER BY tg.game_date ASC, tg.game_id ASC
        """
    )

    with engine.connect() as conn:
        rows = conn.execute(q, params).mappings().all()
    return [dict(r) for r in rows]


def get_last_n(team: str, as_of: str, n: int) -> List[Dict[str, Any]]:
    q = text(
        f"""
        SELECT
            tg.game_id,
            tg.game_date,
            tg.is_home,
            tg.goals_for,
            tg.goals_against,
            tg.shots_for,
            tg.shots_against,
            tg.pp_goals,
            tg.pp_opps,
            tg.pk_goals_against,
            tg.pk_opps,
            tg.goalie_sv_pct,
            tg.win
        FROM team_games tg
        WHERE tg.team = :team
          AND tg.game_date < :as_of
          AND {_regular_season_condition("tg")}
        ORDER BY tg.game_date DESC, tg.game_id DESC
        LIMIT :n
        """
    )
    with engine.connect() as conn:
        rows = conn.execute(q, {"team": team, "as_of": as_of, "n": n}).mappings().all()
    return [dict(r) for r in rows]


def get_next_k(team: str, as_of: str, k: int) -> List[Dict[str, Any]]:
    q = text(
        f"""
        SELECT
            tg.game_id,
            tg.game_date,
            tg.is_home,
            tg.goals_for,
            tg.goals_against,
            tg.shots_for,
            tg.shots_against,
            tg.pp_goals,
            tg.pp_opps,
            tg.pk_goals_against,
            tg.pk_opps,
            tg.goalie_sv_pct,
            tg.win
        FROM team_games tg
        WHERE tg.team = :team
          AND tg.game_date >= :as_of
          AND {_regular_season_condition("tg")}
        ORDER BY tg.game_date ASC, tg.game_id ASC
        LIMIT :k
        """
    )
    with engine.connect() as conn:
        rows = conn.execute(q, {"team": team, "as_of": as_of, "k": k}).mappings().all()
    return [dict(r) for r in rows]
