import { NextResponse } from "next/server";

type RanksForMetric = Record<string, number | null>;

export type TeamRanks = {
  seasonId: number;
  teamsCount: number;
  teamA: string;
  teamB: string;
  ranks: {
    goalsForPerGame: RanksForMetric;
    goalsAgainstPerGame: RanksForMetric;
    powerPlayPct: RanksForMetric;
    penaltyKillPct: RanksForMetric;
    shotsForPerGame: RanksForMetric;
    shotsAgainstPerGame: RanksForMetric;
  };
};

function inferCurrentSeasonIdFromToday(): number {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const startYear = m >= 9 ? y : y - 1;
  const endYear = startYear + 1;
  return Number(`${startYear}${endYear}`);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teamA = (url.searchParams.get("teamA") ?? "").trim().toUpperCase();
    const teamB = (url.searchParams.get("teamB") ?? "").trim().toUpperCase();

    if (!teamA || !teamB) {
      return NextResponse.json({ error: "Missing teamA/teamB" }, { status: 400 });
    }

    const backendBase = process.env.ML_SERVICE_URL || "http://localhost:8000";
    const r = await fetch(`${backendBase}/v1/league/ranks`, { cache: "no-store" });

    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json(
        { error: "Backend error", detail: text },
        { status: 502 }
      );
    }

    const b = await r.json();

    const ranks = b?.ranks ?? {};

    const payload: TeamRanks = {
      seasonId: inferCurrentSeasonIdFromToday(),
      teamsCount: 32,
      teamA,
      teamB,
      ranks: {
        goalsForPerGame: ranks.goalsForPerGame ?? {},
        goalsAgainstPerGame: ranks.goalsAgainstPerGame ?? {},
        powerPlayPct: ranks.powerPlayPct ?? {},
        penaltyKillPct: ranks.penaltyKillPct ?? {},
        shotsForPerGame: ranks.shotsForPerGame ?? {},
        shotsAgainstPerGame: ranks.shotsAgainstPerGame ?? {},
      },
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
