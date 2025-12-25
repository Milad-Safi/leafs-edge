from __future__ import annotations

from typing import Any, Dict, Optional

from sqlalchemy import text

from .db import engine

# Frontend wants only THIS season.
SEASON_START = "2025-10-05"


def _regular_season_condition(alias: str = "tg") -> str:
    # NHL game_id format: YYYYTTNNNN where TT == 02 for regular season
    return f"((CAST({alias}.game_id / 10000 AS INTEGER) % 100) = 2)"


def team_latest_game_date(team: str) -> Optional[str]:
    """
    Latest game_date for a team in THIS season (regular season).
    Returns YYYY-MM-DD or None if no rows.
    """
    q = text(
        f"""
        SELECT MAX(tg.game_date) AS max_date
        FROM team_games tg
        WHERE tg.team = :team
          AND tg.game_date >= :season_start
          AND {_regular_season_condition("tg")}
        """
    )
    with engine.connect() as conn:
        r = conn.execute(q, {"team": team, "season_start": SEASON_START}).mappings().first()
    if not r:
        return None
    return r["max_date"]


def league_latest_game_date() -> Optional[str]:
    """
    Latest game_date present in DB for THIS season (regular season).
    """
    q = text(
        f"""
        SELECT MAX(tg.game_date) AS max_date
        FROM team_games tg
        WHERE tg.game_date >= :season_start
          AND {_regular_season_condition("tg")}
        """
    )
    with engine.connect() as conn:
        r = conn.execute(q, {"season_start": SEASON_START}).mappings().first()
    if not r:
        return None
    return r["max_date"]


def team_aggregate(team: str, through: Optional[str] = None) -> Dict[str, Any]:
    """
    Season-to-date aggregates from team_games for this season only.
    Date range is restricted to [SEASON_START, through_resolved].
    Regular season only.

    If through is None, it resolves to the latest game_date for that team.
    """
    team = team.strip().upper()

    if through is None:
        through = team_latest_game_date(team)

    # If still None (no games), return empty response
    if through is None:
        return {
            "team": team,
            "seasonStart": SEASON_START,
            "through": None,
            "games": 0,
            "wins": 0,
            "losses": 0,
            "goalsForPerGame": None,
            "goalsAgainstPerGame": None,
            "shotsForPerGame": None,
            "shotsAgainstPerGame": None,
            "powerPlayPct": None,
            "penaltyKillPct": None,
            "homeRecord": {"w": 0, "l": 0},
            "awayRecord": {"w": 0, "l": 0},
        }

    q = text(
        f"""
        SELECT
          COUNT(*)::int AS games,
          SUM(CASE WHEN tg.win THEN 1 ELSE 0 END)::int AS wins,
          SUM(CASE WHEN tg.win THEN 0 ELSE 1 END)::int AS losses,

          SUM(tg.goals_for)::int AS gf,
          SUM(tg.goals_against)::int AS ga,
          AVG(tg.goals_for)::float AS gf_pg,
          AVG(tg.goals_against)::float AS ga_pg,

          SUM(tg.shots_for)::int AS sf,
          SUM(tg.shots_against)::int AS sa,
          AVG(tg.shots_for)::float AS sf_pg,
          AVG(tg.shots_against)::float AS sa_pg,

          SUM(COALESCE(tg.pp_goals,0))::int AS pp_goals,
          SUM(COALESCE(tg.pp_opps,0))::int AS pp_opps,

          SUM(COALESCE(tg.pk_goals_against,0))::int AS pk_ga,
          SUM(COALESCE(tg.pk_opps,0))::int AS pk_opps,

          SUM(CASE WHEN tg.is_home THEN 1 ELSE 0 END)::int AS home_games,
          SUM(CASE WHEN tg.is_home AND tg.win THEN 1 ELSE 0 END)::int AS home_wins,
          SUM(CASE WHEN tg.is_home AND NOT tg.win THEN 1 ELSE 0 END)::int AS home_losses,

          SUM(CASE WHEN NOT tg.is_home THEN 1 ELSE 0 END)::int AS away_games,
          SUM(CASE WHEN NOT tg.is_home AND tg.win THEN 1 ELSE 0 END)::int AS away_wins,
          SUM(CASE WHEN NOT tg.is_home AND NOT tg.win THEN 1 ELSE 0 END)::int AS away_losses
        FROM team_games tg
        WHERE tg.team = :team
          AND tg.game_date >= :season_start
          AND tg.game_date <= :through
          AND {_regular_season_condition("tg")}
        """
    )

    params: Dict[str, Any] = {"team": team, "season_start": SEASON_START, "through": through}

    with engine.connect() as conn:
        row = conn.execute(q, params).mappings().first()

    if not row or row["games"] == 0:
        return {
            "team": team,
            "seasonStart": SEASON_START,
            "through": through,
            "games": 0,
            "wins": 0,
            "losses": 0,
            "goalsForPerGame": None,
            "goalsAgainstPerGame": None,
            "shotsForPerGame": None,
            "shotsAgainstPerGame": None,
            "powerPlayPct": None,
            "penaltyKillPct": None,
            "homeRecord": {"w": 0, "l": 0},
            "awayRecord": {"w": 0, "l": 0},
        }

    pp_pct = None
    if row["pp_opps"] and row["pp_opps"] > 0:
        pp_pct = row["pp_goals"] / row["pp_opps"]

    pk_pct = None
    if row["pk_opps"] and row["pk_opps"] > 0:
        pk_pct = 1.0 - (row["pk_ga"] / row["pk_opps"])

    return {
        "team": team,
        "seasonStart": SEASON_START,
        "through": through,
        "games": int(row["games"]),
        "wins": int(row["wins"]),
        "losses": int(row["losses"]),
        "goalsForPerGame": float(row["gf_pg"]) if row["gf_pg"] is not None else None,
        "goalsAgainstPerGame": float(row["ga_pg"]) if row["ga_pg"] is not None else None,
        "shotsForPerGame": float(row["sf_pg"]) if row["sf_pg"] is not None else None,
        "shotsAgainstPerGame": float(row["sa_pg"]) if row["sa_pg"] is not None else None,
        "powerPlayPct": pp_pct,
        "penaltyKillPct": pk_pct,
        "homeRecord": {"w": int(row["home_wins"]), "l": int(row["home_losses"])},
        "awayRecord": {"w": int(row["away_wins"]), "l": int(row["away_losses"])},
    }


def team_last_n(team: str, as_of: str, n: int) -> Dict[str, Any]:
    """
    Last N games in this season only.
    Uses games strictly before as_of.
    Returns aggregates + per-game list + window range.
    """
    team = team.strip().upper()

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
          COALESCE(tg.pp_goals,0) AS pp_goals,
          COALESCE(tg.pp_opps,0) AS pp_opps,
          COALESCE(tg.pk_goals_against,0) AS pk_goals_against,
          COALESCE(tg.pk_opps,0) AS pk_opps,
          tg.win
        FROM team_games tg
        WHERE tg.team = :team
          AND tg.game_date >= :season_start
          AND tg.game_date < :as_of
          AND {_regular_season_condition("tg")}
        ORDER BY tg.game_date DESC, tg.game_id DESC
        LIMIT :n
        """
    )

    with engine.connect() as conn:
        rows = conn.execute(
            q,
            {"team": team, "as_of": as_of, "n": n, "season_start": SEASON_START},
        ).mappings().all()

    games = [dict(r) for r in rows]
    games_count = len(games)

    newest = games[0]["game_date"] if games_count > 0 else None
    oldest = games[-1]["game_date"] if games_count > 0 else None

    game_list = []
    for g in games:
        game_list.append(
            {
                "gameId": int(g["game_id"]),
                "date": g["game_date"],
                "isHome": bool(g["is_home"]),
                "opponent": g["opponent"],
                "goalsFor": int(g["goals_for"]),
                "goalsAgainst": int(g["goals_against"]),
                "shotsFor": int(g["shots_for"]),
                "shotsAgainst": int(g["shots_against"]),
                "pp": {"goals": int(g["pp_goals"]), "opps": int(g["pp_opps"])},
                "pk": {"oppPPGoals": int(g["pk_goals_against"]), "oppPPOpps": int(g["pk_opps"])},
                "win": bool(g["win"]),
            }
        )

    if games_count == 0:
        return {
            "team": team,
            "seasonStart": SEASON_START,
            "as_of": as_of,
            "n": n,
            "games": 0,
            "range": {"newest": None, "oldest": None},
            "record": {"w": 0, "l": 0, "otl": None},
            "goalsForPerGame": None,
            "goalsAgainstPerGame": None,
            "shotsForPerGame": None,
            "shotsAgainstPerGame": None,
            "powerPlay": {"goals": 0, "opps": 0, "pct": None},
            "penaltyKill": {"oppPPGoals": 0, "oppPPOpps": 0, "pct": None},
            "gameIds": [],
            "gamesList": [],
        }

    w = sum(1 for g in games if g["win"])
    l = games_count - w

    gf = sum(g["goals_for"] for g in games)
    ga = sum(g["goals_against"] for g in games)
    sf = sum(g["shots_for"] for g in games)
    sa = sum(g["shots_against"] for g in games)

    pp_goals = sum(g["pp_goals"] for g in games)
    pp_opps = sum(g["pp_opps"] for g in games)
    pp_pct = (pp_goals / pp_opps) if pp_opps > 0 else None

    pk_ga = sum(g["pk_goals_against"] for g in games)
    pk_opps = sum(g["pk_opps"] for g in games)
    pk_pct = (1.0 - (pk_ga / pk_opps)) if pk_opps > 0 else None

    return {
        "team": team,
        "seasonStart": SEASON_START,
        "as_of": as_of,
        "n": n,
        "games": games_count,
        "range": {"newest": newest, "oldest": oldest},
        "record": {"w": w, "l": l, "otl": None},
        "goalsForPerGame": round(gf / games_count, 2),
        "goalsAgainstPerGame": round(ga / games_count, 2),
        "shotsForPerGame": round(sf / games_count, 2),
        "shotsAgainstPerGame": round(sa / games_count, 2),
        "powerPlay": {"goals": pp_goals, "opps": pp_opps, "pct": pp_pct},
        "penaltyKill": {"oppPPGoals": pk_ga, "oppPPOpps": pk_opps, "pct": pk_pct},
        "gameIds": [int(g["game_id"]) for g in games],
        "gamesList": game_list,
    }


def league_ranks(through: Optional[str] = None) -> Dict[str, Dict[str, Optional[int]]]:
    """
    League ranks for THIS season only.
    If through is None, resolves to latest date in DB for this season.
    """
    if through is None:
        through = league_latest_game_date()

    # If still None, empty
    if through is None:
        return {
            "goalsForPerGame": {},
            "goalsAgainstPerGame": {},
            "shotsForPerGame": {},
            "shotsAgainstPerGame": {},
            "powerPlayPct": {},
            "penaltyKillPct": {},
        }

    q = text(
        f"""
        SELECT
          tg.team AS team,

          AVG(tg.goals_for)::float AS gf_pg,
          AVG(tg.goals_against)::float AS ga_pg,
          AVG(tg.shots_for)::float AS sf_pg,
          AVG(tg.shots_against)::float AS sa_pg,

          (SUM(COALESCE(tg.pp_goals,0))::float / NULLIF(SUM(COALESCE(tg.pp_opps,0)),0)) AS pp_pct,
          (1.0 - (SUM(COALESCE(tg.pk_goals_against,0))::float / NULLIF(SUM(COALESCE(tg.pk_opps,0)),0))) AS pk_pct
        FROM team_games tg
        WHERE tg.game_date >= :season_start
          AND tg.game_date <= :through
          AND {_regular_season_condition("tg")}
        GROUP BY tg.team
        """
    )

    with engine.connect() as conn:
        rows = conn.execute(q, {"season_start": SEASON_START, "through": through}).mappings().all()

    def rank_metric(key: str, higher_is_better: bool) -> Dict[str, Optional[int]]:
        vals = []
        for r in rows:
            v = r[key]
            if v is None:
                continue
            vals.append((r["team"], float(v)))

        vals.sort(key=lambda x: x[1], reverse=higher_is_better)

        out: Dict[str, Optional[int]] = {r["team"]: None for r in rows}
        for i, (team, _) in enumerate(vals, start=1):
            out[team] = i
        return out

    return {
        "goalsForPerGame": rank_metric("gf_pg", True),
        "goalsAgainstPerGame": rank_metric("ga_pg", False),
        "shotsForPerGame": rank_metric("sf_pg", True),
        "shotsAgainstPerGame": rank_metric("sa_pg", False),
        "powerPlayPct": rank_metric("pp_pct", True),
        "penaltyKillPct": rank_metric("pk_pct", True),
    }
