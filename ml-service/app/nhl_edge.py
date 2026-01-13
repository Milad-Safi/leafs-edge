from __future__ import annotations

# Helper module for routing query params into nhlpy edge client methods
# Keeps one consistent place for team id mapping, query coercion, and method invocation
# Used by backend routes that expose nhlpy edge endpoints through FastAPI

import inspect
from typing import Any, Dict, Optional

from fastapi import HTTPException, Request

from .nhlpy_proxy import nhl_client

# Static NHL team id mapping used when an endpoint needs team_id instead of tri-code
TEAM_ID_BY_ABBR: Dict[str, int] = {
    "NJD": 1, "NYI": 2, "NYR": 3, "PHI": 4, "PIT": 5, "BOS": 6, "BUF": 7, "MTL": 8,
    "OTT": 9, "TOR": 10, "CAR": 12, "FLA": 13, "TBL": 14, "WSH": 15, "CHI": 16,
    "DET": 17, "NSH": 18, "STL": 19, "CGY": 20, "COL": 21, "EDM": 22, "VAN": 23,
    "ANA": 24, "DAL": 25, "LAK": 26, "SJS": 28, "CBJ": 29, "MIN": 30,
    "WPG": 52, "UTA": 53, "VGK": 54, "SEA": 55,
}


# Convert a team abbreviation into the numeric NHL team id when available
def team_id_for_abbrev(team: str) -> Optional[int]:
    return TEAM_ID_BY_ABBR.get(team.strip().upper())


# Convert query string values into bool, int, float when safe, else keep as string
def coerce_q(v: str):
    s = v.strip()
    low = s.lower()
    if low in ("true", "false"):
        return low == "true"
    try:
        if s.isdigit() or (s.startswith("-") and s[1:].isdigit()):
            return int(s)
    except Exception:
        pass
    try:
        if "." in s:
            return float(s)
    except Exception:
        pass
    return s


# Build kwargs for a target nhlpy method by inspecting its signature and matching query params
def invoke_with_query(fn, query: Dict[str, str]):
    sig = inspect.signature(fn)
    params = sig.parameters

    # Known alias sets so routes can accept stable query params across slightly different method names
    aliases = {
        "team": ["team", "team_abbrev", "team_abbr", "team_abbreviation", "tri_code", "team_tri_code"],
        "teamId": ["teamId", "team_id", "teamID"],
        "season": ["season", "season_id", "seasonId", "start_season"],
    }

    kwargs: Dict[str, Any] = {}

    # Direct param matches based on the wrapped function signature
    for k, v in query.items():
        if k in params:
            kwargs[k] = coerce_q(v)

    # Alias matches where the incoming query uses a different common name
    for given, targets in aliases.items():
        if given in query:
            for t in targets:
                if t in params and t not in kwargs:
                    kwargs[t] = coerce_q(query[given])
                    break

    # If the wrapped method expects team_id, allow passing ?team=TOR and map it here
    if "team_id" in params and "team_id" not in kwargs:
        if "team" in query:
            tid = team_id_for_abbrev(query["team"])
            if tid is None:
                raise HTTPException(status_code=400, detail=f"Unknown team abbrev: {query['team']}")
            kwargs["team_id"] = tid
        elif "teamId" in query:
            kwargs["team_id"] = coerce_q(query["teamId"])

    # Enforce required args so missing inputs fail with a clear 400
    missing = []
    for name, p in params.items():
        if p.default is inspect._empty and p.kind in (
            inspect.Parameter.POSITIONAL_OR_KEYWORD,
            inspect.Parameter.KEYWORD_ONLY,
        ):
            if name not in kwargs:
                missing.append(name)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required query params: {missing}")

    return fn(**kwargs)


# Entry point used by API routes to call nhlpy edge methods by name with request query params
def edge_call(method_name: str, request: Request):
    c = nhl_client()
    fn = getattr(c.edge, method_name, None)
    if fn is None or not callable(fn):
        raise HTTPException(status_code=404, detail=f"edge method not found: {method_name}")
    return invoke_with_query(fn, dict(request.query_params))
