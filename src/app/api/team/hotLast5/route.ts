import { NextResponse } from "next/server";

export const revalidate = 60;

function backendBaseUrl() {
  return process.env.NHL_BACKEND_URL || "https://leafs-edge-api.onrender.com/docs";

}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const team = (url.searchParams.get("team") || "").trim().toUpperCase();

  if (!team) {
    return NextResponse.json({ error: "Missing query param ?team=TOR" }, { status: 400 });
  }

  const upstream = new URL("/v1/hot/last5", backendBaseUrl());
  upstream.searchParams.set("team", team);

  try {
    const r = await fetch(upstream.toString(), { next: { revalidate } });
    if (!r.ok) {
      const detail = await r.text();
      return NextResponse.json(
        { error: `Upstream returned ${r.status}`, detail: detail.slice(0, 1200) },
        { status: 502 }
      );
    }

    const upstreamJson: any = await r.json();

    // ✅ BACKWARD-COMPAT SHAPE: match what your old Next route returned
    const payload = upstreamJson?.data ?? upstreamJson;

    return NextResponse.json({
      team: payload?.team ?? team,
      seasonId: payload?.seasonId ?? upstreamJson?.seasonId ?? null,
      gameIds: Array.isArray(payload?.gameIds) ? payload.gameIds : [],
      debug: payload?.debug ?? null,
      leaders: payload?.leaders ?? { goals: null, points: null, shots: null },
      // keep ok if you want, but it won’t break anything:
      ok: upstreamJson?.ok ?? true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Proxy fetch failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
