import { NextResponse } from "next/server";
import { cleanStr, toNum } from "@/lib/nhl/parse";
import { isoDate, diffDays, toUtcMs, torontoDateISO } from "@/lib/nhl/dates";
import { toiToMinutes } from "@/lib/nhl/toi";

export const runtime = "nodejs";

/* -------------------- fetchers -------------------- */

async function fetchRosterGoalies(team: string) {
  const url = `https://api-web.nhle.com/v1/roster/${team}/current`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return new Map<number, { playerId: number; name: string; headshot: string | null }>();
  }

  const data = await res.json();
  const map = new Map<number, { playerId: number; name: string; headshot: string | null }>();

  for (const g of data?.goalies ?? []) {
    const id = toNum(g?.id);
    if (!id) continue;

    const name = `${cleanStr(g?.firstName?.default) ?? ""} ${
      cleanStr(g?.lastName?.default) ?? ""
    }`.trim();
    if (!name) continue;

    map.set(id, { playerId: id, name, headshot: cleanStr(g?.headshot) });
  }

  return map;
}

/**
 * ✅ Single source of truth: use YOUR injuries endpoint.
 * Works in dev + prod because we build an absolute base URL from req.url.
 */
async function fetchInjuredIdsViaApi(team: string, reqUrl: string): Promise<Set<number>> {
  const u = new URL(reqUrl);
  const base = `${u.protocol}//${u.host}`;

  const res = await fetch(`${base}/api/team/injuries?team=${team}`, {
    next: { revalidate: 3600 },
    headers: { accept: "application/json" },
  });

  if (!res.ok) return new Set();

  const json = await res.json();
  const injuries: any[] = Array.isArray(json?.injuries) ? json.injuries : [];

  const set = new Set<number>();
  for (const it of injuries) {
    const pid = toNum(it?.playerId);
    if (pid) set.add(pid);
  }
  return set;
}

// CLUB STATS (goalies)
async function fetchClubGoalies(team: string, season: string): Promise<any[]> {
  const url = `https://api-web.nhle.com/v1/club-stats/${team}/${season}/2`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.goalies) ? data.goalies : [];
}

// SEASON SCHEDULE (for last 5 completed before gameDate)
async function fetchSeasonSchedule(team: string, season: string): Promise<any[]> {
  const url = `https://api-web.nhle.com/v1/club-schedule-season/${team}/${season}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.games) ? data.games : [];
}

function isCompletedGameState(v: any) {
  const st = String(v ?? "").toUpperCase();
  return st === "OFF" || st === "FINAL";
}

/* -------------------- boxscore helpers -------------------- */

function getTeamGoaliesFromBoxscore(box: any, team: string): any[] {
  const awayAbbrev = cleanStr(box?.awayTeam?.abbrev)?.toUpperCase() ?? null;
  const homeAbbrev = cleanStr(box?.homeTeam?.abbrev)?.toUpperCase() ?? null;

  const pbgs = box?.playerByGameStats;
  if (!pbgs) return [];

  if (awayAbbrev === team) {
    const arr = pbgs?.awayTeam?.goalies;
    return Array.isArray(arr) ? arr : [];
  }
  if (homeAbbrev === team) {
    const arr = pbgs?.homeTeam?.goalies;
    return Array.isArray(arr) ? arr : [];
  }

  return [];
}

function starterIdFromBoxscore(box: any, team: string): number | null {
  const goalies = getTeamGoaliesFromBoxscore(box, team);
  if (goalies.length === 0) return null;

  const starterRow = goalies.find((g: any) => g?.starter === true);
  const starterId = toNum(starterRow?.playerId);
  if (starterId) return starterId;

  // Fallback: highest TOI
  let bestId: number | null = null;
  let bestTOI = 0;

  for (const g of goalies) {
    const id = toNum(g?.playerId);
    if (!id) continue;
    const mins = toiToMinutes(g?.toi);
    if (mins > bestTOI) {
      bestTOI = mins;
      bestId = id;
    }
  }

  return bestId;
}

// Used only for prevGame b2b check (single game)
async function fetchStarterIdFromBoxscore(team: string, gameId: number) {
  const url = `https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const box = await res.json();
  return starterIdFromBoxscore(box, team);
}

async function fetchBoxscores(gameIds: number[]) {
  const boxes = await Promise.all(
    gameIds.map(async (gid) => {
      const r = await fetch(`https://api-web.nhle.com/v1/gamecenter/${gid}/boxscore`, {
        next: { revalidate: 3600 },
      });
      if (!r.ok) return null;
      return (await r.json()) as any;
    })
  );
  return boxes.filter(Boolean) as any[];
}

async function computeLast5GoalieSplitsFromBoxes(team: string, goalieId: number, boxes: any[]) {
  if (!goalieId || boxes.length === 0) {
    return {
      games: 0,
      record: { w: 0, l: 0, ot: 0 },
      svPct: null as number | null,
      gaa: null as number | null,
    };
  }

  let shotsAgainst = 0;
  let saves = 0;
  let goalsAgainst = 0;
  let minutes = 0;

  let w = 0;
  let l = 0;
  let ot = 0;
  let games = 0;

  for (const box of boxes) {
    const goalies = getTeamGoaliesFromBoxscore(box, team);
    const row = goalies.find((g: any) => toNum(g?.playerId) === goalieId);
    if (!row) continue;

    const toiMin = toiToMinutes(row?.toi);
    if (toiMin <= 0) continue;

    games++;

    const sa = toNum(row?.shotsAgainst) ?? 0;
    const sv = toNum(row?.saves) ?? 0;
    const ga = toNum(row?.goalsAgainst) ?? 0;

    shotsAgainst += sa;
    saves += sv;
    goalsAgainst += ga;
    minutes += toiMin;

    const decision = String(row?.decision ?? "").toUpperCase();
    if (decision === "W") w++;
    else if (decision === "L") l++;
    else if (decision.includes("OT")) ot++;
  }

  const svPct = shotsAgainst > 0 ? saves / shotsAgainst : null;
  const gaa = minutes > 0 ? (goalsAgainst * 60) / minutes : null;

  return { games, record: { w, l, ot }, svPct, gaa };
}

/* -------------------- route -------------------- */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const team = (searchParams.get("team") ?? "").toUpperCase();
  const season = searchParams.get("season") ?? "20252026";
  const gameDateRaw = searchParams.get("gameDate");

  if (!team || !gameDateRaw) {
    return NextResponse.json(
      { error: "Missing ?team=TOR&season=20252026&gameDate=YYYY-MM-DD" },
      { status: 400 }
    );
  }

  // Treat incoming YYYY-MM-DD as the Toronto game day
  const gameDate = isoDate(new Date(gameDateRaw));

  try {
    const [rosterMap, injuredIds, clubGoalies, seasonGames] = await Promise.all([
      fetchRosterGoalies(team),
      fetchInjuredIdsViaApi(team, req.url),
      fetchClubGoalies(team, season),
      fetchSeasonSchedule(team, season),
    ]);

    // Eligible roster goalies: active roster AND not injured (by playerId)
    const eligibleRosterIds: number[] = [];
    for (const [id] of rosterMap) {
      if (!injuredIds.has(id)) eligibleRosterIds.push(id);
    }

    // Season stats map by playerId (club-stats)
    const seasonById = new Map<number, any>();
    for (const g of clubGoalies) {
      const id = toNum(g?.playerId);
      if (!id) continue;
      seasonById.set(id, g);
    }

    const completedBefore = (seasonGames ?? [])
      .map((g: any) => {
        const torDate = torontoDateISO(g?.startTimeUTC);
        const startMs = toUtcMs(g?.startTimeUTC) ?? -1;
        return { ...g, _torDate: torDate, _startMs: startMs };
      })
      .filter((g: any) => g._torDate && g._torDate < gameDate)
      .filter((g: any) => isCompletedGameState(g?.gameState))
      .filter((g: any) => g._startMs > 0)
      .sort((a: any, b: any) => b._startMs - a._startMs);

    const last5Games = completedBefore.slice(0, 5);
    const prevGame = completedBefore[0] ?? null;

    const last5GameIds: number[] = last5Games
      .map((g: any) => toNum(g?.id))
      .filter((x: any): x is number => typeof x === "number");

    const last5Boxes = await fetchBoxscores(last5GameIds);
    const last5StarterIds = last5Boxes.map((box) => starterIdFromBoxscore(box, team));

    // Count starts among eligible roster goalies
    const startsMap = new Map<number, number>();
    for (const sid of last5StarterIds) {
      if (!sid) continue;
      if (!eligibleRosterIds.includes(sid)) continue;
      startsMap.set(sid, (startsMap.get(sid) ?? 0) + 1);
    }

    // Build candidates (use club-stats goalie fields)
    const candidates = eligibleRosterIds.map((id) => {
      const r = rosterMap.get(id)!;
      const s = seasonById.get(id);

      return {
        playerId: id,
        name: r.name,
        headshot: r.headshot,

        last5Starts: startsMap.get(id) ?? 0,

        gamesPlayed: toNum(s?.gamesPlayed) ?? 0,
        wins: toNum(s?.wins) ?? 0,
        losses: toNum(s?.losses) ?? 0,
        ot: toNum(s?.overtimeLosses) ?? 0,
        savePct: toNum(s?.savePercentage),
        gaa: toNum(s?.goalsAgainstAverage),
      };
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        team,
        projectedStarter: null,
        note: "No healthy active roster goalies found",
        meta: { gameDate },
      });
    }

    // Projection: last5 starts → season games played
    candidates.sort((a, b) => {
      if (b.last5Starts !== a.last5Starts) return b.last5Starts - a.last5Starts;
      return b.gamesPlayed - a.gamesPlayed;
    });

    let projected = candidates[0];

    // Back-to-back override (prev game Toronto-day exactly 1 day before)
    const prevDate =
      typeof prevGame?._torDate === "string"
        ? prevGame._torDate
        : typeof prevGame?.gameDate === "string"
          ? prevGame.gameDate
          : null;

    const isBackToBack = prevDate ? diffDays(gameDate, prevDate) === 1 : false;

    if (isBackToBack && prevGame) {
      const prevId = toNum(prevGame?.id);
      if (prevId) {
        const prevStarterId = await fetchStarterIdFromBoxscore(team, prevId);
        if (prevStarterId && projected.playerId === prevStarterId) {
          const alt = candidates.find((c) => c.playerId !== prevStarterId);
          if (alt) projected = alt;
        }
      }
    }

    const last5Splits = await computeLast5GoalieSplitsFromBoxes(
      team,
      projected.playerId,
      last5Boxes
    );

    return NextResponse.json({
      team,
      projectedStarter: {
        playerId: projected.playerId,
        name: projected.name,
        headshot: projected.headshot,
        record: { wins: projected.wins, losses: projected.losses, ot: projected.ot },
        gamesPlayed: projected.gamesPlayed,
        savePct: projected.savePct,
        gaa: projected.gaa,
        last5Starts: projected.last5Starts,
        last5Splits,
      },
      meta: {
        logic: "last5_starts → season_gp → b2b_override",
        gameDate,
        prevGameDate: prevDate,
        isBackToBack,
        last5GameIds,
        last5StarterIds,
        startsMap: Object.fromEntries([...startsMap.entries()]),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Goalie projection failed" },
      { status: 500 }
    );
  }
}
