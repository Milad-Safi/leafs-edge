from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd

from .ingest_nhl import fetch_play_by_play
from .xg_dataset_builder import SHOT_ROW_COLUMNS, shot_rows_from_pbp
from .xg_dataset_db import list_regular_season_games


def _ensure_all_columns(df: pd.DataFrame) -> pd.DataFrame:
    for col in SHOT_ROW_COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA

    return df[SHOT_ROW_COLUMNS]


def _build_summary(
    games: List[Dict[str, Any]],
    skipped: List[Dict[str, Any]],
    df: pd.DataFrame,
) -> Dict[str, Any]:
    is_goal_count = 0
    if "is_goal" in df.columns and not df.empty:
        is_goal_count = int(df["is_goal"].fillna(False).astype(bool).sum())

    return {
        "games_requested": len(games),
        "games_skipped": len(skipped),
        "games_completed": len(games) - len(skipped),
        "shot_rows": int(len(df)),
        "goal_rows": is_goal_count,
        "first_game_date": None if df.empty else str(df["game_date"].iloc[0]),
        "last_game_date": None if df.empty else str(df["game_date"].iloc[-1]),
        "skipped_examples": skipped[:10],
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


def build_xg_dataset(
    out_dir: str = "data/xg",
    limit_games: int | None = None,
    season_start_min: int | None = None,
    season_start_max: int | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    write_csv: bool = False,
) -> Dict[str, Any]:
    games = list_regular_season_games(
        limit=limit_games,
        season_start_min=season_start_min,
        season_start_max=season_start_max,
        start_date=start_date,
        end_date=end_date,
    )

    if not games:
        raise RuntimeError("No regular season games found in team_games for the selected filters")

    all_rows: List[Dict[str, Any]] = []
    skipped: List[Dict[str, Any]] = []

    print(f"Found {len(games)} games to process")

    for idx, game in enumerate(games, start=1):
        game_id = int(game["game_id"])
        game_date = game.get("game_date")
        away_team = game.get("away_team")
        home_team = game.get("home_team")

        try:
            pbp = fetch_play_by_play(game_id)
            rows = shot_rows_from_pbp(pbp, game_date=game_date)
            all_rows.extend(rows)

            print(
                f"[{idx}/{len(games)}] "
                f"{away_team} @ {home_team} "
                f"game_id={game_id} "
                f"rows={len(rows)}"
            )
        except Exception as exc:
            skipped.append(
                {
                    "game_id": game_id,
                    "error": str(exc),
                }
            )
            print(f"[{idx}/{len(games)}] game_id={game_id} skipped -> {exc}")

    df = pd.DataFrame(all_rows)
    df = _ensure_all_columns(df)

    if not df.empty:
        df = df.sort_values(
            by=["game_date", "game_id", "abs_game_seconds", "event_index"],
            kind="stable",
        ).reset_index(drop=True)

    summary = _build_summary(games, skipped, df)

    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    run_tag = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    parquet_path = out_path / f"xg_shot_events_{run_tag}.parquet"
    csv_path = out_path / f"xg_shot_events_{run_tag}.csv"
    summary_path = out_path / f"xg_shot_events_{run_tag}.summary.json"

    wrote_parquet = False
    try:
        df.to_parquet(parquet_path, index=False)
        wrote_parquet = True
        print(f"Wrote parquet -> {parquet_path}")
    except Exception as exc:
        print(f"Parquet write skipped -> {exc}")

    if write_csv or not wrote_parquet:
        df.to_csv(csv_path, index=False)
        print(f"Wrote csv -> {csv_path}")

    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"Wrote summary -> {summary_path}")
    print(json.dumps(summary, indent=2))

    return {
        "summary": summary,
        "parquet_path": str(parquet_path) if wrote_parquet else None,
        "csv_path": str(csv_path) if (write_csv or not wrote_parquet) else None,
        "summary_path": str(summary_path),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default="data/xg")
    parser.add_argument("--limit-games", type=int, default=None)
    parser.add_argument("--season-start-min", type=int, default=None)
    parser.add_argument("--season-start-max", type=int, default=None)
    parser.add_argument("--start-date", default=None)
    parser.add_argument("--end-date", default=None)
    parser.add_argument("--write-csv", action="store_true")

    args = parser.parse_args()

    build_xg_dataset(
        out_dir=args.out_dir,
        limit_games=args.limit_games,
        season_start_min=args.season_start_min,
        season_start_max=args.season_start_max,
        start_date=args.start_date,
        end_date=args.end_date,
        write_csv=args.write_csv,
    )


if __name__ == "__main__":
    main()