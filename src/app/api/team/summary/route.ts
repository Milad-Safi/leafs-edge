import { NextResponse } from "next/server";

type TeamSummary = {
  teamAbbrev: string;
  seasonId: number;
  gameTypeId: number; // 2 = regular season

  teamId: number | null;
  teamFullName: string | null;

  gamesPlayed: number | null;

  goalsForPerGame: number | null;
  goalsAgainstPerGame: number | null;

  powerPlayPct: number | null;   // percent (0-100)
  penaltyKillPct: number | null; // percent (0-100)

  shotsForPerGame: number | null;
  shotsAgainstPerGame: number | null;

  wins: number | null;
  losses: number | null;
  otLosses: number | null;
  points: number | null;
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
  // Example: Dec 2025 is the 2025-2026 season => 20252026
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1; // 1-12
  const startYear = m >= 7 ? y : y - 1; // season starts around fall; July is a safe cutoff
  const endYear = startYear + 1;
  return Number(`${startYear}${endYear}`);
}

async function getTeamIdByAbbrev(teamAbbrev: string): Promise<number | null> {
  // Stats REST team list (same family as team/summary)
  const res = await fetch("https://api.nhle.com/stats/rest/en/team", {
    next: { revalidate: 60 * 60 },
    headers: { "User-Agent": "leafs-edge" },
  });
  if (!res.ok) return null;

  const json = await res.json();
  const rows: any[] = Array.isArray(json?.data) ? json.data : [];

  const found =
    rows.find((t) => String(t?.triCode || "").toUpperCase() === teamAbbrev) ||
    rows.find((t) => String(t?.abbrev || "").toUpperCase() === teamAbbrev) ||
    rows.find((t) => String(t?.abbreviation || "").toUpperCase() === teamAbbrev);

  return toNumber(found?.id ?? found?.teamId) ?? null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const teamAbbrev = (url.searchParams.get("team") || "").trim().toUpperCase();

  // Optional override: /api/team/summary?team=TOR&season=20252026
  const seasonOverride = toNumber(url.searchParams.get("season"));

  const gameTypeId = 2; // regular season
  const seasonId = seasonOverride ?? inferCurrentSeasonIdFromToday();

  if (!teamAbbrev) {
    return NextResponse.json({ error: "Missing query param ?team=TOR" }, { status: 400 });
  }

  try {
    const teamId = await getTeamIdByAbbrev(teamAbbrev);
    if (!teamId) {
      return NextResponse.json({ error: `Unknown team abbrev: ${teamAbbrev}` }, { status: 404 });
    }

    // One endpoint for everything we need
    const cayenneExp = `seasonId=${seasonId} and gameTypeId=${gameTypeId} and teamId=${teamId}`;
    const endpoint =
      "https://api.nhle.com/stats/rest/en/team/summary" +
      `?cayenneExp=${encodeURIComponent(cayenneExp)}`;

    const res = await fetch(endpoint, {
      next: { revalidate: 60 },
      headers: { "User-Agent": "leafs-edge" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `team/summary fetch failed: ${res.status}`, endpoint },
        { status: 502 }
      );
    }

    const json = await res.json();
    const row = Array.isArray(json?.data) ? json.data[0] : null;

    if (!row) {
      return NextResponse.json(
        { error: "No team summary row returned", teamAbbrev, teamId, seasonId },
        { status: 502 }
      );
    }

    const payload: TeamSummary = {
      teamAbbrev,
      seasonId,
      gameTypeId,

      teamId: toNumber(row?.teamId ?? teamId),
      teamFullName: typeof row?.teamFullName === "string" ? row.teamFullName : null,

      gamesPlayed: toNumber(row?.gamesPlayed),

      goalsForPerGame: round2(toNumber(row?.goalsForPerGame)),
      goalsAgainstPerGame: round2(toNumber(row?.goalsAgainstPerGame)),

      // NOTE: these are decimals in [0..1] -> convert to percent
      powerPlayPct: pctFromDecimal01(toNumber(row?.powerPlayPct)),
      penaltyKillPct: pctFromDecimal01(toNumber(row?.penaltyKillPct)),

      shotsForPerGame: round2(toNumber(row?.shotsForPerGame)),
      shotsAgainstPerGame: round2(toNumber(row?.shotsAgainstPerGame)),

      wins: toNumber(row?.wins),
      losses: toNumber(row?.losses),
      otLosses: toNumber(row?.otLosses),
      points: toNumber(row?.points),
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
