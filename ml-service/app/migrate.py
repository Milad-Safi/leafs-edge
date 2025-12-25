from sqlalchemy import text
from .db import engine

def migrate_v1_add_game_id():
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE team_games ADD COLUMN IF NOT EXISTS game_id BIGINT;"))
        conn.execute(text("ALTER TABLE team_games ADD COLUMN IF NOT EXISTS game_date DATE;"))

        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'team_games_game_id_team_uniq'
                ) THEN
                    ALTER TABLE team_games
                    ADD CONSTRAINT team_games_game_id_team_uniq UNIQUE (game_id, team);
                END IF;
            END
            $$;
        """))
