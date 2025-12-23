import { NextResponse } from "next/server";
import { cleanStr, toNum } from "@/lib/nhl/parse";

export const runtime = "nodejs";

const INJURY_SOURCE =
  "https://datacrunch.9c9media.ca/statsapi/sports/hockey/leagues/nhl/playerInjuries?type=json";

type InjuryOut = {
  playerId: number | null;
  player: string;
  pos: string | null;
  status: string | null;
  date: string | null;
  description: string | null;
  headshot: string | null;
};

type TeamInjuryReport = {
  team: string;
  teamName: string | null;
  teamSeo: string | null;
  source: string;
  lastUpdated: string;
  injuries: InjuryOut[];
  error?: string;
};

async function fetchRosterHeadshots(team: string): Promise<{
  byId: Map<number, string>;
  byName: Map<string, string>;
}> {
  const url = `https://api-web.nhle.com/v1/roster/${team}/current`;

  const res = await fetch(url, {
    next: { revalidate: 86400 },
    headers: { accept: "application/json" },
  });

  const byId = new Map<number, string>();
  const byName = new Map<string, string>();

  if (!res.ok) return { byId, byName };

  const data = await res.json();
  const players = [
    ...(data?.forwards ?? []),
    ...(data?.defensemen ?? []),
    ...(data?.goalies ?? []),
  ];

  for (const p of players) {
    const id = toNum(p?.id);
    const headshot = cleanStr(p?.headshot);
    const first = cleanStr(p?.firstName?.default);
    const last = cleanStr(p?.lastName?.default);

    if (!headshot || !first || !last) continue;

    const nameKey = `${first} ${last}`.toLowerCase();

    if (id !== null) byId.set(id, headshot);
    byName.set(nameKey, headshot);
  }

  return { byId, byName };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const team = (searchParams.get("team") ?? "").toUpperCase();

  if (!team) {
    return NextResponse.json({ error: "Missing ?team=TOR" }, { status: 400 });
  }

  try {
    const [injRes, roster] = await Promise.all([
      fetch(INJURY_SOURCE, {
        next: { revalidate: 86400 },
        headers: {
          "user-agent": "Mozilla/5.0 (leafs-edge)",
          accept: "application/json,text/plain,*/*",
        },
      }),
      fetchRosterHeadshots(team),
    ]);

    if (!injRes.ok) {
      return NextResponse.json(
        {
          team,
          teamName: null,
          teamSeo: null,
          source: INJURY_SOURCE,
          lastUpdated: new Date().toISOString(),
          injuries: [],
          error: `Injury source HTTP ${injRes.status}`,
        },
        { status: 502 }
      );
    }

    const data = await injRes.json();
    const blocks: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : [];

    const block = blocks.find(
      (b) => cleanStr(b?.competitor?.shortName)?.toUpperCase() === team
    );

    if (!block) {
      return NextResponse.json({
        team,
        teamName: null,
        teamSeo: null,
        source: INJURY_SOURCE,
        lastUpdated: new Date().toISOString(),
        injuries: [],
      });
    }

    const injuries: InjuryOut[] = (block?.playerInjuries ?? []).map((pi: any) => {
      const pid = toNum(pi?.player?.playerId);
      const name = cleanStr(pi?.player?.displayName) ?? "Unknown";
      const nameKey = name.toLowerCase();

      return {
        playerId: pid,
        player: name,
        pos: cleanStr(pi?.player?.positionShort),
        status: cleanStr(pi?.status),
        date: cleanStr(pi?.date),
        description: cleanStr(pi?.description),
        headshot: (pid !== null && roster.byId.get(pid)) || roster.byName.get(nameKey) || null,
      };
    });

    const payload: TeamInjuryReport = {
      team,
      teamName: cleanStr(block?.competitor?.name),
      teamSeo: cleanStr(block?.competitor?.seoIdentifier),
      source: INJURY_SOURCE,
      lastUpdated: new Date().toISOString(),
      injuries,
    };

    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json(
      {
        team,
        teamName: null,
        teamSeo: null,
        source: INJURY_SOURCE,
        lastUpdated: new Date().toISOString(),
        injuries: [],
        error: e?.message ?? "Fetch failed",
      },
      { status: 500 }
    );
  }
}
