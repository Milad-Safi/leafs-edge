import { NextResponse } from "next/server";

export const revalidate = 60;

type TeamAbbrev = string;

function normalizeTeam(input: string): TeamAbbrev {
  return input.trim().toUpperCase();
}

function backendBaseUrl() {
  // frontend .env.local: NHL_BACKEND_URL=http://localhost:8000
  return process.env.NHL_BACKEND_URL || "https://leafs-edge-api.onrender.com/";
}

function num(n: unknown, fallback = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function pct100(v: unknown): number | null {
  // backend is 0..1, UI expects 0..100
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return +((v * 100).toFixed(1));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const team = normalizeTeam(url.searchParams.get("team") || "");
  const opp = normalizeTeam(url.searchParams.get("opp") || "");
  const asOf = url.searchParams.get("as_of");

  if (!team) {
    return NextResponse.json({ error: "Missing ?team=TOR" }, { status: 400 });
  }

  // If your frontend doesn’t pass opp, we fall back to same team (won’t crash UI).
  const teamB = opp || team;

  try {
    const upstream = new URL("/v1/matchup/summary", backendBaseUrl());
    upstream.searchParams.set("teamA", team);
    upstream.searchParams.set("teamB", teamB);
    if (asOf) upstream.searchParams.set("as_of", asOf);

    const r = await fetch(upstream.toString(), { next: { revalidate } });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json(
        { error: `Upstream matchup/summary failed (${r.status})`, detail: t.slice(0, 800) },
        { status: 502 }
      );
    }

    const data: any = await r.json();

    // choose A or B block depending on which matches ?team
    const pick = String(data?.teams?.A || "").toUpperCase() === team ? "A" : "B";
    const l5 = data?.last5?.[pick];

    if (!l5) {
      return NextResponse.json({ error: "Upstream missing last5 block" }, { status: 502 });
    }

    return NextResponse.json({
      team: l5.team,
      games: num(l5.games),
      record: {
        w: num(l5.record?.w),
        l: num(l5.record?.l),
        otl: num(l5.record?.otl, 0), // backend has null sometimes
      },
      goalsForPerGame: +num(l5.goalsForPerGame).toFixed(2),
      goalsAgainstPerGame: +num(l5.goalsAgainstPerGame).toFixed(2),
      shotsForPerGame: +num(l5.shotsForPerGame).toFixed(2),
      shotsAgainstPerGame: +num(l5.shotsAgainstPerGame).toFixed(2),
      powerPlay: {
        goals: num(l5.powerPlay?.goals),
        opps: num(l5.powerPlay?.opps),
        pct: pct100(l5.powerPlay?.pct),
      },
      penaltyKill: {
        oppPPGoals: num(l5.penaltyKill?.oppPPGoals),
        oppPPOpps: num(l5.penaltyKill?.oppPPOpps),
        pct: pct100(l5.penaltyKill?.pct),
      },
      gameIds: Array.isArray(l5.gameIds) ? l5.gameIds : [],
      skippedPPGames: [],
      note: "Proxied from backend /v1/matchup/summary (last5).",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Proxy error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
