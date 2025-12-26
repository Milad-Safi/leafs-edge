from __future__ import annotations

import datetime as dt
import time
from typing import Any, Dict, List, Optional, Tuple

import requests


NHL_WEB_BASE = "https://api-web.nhle.com"


def infer_current_season_id(today_utc: Optional[dt.date] = None) -> int:
    """Infer NHL season id (e.g., 20252026).

    Matches the frontend rule:
      - if month >= 7 (July), season startYear = current year
      - else season startYear = current year - 1
    """

    d = today_utc or dt.datetime.utcnow().date()
    y = d.year
    m = d.month
    start_year = y if m >= 7 else y - 1
    return int(f"{start_year}{start_year + 1}")


def _to_number(x: Any) -> Optional[int]:
    try:
        if x is None:
            return None
        if isinstance(x, bool):
            return None
        if isinstance(x, (int, float)):
            n = int(x)
            return n
        if isinstance(x, str):
            s = x.strip()
            if not s:
                return None
            n = int(float(s))
            return n
    except Exception:
        return None
    return None


def _safe_name(p: Dict[str, Any]) -> str:
    n = p.get("name")
    if isinstance(n, dict):
        v = n.get("default")
        if isinstance(v, str) and v.strip():
            return v.strip()
    if isinstance(n, str) and n.strip():
        return n.strip()
    return "Unknown"


def _parse_games(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    g = payload.get("games")
    return g if isinstance(g, list) else []


def _is_completed_game(game: Dict[str, Any]) -> bool:
    st = game.get("gameState")
    st_s = str(st).upper() if st is not None else ""
    return st_s in {"OFF", "FINAL"}


def _start_time_ms(game: Dict[str, Any]) -> int:
    t = game.get("startTimeUTC")
    try:
        return int(dt.datetime.fromisoformat(str(t).replace("Z", "+00:00")).timestamp() * 1000)
    except Exception:
        return 0


def get_last5_completed_game_ids(team: str, season_id: int, timeout_s: int = 10) -> List[int]:
    team = team.strip().upper()
    url = f"{NHL_WEB_BASE}/v1/club-schedule-season/{team}/{season_id}"
    r = requests.get(url, timeout=timeout_s, headers={"User-Agent": "leafs-edge"})
    r.raise_for_status()
    payload = r.json()

    games = [g for g in _parse_games(payload) if isinstance(g, dict) and _is_completed_game(g)]
    games.sort(key=_start_time_ms)
    games = games[-5:]

    out: List[int] = []
    for g in games:
        gid = _to_number(g.get("id"))
        if gid is not None:
            out.append(gid)
    return out


def _skaters_for_team_from_boxscore(box: Dict[str, Any], team: str) -> List[Dict[str, Any]]:
    team = team.strip().upper()
    home_team = box.get("homeTeam")
    away_team = box.get("awayTeam")
    home_abbrev = str(home_team.get("abbrev") if isinstance(home_team, dict) else "").upper()
    away_abbrev = str(away_team.get("abbrev") if isinstance(away_team, dict) else "").upper()

    is_home = home_abbrev == team
    is_away = away_abbrev == team
    if not is_home and not is_away:
        return []

    pbg = box.get("playerByGameStats") or {}
    side = (pbg.get("homeTeam") if is_home else pbg.get("awayTeam")) or {}
    forwards = side.get("forwards") if isinstance(side.get("forwards"), list) else []
    defense = side.get("defense") if isinstance(side.get("defense"), list) else []

    out: List[Dict[str, Any]] = []
    for arr in (forwards, defense):
        for p in arr:
            if isinstance(p, dict):
                out.append(p)
    return out


def _add_game_to_agg(team: str, game_id: int, agg: Dict[int, Dict[str, Any]], timeout_s: int = 10) -> None:
    url = f"{NHL_WEB_BASE}/v1/gamecenter/{game_id}/boxscore"
    r = requests.get(url, timeout=timeout_s, headers={"User-Agent": "leafs-edge"})
    r.raise_for_status()
    box = r.json()

    for p in _skaters_for_team_from_boxscore(box, team):
        pid = _to_number(p.get("playerId"))
        if pid is None:
            continue

        goals = _to_number(p.get("goals")) or 0
        assists = _to_number(p.get("assists")) or 0
        sog = _to_number(p.get("sog")) or 0

        if pid not in agg:
            agg[pid] = {
                "playerId": pid,
                "name": _safe_name(p),
                "goals": goals,
                "assists": assists,
                "sog": sog,
            }
        else:
            agg[pid]["goals"] += goals
            agg[pid]["assists"] += assists
            agg[pid]["sog"] += sog


def _pick_best(agg: Dict[int, Dict[str, Any]], key: str) -> Optional[Dict[str, Any]]:
    leaders: List[Dict[str, Any]] = []
    for p in agg.values():
        goals = int(p.get("goals") or 0)
        assists = int(p.get("assists") or 0)
        shots = int(p.get("sog") or 0)
        leaders.append(
            {
                "playerId": int(p.get("playerId")),
                "name": str(p.get("name") or "Unknown"),
                "goals": goals,
                "assists": assists,
                "points": goals + assists,
                "shots": shots,
            }
        )

    if not leaders:
        return None

    def sort_key(x: Dict[str, Any]) -> Tuple[int, int, int, int]:
        return (
            int(x.get(key) or 0),
            int(x.get("points") or 0),
            int(x.get("goals") or 0),
            int(x.get("shots") or 0),
        )

    leaders.sort(key=sort_key, reverse=True)
    return leaders[0]


# Tiny in-memory cache to reduce NHL calls (helpful on free hosting).
# Keyed by (team, season_id). TTL kept short so it's always "fresh enough".
_CACHE: Dict[Tuple[str, int], Tuple[float, Dict[str, Any]]] = {}


def fetch_hot_last5(team: str, season_id: Optional[int] = None, ttl_s: int = 120) -> Dict[str, Any]:
    """Compute hot-player leaders over the team's last 5 completed games.

    This does NOT write to DB.
    Returns a stable shape even if NHL API fails.
    """

    team_u = team.strip().upper()
    sid = int(season_id) if season_id is not None else infer_current_season_id()
    key = (team_u, sid)

    now = time.time()
    cached = _CACHE.get(key)
    if cached and (now - cached[0]) <= ttl_s:
        return cached[1]

    payload: Dict[str, Any] = {
        "team": team_u,
        "seasonId": sid,
        "gameIds": [],
        "leaders": {"goals": None, "points": None, "shots": None},
        "debug": {"playersAggregated": 0},
    }

    try:
        game_ids = get_last5_completed_game_ids(team_u, sid)
        payload["gameIds"] = game_ids

        agg: Dict[int, Dict[str, Any]] = {}
        for gid in game_ids:
            _add_game_to_agg(team_u, gid, agg)

        payload["debug"]["playersAggregated"] = len(agg)
        payload["leaders"] = {
            "goals": _pick_best(agg, "goals"),
            "points": _pick_best(agg, "points"),
            "shots": _pick_best(agg, "shots"),
        }
    except Exception as e:
        payload["error"] = str(e)

    _CACHE[key] = (now, payload)
    return payload
