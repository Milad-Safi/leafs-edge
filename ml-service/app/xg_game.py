from __future__ import annotations

import argparse
import json
from typing import Any, Dict

import pandas as pd

from .ingest_nhl import fetch_play_by_play
from .xg_dataset_builder import shot_rows_from_pbp
from .xg_model import predict_shot_xg, summarise_game_xg


def compute_game_team_xg(
    game_id: int,
    model_path: str = "data/xg/models/xg_shot_model.json",
    metadata_path: str = "data/xg/models/xg_training_metadata.json",
    drop_empty_net: bool = True,
) -> Dict[str, Any]:
    pbp = fetch_play_by_play(int(game_id))
    raw_shot_rows = shot_rows_from_pbp(
        pbp=pbp,
        game_date=pbp.get("gameDate"),
    )

    raw_shots_df = pd.DataFrame(raw_shot_rows)

    if raw_shots_df.empty:
        return {
            "game_id": int(game_id),
            "team_xg": {},
            "total_shots_modelled": 0,
            "total_xg": 0.0,
        }

    predicted_shots_df = predict_shot_xg(
        raw_shots_df=raw_shots_df,
        model_path=model_path,
        metadata_path=metadata_path,
        drop_empty_net=drop_empty_net,
    )

    summary = summarise_game_xg(predicted_shots_df)

    return {
        "game_id": int(game_id),
        "team_xg": summary["team_xg"],
        "total_shots_modelled": summary["total_shots_modelled"],
        "total_xg": summary["total_xg"],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--game-id", type=int, required=True)
    parser.add_argument("--model-path", default="data/xg/models/xg_shot_model.json")
    parser.add_argument("--metadata-path", default="data/xg/models/xg_training_metadata.json")
    parser.add_argument("--include-empty-net", action="store_true")

    args = parser.parse_args()

    result = compute_game_team_xg(
        game_id=args.game_id,
        model_path=args.model_path,
        metadata_path=args.metadata_path,
        drop_empty_net=not args.include_empty_net,
    )

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()