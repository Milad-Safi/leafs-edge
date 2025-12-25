import { NextResponse } from "next/server";

type RecordSplit = {
  w: number;
  l: number;
};

type TeamSummary = {
  teamAbbrev: string;
  seasonId: number;
  gameTypeId: number;

  teamId: number | null;
  teamFullName: string | null;

  gamesPlayed: number | null;

  goalsForPerGame: number | null;
  goalsAgainstPerGame: number | null;

  powerPlayPct: number | null; // percent (0-100)
  penaltyKillPct: number | null; // percent (0-100)

  shotsForPerGame: number | null;
  shotsAgainstPerGame: number | null;

  wins: number | null;
  losses: number | null;
  otLosses: number | null;
  points: number | null;

  homeRecord: RecordSplit;
  awayRecord: RecordSplit;

  // Optional extras (safe if UI ignores)
  seasonStart?: string;
  through?: string | null;

  // From standings (if present)
  pointPctg?: number | null; // 0-1
  streakCode?: string | null; // "W" | "L" | "O"
  streakCount?: number | null;
  leagueSequence?: number | null;
  conferenceSequence?: number | null;
  divisionSequence?: number | null;
  teamLogo?: string | null;
  standingsDateTimeUtc?: string | null;
};

function toNumber(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function round2(n: number | null): number | null {
  if (n == null) return null;
  return Math.round(n * 100) / 100;
}

function pctFromDecimal01(n: number | null): number | null {
  if (n == null) return null;
  return round2(n * 100);
}

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
    const teamAbbrev = (url.searchParams.get("team") ?? "").trim().toUpperCase();

    if (!teamAbbrev) {
      return NextResponse.json({ error: "Missing team" }, { status: 400 });
    }

    const backendBase = process.env.ML_SERVICE_URL || "http://localhost:8000";
    const r = await fetch(
      `${backendBase}/v1/team/summary?team=${encodeURIComponent(teamAbbrev)}`,
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

    const payload: TeamSummary = {
      teamAbbrev,
      seasonId: toNumber(b?.seasonId) ?? inferCurrentSeasonIdFromToday(),
      gameTypeId: 2,

      teamId: null,
      teamFullName: null,

      gamesPlayed: toNumber(b?.gamesPlayed) ?? toNumber(b?.games),

      goalsForPerGame: round2(toNumber(b?.goalsForPerGame)),
      goalsAgainstPerGame: round2(toNumber(b?.goalsAgainstPerGame)),

      // backend sends decimal 0-1, UI expects 0-100
      powerPlayPct: pctFromDecimal01(toNumber(b?.powerPlayPct)),
      penaltyKillPct: pctFromDecimal01(toNumber(b?.penaltyKillPct)),

      shotsForPerGame: round2(toNumber(b?.shotsForPerGame)),
      shotsAgainstPerGame: round2(toNumber(b?.shotsAgainstPerGame)),

      // now REAL from standings merge (or DB fallback)
      wins: toNumber(b?.wins),
      losses: toNumber(b?.losses),
      otLosses: toNumber(b?.otLosses) ?? 0, // never let it be null (avoids "-null")
      points: toNumber(b?.points),

      homeRecord: {
        w: toNumber(b?.homeRecord?.w) ?? 0,
        l: toNumber(b?.homeRecord?.l) ?? 0,
      },
      awayRecord: {
        w: toNumber(b?.awayRecord?.w) ?? 0,
        l: toNumber(b?.awayRecord?.l) ?? 0,
      },

      // extras
      seasonStart: typeof b?.seasonStart === "string" ? b.seasonStart : undefined,
      through:
        typeof b?.through === "string" || b?.through === null ? b.through : undefined,

      pointPctg: toNumber(b?.pointPctg),
      streakCode: typeof b?.streakCode === "string" ? b.streakCode : null,
      streakCount: toNumber(b?.streakCount),
      leagueSequence: toNumber(b?.leagueSequence),
      conferenceSequence: toNumber(b?.conferenceSequence),
      divisionSequence: toNumber(b?.divisionSequence),
      teamLogo: typeof b?.teamLogo === "string" ? b.teamLogo : null,
      standingsDateTimeUtc:
        typeof b?.standingsDateTimeUtc === "string" ? b.standingsDateTimeUtc : null,
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
