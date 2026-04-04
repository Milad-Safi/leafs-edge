from __future__ import annotations

import datetime as dt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .trend_model import predict_team_trend
from .nhlpy_proxy import nhl_client, capabilities as nhlpy_capabilities
from .routes_edge import router as edge_router
from fastapi import HTTPException, Query
from .xg_game import compute_game_team_xg

# Use shared helper cache file
from .cache import cached

app = FastAPI(title="Leafs Edge API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _teams_all_cached():
    # Cache the NHL team list for 1 hour (same key + TTL as before)
    def build():
        c = nhl_client()
        return c.teams.teams()

    return cached("nhlpy_teams_all", 3600, build)


# Core endpoints

# Endpoint for getting the trend of the team (Machine Learning)
@app.get("/v1/trend/team")
def trend_team(team: str):
    today = dt.date.today().isoformat()
    return predict_team_trend(team=team.upper(), as_of=today)
 
@app.get("/v1/nhl/capabilities")
def nhl_capabilities():
    return {"ok": True, **nhlpy_capabilities()}

@app.get("/v1/nhl/teams/all")
def nhl_teams_all():
    return {"ok": True, "data": _teams_all_cached()}

@app.get("/v1/xg/game")
def get_game_xg(
    game_id: int = Query(..., description="NHL game id"),
):
    try:
        result = compute_game_team_xg(game_id=game_id)

        team_xg = {
            str(team): round(float(xg), 3)
            for team, xg in result.get("team_xg", {}).items()
        }

        if not team_xg:
            raise HTTPException(
                status_code=404,
                detail=f"No xG data available for game_id={game_id}",
            )

        return {
            "game_id": int(game_id),
            "team_xg": team_xg,
            "total_xg": round(float(result.get("total_xg", 0.0)), 3),
            "total_shots_modelled": int(result.get("total_shots_modelled", 0)),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"xG computation failed for game_id={game_id}: {exc}",
        ) from exc

# All 3 NHL EDGE Stat Endpoints (Shot/Goal locations, Skater speed, Hardest/Fastest Shots)
app.include_router(edge_router)
