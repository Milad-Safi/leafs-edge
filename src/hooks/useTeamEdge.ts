"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchJson } from "@/lib/fetchJson";
import type {
  TeamEdgeBundle,
  TeamSkatingSpeedResponse,
  TeamShotLocationResponse,
  TeamShotSpeedResponse,
  EdgeAreaRow,
  EdgeFastestSkater,
  EdgeHardestShooter,
} from "@/types/api";

// Re-export types for backwards-compat with existing imports.
export type {
  TeamEdgeBundle,
  TeamSkatingSpeedResponse,
  TeamShotLocationResponse,
  TeamShotSpeedResponse,
  EdgeAreaRow,
  EdgeFastestSkater,
  EdgeHardestShooter,
} from "@/types/api";

function buildUrl(baseUrl: string, path: string, team: string) {
  const u = new URL(path, baseUrl);
  u.searchParams.set("team", team);
  return u.toString();
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
      fetchJson<TeamSkatingSpeedResponse>(urls.skating, { signal: ac.signal }),
      fetchJson<TeamShotSpeedResponse>(urls.shotSpeed, { signal: ac.signal }),
      fetchJson<TeamShotLocationResponse>(urls.shotLocation, { signal: ac.signal }),
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
