import { NextResponse } from "next/server";

type NHLGame = {
  id: number;
  gameDate: string; // comes from NHL, but can be off vs Toronto local date
  startTimeUTC: string;
  gameState?: string; // FUT, OFF, LIVE, etc.
  homeTeam?: { abbrev?: string; score?: number };
  awayTeam?: { abbrev?: string; score?: number };
};

function getSeasonStringForToday(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const startYear = month >= 7 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}${endYear}`;
}

/**
 * ✅ KEY FIX:
 * Convert startTimeUTC -> Toronto calendar day (YYYY-MM-DD)
 * so you NEVER rely on the feed's gameDate which can appear "1 day behind"
 */
function torontoDateISO(utcIso: string): string {
  const dt = new Date(utcIso);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dt);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";

  return `${y}-${m}-${d}`;
}

export async function GET() {
  const team = "tor";
  const season = process.env.NHL_SEASON ?? getSeasonStringForToday();

  const url = `https://api-web.nhle.com/v1/club-schedule-season/${team}/${season}`;

  const res = await fetch(url, {
    next: { revalidate: 60 * 10 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch schedule", status: res.status },
      { status: 500 }
    );
  }

  const data = await res.json();

  const games: NHLGame[] = Array.isArray(data?.games) ? data.games : [];

  const normalized = games.map((g) => {
    const torDate = torontoDateISO(g.startTimeUTC);

    return {
      id: g.id,

      // ✅ overwrite gameDate to be Toronto-correct everywhere downstream
      gameDate: torDate,

      // also expose explicitly so it’s obvious in the UI/debug
      gameDayToronto: torDate,

      startTimeUTC: g.startTimeUTC,
      gameState: g.gameState ?? "",

      homeAbbrev: g.homeTeam?.abbrev ?? "",
      awayAbbrev: g.awayTeam?.abbrev ?? "",

      homeScore: typeof g.homeTeam?.score === "number" ? g.homeTeam.score : null,
      awayScore: typeof g.awayTeam?.score === "number" ? g.awayTeam.score : null,
    };
  });

  return NextResponse.json({
    team,
    season,
    games: normalized,
  });
}
