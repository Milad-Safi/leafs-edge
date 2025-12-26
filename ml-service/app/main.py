from __future__ import annotations

import datetime as dt
import time
from typing import Any, Dict, Optional, Tuple

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .trend_model import predict_team_trend
from .nhlpy_proxy import nhl_client, capabilities as nhlpy_capabilities
from .stats_db import team_aggregate, team_last_n, team_latest_game_date
from .standings import fetch_standings_now, extract_all_summary_fields_from_standings
from .hot_last5 import fetch_hot_last5, infer_current_season_id

# ✅ EDGE routes live in app/routes_edge.py now
from .routes_edge import router as edge_router

app = FastAPI(title="Leafs Edge API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Tiny in-memory TTL cache (dev-friendly, single-process)
# ─────────────────────────────────────────────────────────────
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


def _current_season_str() -> str:
    return str(infer_current_season_id())


def _teams_all_cached():
    def build():
        c = nhl_client()
        return c.teams.teams()

    return _cached("nhlpy_teams_all", 3600, build)


# ─────────────────────────────────────────────────────────────
# Core endpoints (unchanged)
# ─────────────────────────────────────────────────────────────
@app.get("/v1/trend/team")
def trend_team(team: str):
    today = dt.date.today().isoformat()
    return predict_team_trend(team=team.upper(), as_of=today)


@app.get("/v1/standings/summary")
def standings_summary():
    def build():
        standings = fetch_standings_now()
        return extract_all_summary_fields_from_standings(standings)

    extras_map = _cached("standings_extras", 60, build)
    return {"ok": True, "as_of": dt.date.today().isoformat(), "teams": extras_map}


def _merge_standings_extras(team: str, base: dict, extras_map: dict) -> dict:
    out = dict(base) if base is not None else {}
    extra = extras_map.get(team)
    if extra:
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

    if out.get("otLosses") is None:
        out["otLosses"] = 0
    if out.get("points") is None and out.get("wins") is not None:
        out["points"] = int(out["wins"]) * 2

    out.setdefault("streakCode", None)
    out.setdefault("streakCount", 0)
    return out


@app.get("/v1/hot/last5")
def hot_last5(team: str):
    t = team.strip().upper()
    season_id = infer_current_season_id()

    def build():
        return fetch_hot_last5(t, season_id=season_id)

    payload = _cached(f"hotLast5:{season_id}:{t}", 60, build)
    return {"ok": True, "seasonId": season_id, "team": t, "data": payload}


@app.get("/v1/matchup/summary")
def matchup_summary(teamA: str, teamB: str):
    a = teamA.upper()
    b = teamB.upper()
    as_of = dt.date.today().isoformat()

    seasonA = team_aggregate(a)
    seasonB = team_aggregate(b)

    extras_map = _cached(
        "standings_extras",
        60,
        lambda: extract_all_summary_fields_from_standings(fetch_standings_now()),
    )
    seasonA = _merge_standings_extras(a, seasonA, extras_map)
    seasonB = _merge_standings_extras(b, seasonB, extras_map)

    lastA = team_last_n(a, as_of=as_of, n=5)
    lastB = team_last_n(b, as_of=as_of, n=5)

    through = {"A": team_latest_game_date(a), "B": team_latest_game_date(b)}

    return {
        "ok": True,
        "as_of": as_of,
        "teams": {"A": a, "B": b},
        "through": through,
        "season": {"A": seasonA, "B": seasonB},
        "last5": {"A": lastA, "B": lastB},
    }


# ─────────────────────────────────────────────────────────────
# Minimal NHL proxy endpoints (unchanged)
# ─────────────────────────────────────────────────────────────
@app.get("/v1/nhl/capabilities")
def nhl_capabilities():
    return {"ok": True, **nhlpy_capabilities()}


@app.get("/v1/nhl/teams/all")
def nhl_teams_all():
    return {"ok": True, "data": _teams_all_cached()}


# ✅ Include EDGE router (moved out)
app.include_router(edge_router)
