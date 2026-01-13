import { NextResponse } from "next/server";

type RecordSplit = {
  w: number;
  l: number;
  otl: number;
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
};

// Best-effort number parsing for API values that may arrive as strings
function toNumber(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Round numeric outputs to 2 decimals for UI-friendly stats
function round2(n: number | null): number | null {
  if (n == null) return null;
  return Math.round(n * 100) / 100;
}

// Convert 0..1 decimal rates into percent values for display
function pctFromDecimal01(n: number | null): number | null {
  if (n == null) return null;
  return round2(n * 100);
}

// Guess the current NHL seasonId based on today in UTC
function inferCurrentSeasonIdFromToday(): number {
  // Example: Sept 2025 is the 2025-2026 season => 20252026
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1; // 1-12
  const startYear = m >= 7 ? y : y - 1; // season starts around fall; July is a safe cutoff
  const endYear = startYear + 1;
  return Number(`${startYear}${endYear}`);
}

// Resolve NHL teamId from a 3-letter abbreviation
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

// Detect whether a completed schedule game ended in OT or a shootout
function isOtlGameFromSchedule(g: any): boolean {
  const last = String(g?.gameOutcome?.lastPeriodType ?? "").toUpperCase();
  if (last === "OT" || last === "SO") return true;

  const pd = String(g?.periodDescriptor?.periodType ?? "").toUpperCase();
  if (pd === "OT" || pd === "SO") return true;

  return false;
}

// Compute home and away record splits by iterating the season schedule
async function getHomeAwayRecord(teamAbbrev: string, seasonId: number): Promise<{
  homeRecord: RecordSplit;
  awayRecord: RecordSplit;
}> {
  const homeRecord: RecordSplit = { w: 0, l: 0, otl: 0 };
  const awayRecord: RecordSplit = { w: 0, l: 0, otl: 0 };

  const endpoint = `https://api-web.nhle.com/v1/club-schedule-season/${teamAbbrev}/${seasonId}`;
  const res = await fetch(endpoint, {
    // schedule changes as games finish; keep it fresh
    cache: "no-store",
    headers: { "User-Agent": "leafs-edge" },
  });

  if (!res.ok) {
    // If schedule fails, just return zeros
    return { homeRecord, awayRecord };
  }

  const json = await res.json();
  const games: any[] = Array.isArray(json?.games) ? json.games : [];

  for (const g of games) {
    // Only count completed games
    const state = String(g?.gameState ?? "").toUpperCase();
    const isCompleted = state === "FINAL" || state === "OFF";
    if (!isCompleted) continue;

    // regular season only (keep consistent with the rest of your app)
    if (toNumber(g?.gameType) !== 2) continue;

    // Identify whether the team is home or away for this game
    const homeAbbrev = String(g?.homeTeam?.abbrev || "").toUpperCase();
    const awayAbbrev = String(g?.awayTeam?.abbrev || "").toUpperCase();
    const isHome = homeAbbrev === teamAbbrev;
    const isAway = awayAbbrev === teamAbbrev;
    if (!isHome && !isAway) continue;

    const homeScore = toNumber(g?.homeTeam?.score);
    const awayScore = toNumber(g?.awayTeam?.score);

    // Skip bad or incomplete score states
    if (homeScore == null || awayScore == null) continue;
    if (homeScore === awayScore) continue;

    const goalsFor = isHome ? homeScore : awayScore;
    const goalsAgainst = isHome ? awayScore : homeScore;

    // Update split record based on result and OT detection
    if (goalsFor > goalsAgainst) {
      if (isHome) homeRecord.w++;
      else awayRecord.w++;
    } else {
      const otl = isOtlGameFromSchedule(g);
      if (otl) {
        if (isHome) homeRecord.otl++;
        else awayRecord.otl++;
      } else {
        if (isHome) homeRecord.l++;
        else awayRecord.l++;
      }
    }
  }

  return { homeRecord, awayRecord };
}

// GET /api/team/summary?team=TOR&season=20252026
// Fetches team summary stats and returns a normalized payload for the UI
export async function GET(req: Request) {
  const url = new URL(req.url);
  const teamAbbrev = (url.searchParams.get("team") || "").trim().toUpperCase();

  // Optional override: /api/team/summary?team=TOR&season=20252026
  const seasonOverride = toNumber(url.searchParams.get("season"));

  // Keep game type consistent across the route and schedule splits
  const gameTypeId = 2; // 2 == regular season, 3 == playoffs
  const seasonId = seasonOverride ?? inferCurrentSeasonIdFromToday();

  // Validate required query params
  if (!teamAbbrev) {
    return NextResponse.json({ error: "Missing query param ?team=TOR" }, { status: 400 });
  }

  try {
    // Resolve teamId first since stats REST uses numeric ids in the filter expression
    const teamId = await getTeamIdByAbbrev(teamAbbrev);
    if (!teamId) {
      return NextResponse.json({ error: `Unknown team abbrev: ${teamAbbrev}` }, { status: 404 });
    }

    // Build stats REST filter expression for the requested team and season
    const cayenneExp = `seasonId=${seasonId} and gameTypeId=${gameTypeId} and teamId=${teamId}`;
    const endpoint =
      "https://api.nhle.com/stats/rest/en/team/summary" +
      `?cayenneExp=${encodeURIComponent(cayenneExp)}`;

    // Fetch stats summary and compute schedule-based splits in parallel
    const [summaryRes, splits] = await Promise.all([
      fetch(endpoint, {
        next: { revalidate: 60 },
        headers: { "User-Agent": "leafs-edge" },
      }),
      getHomeAwayRecord(teamAbbrev, seasonId),
    ]);

    if (!summaryRes.ok) {
      return NextResponse.json(
        { error: `team/summary fetch failed: ${summaryRes.status}`, endpoint },
        { status: 502 }
      );
    }

    const json = await summaryRes.json();
    const row = Array.isArray(json?.data) ? json.data[0] : null;

    // Stats REST returns the row inside data[0] for this filtered query
    if (!row) {
      return NextResponse.json(
        { error: "No team summary row returned", teamAbbrev, teamId, seasonId },
        { status: 502 }
      );
    }

    // Normalize and shape the payload consumed by the frontend
    const payload: TeamSummary = {
      teamAbbrev,
      seasonId,
      gameTypeId,

      teamId: toNumber(row?.teamId ?? teamId),
      teamFullName: typeof row?.teamFullName === "string" ? row.teamFullName : null,

      gamesPlayed: toNumber(row?.gamesPlayed),

      goalsForPerGame: round2(toNumber(row?.goalsForPerGame)),
      goalsAgainstPerGame: round2(toNumber(row?.goalsAgainstPerGame)),

      powerPlayPct: pctFromDecimal01(toNumber(row?.powerPlayPct)),
      penaltyKillPct: pctFromDecimal01(toNumber(row?.penaltyKillPct)),

      shotsForPerGame: round2(toNumber(row?.shotsForPerGame)),
      shotsAgainstPerGame: round2(toNumber(row?.shotsAgainstPerGame)),

      wins: toNumber(row?.wins),
      losses: toNumber(row?.losses),
      otLosses: toNumber(row?.otLosses),
      points: toNumber(row?.points),

      homeRecord: splits.homeRecord,
      awayRecord: splits.awayRecord,
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    // Final catch-all for unexpected fetch or parsing errors
    return NextResponse.json(
      { error: "Server error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
