import { NextResponse } from "next/server";

export const revalidate = 60;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Basic YYYY-MM-DD validation for as_of filtering
function isISODate(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Default as_of value when the client does not provide one
function todayISO_UTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// NHL season id format used by api-web.nhle.com is like: 20252026
function seasonIdForDateISO(dateISO: string) {
  const y = Number(dateISO.slice(0, 4));
  const m = Number(dateISO.slice(5, 7));
  const startYear = m >= 9 ? y : y - 1; // Sep+ is new season
  return `${startYear}${startYear + 1}`;
}

// Fetch JSON with no-store caching and a useful error on failure
async function fetchJson(url: string) {
  const r = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      "user-agent": "leafs-edge/1.0",
    },
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Fetch failed ${r.status} ${url} :: ${t.slice(0, 300)}`);
  }
  return r.json();
}

// Aggregated stat line across the sampled games
type Leader = {
  name: string;
  goals: number;
  points: number;
  shots: number;
  playerId?: number;
};

// Pick the best leader by a single stat key
function pickLeader(map: Map<string, Leader>, key: "goals" | "points" | "shots"): Leader | null {
  let best: Leader | null = null;
  for (const v of map.values()) {
    if (!best) best = v;
    else if (v[key] > best[key]) best = v;
  }
  return best;
}

// Normalize name fields across slightly different payload shapes
function safeName(p: any): string | null {
  const a = p?.name?.default;
  if (typeof a === "string" && a.trim()) return a.trim();

  const b = p?.name;
  if (typeof b === "string" && b.trim()) return b.trim();

  const fn = p?.firstName;
  const ln = p?.lastName;
  if (typeof fn === "string" && typeof ln === "string" && (fn.trim() || ln.trim())) {
    return `${fn}`.trim() + (ln ? ` ${ln}` : "");
  }

  return null;
}

// GET /api/hotLast5?team=TOR&as_of=YYYY-MM-DD
// Returns leaders for goals, points, and shots over the last 5 completed games
export async function GET(req: Request) {
  const url = new URL(req.url);
  const team = (url.searchParams.get("team") || "").trim().toUpperCase();
  const asOfParam = url.searchParams.get("as_of");
  const asOf = isISODate(asOfParam) ? asOfParam : todayISO_UTC();

  // Validate required query param
  if (!team) {
    return NextResponse.json({ error: "Missing query param ?team=TOR" }, { status: 400 });
  }

  try {
    const seasonId = seasonIdForDateISO(asOf);

    // URL #1: schedule
    const scheduleUrl = `https://api-web.nhle.com/v1/club-schedule-season/${team}/${seasonId}`;
    const sched = await fetchJson(scheduleUrl);

    const games: any[] =
      (Array.isArray(sched?.games) ? sched.games : null) ??
      (Array.isArray(sched?.gameWeek) ? sched.gameWeek.flatMap((w: any) => w?.games ?? []) : null) ??
      [];

    // Filter to last 5 completed regular-season games up to asOf
    const completed = games
      .filter((g) => {
        const d = (g?.gameDate || g?.startTimeUTC || "").toString().slice(0, 10);

        const type = g?.gameType ?? g?.gameTypeId ?? g?.gameTypeCode;
        const isReg =
          type === 2 || type === "R" || type === "02" || type === "REGULAR" || type === "REG";

        const stateRaw = (g?.gameState ?? g?.gameStatus ?? g?.gameOutcome?.lastPeriodType ?? "")
          .toString()
          .toUpperCase();
        const isDone =
          stateRaw.includes("FINAL") ||
          stateRaw.includes("OFF") ||
          stateRaw.includes("COMPLETED") ||
          g?.gameStateId === 7;

        return !!d && d <= asOf && isReg && isDone;
      })
      .sort((a, b) => {
        const da = (a?.gameDate || a?.startTimeUTC || "").toString().slice(0, 10);
        const db = (b?.gameDate || b?.startTimeUTC || "").toString().slice(0, 10);
        if (da !== db) return db.localeCompare(da);

        const ga = Number(a?.gameId ?? a?.id ?? 0);
        const gb = Number(b?.gameId ?? b?.id ?? 0);
        return gb - ga;
      })
      .slice(0, 5);

    // Extract game ids so we can pull boxscores
    const gameIds = completed
      .map((g) => Number(g?.gameId ?? g?.id))
      .filter((n) => Number.isFinite(n));

    const boxUrls = gameIds.map((id) => `https://api-web.nhle.com/v1/gamecenter/${id}/boxscore`);

    // Keep response shape stable when there are no completed games yet
    if (gameIds.length === 0) {
      return NextResponse.json({
        ok: true,
        team,
        seasonId,
        gameIds: [],
        leaders: { goals: null, points: null, shots: null },
        debug: { asOf, scheduleUrl, boxUrls, note: "No completed regular-season games up to asOf." },
      });
    }

    // Aggregate per-player totals across the sampled games
    const agg = new Map<string, Leader>();

    for (const gameId of gameIds) {

      // URL #2: boxscore
      const boxUrl = `https://api-web.nhle.com/v1/gamecenter/${gameId}/boxscore`;
      const box = await fetchJson(boxUrl);

      const homeAbbrev = box?.homeTeam?.abbrev;
      const awayAbbrev = box?.awayTeam?.abbrev;

      // playerByGameStats is keyed by awayTeam/homeTeam
      const sideKey = team === homeAbbrev ? "homeTeam" : team === awayAbbrev ? "awayTeam" : null;
      if (!sideKey) continue;

      const pbg = box?.playerByGameStats?.[sideKey];
      if (!pbg) continue;

      const forwards: any[] = Array.isArray(pbg?.forwards) ? pbg.forwards : [];
      const defense: any[] = Array.isArray(pbg?.defense) ? pbg.defense : [];
      const skaters = [...forwards, ...defense];

      // Sum goals, points, and shots on goal per skater name
      for (const p of skaters) {
        const name = safeName(p);
        if (!name) continue;

        const goals = Number(p?.goals ?? 0) || 0;
        const assists = Number(p?.assists ?? 0) || 0;
        const points = Number(p?.points) || (goals + assists);

        const shots = Number(p?.sog ?? p?.shotsOnGoal ?? 0) || 0;

        const playerIdNum = Number(p?.playerId);
        const playerId = Number.isFinite(playerIdNum) ? playerIdNum : undefined;

        const prev = agg.get(name);
        if (!prev) agg.set(name, { name, goals, points, shots, playerId });
        else {
          prev.goals += goals;
          prev.points += points;
          prev.shots += shots;
        }
      }
    }

    // Final leaders are chosen from aggregated totals
    const goalsLeader = pickLeader(agg, "goals");
    const pointsLeader = pickLeader(agg, "points");
    const shotsLeader = pickLeader(agg, "shots");

    return NextResponse.json({
      ok: true,
      team,
      seasonId,
      gameIds,
      leaders: {
        goals: goalsLeader,
        points: pointsLeader,
        shots: shotsLeader,
      },
      debug: {
        asOf,
        scheduleUrl,
        boxUrls,
        playersCounted: agg.size,
      },
    });
  } catch (err: any) {

    // Upstream NHL failures or unexpected parsing errors
    return NextResponse.json(
      { error: "hotLast5 nhl api error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
