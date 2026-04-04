from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import text

from .db import engine


def _regular_season_condition(alias: str = "tg") -> str:
    # NHL game_id format is YYYYTTNNNN where TT == 02 means regular season
    return f"((CAST({alias}.game_id / 10000 AS INTEGER) % 100) = 2)"


def _season_start_expr(alias: str = "tg") -> str:
    # 2025020001 -> 2025
    return f"CAST({alias}.game_id / 1000000 AS INTEGER)"


def list_regular_season_games(
    limit: Optional[int] = None,
    season_start_min: Optional[int] = None,
    season_start_max: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    where = [_regular_season_condition("tg")]
    params: Dict[str, Any] = {}

    if season_start_min is not None:
        where.append(f"{_season_start_expr('tg')} >= :season_start_min")
        params["season_start_min"] = int(season_start_min)

    if season_start_max is not None:
        where.append(f"{_season_start_expr('tg')} <= :season_start_max")
        params["season_start_max"] = int(season_start_max)

    if start_date:
        where.append("tg.game_date >= :start_date")
        params["start_date"] = start_date

    if end_date:
        where.append("tg.game_date <= :end_date")
        params["end_date"] = end_date

    limit_sql = ""
    if limit is not None:
        limit_sql = "LIMIT :limit"
        params["limit"] = int(limit)

    q = text(
        f"""
        SELECT
            tg.game_id,
            MIN(tg.game_date) AS game_date,
            MAX(CASE WHEN tg.is_home THEN tg.team END) AS home_team,
            MAX(CASE WHEN NOT tg.is_home THEN tg.team END) AS away_team
        FROM team_games tg
        WHERE {" AND ".join(where)}
        GROUP BY tg.game_id
        ORDER BY MIN(tg.game_date) ASC, tg.game_id ASC
        {limit_sql}
        """
    )

    with engine.connect() as conn:
        rows = conn.execute(q, params).mappings().all()

    return [dict(r) for r in rows]