from __future__ import annotations

from typing import Any, Dict, Optional

import requests

NHL_WEB_BASE = "https://api-web.nhle.com"


def fetch_standings_now(timeout_s: int = 10) -> Dict[str, Any]:
    url = f"{NHL_WEB_BASE}/v1/standings/now"
    r = requests.get(url, timeout=timeout_s)
    r.raise_for_status()
    return r.json()


def _team_abbrev_from_row(row: Dict[str, Any]) -> Optional[str]:
    ta = row.get("teamAbbrev")
    if isinstance(ta, dict):
        v = ta.get("default")
        return v.upper() if isinstance(v, str) else None
    if isinstance(ta, str):
        return ta.upper()
    return None


def extract_team_standings_row(payload: Dict[str, Any], team_abbrev: str) -> Optional[Dict[str, Any]]:
    """
    Returns the standings dict row for the given team abbrev, or None.
    """
    team_abbrev = team_abbrev.strip().upper()
    rows = payload.get("standings")
    if not isinstance(rows, list):
        return None

    for row in rows:
        if not isinstance(row, dict):
            continue
        if _team_abbrev_from_row(row) == team_abbrev:
            return row

    return None


def extract_summary_fields_from_standings(
    payload: Dict[str, Any],
    team_abbrev: str,
) -> Optional[Dict[str, Any]]:
    """
    Pull only the fields we want to merge into our UI response for ONE TEAM.
    """
    row = extract_team_standings_row(payload, team_abbrev)
    if row is None:
        return None

    def as_int(x: Any) -> Optional[int]:
        try:
            if x is None:
                return None
            return int(x)
        except Exception:
            return None

    def as_float(x: Any) -> Optional[float]:
        try:
            if x is None:
                return None
            return float(x)
        except Exception:
            return None

    out: Dict[str, Any] = {
        # record context
        "wins": as_int(row.get("wins")),
        "losses": as_int(row.get("losses")),
        "otLosses": as_int(row.get("otLosses")),
        "points": as_int(row.get("points")),
        "pointPctg": as_float(row.get("pointPctg")),

        # streak
        "streakCode": row.get("streakCode") if isinstance(row.get("streakCode"), str) else None,
        "streakCount": as_int(row.get("streakCount")),

        # ranks
        "divisionSequence": as_int(row.get("divisionSequence")),
        "conferenceSequence": as_int(row.get("conferenceSequence")),
        "leagueSequence": as_int(row.get("leagueSequence")),

        # optional nice-to-have
        "teamLogo": row.get("teamLogo") if isinstance(row.get("teamLogo"), str) else None,
        "standingsDate": row.get("date") if isinstance(row.get("date"), str) else None,
    }

    # Also pass through the "standingsDateTimeUtc" from the top-level payload if present
    sdt = payload.get("standingsDateTimeUtc")
    if isinstance(sdt, str):
        out["standingsDateTimeUtc"] = sdt

    return out


def extract_all_summary_fields_from_standings(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns a dict keyed by TEAM ABBREV for ALL teams in the standings payload.
    Example:
      {
        "TOR": { ... },
        "OTT": { ... },
        ...
      }
    """
    rows = payload.get("standings")
    if not isinstance(rows, list):
        return {}

    out: Dict[str, Any] = {}

    for row in rows:
        if not isinstance(row, dict):
            continue

        team = _team_abbrev_from_row(row)
        if not team:
            continue

        fields = extract_summary_fields_from_standings(payload, team)
        if fields is not None:
            out[team] = fields

    return out
