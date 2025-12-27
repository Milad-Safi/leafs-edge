"use client";

import { useEffect, useMemo, useState } from "react";

export type EdgeFastestSkater = {
  playerId: number;
  name: string;
  mph: number;
  kph: number;
  gameDate: string;
  gameCenterLink?: string;
  period?: number;
  time?: string;
};

export type EdgeHardestShooter = {
  playerId: number;
  name: string;
  mph: number;
  kph: number;
  gameDate: string;
  time?: string;
};

export type EdgeAreaRow = {
  area: string;
  sog: number;
  goals: number;
  shootingPctg: number;
};

export type TeamSkatingSpeedResponse = {
  ok: boolean;
  team: string;
  season: string | null;
  fastestSkaters: EdgeFastestSkater[];
};

export type TeamShotSpeedResponse = {
  ok: boolean;
  team: string;
  season: string | null;
  hardestShooters: EdgeHardestShooter[];
};

export type TeamShotLocationResponse = {
  ok: boolean;
  team: string;
  season: string | null;
  areas: EdgeAreaRow[];
  scale?: { maxSog: number; maxGoals: number };
};

export type TeamEdgeBundle = {
  skating: TeamSkatingSpeedResponse;
  shotSpeed: TeamShotSpeedResponse;
  shotLocation: TeamShotLocationResponse;
};

function buildUrl(baseUrl: string, path: string, team: string) {
  const u = new URL(path, baseUrl);
  u.searchParams.set("team", team);
  return u.toString();
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
    // If your backend sets cookies you can switch to "include".
    credentials: "omit",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }
  return (await res.json()) as T;
}

export default function useTeamEdge(team: string | null, enabled = true) {
  const baseUrl =
    process.env.NEXT_PUBLIC_EDGE_API_BASE ?? "http://localhost:8000";

  const urls = useMemo(() => {
    if (!team) return null;
    return {
      skating: buildUrl(baseUrl, "/v1/nhl/edge/team_skating_speed", team),
      shotSpeed: buildUrl(baseUrl, "/v1/nhl/edge/team_shot_speed", team),
      shotLocation: buildUrl(baseUrl, "/v1/nhl/edge/team_shot_location", team),
    };
  }, [baseUrl, team]);

  const [data, setData] = useState<TeamEdgeBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !team || !urls) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      fetchJson<TeamSkatingSpeedResponse>(urls.skating, ac.signal),
      fetchJson<TeamShotSpeedResponse>(urls.shotSpeed, ac.signal),
      fetchJson<TeamShotLocationResponse>(urls.shotLocation, ac.signal),
    ])
      .then(([skating, shotSpeed, shotLocation]) => {
        setData({ skating, shotSpeed, shotLocation });
      })
      .catch((e: unknown) => {
        if ((e as any)?.name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [enabled, team, urls]);

  return { data, loading, error, baseUrl };
}
