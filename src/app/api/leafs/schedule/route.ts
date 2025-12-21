import { NextResponse } from "next/server";

type NHLGame = {
  id: number;
  gameDate: string; // "YYYY-MM-DD"
  startTimeUTC: string;
  gameState?: string; // FUT, OFF, LIVE, etc.
  homeTeam?: { abbrev?: string; score?: number };
  awayTeam?: { abbrev?: string; score?: number };
};

function getSeasonStringForToday(): string {
  // NHL seasons are like 20242025.
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-12

  // If it's July (7) or later, we're in the season starting this year.
  const startYear = month >= 7 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}${endYear}`;
}

export async function GET() {
  const team = "tor";
  const season = process.env.NHL_SEASON ?? getSeasonStringForToday();

  const url = `https://api-web.nhle.com/v1/club-schedule-season/${team}/${season}`;

  const res = await fetch(url, {
    // Cache a bit so refreshes are fast; we can tune later
    next: { revalidate: 60 * 10 },
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch schedule", status: res.status },
      { status: 500 }
    );
  }

  const data = await res.json();

  // The response shape is usually { games: [...] }.
  const games: NHLGame[] = Array.isArray(data?.games) ? data.games : [];

  const normalized = games.map((g) => ({
    id: g.id,
    gameDate: g.gameDate,
    startTimeUTC: g.startTimeUTC,
    gameState: g.gameState ?? "",
    homeAbbrev: g.homeTeam?.abbrev ?? "",
    awayAbbrev: g.awayTeam?.abbrev ?? "",
    homeScore: typeof g.homeTeam?.score === "number" ? g.homeTeam.score : null,
    awayScore: typeof g.awayTeam?.score === "number" ? g.awayTeam.score : null,
  }));

  return NextResponse.json({
    team,
    season,
    games: normalized,
  });
}
