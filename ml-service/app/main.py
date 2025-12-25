from __future__ import annotations

import datetime as dt
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Trend ML (KEEP)
from .train_trend import train_trend
from .trend_model import predict_team_trend

app = FastAPI(title="Leafs Edge ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/v1/model/train_trend")
def train_trend_route(
    n: int = 10,
    k: int = 5,
    eps: float = 0.2,
    through: str | None = None,
    steps: int = 3000,
    lr: float = 0.05,
    l2: float = 0.1,
):
    return train_trend(
        n=n,
        k=k,
        eps=eps,
        through=through,
        steps=steps,
        lr=lr,
        l2=l2,
    )

@app.get("/v1/trend/team")
def trend_team_route(
    team: str,
    as_of: Optional[str] = None,
    n: int = 10,
):
    if as_of is None:
        as_of = dt.date.today().isoformat()
    return predict_team_trend(team=team, as_of=as_of, n=n)
