import { NextResponse } from "next/server";

// Pulls game ids from schedule for the last 2 seasons, then uses boxscores to compute
// Records (W-L-OTL), average shots on goal, and simple leaders (goals, points, SOG)
// [ matchup history ^ ]

type ScheduleGame = {
  id: number;
  gameType: number;
  gameState?: string; // filter FUT without boxscore
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
  homeTeam?: { abbrev?: string; score?: number; sog?: number };
  awayTeam?: { abbrev?: string; score?: number; sog?: number };
  periodDescriptor?: { number?: number; periodType?: string; maxRegulationPeriods?: number };
  gameOutcome?: { lastPeriodType?: string; otPeriods?: number };
};

type Agg = { playerId: number; name: string; goals: number; points: number; sog: number };

type Record = { w: number; l: number; otl: number };

// Cache for 24h
const REVALIDATE = 86400;
const CONCURRENCY = 5;

// Minimal JSON fetch helper with a consistent cache policy
async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { next: { revalidate: REVALIDATE } });
  if (!r.ok) throw new Error(`Fetch ${r.status} ${r.statusText}: ${url}`);
  return (await r.json()) as T;
}

// Run async work with a concurrency limit while preserving input ordering
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

// Normalize skater name field across payload shapes
function nameOf(n: Skater["name"]) {
  return typeof n === "string" ? n : (n?.default ?? "");
}

// Safe number coercion for stats fields
function num(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

// Add a skater game line into the running aggregate keyed by playerId
function add(agg: Map<number, Agg>, p: Skater) {
  const id = Number(p.playerId);
  if (!Number.isFinite(id)) return;

  const row = agg.get(id) ?? {
    playerId: id,
    name: nameOf(p.name),
    goals: 0,
    points: 0,
    sog: 0,
  };

  row.goals += num(p.goals);

  // Robust points: prefer points, else goals+assists
  const pts = num((p as any).points);
  row.points += pts || (num((p as any).goals) + num((p as any).assists));

  row.sog += num(p.sog);
  agg.set(id, row);
}

// Pick a single leader from an aggregated list by stat key
function topBy(list: Agg[], key: keyof Pick<Agg, "goals" | "points" | "sog">): Agg | null {
  if (!list.length) return null;
  return list.reduce((best, cur) => (cur[key] > best[key] ? cur : best), list[0]);
}

// Create a fresh W-L-OTL record object
function newRec(): Record {
  return { w: 0, l: 0, otl: 0 };
}

// Identify whether a game ended in OT or shootout
function isOtlGame(box: Boxscore): boolean {
  const last = (box.gameOutcome?.lastPeriodType ?? "").toUpperCase();
  if (last === "OT" || last === "SO") return true;

  const pd = (box.periodDescriptor?.periodType ?? "").toUpperCase();
  if (pd === "OT" || pd === "SO") return true;

  return false;
}

// GET /api/matchup/history?team=TOR&opp=BOS
// Computes 2-season matchup aggregates using schedule ids + boxscore stats
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const team = (searchParams.get("team") || "").trim().toUpperCase();
    const opp = (searchParams.get("opp") || "").trim().toUpperCase();

    // Validate required params
    if (!team || !opp) {
      return NextResponse.json({ error: "Need ?team=TOR&opp=BOS" }, { status: 400 });
    }

    const teamLower = team.toLowerCase();

    // Seed schedule just to learn current + previous seasons for this team
    const seedSeason = 20252026;
    const seed = await fetchJson<ClubScheduleSeason>(
      `https://api-web.nhle.com/v1/club-schedule-season/${teamLower}/${seedSeason}`
    );

    // Last 2 seasons only
    const seasons = [seed.currentSeason, seed.previousSeason];

    // Track home/away mapping per gameId so boxscore stats can be assigned correctly
    const isTeamHomeByGameId = new Map<number, boolean>();

    const perSeason: { season: number; gameIds: number[] }[] = [];

    // Gather matchup game ids per season from schedule
    for (const season of seasons) {
      const sched = await fetchJson<ClubScheduleSeason>(
        `https://api-web.nhle.com/v1/club-schedule-season/${teamLower}/${season}`
      );

      const gameIds =
        (sched.games ?? [])
          .filter((g) => {
            // Regular season only
            if (g.gameType !== 2) return false;

            // Skip future games before boxscore fetch
            if (g.gameState === "FUT") return false;

            const ht = (g.homeTeam?.abbrev || "").toUpperCase();
            const at = (g.awayTeam?.abbrev || "").toUpperCase();
            const ok = (ht === team && at === opp) || (ht === opp && at === team);

            // Store whether team is home for this gameId for later stat assignment
            if (ok && Number.isFinite(g.id)) {
              isTeamHomeByGameId.set(g.id, ht === team);
            }

            return ok;
          })
          .map((g) => g.id)
          .filter((id) => Number.isFinite(id)) ?? [];

      perSeason.push({ season, gameIds });
    }

    // De-dupe across seasons just in case
    const gameIds = Array.from(new Set(perSeason.flatMap((x) => x.gameIds)));

    // Empty state when no matchup games were found
    if (!gameIds.length) {
      return NextResponse.json({
        team,
        opp,
        seasons,
        perSeason,
        perSeasonPlayed: perSeason.map((x) => ({ season: x.season, gameIds: [] })),
        gamesFound: 0,
        records: {
          [team]: newRec(),
          [opp]: newRec(),
        },
        avgShotsOnGoal: {
          [team]: null,
          [opp]: null,
        },
        leaders: {
          [team]: { topGoals: null, topPoints: null, topSog: null },
          [opp]: { topGoals: null, topPoints: null, topSog: null },
        },
      });
    }

    // Aggregates split by side so leaders can be reported per team
    const aggTeam = new Map<number, Agg>();
    const aggOpp = new Map<number, Agg>();

    // Records computed from boxscore scorelines and OT detection
    const recTeam = newRec();
    const recOpp = newRec();

    // Running totals for average SOG per game
    let sogTeamTotal = 0;
    let sogOppTotal = 0;

    // Track which scheduled gameIds had playable boxscore stats
    const playedGameIds: number[] = [];
    const playedSet = new Set<number>();

    // Fetch boxscores with a concurrency limit to avoid hammering the NHL endpoint
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

      // Skip unplayed or incomplete games
      if (homeSkaters.length === 0 && awaySkaters.length === 0) return true;

      playedGameIds.push(gameId);
      playedSet.add(gameId);

      // Home/away mapping comes from schedule, not boxscore
      const isTeamHome = isTeamHomeByGameId.get(gameId);
      if (typeof isTeamHome !== "boolean") return true;

      // Assign skater lines to the correct aggregate based on home/away
      const homeAgg = isTeamHome ? aggTeam : aggOpp;
      const awayAgg = isTeamHome ? aggOpp : aggTeam;

      for (const p of homeSkaters) add(homeAgg, p);
      for (const p of awaySkaters) add(awayAgg, p);

      // Record logic uses scoreline plus OT detection for OTL vs regulation loss
      const homeScore = Number((box as any)?.homeTeam?.score);
      const awayScore = Number((box as any)?.awayTeam?.score);

      if (Number.isFinite(homeScore) && Number.isFinite(awayScore) && homeScore !== awayScore) {
        const teamScore = isTeamHome ? homeScore : awayScore;
        const oppScore = isTeamHome ? awayScore : homeScore;

        const teamWon = teamScore > oppScore;
        const otl = isOtlGame(box);

        if (teamWon) {
          recTeam.w += 1;
          if (otl) recOpp.otl += 1;
          else recOpp.l += 1;
        } else {
          recOpp.w += 1;
          if (otl) recTeam.otl += 1;
          else recTeam.l += 1;
        }
      }

      // Average SOG uses the team-aligned home/away mapping
      const homeSog = Number((box as any)?.homeTeam?.sog);
      const awaySog = Number((box as any)?.awayTeam?.sog);

      if (Number.isFinite(homeSog) && Number.isFinite(awaySog)) {
        const teamSog = isTeamHome ? homeSog : awaySog;
        const oppSog = isTeamHome ? awaySog : homeSog;

        sogTeamTotal += teamSog;
        sogOppTotal += oppSog;
      }

      return true;
    });

    // Convert aggregates to arrays for leader selection
    const teamList = Array.from(aggTeam.values());
    const oppList = Array.from(aggOpp.values());

    // Per-season ids restricted to games that had usable boxscore data
    const perSeasonPlayed = perSeason.map((x) => ({
      season: x.season,
      gameIds: x.gameIds.filter((id) => playedSet.has(id)),
    }));

    const gamesFound = playedGameIds.length;

    return NextResponse.json({
      team,
      opp,
      seasons,
      perSeason,
      perSeasonPlayed,
      gamesFound,

      records: {
        [team]: recTeam,
        [opp]: recOpp,
      },

      avgShotsOnGoal: {
        [team]: gamesFound ? +(sogTeamTotal / gamesFound).toFixed(2) : null,
        [opp]: gamesFound ? +(sogOppTotal / gamesFound).toFixed(2) : null,
      },

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
    // Catch-all so the client always gets JSON
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
