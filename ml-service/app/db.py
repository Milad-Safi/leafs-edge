import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Loads variables from .env, deployed version has in secrets though
load_dotenv()

# Assign DATABASE_URL 
DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def test_db():
    with engine.connect() as conn:
        return conn.execute(text("SELECT 1")).scalar_one()
