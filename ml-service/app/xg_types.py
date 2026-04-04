from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Set


# Raw columns expected from the shot-event CSV builder
RAW_REQUIRED_COLUMNS: List[str] = [
    "game_id",
    "game_date",
    "period_number",
    "period_type",
    "time_in_period",
    "abs_game_seconds",
    "team",
    "opponent",
    "home_team",
    "away_team",
    "is_home",
    "event_type",
    "is_goal",
    "shot_type",
    "x_coord",
    "y_coord",
    "seconds_since_last_event",
    "prev_event_type",
    "same_team_as_prev",
    "is_rebound_candidate",
    "situation_code",
    "empty_net",
]


# Raw columns that are nice to have but not mandatory for v1
RAW_OPTIONAL_COLUMNS: List[str] = [
    "event_index",
    "event_id",
    "event_team_id",
    "shooter_id",
    "goalie_id",
    "home_score_before",
    "away_score_before",
    "score_diff_before",
    "is_shot_on_goal",
    "is_missed_shot",
]


# Columns that will be fed into the model after feature engineering
MODEL_FEATURE_COLUMNS: List[str] = [
    "norm_x",
    "norm_y",
    "distance_ft",
    "angle_deg",
    "abs_angle_deg",
    "is_rebound",
    "seconds_since_last_event_capped",
    "is_same_team_as_prev",
    "is_home",
    "is_overtime",
    "is_empty_net",
    "strength_state",
    "shot_type_group",
    "prev_event_type_group",
]


# Numeric features only
NUMERIC_FEATURE_COLUMNS: List[str] = [
    "norm_x",
    "norm_y",
    "distance_ft",
    "angle_deg",
    "abs_angle_deg",
    "seconds_since_last_event_capped",
]


# Boolean-like features that will be cast to 0/1
BOOLEAN_FEATURE_COLUMNS: List[str] = [
    "is_rebound",
    "is_same_team_as_prev",
    "is_home",
    "is_overtime",
    "is_empty_net",
]


# Categorical features for one-hot encoding or category handling
CATEGORICAL_FEATURE_COLUMNS: List[str] = [
    "strength_state",
    "shot_type_group",
    "prev_event_type_group",
]


# Final supervised learning target
TARGET_COLUMN = "target_goal"


# Keep v1 focused on actual shots that can reasonably be scored
SUPPORTED_EVENT_TYPES: Set[str] = {
    "shot-on-goal",
    "goal",
    "missed-shot",
}


# Some raw shot types can get noisy, so we map them into a cleaner set
SHOT_TYPE_GROUP_MAP: Dict[str, str] = {
    "wrist": "wrist",
    "snap": "snap",
    "slap": "slap",
    "backhand": "backhand",
    "tip-in": "tip-in",
    "deflected": "tip-in",
    "poke": "poke",
    "wrap-around": "wrap-around",
    "bat": "other",
}


# Previous event grouping to reduce category explosion
PREV_EVENT_TYPE_GROUP_MAP: Dict[str, str] = {
    "shot-on-goal": "shot",
    "goal": "shot",
    "missed-shot": "shot",
    "blocked-shot": "blocked-shot",
    "faceoff": "faceoff",
    "hit": "hit",
    "giveaway": "turnover",
    "takeaway": "turnover",
    "penalty": "penalty",
    "delayed-penalty": "penalty",
    "stoppage": "stoppage",
}


# Situation code buckets
# We are keeping this intentionally simple for v1
# Example values in your CSV include things like 1551, 1451, 1541, 1010, 0651, 1560, 1331, 1431
def map_strength_state(situation_code: str | None) -> str:
    if not situation_code:
        return "other"

    code = str(situation_code).strip()

    if len(code) != 4 or not code.isdigit():
        return "other"

    away_skaters = int(code[0])
    away_goalie = int(code[1])
    home_skaters = int(code[2])
    home_goalie = int(code[3])

    if away_goalie == 0 or home_goalie == 0:
        return "empty-net"

    # Common even-strength states
    if (away_skaters, home_skaters) in {(5, 5), (4, 4), (3, 3)}:
        return "even"

    # Power play / shorthanded
    if away_skaters > home_skaters:
        return "away-advantage"

    if home_skaters > away_skaters:
        return "home-advantage"

    return "other"


def map_shot_type_group(raw_shot_type: str | None) -> str:
    if not raw_shot_type:
        return "other"

    key = str(raw_shot_type).strip().lower()
    return SHOT_TYPE_GROUP_MAP.get(key, "other")


def map_prev_event_type_group(raw_prev_event_type: str | None) -> str:
    if not raw_prev_event_type:
        return "other"

    key = str(raw_prev_event_type).strip().lower()
    return PREV_EVENT_TYPE_GROUP_MAP.get(key, "other")


@dataclass(frozen=True)
class XGFeatureConfig:
    target_col: str = TARGET_COLUMN
    raw_required_columns: tuple[str, ...] = tuple(RAW_REQUIRED_COLUMNS)
    raw_optional_columns: tuple[str, ...] = tuple(RAW_OPTIONAL_COLUMNS)
    model_feature_columns: tuple[str, ...] = tuple(MODEL_FEATURE_COLUMNS)
    numeric_feature_columns: tuple[str, ...] = tuple(NUMERIC_FEATURE_COLUMNS)
    boolean_feature_columns: tuple[str, ...] = tuple(BOOLEAN_FEATURE_COLUMNS)
    categorical_feature_columns: tuple[str, ...] = tuple(CATEGORICAL_FEATURE_COLUMNS)


XG_CONFIG = XGFeatureConfig()