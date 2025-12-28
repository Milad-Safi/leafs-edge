from __future__ import annotations

import datetime as dt
import time
from typing import Any, Dict, Optional, Tuple

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .trend_model import predict_team_trend
from .nhlpy_proxy import nhl_client, capabilities as nhlpy_capabilities

from .routes_edge import router as edge_router

app = FastAPI(title="Leafs Edge API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tiny in-memory TTL cache (dev-friendly, single-process)
_TTL_CACHE: Dict[str, Tuple[float, Any]] = {}


def _cache_get(key: str) -> Optional[Any]:
    item = _TTL_CACHE.get(key)
    if not item:
        return None
    expires_at, val = item
    if time.time() > expires_at:
        _TTL_CACHE.pop(key, None)
        return None
    return val


def _cache_set(key: str, val: Any, ttl_seconds: int) -> None:
    _TTL_CACHE[key] = (time.time() + ttl_seconds, val)


def _cached(key: str, ttl_seconds: int, fn):
    v = _cache_get(key)
    if v is not None:
        return v
    v = fn()
    _cache_set(key, v, ttl_seconds)
    return v


def _teams_all_cached():
    def build():
        c = nhl_client()
        return c.teams.teams()

    return _cached("nhlpy_teams_all", 3600, build)


# Core endpoints 
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

app.include_router(edge_router)
