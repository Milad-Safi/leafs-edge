from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Request

from .cache import cached
from .nhl_edge import edge_call

router = APIRouter()


def _pick(d: Dict[str, Any], keys: List[str], default=None):
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return default

def _extract_speed_mph_kph(item: Dict[str, Any]) -> Tuple[Optional[float], Optional[float]]:
    """
    Matches the payload in team_shot_speed.pdf:
      - item["shotSpeed"] = {"imperial": <mph>, "metric": <kph>}
    """
    mph = None
    kph = None

    ss = item.get("shotSpeed")
    if isinstance(ss, dict):
        imp = ss.get("imperial")
        met = ss.get("metric")
        if isinstance(imp, (int, float)):
            mph = float(imp)
        if isinstance(met, (int, float)):
            kph = float(met)

    # fallback support (keep your earlier generic behavior)
    if mph is None or kph is None:
        speed_obj = _pick(item, ["speed", "skatingSpeed"], default=None)
        if isinstance(speed_obj, dict):
            if mph is None:
                vv = _pick(speed_obj, ["mph", "MPH", "valueMph", "value_mph", "imperial"], default=None)
                if isinstance(vv, (int, float)):
                    mph = float(vv)
            if kph is None:
                vv = _pick(speed_obj, ["kph", "KPH", "valueKph", "value_kph", "metric"], default=None)
                if isinstance(vv, (int, float)):
                    kph = float(vv)

    return mph, kph

def _extract_player(item: Dict[str, Any]) -> Tuple[Optional[int], Optional[str]]:
    """
    Matches team_shot_speed.pdf:
      - item["player"] = {"id": ..., "firstName": {"default": ...}, "lastName": {"default": ...}}
    """
    p = item.get("player")
    if isinstance(p, dict):
        pid = p.get("id")
        try:
            pid_int = int(pid) if pid is not None else None
        except Exception:
            pid_int = None

        first = None
        last = None
        fn = p.get("firstName")
        ln = p.get("lastName")
        if isinstance(fn, dict):
            first = fn.get("default")
        if isinstance(ln, dict):
            last = ln.get("default")

        name = None
        if first or last:
            name = f"{first or ''} {last or ''}".strip()

        return pid_int, name

    # fallback direct fields (just in case)
    pid = _pick(item, ["playerId", "player_id", "id"], default=None)
    try:
        pid_int = int(pid) if pid is not None else None
    except Exception:
        pid_int = None
    name = _pick(item, ["playerName", "name", "fullName"], default=None)
    return pid_int, str(name) if name is not None else None


def _extract_context(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pull minimal context for UI tooltips (optional fields if present).
    """
    return {
        "gameId": _pick(item, ["gameId", "game_id"], None),
        "gameDate": _pick(item, ["gameDate", "date"], None),
        "period": _pick(item, ["period", "periodNumber", "periodNum"], None),
        "time": _pick(item, ["time", "timeInPeriod", "time_in_period"], None),
        "eventId": _pick(item, ["eventId", "event_id"], None),
        "strength": _pick(item, ["strength", "situation"], None),
    }

@router.get("/v1/nhl/edge/team_shot_location")
def edge_team_shot_location(request: Request, team: str, season: Optional[str] = None):
    """
    Clean response for area-based shot/goal heatmaps.

    Returns:
      - areas[] with {area, sog, goals, shootingPctg}
      - scale {maxSog, maxGoals} for frontend coloring
    """
    def build():
        raw = edge_call("team_shot_location_detail", request)

        data = None
        if isinstance(raw, dict):
            if isinstance(raw.get("data"), dict):
                data = raw["data"]
            else:
                # some wrappers might already return the "data" shape
                data = raw

        details = []
        if isinstance(data, dict) and isinstance(data.get("shotLocationDetails"), list):
            details = data["shotLocationDetails"]

        areas: List[Dict[str, Any]] = []
        max_sog = 0
        max_goals = 0

        for row in details:
            if not isinstance(row, dict):
                continue

            area = row.get("area")
            sog = row.get("sog")
            goals = row.get("goals")
            shooting_pctg = row.get("shootingPctg")

            if not isinstance(area, str) or not area.strip():
                continue

            sog_i = int(sog) if isinstance(sog, (int, float)) else 0
            goals_i = int(goals) if isinstance(goals, (int, float)) else 0

            max_sog = max(max_sog, sog_i)
            max_goals = max(max_goals, goals_i)

            areas.append(
                {
                    "area": area,
                    "sog": sog_i,
                    "goals": goals_i,
                    "shootingPctg": float(shooting_pctg) if isinstance(shooting_pctg, (int, float)) else None,
                }
            )

        # sort by shots desc (nice default for debugging)
        areas.sort(key=lambda x: x.get("sog", 0), reverse=True)

        # determine season for response
        season_out = season
        if season_out is None and isinstance(raw, dict):
            # raw sometimes has top-level season field
            s = raw.get("season")
            if isinstance(s, str) and s.strip():
                season_out = s
        if season_out is None and isinstance(data, dict):
            s = data.get("season")
            if isinstance(s, str) and s.strip():
                season_out = s

        return season_out, areas, max_sog, max_goals

    key = f"edge:team_shot_location:clean:{team.upper()}:{season or ''}:{request.url.query}"
    season_out, areas, max_sog, max_goals = cached(key, 300, build)

    return {
        "ok": True,
        "team": team.upper(),
        "season": season_out,
        "areas": areas,
        "scale": {"maxSog": max_sog, "maxGoals": max_goals},
    }

@router.get("/v1/nhl/edge/team_shot_speed")
def edge_team_shot_speed(
    request: Request,
    team: str,
    season: Optional[str] = None,
    top: int = 3,
):
    """
    Clean response: top N hardest shooters for the team.
    We dedupe by player and keep each player's max shot speed event.
    """
    def build():
        raw = edge_call("team_shot_speed_detail", request)

        # Locate the list of shot events robustly
        # Common shapes:
        #   raw["hardestShots"]
        #   raw["data"]["hardestShots"]
        hardest = None
        if isinstance(raw, dict):
            if isinstance(raw.get("hardestShots"), list):
                hardest = raw.get("hardestShots")
            elif isinstance(raw.get("data"), dict) and isinstance(raw["data"].get("hardestShots"), list):
                hardest = raw["data"].get("hardestShots")

        if not hardest:
            return []

        best_by_player: Dict[int, Dict[str, Any]] = {}

        for ev in hardest:
            if not isinstance(ev, dict):
                continue

            pid, pname = _extract_player(ev)
            if pid is None:
                continue

            mph, kph = _extract_speed_mph_kph(ev)
            if mph is None and kph is None:
                continue

            ctx = _extract_context(ev)

            candidate = {
                "playerId": pid,
                "name": pname,
                "mph": mph,
                "kph": kph,
                **{k: v for k, v in ctx.items() if v is not None},
            }

            # Compare by mph if present, else by kph
            def score(x: Dict[str, Any]) -> float:
                if x.get("mph") is not None:
                    return float(x["mph"])
                return float(x.get("kph") or 0.0)

            prev = best_by_player.get(pid)
            if prev is None or score(candidate) > score(prev):
                best_by_player[pid] = candidate

        # Sort and take top N
        rows = list(best_by_player.values())

        def sort_key(x: Dict[str, Any]) -> float:
            if x.get("mph") is not None:
                return float(x["mph"])
            return float(x.get("kph") or 0.0)

        rows.sort(key=sort_key, reverse=True)
        return rows[: max(1, min(int(top), 25))]

    key = f"edge:team_shot_speed:hardestShooters:{team.upper()}:{season or ''}:{top}:{request.url.query}"    
    hardest_shooters = cached(key, 300, build)

    return {
        "ok": True,
        "team": team.upper(),
        "season": season,
        "hardestShooters": hardest_shooters,
    }


@router.get("/v1/nhl/edge/team_skating_speed")
def edge_team_skating_speed(
    request: Request,
    team: str,
    season: Optional[str] = None,
    top: int = 3,
):
    """
    Clean response: top N fastest skaters for the team.
    Dedupe by player and keep each player's max skating speed event.
    Payload source: data.topSkatingSpeeds[*].skatingSpeed.imperial/metric
    """
    def build():
        raw = edge_call("team_skating_speed_detail", request)

        speeds = None
        if isinstance(raw, dict):
            if isinstance(raw.get("topSkatingSpeeds"), list):
                speeds = raw.get("topSkatingSpeeds")
            elif isinstance(raw.get("data"), dict) and isinstance(raw["data"].get("topSkatingSpeeds"), list):
                speeds = raw["data"].get("topSkatingSpeeds")

        if not speeds:
            return []

        best_by_player: Dict[int, Dict[str, Any]] = {}

        for ev in speeds:
            if not isinstance(ev, dict):
                continue

            pid, pname = _extract_player(ev)
            if pid is None:
                continue

            # skatingSpeed has {imperial, metric} per PDF
            sp = ev.get("skatingSpeed")
            mph = None
            kph = None
            if isinstance(sp, dict):
                imp = sp.get("imperial")
                met = sp.get("metric")
                if isinstance(imp, (int, float)):
                    mph = float(imp)
                if isinstance(met, (int, float)):
                    kph = float(met)

            if mph is None and kph is None:
                continue

            # context from this payload
            period_num = None
            pd = ev.get("periodDescriptor")
            if isinstance(pd, dict):
                n = pd.get("number")
                if isinstance(n, int):
                    period_num = n

            candidate = {
                "playerId": pid,
                "name": pname,
                "mph": mph,
                "kph": kph,
                "gameDate": ev.get("gameDate"),
                "gameCenterLink": ev.get("gameCenterLink"),
                "period": period_num,
                "time": ev.get("timeInPeriod"),
            }

            def score(x: Dict[str, Any]) -> float:
                if x.get("mph") is not None:
                    return float(x["mph"])
                return float(x.get("kph") or 0.0)

            prev = best_by_player.get(pid)
            if prev is None or score(candidate) > score(prev):
                best_by_player[pid] = candidate

        rows = list(best_by_player.values())

        def sort_key(x: Dict[str, Any]) -> float:
            if x.get("mph") is not None:
                return float(x["mph"])
            return float(x.get("kph") or 0.0)

        rows.sort(key=sort_key, reverse=True)
        return rows[: max(1, min(int(top), 25))]

    key = f"edge:team_skating_speed:fastestSkaters:{team.upper()}:{season or ''}:{top}:{request.url.query}"
    fastest = cached(key, 300, build)

    return {
        "ok": True,
        "team": team.upper(),
        "season": season,
        "fastestSkaters": fastest,
    }
