from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

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
    """
    Chronological ASC rows for a team (regular season only).
    NOTE: We include opponent + goalie_sv_pct (DB stays intact); trend features can ignore sv%.
    """
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
            tg.opponent,
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
    """
    Last N games strictly BEFORE as_of, DESC order (newest first), regular season only.
    """
    q = text(
        f"""
        SELECT
            tg.game_id,
            tg.game_date,
            tg.is_home,
            tg.opponent,
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
    """
    Next K games on/after as_of, ASC order, regular season only.
    (Used for training labels; still pulled from team_games.)
    """
    q = text(
        f"""
        SELECT
            tg.game_id,
            tg.game_date,
            tg.is_home,
            tg.opponent,
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


# -------------------------------------------------------------------
# Option B helpers: opponent baselines (as-of) + league fallback + cache
# Baselines intentionally DO NOT use goalie_sv_pct.
# -------------------------------------------------------------------

_BASELINE_CACHE: Dict[Tuple[str, str, int], Dict[str, Any]] = {}
_LEAGUE_CACHE: Dict[str, Dict[str, Any]] = {}


def _pct_or_none(numer: float, denom: float) -> Optional[float]:
    if denom <= 0:
        return None
    return float(numer) / float(denom)


def _aggregate_baseline(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate expectations from a list of team_games-like rows.
    Returns per-game averages + PP%/PK%. No save% included.
    """
    n = len(rows)
    if n == 0:
        return {
            "games_used": 0,
            "gf_pg": None,
            "ga_pg": None,
            "sf_pg": None,
            "sa_pg": None,
            "pp_pct": None,
            "pk_pct": None,
        }

    gf = sum(int(r.get("goals_for") or 0) for r in rows)
    ga = sum(int(r.get("goals_against") or 0) for r in rows)
    sf = sum(int(r.get("shots_for") or 0) for r in rows)
    sa = sum(int(r.get("shots_against") or 0) for r in rows)

    pp_goals = sum(int(r.get("pp_goals") or 0) for r in rows)
    pp_opps = sum(int(r.get("pp_opps") or 0) for r in rows)
    pk_ga = sum(int(r.get("pk_goals_against") or 0) for r in rows)
    pk_opps = sum(int(r.get("pk_opps") or 0) for r in rows)

    pp_pct = _pct_or_none(pp_goals, pp_opps)

    pk_pct = None
    if pk_opps > 0:
        pk_pct = 1.0 - (float(pk_ga) / float(pk_opps))

    return {
        "games_used": n,
        "gf_pg": gf / n,
        "ga_pg": ga / n,
        "sf_pg": sf / n,
        "sa_pg": sa / n,
        "pp_pct": pp_pct,
        "pk_pct": pk_pct,
    }


def get_team_baseline_asof(team: str, as_of: str, m: int) -> Dict[str, Any]:
    """
    Rolling baseline for `team` using their last `m` regular-season games
    strictly BEFORE `as_of` (no leakage).
    """
    key = (team, as_of, m)
    if key in _BASELINE_CACHE:
        return _BASELINE_CACHE[key]

    q = text(
        f"""
        SELECT
            tg.goals_for,
            tg.goals_against,
            tg.shots_for,
            tg.shots_against,
            tg.pp_goals,
            tg.pp_opps,
            tg.pk_goals_against,
            tg.pk_opps
        FROM team_games tg
        WHERE tg.team = :team
          AND tg.game_date < :as_of
          AND {_regular_season_condition("tg")}
        ORDER BY tg.game_date DESC, tg.game_id DESC
        LIMIT :m
        """
    )

    with engine.connect() as conn:
        rows = conn.execute(q, {"team": team, "as_of": as_of, "m": m}).mappings().all()

    baseline = _aggregate_baseline([dict(r) for r in rows])
    _BASELINE_CACHE[key] = baseline
    return baseline


def get_league_baseline_asof(as_of: str) -> Dict[str, Any]:
    """
    League-average baseline over all regular-season team-game rows strictly BEFORE `as_of`.
    Used as neutral fallback when an opponent doesn't have enough prior games.
    """
    if as_of in _LEAGUE_CACHE:
        return _LEAGUE_CACHE[as_of]

    q = text(
        f"""
        SELECT
            AVG(tg.goals_for)     AS gf_pg,
            AVG(tg.goals_against) AS ga_pg,
            AVG(tg.shots_for)     AS sf_pg,
            AVG(tg.shots_against) AS sa_pg,
            SUM(COALESCE(tg.pp_goals, 0))         AS pp_goals,
            SUM(COALESCE(tg.pp_opps, 0))          AS pp_opps,
            SUM(COALESCE(tg.pk_goals_against, 0)) AS pk_ga,
            SUM(COALESCE(tg.pk_opps, 0))          AS pk_opps,
            COUNT(*) AS rows_used
        FROM team_games tg
        WHERE tg.game_date < :as_of
          AND {_regular_season_condition("tg")}
        """
    )

    with engine.connect() as conn:
        r = conn.execute(q, {"as_of": as_of}).mappings().first()

    if not r:
        league = {
            "rows_used": 0,
            "gf_pg": None,
            "ga_pg": None,
            "sf_pg": None,
            "sa_pg": None,
            "pp_pct": None,
            "pk_pct": None,
        }
    else:
        pp_pct = _pct_or_none(float(r["pp_goals"] or 0), float(r["pp_opps"] or 0))

        pk_pct = None
        pk_opps = float(r["pk_opps"] or 0)
        if pk_opps > 0:
            pk_pct = 1.0 - (float(r["pk_ga"] or 0) / pk_opps)

        league = {
            "rows_used": int(r["rows_used"] or 0),
            "gf_pg": float(r["gf_pg"]) if r["gf_pg"] is not None else None,
            "ga_pg": float(r["ga_pg"]) if r["ga_pg"] is not None else None,
            "sf_pg": float(r["sf_pg"]) if r["sf_pg"] is not None else None,
            "sa_pg": float(r["sa_pg"]) if r["sa_pg"] is not None else None,
            "pp_pct": pp_pct,
            "pk_pct": pk_pct,
        }

    _LEAGUE_CACHE[as_of] = league
    return league


def get_team_baseline_asof_with_fallback(
    team: str, as_of: str, m: int, *, min_games: int = 5
) -> Dict[str, Any]:
    """
    If team has < min_games prior games, return league baseline expectations.
    Keep the real `games_used` so downstream can compute an opponent-context strength score.
    """
    b = get_team_baseline_asof(team, as_of, m)
    if int(b.get("games_used") or 0) >= min_games:
        return b

    league = get_league_baseline_asof(as_of)
    return {
        "games_used": int(b.get("games_used") or 0),
        "gf_pg": league.get("gf_pg"),
        "ga_pg": league.get("ga_pg"),
        "sf_pg": league.get("sf_pg"),
        "sa_pg": league.get("sa_pg"),
        "pp_pct": league.get("pp_pct"),
        "pk_pct": league.get("pk_pct"),
        "fallback": "league",
    }


def clear_baseline_caches() -> None:
    _BASELINE_CACHE.clear()
    _LEAGUE_CACHE.clear()
