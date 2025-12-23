import { NextResponse } from "next/server";

type ScheduleGame = {
  id: number;
  gameType: number;
  homeTeam: { abbrev: string };
  awayTeam: { abbrev: string };
};

type ClubScheduleSeason = {
  previousSeason: number;
  currentSeason: number;
  games: ScheduleGame[];
};

type Skater = {
  playerId: number;
  name: { default: string } | string;
  goals?: number;
  points?: number;
  sog?: number;
};

type Boxscore = {
  playerByGameStats: {
    homeTeam: { forwards: Skater[]; defense: Skater[] };
    awayTeam: { forwards: Skater[]; defense: Skater[] };
  };
  homeTeam?: { abbrev?: string };
  awayTeam?: { abbrev?: string };
};

type Agg = { playerId: number; name: string; goals: number; points: number; sog: number };

const REVALIDATE = 3600;
const CONCURRENCY = 5;

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { next: { revalidate: REVALIDATE } });
  if (!r.ok) throw new Error(`Fetch ${r.status} ${r.statusText}: ${url}`);
  return (await r.json()) as T;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function nameOf(n: Skater["name"]) {
  return typeof n === "string" ? n : (n?.default ?? "");
}

function add(agg: Map<number, Agg>, p: Skater) {
  const id = Number(p.playerId);
  if (!Number.isFinite(id)) return;

  const row = agg.get(id) ?? { playerId: id, name: nameOf(p.name), goals: 0, points: 0, sog: 0 };
  row.goals += Number(p.goals ?? 0) || 0;
  row.points += Number(p.points ?? 0) || 0;
  row.sog += Number(p.sog ?? 0) || 0;
  agg.set(id, row);
}

function topBy(list: Agg[], key: keyof Pick<Agg, "goals" | "points" | "sog">): Agg | null {
  if (!list.length) return null;
  return list.reduce((best, cur) => (cur[key] > best[key] ? cur : best), list[0]);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const team = (searchParams.get("team") || "").trim().toUpperCase();
    const opp = (searchParams.get("opp") || "").trim().toUpperCase();
    if (!team || !opp) {
      return NextResponse.json({ error: "Need ?team=TOR&opp=BOS" }, { status: 400 });
    }

    const teamLower = team.toLowerCase();

    // 1) Discover current + previous season using ANY season request (use your current default)
    const seedSeason = 20252026;
    const seed = await fetchJson<ClubScheduleSeason>(
      `https://api-web.nhle.com/v1/club-schedule-season/${teamLower}/${seedSeason}`
    );

    const seasons = [seed.currentSeason, seed.previousSeason];

    // 2) Collect matchup gameIds across those two seasons (REG SEASON only gameType=2)
    const perSeason: { season: number; gameIds: number[] }[] = [];

    for (const season of seasons) {
      const sched = await fetchJson<ClubScheduleSeason>(
        `https://api-web.nhle.com/v1/club-schedule-season/${teamLower}/${season}`
      );

      const gameIds =
        (sched.games ?? [])
          .filter((g) => {
            if (g.gameType !== 2) return false; // reg season only
            const ht = (g.homeTeam?.abbrev || "").toUpperCase();
            const at = (g.awayTeam?.abbrev || "").toUpperCase();
            return (ht === team && at === opp) || (ht === opp && at === team);
          })
          .map((g) => g.id)
          .filter((id) => Number.isFinite(id)) ?? [];

      perSeason.push({ season, gameIds });
    }

    const gameIds = Array.from(new Set(perSeason.flatMap((x) => x.gameIds)));

    // 3) Aggregate stats separately for each team
    const aggTeam = new Map<number, Agg>();
    const aggOpp = new Map<number, Agg>();

    await mapLimit(gameIds, CONCURRENCY, async (gameId) => {
      const box = await fetchJson<Boxscore>(`https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`);

      const homeAbbrev = (box.homeTeam?.abbrev || "").toUpperCase();
      const awayAbbrev = (box.awayTeam?.abbrev || "").toUpperCase();

      const homeSkaters = [
        ...(box.playerByGameStats?.homeTeam?.forwards ?? []),
        ...(box.playerByGameStats?.homeTeam?.defense ?? []),
      ];
      const awaySkaters = [
        ...(box.playerByGameStats?.awayTeam?.forwards ?? []),
        ...(box.playerByGameStats?.awayTeam?.defense ?? []),
      ];

      const isHomeTeam = homeAbbrev === team;
      const homeAgg = isHomeTeam ? aggTeam : aggOpp;
      const awayAgg = isHomeTeam ? aggOpp : aggTeam;

      for (const p of homeSkaters) add(homeAgg, p);
      for (const p of awaySkaters) add(awayAgg, p);

      return true;
    });

    const teamList = Array.from(aggTeam.values());
    const oppList = Array.from(aggOpp.values());

    return NextResponse.json({
      team,
      opp,
      seasons,
      perSeason,
      gamesFound: gameIds.length,

      leaders: {
        [team]: {
          topGoals: topBy(teamList, "goals"),
          topPoints: topBy(teamList, "points"),
          topSog: topBy(teamList, "sog"),
        },
        [opp]: {
          topGoals: topBy(oppList, "goals"),
          topPoints: topBy(oppList, "points"),
          topSog: topBy(oppList, "sog"),
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
