import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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
  return new Date().toISOString().slice(0, 10);
}

const SEASON_START = "2025-10-05";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const team = normalizeTeam(url.searchParams.get("team") || "");
  const asOfParam = url.searchParams.get("as_of");
  const asOf = isISODate(asOfParam) ? asOfParam : todayISO_UTC();

  if (!team) {
    return NextResponse.json({ error: "Missing ?team=TOR" }, { status: 400 });
  }

  try {
    const r = await query<{
      game_id: string | number;
      game_date: string;
      goals_for: number;
      goals_against: number;
      shots_for: number;
      shots_against: number;
      pp_goals: number | null;
      pp_opps: number | null;
      pk_goals_against: number | null;
      pk_opps: number | null;
      win: boolean | null;
    }>(
      `
      SELECT
        tg.game_id,
        tg.game_date,
        tg.goals_for,
        tg.goals_against,
        tg.shots_for,
        tg.shots_against,
        COALESCE(tg.pp_goals,0) AS pp_goals,
        COALESCE(tg.pp_opps,0) AS pp_opps,
        COALESCE(tg.pk_goals_against,0) AS pk_goals_against,
        COALESCE(tg.pk_opps,0) AS pk_opps,
        tg.win
      FROM team_games tg
      WHERE tg.team = $1
        AND tg.game_date >= $2
        AND tg.game_date <= $3
        AND SUBSTRING(tg.game_id::text, 5, 2) = '02'
      ORDER BY tg.game_date DESC, tg.game_id DESC
      LIMIT 5
      `,
      [team, SEASON_START, asOf]
    );

    const rows = r.rows ?? [];

    if (rows.length === 0) {
      return NextResponse.json({
        team,
        games: 0,
        record: { w: 0, l: 0, otl: 0 },

        goalsFor: 0,
        goalsAgainst: 0,

        goalsForPerGame: 0,
        goalsAgainstPerGame: 0,
        shotsForPerGame: 0,
        shotsAgainstPerGame: 0,
        powerPlay: { goals: 0, opps: 0, pct: null },
        penaltyKill: { oppPPGoals: 0, oppPPOpps: 0, pct: null },
        gameIds: [],
        skippedPPGames: [],
        note: "Computed from Supabase team_games (no backend).",
      });
    }

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

    let pkGA = 0;
    let pkOpps = 0;

    for (const g of rows) {
      games++;

      gf += num(g.goals_for);
      ga += num(g.goals_against);
      sf += num(g.shots_for);
      sa += num(g.shots_against);

      const won = !!g.win;
      if (won) w++;
      else l++;

      ppGoals += num(g.pp_goals);
      ppOpps += num(g.pp_opps);

      pkGA += num(g.pk_goals_against);
      pkOpps += num(g.pk_opps);
    }

    const ppPct = pct100(ppGoals, ppOpps);
    const pkPct = pkOpps > 0 ? +(100 - (pkGA / pkOpps) * 100).toFixed(1) : null;

    return NextResponse.json({
      team,
      games,
      record: { w, l, otl },

      goalsFor: gf,
      goalsAgainst: ga,

      goalsForPerGame: +(gf / games).toFixed(2),
      goalsAgainstPerGame: +(ga / games).toFixed(2),
      shotsForPerGame: +(sf / games).toFixed(2),
      shotsAgainstPerGame: +(sa / games).toFixed(2),
      powerPlay: { goals: ppGoals, opps: ppOpps, pct: ppPct },
      penaltyKill: { oppPPGoals: pkGA, oppPPOpps: pkOpps, pct: pkPct },
      gameIds: rows.map((x) => Number(x.game_id)).filter((n) => Number.isFinite(n)),
      skippedPPGames: [],
      note: "Computed from Supabase team_games (no backend).",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "DB last5 error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
