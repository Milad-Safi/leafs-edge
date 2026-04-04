from __future__ import annotations

from typing import Any, Dict, List, Optional


SHOT_EVENT_TYPES = {"goal", "shot-on-goal", "missed-shot"}
REBOUND_SOURCE_TYPES = {"goal", "shot-on-goal", "missed-shot"}

SHOT_ROW_COLUMNS = [
    "season_start_year",
    "game_id",
    "game_date",
    "event_index",
    "event_id",
    "period_number",
    "period_type",
    "time_in_period",
    "abs_game_seconds",
    "team",
    "opponent",
    "home_team",
    "away_team",
    "event_team_id",
    "is_home",
    "event_type",
    "is_goal",
    "is_shot_on_goal",
    "is_missed_shot",
    "shot_type",
    "x_coord",
    "y_coord",
    "shooter_id",
    "goalie_id",
    "home_score_before",
    "away_score_before",
    "score_diff_before",
    "seconds_since_last_event",
    "prev_event_type",
    "prev_event_team_id",
    "same_team_as_prev",
    "is_rebound_candidate",
    "situation_code",
    "empty_net",
]


def _first_present(d: Dict[str, Any], keys: List[str]) -> Any:
    for key in keys:
        if key in d and d.get(key) is not None:
            return d.get(key)
    return None


def _safe_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except Exception:
        return None


def _safe_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None


def _normalise_event_type(value: Any) -> str:
    raw = str(value or "").strip().lower()
    raw = raw.replace("_", "-")
    raw = raw.replace(" ", "-")
    return raw


def _mmss_to_seconds(mmss: str) -> int:
    try:
        mm, ss = mmss.split(":")
        return int(mm) * 60 + int(ss)
    except Exception:
        return 0


def _event_abs_seconds(play: Dict[str, Any], reg_periods: int = 3) -> int:
    pd = play.get("periodDescriptor") or {}
    period_number = int(pd.get("number") or 0)
    period_type = str(pd.get("periodType") or "").upper()
    time_in_period = str(play.get("timeInPeriod") or "00:00")
    sec_in_period = _mmss_to_seconds(time_in_period)

    if period_type == "REG":
        base = max(0, period_number - 1) * 1200
    elif period_type == "OT":
        if period_number <= reg_periods:
            ot_index = 0
        else:
            ot_index = period_number - reg_periods - 1
        base = reg_periods * 1200 + max(0, ot_index) * 300
    else:
        base = reg_periods * 1200

    return base + sec_in_period


def shot_rows_from_pbp(pbp: Dict[str, Any], game_date: Any = None) -> List[Dict[str, Any]]:
    plays = pbp.get("plays") or []

    home_team_raw = pbp.get("homeTeam") or {}
    away_team_raw = pbp.get("awayTeam") or {}

    home_team = (
        home_team_raw.get("abbrev")
        or home_team_raw.get("triCode")
        or home_team_raw.get("placeName", {}).get("default")
        or home_team_raw.get("name", {}).get("default")
    )
    away_team = (
        away_team_raw.get("abbrev")
        or away_team_raw.get("triCode")
        or away_team_raw.get("placeName", {}).get("default")
        or away_team_raw.get("name", {}).get("default")
    )

    home_id = _safe_int(home_team_raw.get("id"))
    away_id = _safe_int(away_team_raw.get("id"))
    game_id = _safe_int(pbp.get("id") or pbp.get("gameId"))
    reg_periods = int(pbp.get("regPeriods") or 3)

    season_start_year = None
    if game_id is not None:
        try:
            season_start_year = int(str(game_id)[:4])
        except Exception:
            season_start_year = None

    rows: List[Dict[str, Any]] = []

    prev_abs_seconds: Optional[int] = None
    prev_event_type: Optional[str] = None
    prev_event_team_id: Optional[int] = None

    for event_index, play in enumerate(plays):
        details = play.get("details") or {}
        event_type = _normalise_event_type(play.get("typeDescKey"))
        period_descriptor = play.get("periodDescriptor") or {}

        event_team_id = _safe_int(
            _first_present(details, ["eventOwnerTeamId", "teamId"])
        )

        period_number = _safe_int(period_descriptor.get("number"))
        period_type = str(period_descriptor.get("periodType") or "").upper()
        time_in_period = str(play.get("timeInPeriod") or "00:00")
        abs_game_seconds = _event_abs_seconds(play, reg_periods=reg_periods)

        if event_type in SHOT_EVENT_TYPES and period_type != "SO":
            if event_team_id == home_id:
                team = home_team
                opponent = away_team
                is_home = True
            elif event_team_id == away_id:
                team = away_team
                opponent = home_team
                is_home = False
            else:
                team = None
                opponent = None
                is_home = None

            home_score_after = _safe_int(play.get("homeScore"))
            away_score_after = _safe_int(play.get("awayScore"))

            home_score_before = home_score_after
            away_score_before = away_score_after

            if event_type == "goal":
                if event_team_id == home_id and home_score_after is not None:
                    home_score_before = max(0, home_score_after - 1)
                elif event_team_id == away_id and away_score_after is not None:
                    away_score_before = max(0, away_score_after - 1)

            score_diff_before = None
            if (
                event_team_id == home_id
                and home_score_before is not None
                and away_score_before is not None
            ):
                score_diff_before = home_score_before - away_score_before
            elif (
                event_team_id == away_id
                and home_score_before is not None
                and away_score_before is not None
            ):
                score_diff_before = away_score_before - home_score_before

            seconds_since_last_event = None
            if prev_abs_seconds is not None:
                seconds_since_last_event = abs_game_seconds - prev_abs_seconds

            same_team_as_prev = None
            if prev_event_team_id is not None and event_team_id is not None:
                same_team_as_prev = prev_event_team_id == event_team_id

            is_rebound_candidate = False
            if (
                prev_event_type in REBOUND_SOURCE_TYPES
                and same_team_as_prev is True
                and seconds_since_last_event is not None
                and 0 <= seconds_since_last_event <= 3
            ):
                is_rebound_candidate = True

            shot_type = _first_present(details, ["shotType", "secondaryReason"])
            x_coord = _safe_float(_first_present(details, ["xCoord", "xCoordinate", "x"]))
            y_coord = _safe_float(_first_present(details, ["yCoord", "yCoordinate", "y"]))

            shooter_id = _safe_int(
                _first_present(
                    details,
                    [
                        "shootingPlayerId",
                        "scoringPlayerId",
                        "playerId",
                    ],
                )
            )
            goalie_id = _safe_int(
                _first_present(
                    details,
                    [
                        "goalieInNetId",
                        "goalieId",
                    ],
                )
            )

            situation_code = (
                _first_present(play, ["situationCode"])
                or _first_present(details, ["situationCode"])
            )

            empty_net_raw = _first_present(
                details,
                [
                    "emptyNet",
                    "isEmptyNet",
                ],
            )
            empty_net = bool(empty_net_raw) if empty_net_raw is not None else None

            row = {
                "season_start_year": season_start_year,
                "game_id": game_id,
                "game_date": str(game_date) if game_date is not None else None,
                "event_index": event_index,
                "event_id": _safe_int(
                    _first_present(
                        play,
                        ["eventId", "eventNumber", "sortOrder", "eventIdx"],
                    )
                ),
                "period_number": period_number,
                "period_type": period_type,
                "time_in_period": time_in_period,
                "abs_game_seconds": abs_game_seconds,
                "team": team,
                "opponent": opponent,
                "home_team": home_team,
                "away_team": away_team,
                "event_team_id": event_team_id,
                "is_home": is_home,
                "event_type": event_type,
                "is_goal": event_type == "goal",
                "is_shot_on_goal": event_type in {"goal", "shot-on-goal"},
                "is_missed_shot": event_type == "missed-shot",
                "shot_type": str(shot_type) if shot_type is not None else None,
                "x_coord": x_coord,
                "y_coord": y_coord,
                "shooter_id": shooter_id,
                "goalie_id": goalie_id,
                "home_score_before": home_score_before,
                "away_score_before": away_score_before,
                "score_diff_before": score_diff_before,
                "seconds_since_last_event": seconds_since_last_event,
                "prev_event_type": prev_event_type,
                "prev_event_team_id": prev_event_team_id,
                "same_team_as_prev": same_team_as_prev,
                "is_rebound_candidate": is_rebound_candidate,
                "situation_code": str(situation_code) if situation_code is not None else None,
                "empty_net": empty_net,
            }

            rows.append(row)

        prev_abs_seconds = abs_game_seconds
        prev_event_type = event_type
        prev_event_team_id = event_team_id

    return rows