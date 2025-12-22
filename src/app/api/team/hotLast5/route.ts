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
  const m = now.getUTCMonth() + 1;
  const startYear = m >= 7 ? y : y - 1;
  const endYear = startYear + 1;
  return Number(`${startYear}${endYear}`);
}

type Leader = {
  playerId: number;
  name: string;
  goals: number;
  assists: number;
  points: number;
  shots: number;
};

type PlayerAgg = {
  playerId: number;
  name: string;
  goals: number;
  assists: number;
  shots: number;
};

function safeName(p: any): string {
  // Most common: { name: { default: "..." } }
  const n1 = p?.name?.default;
  if (typeof n1 === "string" && n1.trim()) return n1.trim();

  // Sometimes: { firstName: { default }, lastName: { default } }
  const fn = p?.firstName?.default;
  const ln = p?.lastName?.default;
  const both =
    (typeof fn === "string" ? fn : "") + (typeof ln === "string" ? ` ${ln}` : "");
  if (both.trim()) return both.trim();

  // Sometimes: { fullName: "..." } or { name: "..." }
  if (typeof p?.fullName === "string" && p.fullName.trim()) return p.fullName.trim();
  if (typeof p?.name === "string" && p.name.trim()) return p.name.trim();

  return "Unknown";
}

function pickBest(map: Map<number, PlayerAgg>, key: "goals" | "shots" | "points"): Leader | null {
  const arr: Leader[] = Array.from(map.values()).map((p) => ({
    playerId: p.playerId,
    name: p.name,
    goals: p.goals,
    assists: p.assists,
    points: p.goals + p.assists,
    shots: p.shots,
  }));

  if (!arr.length) return null;

  arr.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (vb !== va) return vb - va; // desc
    // tie breakers
    if (b.points !== a.points) return b.points - a.points;
    if (b.goals !== a.goals) return b.goals - a.goals;
    return b.shots - a.shots;
  });

  return arr[0];
}

async function getLast5GameIds(team: string, seasonId: number): Promise<number[]> {
  const url = `https://api-web.nhle.com/v1/club-schedule-season/${team}/${seasonId}`;
  const res = await fetch(url, {
    next: { revalidate: 60 * 10 },
    headers: { "User-Agent": "leafs-edge" },
  });
  if (!res.ok) return [];

  const json = await res.json();
  const games: any[] = Array.isArray(json?.games) ? json.games : [];

  const completed = games
    .filter((g) => {
      const st = String(g?.gameState ?? "").toUpperCase();
      return st === "OFF" || st === "FINAL";
    })
    .sort((a, b) => {
      const da = new Date(String(a?.startTimeUTC ?? "")).getTime();
      const db = new Date(String(b?.startTimeUTC ?? "")).getTime();
      return da - db;
    });

  const last5 = completed.slice(-5);
  return last5.map((g) => toNumber(g?.id)).filter((n): n is number => n != null);
}

function extractSkaters(side: any): any[] {
  const lists: any[][] = [];

  if (Array.isArray(side?.skaters)) lists.push(side.skaters);

  if (Array.isArray(side?.forwards)) lists.push(side.forwards);
  if (Array.isArray(side?.defense)) lists.push(side.defense);
  if (Array.isArray(side?.defensemen)) lists.push(side.defensemen);

  // Some variants nest:
  // side.playerByGameStats?.skaters etc (rare but harmless to check)
  if (Array.isArray(side?.playerByGameStats?.skaters)) lists.push(side.playerByGameStats.skaters);
  if (Array.isArray(side?.playerByGameStats?.forwards)) lists.push(side.playerByGameStats.forwards);
  if (Array.isArray(side?.playerByGameStats?.defense)) lists.push(side.playerByGameStats.defense);

  // Flatten
  return lists.flat();
}

async function addGameToAgg(team: string, gameId: number, agg: Map<number, PlayerAgg>) {
  const url = `https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`;
  const res = await fetch(url, {
    next: { revalidate: 60 * 10 },
    headers: { "User-Agent": "leafs-edge" },
  });
  if (!res.ok) return;

  const json: any = await res.json();

  const homeAbbrev = String(json?.homeTeam?.abbrev ?? "").toUpperCase();
  const awayAbbrev = String(json?.awayTeam?.abbrev ?? "").toUpperCase();

  const isHome = homeAbbrev === team;
  const isAway = awayAbbrev === team;
  if (!isHome && !isAway) return;

  const side = isHome ? json?.playerByGameStats?.homeTeam : json?.playerByGameStats?.awayTeam;

  const skaters = extractSkaters(side);

  for (const p of skaters) {
    const playerId = toNumber(p?.playerId ?? p?.id);
    if (playerId == null) continue;

    const name = safeName(p);

    const goals = toNumber(p?.goals) ?? 0;
    const assists = toNumber(p?.assists) ?? 0;
    const shots = toNumber(p?.shots) ?? toNumber(p?.sog) ?? 0; // sog fallback

    const existing = agg.get(playerId);
    if (!existing) {
      agg.set(playerId, { playerId, name, goals, assists, shots });
    } else {
      existing.goals += goals;
      existing.assists += assists;
      existing.shots += shots;
    }
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const team = (url.searchParams.get("team") || "").trim().toUpperCase();
  const seasonId = toNumber(url.searchParams.get("season")) ?? inferCurrentSeasonIdFromToday();

  if (!team) {
    return NextResponse.json({ error: "Missing query param ?team=TOR" }, { status: 400 });
  }

  try {
    const gameIds = await getLast5GameIds(team, seasonId);

    const agg = new Map<number, PlayerAgg>();
    for (const id of gameIds) {
      await addGameToAgg(team, id, agg);
    }

    const goalsLeader = pickBest(agg, "goals");
    const pointsLeader = pickBest(agg, "points");
    const shotsLeader = pickBest(agg, "shots");

    return NextResponse.json({
      team,
      seasonId,
      gameIds,
      debug: { playersAggregated: agg.size },
      leaders: {
        goals: goalsLeader,
        points: pointsLeader,
        shots: shotsLeader,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
