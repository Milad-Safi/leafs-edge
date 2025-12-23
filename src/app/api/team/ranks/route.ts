import { NextResponse } from "next/server";
import { toNum } from "@/lib/nhl/parse";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const team = (searchParams.get("team") ?? "").toUpperCase();

  if (!team) {
    return NextResponse.json({ error: "Missing ?team=TOR" }, { status: 400 });
  }

  try {
    const url = `https://api-web.nhle.com/v1/club-stats/${team}/20252026/2`;
    const res = await fetch(url, { next: { revalidate: 60 * 10 } });
    if (!res.ok) {
      return NextResponse.json({ error: `NHL API ${res.status}` }, { status: 502 });
    }

    const data = await res.json();

    const teamStats = data?.teamStats ?? data;

    const ranks = {
      goalsForPerGameRank: toNum(teamStats?.goalsForPerGameRank),
      goalsAgainstPerGameRank: toNum(teamStats?.goalsAgainstPerGameRank),
      shotsForPerGameRank: toNum(teamStats?.shotsForPerGameRank),
      shotsAgainstPerGameRank: toNum(teamStats?.shotsAgainstPerGameRank),
      powerPlayPctRank: toNum(teamStats?.powerPlayPctRank),
      penaltyKillPctRank: toNum(teamStats?.penaltyKillPctRank),
    };

    return NextResponse.json({ team, ranks });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Fetch failed" }, { status: 500 });
  }
}
