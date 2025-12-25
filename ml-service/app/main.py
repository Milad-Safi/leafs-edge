from __future__ import annotations

import datetime as dt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .trend_model import predict_team_trend
from .stats_db import (
    team_aggregate,
    team_last_n,
    league_ranks,
    team_latest_game_date,
)
from .standings import fetch_standings_now, extract_summary_fields_from_standings

app = FastAPI(title="Leafs Edge ML + Stats API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"ok": True, "service": "leafs-edge-ml"}


# TEAM — SEASON SUMMARY (DB + NHL standings extras)
@app.get("/v1/team/summary")
def team_summary_route(team: str):
    team = team.strip().upper()

    # Base = DB truth (GF/GA, SF/SA, PP/PK, home/away, games, etc.)
    out = team_aggregate(team=team, through=None)

    # Merge standings extras (wins/losses/otl/points/streak/ranks)
    # If NHL API fails, we DON'T break the endpoint.
    try:
        s = fetch_standings_now()
        extra = extract_summary_fields_from_standings(s, team)
        if extra:
            # standings wins/losses/otl/points are more "official" than our DB win boolean
            # so we override record-related fields if present.
            for k in [
                "wins",
                "losses",
                "otLosses",
                "points",
                "pointPctg",
                "streakCode",
                "streakCount",
                "divisionSequence",
                "conferenceSequence",
                "leagueSequence",
                "teamLogo",
                "standingsDate",
                "standingsDateTimeUtc",
            ]:
                if k in extra and extra[k] is not None:
                    out[k] = extra[k]
    except Exception:
        # fallback so UI doesn't show null/-
        out.setdefault("otLosses", 0)
        if out.get("wins") is not None and out.get("points") is None:
            out["points"] = int(out["wins"]) * 2
        out.setdefault("streakCode", None)
        out.setdefault("streakCount", 0)

    # Guarantee non-null OTL for UI cleanliness
    if out.get("otLosses") is None:
        out["otLosses"] = 0

    return out


# TEAM — LAST 5
@app.get("/v1/team/last5")
def team_last5_route(team: str):
    team = team.strip().upper()
    as_of = dt.date.today().isoformat()
    return team_last_n(team=team, as_of=as_of, n=5)


# LEAGUE — RANKS
@app.get("/v1/league/ranks")
def league_ranks_route():
    return {"ok": True, "ranks": league_ranks(through=None)}


# 
# ML — TREND
@app.get("/v1/trend/team")
def trend_team_route(team: str):
    team = team.strip().upper()
    as_of = dt.date.today().isoformat()
    return predict_team_trend(team=team, as_of=as_of, n=10)


# MATCHUP — DASHBOARD (one-call convenience)
@app.get("/v1/matchup/dashboard")
def matchup_dashboard_route(teamA: str, teamB: str):
    a = teamA.strip().upper()
    b = teamB.strip().upper()
    as_of = dt.date.today().isoformat()

    a_latest = team_latest_game_date(a)
    b_latest = team_latest_game_date(b)

    if a_latest and b_latest:
        through = min(a_latest, b_latest)
    else:
        through = (dt.date.today() - dt.timedelta(days=1)).isoformat()

    seasonA = team_aggregate(a, through=through)
    seasonB = team_aggregate(b, through=through)

    lastA = team_last_n(a, as_of=as_of, n=5)
    lastB = team_last_n(b, as_of=as_of, n=5)

    trendA = predict_team_trend(team=a, as_of=as_of, n=10)
    trendB = predict_team_trend(team=b, as_of=as_of, n=10)

    return {
        "ok": True,
        "as_of": as_of,
        "through": through,
        "teams": {"A": a, "B": b},
        "season": {"A": seasonA, "B": seasonB},
        "last5": {"A": lastA, "B": lastB},
        "trend": {"A": trendA, "B": trendB},
        "ranks": {"byMetric": league_ranks(through=through)},
    }
