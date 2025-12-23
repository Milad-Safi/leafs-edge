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
  return Number(`${startYear}${startYear + 1}`);
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
  sog: number;
};

function pickBest(map: Map<number, PlayerAgg>, key: "goals" | "shots" | "points"): Leader | null {
  const arr: Leader[] = Array.from(map.values()).map((p) => ({
    playerId: p.playerId,
    name: p.name,
    goals: p.goals,
    assists: p.assists,
    points: p.goals + p.assists,
    shots: p.sog,
  }));

  if (!arr.length) return null;

  arr.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (vb !== va) return vb - va;
    if (b.points !== a.points) return b.points - a.points;
    if (b.goals !== a.goals) return b.goals - a.goals;
    return b.shots - a.shots;
  });

  return arr[0];
}

async function getLast5CompletedGameIds(team: string, seasonId: number): Promise<number[]> {
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
    })
    .slice(-5);

  return completed
    .map((g) => toNumber(g?.id))
    .filter((n): n is number => n != null);
}

function skatersForTeamFromBoxscore(box: any, team: string) {
  const homeAbbrev = String(box?.homeTeam?.abbrev ?? "").toUpperCase();
  const awayAbbrev = String(box?.awayTeam?.abbrev ?? "").toUpperCase();

  const isHome = homeAbbrev === team;
  const isAway = awayAbbrev === team;
  if (!isHome && !isAway) return [];

  const side = isHome ? box?.playerByGameStats?.homeTeam : box?.playerByGameStats?.awayTeam;

  const forwards: any[] = Array.isArray(side?.forwards) ? side.forwards : [];
  const defense: any[] = Array.isArray(side?.defense) ? side.defense : [];

  return [...forwards, ...defense];
}

async function addGameToAgg(team: string, gameId: number, agg: Map<number, PlayerAgg>) {
  const url = `https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`;
  const res = await fetch(url, {
    next: { revalidate: 60 * 10 },
    headers: { "User-Agent": "leafs-edge" },
  });
  if (!res.ok) return;

  const box: any = await res.json();
  const skaters = skatersForTeamFromBoxscore(box, team);

  for (const p of skaters) {
    const playerId = toNumber(p?.playerId);
    if (playerId == null) continue;

    const name =
      (typeof p?.name?.default === "string" && p.name.default.trim()) ? p.name.default.trim() : "Unknown";

    const goals = toNumber(p?.goals) ?? 0;
    const assists = toNumber(p?.assists) ?? 0;
    const sog = toNumber(p?.sog) ?? 0;

    const existing = agg.get(playerId);
    if (!existing) {
      agg.set(playerId, { playerId, name, goals, assists, sog });
    } else {
      existing.goals += goals;
      existing.assists += assists;
      existing.sog += sog;
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
    const gameIds = await getLast5CompletedGameIds(team, seasonId);

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
