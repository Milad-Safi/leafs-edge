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
  assists?: number;
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

function num(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function add(agg: Map<number, Agg>, p: Skater) {
  const id = Number(p.playerId);
  if (!Number.isFinite(id)) return;

  const row = agg.get(id) ?? { playerId: id, name: nameOf(p.name), goals: 0, points: 0, sog: 0 };

  row.goals += num(p.goals);

  // Robust points: prefer points, else goals+assists
  const pts = num((p as any).points);
  row.points += pts || (num((p as any).goals) + num((p as any).assists));

  row.sog += num(p.sog);
  agg.set(id, row);
}

function topBy(list: Agg[], key: keyof Pick<Agg, "goals" | "points" | "sog">): Agg | null {
  if (!list.length) return null;
  return list.reduce((best, cur) => (cur[key] > best[key] ? cur : best), list[0]);
}

/**
 * Current roster filtering (B)
 * NHL roster payload can vary; this attempts to pull playerIds from common fields.
 */
function collectRosterIds(rosterJson: any): Set<number> {
  const ids = new Set<number>();

  const visitArray = (arr: any) => {
    if (!Array.isArray(arr)) return;
    for (const p of arr) {
      const id = num(p?.playerId ?? p?.id);
      if (id) ids.add(id);
    }
  };

  // Common groups
  visitArray(rosterJson?.forwards);
  visitArray(rosterJson?.defensemen);
  visitArray(rosterJson?.goalies);

  // Nested variants
  if (rosterJson && typeof rosterJson === "object") {
    for (const k of Object.keys(rosterJson)) {
      const v = rosterJson[k];
      if (Array.isArray(v)) visitArray(v);
      if (v && typeof v === "object") {
        visitArray(v?.forwards);
        visitArray(v?.defensemen);
        visitArray(v?.goalies);
        visitArray(v?.players);
        visitArray(v?.roster);
      }
    }
  }

  return ids;
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

    // Seed schedule just to learn current + previous seasons for this team
    const seedSeason = 20252026;
    const seed = await fetchJson<ClubScheduleSeason>(
      `https://api-web.nhle.com/v1/club-schedule-season/${teamLower}/${seedSeason}`
    );

    // Requirement: last 2 seasons only
    const seasons = [seed.currentSeason, seed.previousSeason];

    // Fix A: schedule is source of truth for home/away mapping per gameId
    const isTeamHomeByGameId = new Map<number, boolean>();

    // We'll build perSeason now (raw), then later we'll also produce perSeasonPlayed
    const perSeason: { season: number; gameIds: number[] }[] = [];

    for (const season of seasons) {
      const sched = await fetchJson<ClubScheduleSeason>(
        `https://api-web.nhle.com/v1/club-schedule-season/${teamLower}/${season}`
      );

      const gameIds =
        (sched.games ?? [])
          .filter((g) => {
            // Requirement: regular season only
            if (g.gameType !== 2) return false;

            const ht = (g.homeTeam?.abbrev || "").toUpperCase();
            const at = (g.awayTeam?.abbrev || "").toUpperCase();
            const ok = (ht === team && at === opp) || (ht === opp && at === team);

            if (ok && Number.isFinite(g.id)) {
              isTeamHomeByGameId.set(g.id, ht === team);
            }

            return ok;
          })
          .map((g) => g.id)
          .filter((id) => Number.isFinite(id)) ?? [];

      perSeason.push({ season, gameIds });
    }

    const gameIds = Array.from(new Set(perSeason.flatMap((x) => x.gameIds)));

    if (!gameIds.length) {
      return NextResponse.json({
        team,
        opp,
        seasons,
        perSeason,
        perSeasonPlayed: perSeason.map((x) => ({ season: x.season, gameIds: [] })),
        gamesFound: 0,
        leaders: {
          [team]: { topGoals: null, topPoints: null, topSog: null },
          [opp]: { topGoals: null, topPoints: null, topSog: null },
        },
      });
    }

    // B: only count players currently on each team (best-effort)
    let teamRosterIds: Set<number> | null = null;
    let oppRosterIds: Set<number> | null = null;

    try {
      const [teamRosterRaw, oppRosterRaw] = await Promise.all([
        fetchJson<any>(`https://api-web.nhle.com/v1/roster/${team}/current`),
        fetchJson<any>(`https://api-web.nhle.com/v1/roster/${opp}/current`),
      ]);
      teamRosterIds = collectRosterIds(teamRosterRaw);
      oppRosterIds = collectRosterIds(oppRosterRaw);
    } catch {
      teamRosterIds = null;
      oppRosterIds = null;
    }

    const aggTeam = new Map<number, Agg>();
    const aggOpp = new Map<number, Agg>();

    // Fix: schedule includes FUTURE games. Only count games that have skater stats.
    const playedGameIds: number[] = [];
    const playedSet = new Set<number>();

    await mapLimit(gameIds, CONCURRENCY, async (gameId) => {
      const box = await fetchJson<Boxscore>(`https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`);

      const homeSkaters = [
        ...(box.playerByGameStats?.homeTeam?.forwards ?? []),
        ...(box.playerByGameStats?.homeTeam?.defense ?? []),
      ];
      const awaySkaters = [
        ...(box.playerByGameStats?.awayTeam?.forwards ?? []),
        ...(box.playerByGameStats?.awayTeam?.defense ?? []),
      ];

      // ✅ skip unplayed matchups (future schedule items)
      if (homeSkaters.length === 0 && awaySkaters.length === 0) {
        return true;
      }

      playedGameIds.push(gameId);
      playedSet.add(gameId);

      const isTeamHome = isTeamHomeByGameId.get(gameId);
      if (typeof isTeamHome !== "boolean") {
        // If mapping missing, skip to avoid corrupting totals
        return true;
      }

      const homeAgg = isTeamHome ? aggTeam : aggOpp;
      const awayAgg = isTeamHome ? aggOpp : aggTeam;

      const homeRoster = isTeamHome ? teamRosterIds : oppRosterIds;
      const awayRoster = isTeamHome ? oppRosterIds : teamRosterIds;

      for (const p of homeSkaters) {
        const pid = num(p.playerId);
        if (!homeRoster || homeRoster.has(pid)) add(homeAgg, p);
      }
      for (const p of awaySkaters) {
        const pid = num(p.playerId);
        if (!awayRoster || awayRoster.has(pid)) add(awayAgg, p);
      }

      return true;
    });

    const teamList = Array.from(aggTeam.values());
    const oppList = Array.from(aggOpp.values());

    // Helpful: per-season list of ONLY played games (so UI/tooling can use the right counts)
    const perSeasonPlayed = perSeason.map((x) => ({
      season: x.season,
      gameIds: x.gameIds.filter((id) => playedSet.has(id)),
    }));

    return NextResponse.json({
      team,
      opp,
      seasons,
      perSeason,
      perSeasonPlayed,
      gamesFound: playedGameIds.length,

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
