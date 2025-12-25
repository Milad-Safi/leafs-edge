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

app = FastAPI(title="Leafs Edge ML + Stats API")

# CORS (open for local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# HEALTH
# ---------------------------------------------------------
@app.get("/")
def root():
    return {"ok": True, "service": "leafs-edge-ml"}


# ---------------------------------------------------------
# TEAM — SEASON SUMMARY (no optional params)
# ---------------------------------------------------------
@app.get("/v1/team/summary")
def team_summary_route(team: str):
    team = team.strip().upper()
    # team_aggregate resolves through automatically
    return team_aggregate(team=team, through=None)


# ---------------------------------------------------------
# TEAM — LAST 5 (no optional params)
# ---------------------------------------------------------
@app.get("/v1/team/last5")
def team_last5_route(team: str):
    team = team.strip().upper()
    as_of = dt.date.today().isoformat()
    return team_last_n(team=team, as_of=as_of, n=5)


# ---------------------------------------------------------
# LEAGUE — RANKS (no optional params)
# ---------------------------------------------------------
@app.get("/v1/league/ranks")
def league_ranks_route():
    # league_ranks resolves through automatically
    return {
        "ok": True,
        "ranks": league_ranks(through=None),
    }


# ---------------------------------------------------------
# ML — TREND (no optional params)
# ---------------------------------------------------------
@app.get("/v1/trend/team")
def trend_team_route(team: str):
    team = team.strip().upper()
    as_of = dt.date.today().isoformat()
    return predict_team_trend(team=team, as_of=as_of, n=10)


# ---------------------------------------------------------
# MATCHUP — DASHBOARD (one-call frontend convenience)
# ---------------------------------------------------------
@app.get("/v1/matchup/dashboard")
def matchup_dashboard_route(teamA: str, teamB: str):
    a = teamA.strip().upper()
    b = teamB.strip().upper()
    as_of = dt.date.today().isoformat()

    # Keep both teams perfectly consistent:
    # Use the EARLIEST "latest game date" between the two teams.
    # (Prevents one team being "ahead" by a day if the other hasn't played yet.)
    a_latest = team_latest_game_date(a)
    b_latest = team_latest_game_date(b)

    if a_latest and b_latest:
        through = min(a_latest, b_latest)
    else:
        # fallback: yesterday
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
        # Optional but helpful: include ranks here too so dashboard is truly one-call
        "ranks": {"byMetric": league_ranks(through=through)},
    }
