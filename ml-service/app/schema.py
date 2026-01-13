from sqlalchemy import text
from .db import engine

# Database schema helpers for team-level game storage
# Defines the core table used by last-5, trends, and aggregate stats
# Intentionally minimal and idempotent so it can run on startup or deploy


def create_tables():
    # Create the team_games table if it does not already exist
    # Table stores one row per team per game to support fast queries
    with engine.begin() as conn:
        conn.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS team_games (
                id SERIAL PRIMARY KEY,

                -- NHL game identifier
                game_id BIGINT NOT NULL,
                game_date DATE NOT NULL,

                -- Team perspective for this row
                team TEXT NOT NULL,
                opponent TEXT NOT NULL,
                is_home BOOLEAN NOT NULL,

                -- Final score data
                goals_for INT NOT NULL,
                goals_against INT NOT NULL,

                -- Shot totals
                shots_for INT,
                shots_against INT,

                -- Power play tracking
                pp_goals INT,
                pp_opps INT,

                -- Penalty kill tracking
                pk_goals_against INT,
                pk_opps INT,

                -- Aggregate goalie save percentage for the game
                goalie_sv_pct FLOAT,

                -- Win flag from team perspective
                win BOOLEAN NOT NULL,

                -- Prevent duplicate inserts for the same team and game
                UNIQUE (game_id, team)
            );
        """
            )
        )


def reset_tables():
    # Drop the team_games table completely
    # Intended for local resets or destructive rebuilds only
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS team_games;"))
