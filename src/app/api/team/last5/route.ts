import { NextResponse } from "next/server";

export const revalidate = 60;

function toNumber(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function round1(n: number | null): number | null {
  if (n == null) return null;
  return Math.round(n * 10) / 10;
}

function pctFromDecimal01(n: number | null): number | null {
  if (n == null) return null;
  return round1(n * 100);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const team = (url.searchParams.get("team") ?? "").trim().toUpperCase();

    if (!team) {
      return NextResponse.json({ error: "Missing team" }, { status: 400 });
    }

    const backendBase = process.env.ML_SERVICE_URL || "http://localhost:8000";
    const r = await fetch(
      `${backendBase}/v1/team/last5?team=${encodeURIComponent(team)}`,
      { cache: "no-store" }
    );

    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json(
        { error: "Backend error", detail: text },
        { status: 502 }
      );
    }

    const b = await r.json();

    // Convert backend decimal pct -> frontend percent
    const ppPct = pctFromDecimal01(toNumber(b?.powerPlay?.pct));
    const pkPct = pctFromDecimal01(toNumber(b?.penaltyKill?.pct));

    return NextResponse.json({
      team,
      games: toNumber(b?.games) ?? 0,
      record: b?.record ?? { w: 0, l: 0 },

      goalsForPerGame: toNumber(b?.goalsForPerGame),
      goalsAgainstPerGame: toNumber(b?.goalsAgainstPerGame),
      shotsForPerGame: toNumber(b?.shotsForPerGame),
      shotsAgainstPerGame: toNumber(b?.shotsAgainstPerGame),

      powerPlay: {
        goals: toNumber(b?.powerPlay?.goals) ?? 0,
        opps: toNumber(b?.powerPlay?.opps) ?? 0,
        pct: ppPct,
      },
      penaltyKill: {
        oppPPGoals: toNumber(b?.penaltyKill?.oppPPGoals) ?? 0,
        oppPPOpps: toNumber(b?.penaltyKill?.oppPPOpps) ?? 0,
        pct: pkPct,
      },

      gameIds: Array.isArray(b?.gameIds) ? b.gameIds : [],
      skippedPPGames: [],

      note:
        "DB-backed last 5 (this season). PP/PK computed from stored pp_goals/pp_opps and pk_goals_against/pk_opps.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
