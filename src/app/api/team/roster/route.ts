import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team");
  const season = searchParams.get("season");

  if (!team || !season) {
    return NextResponse.json(
      { ok: false, error: "Missing team or season" },
      { status: 400 }
    );
  }

  const url = `https://api-web.nhle.com/v1/roster/${team}/${season}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Roster fetch failed" },
      { status: 500 }
    );
  }
}
