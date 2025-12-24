from fastapi import FastAPI
from .db import test_db

app = FastAPI(title="Leafs Edge ML Service")

@app.get("/")
def root():
    return {"status": "ok", "service": "ml"}

@app.get("/db/ping")
def db_ping():
    val = test_db()
    return {"db": "ok", "select": val}
