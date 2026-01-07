import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Loads variables from .env, for local 
load_dotenv()

# Assign DATABASE_URL 
DATABASE_URL = os.environ["DATABASE_URL"]

# Create connection factory and pre ping DB to ensure its up and reconnect if not
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def test_db():
    with engine.connect() as conn:
        return conn.execute(text("SELECT 1")).scalar_one()
