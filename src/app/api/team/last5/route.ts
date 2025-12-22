import { NextResponse } from "next/server";

export const revalidate = 60;

type TeamAbbrev = string;

type ScheduleGame = {
  id: number;
  gameState: string;
  gameDate: string; // keep, but do NOT use for ordering
  startTimeUTC?: string; // ✅ used for ordering
  homeTeam: { abbrev: string; score?: number };
  awayTeam: { abbrev: string; score?: number };
};

type BoxscoreResponse = {
  id: number;
  homeTeam?: { abbrev: string; sog?: number };
  awayTeam?: { abbrev: string; sog?: number };
};

function normalizeTeam(input: string): TeamAbbrev {
  return input.trim().toUpperCase();
}

function toUtcMs(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * ✅ FIX:
 * Completed NHL games in this feed are typically gameState === "OFF"
 * Some endpoints also use "FINAL".
 */
function isCompleted(g: ScheduleGame) {
  const st = String(g?.gameState ?? "").toUpperCase();
  return st === "OFF" || st === "FINAL";
}

function gameSummaryUrl(season: string, gameId: number) {
  const code = String(gameId).slice(-6); // "010025"
  return `https://www.nhl.com/scores/htmlreports/${season}/GS${code}.HTM`;
}

function boxscoreUrl(gameId: number) {
  return `https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`;
}

async function fetchTeamGames(team: TeamAbbrev): Promise<ScheduleGame[]> {
  const url = `https://api-web.nhle.com/v1/club-schedule-season/${team}/20252026`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Schedule fetch failed (${res.status})`);

  const data = (await res.json()) as any;

  const games: ScheduleGame[] =
    data?.games ??
    data?.gameWeek?.flatMap((w: any) => w?.games ?? []) ??
    data?.weeks?.flatMap((w: any) => w?.games ?? []) ??
    [];

  if (!Array.isArray(games) || games.length === 0) {
    throw new Error("No games found in schedule response");
  }

  return games;
}

/**
 * Robust GS PP parse:
 * 1) locate Power Plays section
 * 2) in a limited window after it, pull first two "X-Y / MM:SS" occurrences
 * Return in order: [away, home]
 */
function parseGsPowerPlays(html: string): Array<{ goals: number; opps: number }> {
  if (!html) return [];

  const lower = html.toLowerCase();

  const key1 = "power plays (goals-opp./pptime)";
  const key2 = "power plays";

  let idx = lower.indexOf(key1);
  if (idx === -1) idx = lower.indexOf(key2);
  if (idx === -1) return [];

  const chunk = html.slice(idx, idx + 5000);

  const re = /(\d+)\s*-\s*(\d+)\s*\/\s*\d{1,2}:\d{2}/g;

  const out: Array<{ goals: number; opps: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(chunk)) !== null) {
    out.push({ goals: Number(m[1]), opps: Number(m[2]) });
    if (out.length >= 2) break;
  }

  return out;
}

async function fetchBoxscores(gameIds: number[]) {
  const results = await Promise.all(
    gameIds.map(async (id) => {
      const r = await fetch(boxscoreUrl(id), { next: { revalidate: 300 } });
      if (!r.ok) return { id, data: null as BoxscoreResponse | null };
      const data = (await r.json()) as BoxscoreResponse;
      return { id, data };
    })
  );

  const map = new Map<number, BoxscoreResponse>();
  for (const r of results) {
    if (r.data) map.set(r.id, r.data);
  }
  return map;
}

function computeRecord(team: TeamAbbrev, games: ScheduleGame[]) {
  let w = 0,
    l = 0,
    otl = 0;

  for (const g of games) {
    const isHome = g.homeTeam.abbrev === team;
    const myScore = isHome ? (g.homeTeam.score ?? 0) : (g.awayTeam.score ?? 0);
    const oppScore = isHome ? (g.awayTeam.score ?? 0) : (g.homeTeam.score ?? 0);

    if (myScore > oppScore) w++;
    else l++; // keeping your simplified loss logic
  }

  return { w, l, otl };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamParam = searchParams.get("team");

  if (!teamParam) {
    return NextResponse.json({ error: "Missing ?team=TOR" }, { status: 400 });
  }

  const team = normalizeTeam(teamParam);

  try {
    const allGames = await fetchTeamGames(team);

    /**
     * ✅ FIX:
     * - only completed games (OFF/FINAL)
     * - sort by startTimeUTC (real time) desc
     * - NEVER sort by gameDate
     */
    const finals = allGames
      .filter(isCompleted)
      .map((g) => ({
        ...g,
        _startMs: toUtcMs(g.startTimeUTC) ?? -1,
      }))
      .filter((g) => g._startMs > 0)
      .sort((a, b) => b._startMs - a._startMs)
      .slice(0, 5);

    if (finals.length === 0) {
      return NextResponse.json({ error: "No completed games found yet." }, { status: 404 });
    }

    const gameIds = finals.map((g) => g.id);

    // totals
    let gf = 0,
      ga = 0;
    let sf = 0,
      sa = 0;

    // PP/PK totals
    let ppGoals = 0,
      ppOpps = 0;
    let oppPPGoals = 0,
      oppPPOpps = 0;

    const skippedPPGames: number[] = [];

    // --- SOG: boxscore ---
    const boxscoreMap = await fetchBoxscores(gameIds);

    // --- PP/PK: GS htmlreports ---
    const season = "20252026";
    const gsHtmls = await Promise.all(
      finals.map(async (g) => {
        const url = gameSummaryUrl(season, g.id);
        const r = await fetch(url, { next: { revalidate: 86400 } });
        if (!r.ok) return { id: g.id, html: "" };
        return { id: g.id, html: await r.text() };
      })
    );

    for (let i = 0; i < finals.length; i++) {
      const g = finals[i];
      const isHome = g.homeTeam.abbrev === team;

      // goals
      const myScore = isHome ? (g.homeTeam.score ?? 0) : (g.awayTeam.score ?? 0);
      const oppScore = isHome ? (g.awayTeam.score ?? 0) : (g.homeTeam.score ?? 0);
      gf += myScore;
      ga += oppScore;

      // shots (boxscore)
      const bs = boxscoreMap.get(g.id);
      if (bs?.homeTeam && bs?.awayTeam) {
        const mySog = isHome ? (bs.homeTeam.sog ?? 0) : (bs.awayTeam.sog ?? 0);
        const oppSog = isHome ? (bs.awayTeam.sog ?? 0) : (bs.homeTeam.sog ?? 0);
        sf += mySog;
        sa += oppSog;
      }

      // PP/PK (GS)
      const html = gsHtmls[i]?.html ?? "";
      const rows = parseGsPowerPlays(html);

      if (rows.length < 2) {
        skippedPPGames.push(g.id);
        continue;
      }

      const awayRow = rows[0];
      const homeRow = rows[1];

      const myRow = isHome ? homeRow : awayRow;
      const theirRow = isHome ? awayRow : homeRow;

      ppGoals += myRow.goals;
      ppOpps += myRow.opps;

      oppPPGoals += theirRow.goals;
      oppPPOpps += theirRow.opps;
    }

    const gamesCount = finals.length;
    const record = computeRecord(team, finals);

    const powerPlayPct = ppOpps > 0 ? +((ppGoals / ppOpps) * 100).toFixed(1) : null;
    const penaltyKillPct =
      oppPPOpps > 0 ? +(100 - (oppPPGoals / oppPPOpps) * 100).toFixed(1) : null;

    return NextResponse.json({
      team,
      games: gamesCount,
      record,
      goalsForPerGame: +(gf / gamesCount).toFixed(2),
      goalsAgainstPerGame: +(ga / gamesCount).toFixed(2),
      shotsForPerGame: +(sf / gamesCount).toFixed(2),
      shotsAgainstPerGame: +(sa / gamesCount).toFixed(2),
      powerPlay: { goals: ppGoals, opps: ppOpps, pct: powerPlayPct },
      penaltyKill: { oppPPGoals, oppPPOpps, pct: penaltyKillPct },
      gameIds,
      skippedPPGames,
      note:
        "Ordering uses startTimeUTC (not gameDate). Completed games are OFF/FINAL. SOG from gamecenter boxscore. PP/PK from NHL GS htmlreports.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
