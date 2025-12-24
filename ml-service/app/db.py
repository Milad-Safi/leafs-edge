import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def test_db():
    with engine.connect() as conn:
        return conn.execute(text("SELECT 1")).scalar_one()
