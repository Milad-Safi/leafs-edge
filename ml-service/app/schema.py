from sqlalchemy import text
from .db import engine

def create_tables():
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS team_games (
                id SERIAL PRIMARY KEY,

                game_id BIGINT NOT NULL,
                game_date DATE NOT NULL,

                team TEXT NOT NULL,
                opponent TEXT NOT NULL,
                is_home BOOLEAN NOT NULL,

                goals_for INT NOT NULL,
                goals_against INT NOT NULL,

                shots_for INT,
                shots_against INT,

                pp_goals INT,
                pp_opps INT,

                pk_goals_against INT,
                pk_opps INT,

                goalie_sv_pct FLOAT,

                win BOOLEAN NOT NULL,

                UNIQUE (game_id, team)
            );
        """))

def reset_tables():
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS team_games;"))
