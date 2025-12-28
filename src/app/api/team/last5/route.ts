import { NextResponse } from "next/server";

export const revalidate = 60;

type TeamAbbrev = string;

function normalizeTeam(input: string): TeamAbbrev {
  return input.trim().toUpperCase();
}

function num(n: unknown, fallback = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function pct100(goals: number, opps: number): number | null {
  if (!opps || opps <= 0) return null;
  return +((goals / opps) * 100).toFixed(1);
}

function isISODate(s: string | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function todayISO_UTC(): string {
  // good enough for “as_of”; you can pass as_of=YYYY-MM-DD if you want exact cutoffs
  return new Date().toISOString().slice(0, 10);
}

const NHL_BASE = "https://api-web.nhle.com";

async function fetchNhlJson(url: string, signal?: AbortSignal) {
  const r = await fetch(url, {
    signal,
    // keep Next caching behavior consistent:
    next: { revalidate },
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`NHL fetch failed ${r.status}: ${t.slice(0, 300)}`);
  }
  return r.json();
}

// Parse strings like "1/4"
function parseRatio(s: unknown): { goals: number; opps: number } | null {
  if (typeof s !== "string") return null;
  const m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  return { goals: Number(m[1]), opps: Number(m[2]) };
}

// Try hard to extract PP conversion from various possible boxscore shapes.
// We keep it defensive because NHL JSON fields can shift.
function extractPP(box: any, side: "home" | "away"): { goals: number; opps: number } | null {
  const candidates: unknown[] = [
    box?.summary?.teamGameStats?.[`${side}Team`]?.powerPlayConversion,
    box?.summary?.teamGameStats?.[side]?.powerPlayConversion,
    box?.teamGameStats?.[`${side}Team`]?.powerPlayConversion,
    box?.teamGameStats?.[side]?.powerPlayConversion,
    box?.gameStats?.[`${side}Team`]?.powerPlayConversion,
    box?.gameStats?.[side]?.powerPlayConversion,
  ];

  for (const c of candidates) {
    const parsed = parseRatio(c);
    if (parsed) return parsed;
  }

  // Another common pattern is explicit numbers:
  const goals =
    box?.summary?.teamGameStats?.[`${side}Team`]?.powerPlayGoals ??
    box?.teamGameStats?.[`${side}Team`]?.powerPlayGoals ??
    box?.[`${side}Team`]?.powerPlayGoals;

  const opps =
    box?.summary?.teamGameStats?.[`${side}Team`]?.powerPlayOpportunities ??
    box?.teamGameStats?.[`${side}Team`]?.powerPlayOpportunities ??
    box?.[`${side}Team`]?.powerPlayOpportunities;

  if (typeof goals === "number" && typeof opps === "number") {
    return { goals, opps };
  }

  return null;
}

function finishedGame(g: any): boolean {
  // In the schedule payload, future games are "FUT".
  // Finished games typically show "OFF" or similar.
  return typeof g?.gameState === "string" && g.gameState !== "FUT";
}

function regularSeasonGame(g: any): boolean {
  // gameType 2 == regular season in NHL gamecenter payloads
  return num(g?.gameType) === 2;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const team = normalizeTeam(url.searchParams.get("team") || "");
  const asOfParam = url.searchParams.get("as_of");
  const asOf = isISODate(asOfParam) ? asOfParam : todayISO_UTC();

  if (!team) {
    return NextResponse.json({ error: "Missing ?team=TOR" }, { status: 400 });
  }

  try {
    // Walk backwards week-by-week until we collect 5 finished games (regular season).
    const gameIds: number[] = [];
    const seen = new Set<number>();

    let cursorDate = asOf;
    let guard = 0;

    while (gameIds.length < 5 && guard < 12) {
      guard++;

      const weekUrl = `${NHL_BASE}/v1/club-schedule/${team}/week/${cursorDate}`;
      const week = await fetchNhlJson(weekUrl);

      const games: any[] = Array.isArray(week?.games) ? week.games : [];

      // Filter finished + regular season + <= asOf
      const finished = games
        .filter((g) => finishedGame(g) && regularSeasonGame(g))
        .filter((g) => typeof g?.gameDate === "string" && g.gameDate <= asOf)
        .sort((a, b) => {
          // newest first
          if (a.gameDate !== b.gameDate) return b.gameDate.localeCompare(a.gameDate);
          return num(b.id) - num(a.id);
        });

      for (const g of finished) {
        const id = num(g?.id);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        gameIds.push(id);
        if (gameIds.length >= 5) break;
      }

      const prev = week?.previousStartDate;
      if (!prev || typeof prev !== "string") break;
      cursorDate = prev;
    }

    if (gameIds.length === 0) {
      return NextResponse.json(
        {
          team,
          games: 0,
          record: { w: 0, l: 0, otl: 0 },
          goalsForPerGame: null,
          goalsAgainstPerGame: null,
          shotsForPerGame: null,
          shotsAgainstPerGame: null,
          powerPlay: { goals: 0, opps: 0, pct: null },
          penaltyKill: { oppPPGoals: 0, oppPPOpps: 0, pct: null },
          gameIds: [],
          skippedPPGames: [],
          note: "Computed from NHL schedule + boxscore.",
        },
        { status: 200 }
      );
    }

    // Fetch boxscores for the last 5 game IDs
    const picked = gameIds.slice(0, 5);

    const boxscores = await Promise.all(
      picked.map((id) => fetchNhlJson(`${NHL_BASE}/v1/gamecenter/${id}/boxscore`))
    );

    let games = 0;
    let w = 0;
    let l = 0;
    let otl = 0;

    let gf = 0;
    let ga = 0;
    let sf = 0;
    let sa = 0;

    let ppGoals = 0;
    let ppOpps = 0;

    let oppPPGoals = 0;
    let oppPPOpps = 0;

    for (const box of boxscores) {
      const awayAbbrev = String(box?.awayTeam?.abbrev || "").toUpperCase();
      const homeAbbrev = String(box?.homeTeam?.abbrev || "").toUpperCase();

      const isAway = awayAbbrev === team;
      const isHome = homeAbbrev === team;
      if (!isAway && !isHome) continue;

      const my = isAway ? box?.awayTeam : box?.homeTeam;
      const opp = isAway ? box?.homeTeam : box?.awayTeam;

      const myGoals = num(my?.score);
      const oppGoals = num(opp?.score);

      const myShots = num(my?.sog);
      const oppShots = num(opp?.sog);

      gf += myGoals;
      ga += oppGoals;
      sf += myShots;
      sa += oppShots;

      games++;

      const won = myGoals > oppGoals;
      if (won) w++;
      else l++;

      // OTL detection: if you lost and the game went beyond regulation.
      // In boxscore, periodDescriptor.periodType may be "OT" or "SO".
      const pType = String(box?.periodDescriptor?.periodType || "").toUpperCase();
      const wentExtra = pType === "OT" || pType === "SO";
      if (!won && wentExtra) otl++;

      const mySide: "home" | "away" = isAway ? "away" : "home";
      const oppSide: "home" | "away" = isAway ? "home" : "away";

      const myPP = extractPP(box, mySide);
      if (myPP) {
        ppGoals += myPP.goals;
        ppOpps += myPP.opps;
      }

      const oppPP = extractPP(box, oppSide);
      if (oppPP) {
        oppPPGoals += oppPP.goals;
        oppPPOpps += oppPP.opps;
      }
    }

    if (games === 0) {
      return NextResponse.json(
        { error: "Could not match team abbrev inside boxscores", team, gameIds: picked },
        { status: 502 }
      );
    }

    const ppPct = pct100(ppGoals, ppOpps);
    const pkPct = oppPPOpps > 0 ? +(100 - (oppPPGoals / oppPPOpps) * 100).toFixed(1) : null;

    return NextResponse.json({
      team,
      games,
      record: { w, l, otl },
      goalsForPerGame: +(gf / games).toFixed(2),
      goalsAgainstPerGame: +(ga / games).toFixed(2),
      shotsForPerGame: +(sf / games).toFixed(2),
      shotsAgainstPerGame: +(sa / games).toFixed(2),
      powerPlay: { goals: ppGoals, opps: ppOpps, pct: ppPct },
      penaltyKill: { oppPPGoals, oppPPOpps, pct: pkPct },
      gameIds: picked,
      skippedPPGames: [],
      note: "Computed from NHL /club-schedule week + /gamecenter boxscore (no backend).",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "NHL proxy error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
