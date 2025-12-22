import { NextResponse } from "next/server";

function toNumber(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function inferCurrentSeasonIdFromToday(): number {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1; // 1-12
  const startYear = m >= 7 ? y : y - 1;
  const endYear = startYear + 1;
  return Number(`${startYear}${endYear}`);
}

function pctFromDecimal01(n: number | null): number | null {
  if (n == null) return null;
  return Math.round(n * 10000) / 100; // 2 decimals
}

type MetricKey =
  | "goalsForPerGame"
  | "goalsAgainstPerGame"
  | "powerPlayPct"
  | "penaltyKillPct"
  | "shotsForPerGame"
  | "shotsAgainstPerGame";

type TeamMetrics = {
  teamAbbrev: string; // triCode (TOR, DAL, etc.)
  goalsForPerGame: number | null;
  goalsAgainstPerGame: number | null;
  powerPlayPct: number | null; // percent 0-100
  penaltyKillPct: number | null; // percent 0-100
  shotsForPerGame: number | null;
  shotsAgainstPerGame: number | null;
};

/**
 * Rank logic:
 * - higherIsBetter: sort desc (rank 1 = highest)
 * - lowerIsBetter: sort asc (rank 1 = lowest)
 * - ties share rank (competition rank)
 */
function computeRanks(
  rows: TeamMetrics[],
  key: MetricKey,
  higherIsBetter: boolean
): Record<string, number> {
  const vals = rows
    .map((r) => ({ team: r.teamAbbrev, val: r[key] }))
    .filter((x) => x.team && x.val != null) as { team: string; val: number }[];

  vals.sort((a, b) => (higherIsBetter ? b.val - a.val : a.val - b.val));

  const rankByTeam: Record<string, number> = {};
  let rank = 1;

  for (let i = 0; i < vals.length; i++) {
    if (i > 0 && vals[i].val !== vals[i - 1].val) {
      rank = i + 1;
    }
    rankByTeam[vals[i].team] = rank;
  }

  return rankByTeam;
}

async function getTeamIdToTriCodeMap(): Promise<Map<number, string>> {
  const res = await fetch("https://api.nhle.com/stats/rest/en/team", {
    next: { revalidate: 60 * 60 }, // cache 1h
    headers: { "User-Agent": "leafs-edge" },
  });

  if (!res.ok) return new Map();

  const json = await res.json();
  const rows: any[] = Array.isArray(json?.data) ? json.data : [];

  const map = new Map<number, string>();
  for (const t of rows) {
    const id = toNumber(t?.id ?? t?.teamId);
    const tri = String(t?.triCode ?? t?.abbrev ?? t?.abbreviation ?? "").toUpperCase().trim();
    if (id != null && tri) map.set(id, tri);
  }
  return map;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const teamA = (url.searchParams.get("teamA") || "").trim().toUpperCase();
  const teamB = (url.searchParams.get("teamB") || "").trim().toUpperCase();

  const seasonId = toNumber(url.searchParams.get("season")) ?? inferCurrentSeasonIdFromToday();
  const gameTypeId = 2;

  if (!teamA || !teamB) {
    return NextResponse.json(
      { error: "Missing query params. Use ?teamA=TOR&teamB=DAL" },
      { status: 400 }
    );
  }

  try {
    // 1) Build teamId -> triCode map (TOR, DAL, etc.)
    const idToTri = await getTeamIdToTriCodeMap();

    // 2) Fetch ALL teams’ season summary in one call
    const cayenneExp = `seasonId=${seasonId} and gameTypeId=${gameTypeId}`;
    const endpoint =
      "https://api.nhle.com/stats/rest/en/team/summary" +
      `?cayenneExp=${encodeURIComponent(cayenneExp)}`;

    const res = await fetch(endpoint, {
      next: { revalidate: 60 * 10 }, // cache 10 min
      headers: { "User-Agent": "leafs-edge" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `stats team/summary failed: ${res.status}`, endpoint },
        { status: 502 }
      );
    }

    const json = await res.json();
    const data: any[] = Array.isArray(json?.data) ? json.data : [];

    // 3) Convert each row using teamId -> triCode
    const rows: TeamMetrics[] = [];
    for (const r of data) {
      const teamId = toNumber(r?.teamId);
      if (teamId == null) continue;

      const tri = idToTri.get(teamId);
      if (!tri) continue; // if mapping fails, skip

      rows.push({
        teamAbbrev: tri,
        goalsForPerGame: toNumber(r?.goalsForPerGame),
        goalsAgainstPerGame: toNumber(r?.goalsAgainstPerGame),
        powerPlayPct: pctFromDecimal01(toNumber(r?.powerPlayPct)),
        penaltyKillPct: pctFromDecimal01(toNumber(r?.penaltyKillPct)),
        shotsForPerGame: toNumber(r?.shotsForPerGame),
        shotsAgainstPerGame: toNumber(r?.shotsAgainstPerGame),
      });
    }

    // If this is still empty, return debug info to help instantly
    if (rows.length === 0) {
      return NextResponse.json(
        {
          seasonId,
          teamsCount: 0,
          teamA,
          teamB,
          error: "No ranked rows produced (teamId->triCode mapping failed).",
          debug: {
            summaryRows: data.length,
            teamMapSize: idToTri.size,
            endpoint,
          },
          ranks: {
            goalsForPerGame: { [teamA]: null, [teamB]: null },
            goalsAgainstPerGame: { [teamA]: null, [teamB]: null },
            powerPlayPct: { [teamA]: null, [teamB]: null },
            penaltyKillPct: { [teamA]: null, [teamB]: null },
            shotsForPerGame: { [teamA]: null, [teamB]: null },
            shotsAgainstPerGame: { [teamA]: null, [teamB]: null },
          },
        },
        { status: 200 }
      );
    }

    // 4) Compute ranks
    const rGF = computeRanks(rows, "goalsForPerGame", true);
    const rGA = computeRanks(rows, "goalsAgainstPerGame", false); // lower better
    const rPP = computeRanks(rows, "powerPlayPct", true);
    const rPK = computeRanks(rows, "penaltyKillPct", true);
    const rSF = computeRanks(rows, "shotsForPerGame", true);
    const rSA = computeRanks(rows, "shotsAgainstPerGame", false); // lower better

    return NextResponse.json({
      seasonId,
      teamsCount: rows.length,
      teamA,
      teamB,
      ranks: {
        goalsForPerGame: { [teamA]: rGF[teamA] ?? null, [teamB]: rGF[teamB] ?? null },
        goalsAgainstPerGame: { [teamA]: rGA[teamA] ?? null, [teamB]: rGA[teamB] ?? null },
        powerPlayPct: { [teamA]: rPP[teamA] ?? null, [teamB]: rPP[teamB] ?? null },
        penaltyKillPct: { [teamA]: rPK[teamA] ?? null, [teamB]: rPK[teamB] ?? null },
        shotsForPerGame: { [teamA]: rSF[teamA] ?? null, [teamB]: rSF[teamB] ?? null },
        shotsAgainstPerGame: { [teamA]: rSA[teamA] ?? null, [teamB]: rSA[teamB] ?? null },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
