"use client";

import { useEffect, useState } from "react";

import { fetchJson } from "@/lib/fetchJson";
import type { MatchupHistoryPayload } from "@/types/api";

// Re-export types for backwards-compat with existing imports.
export type { MatchupHistoryPayload } from "@/types/api";

export function useMatchupHistory(team: string | null, opp: string | null) {
  const [data, setData] = useState<MatchupHistoryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!team || !opp) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const json = await fetchJson<MatchupHistoryPayload>(
          `/api/matchups/history?team=${encodeURIComponent(team)}&opp=${encodeURIComponent(opp)}`,
          { signal: controller.signal }
        );
        setData(json);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message ?? "Failed to load matchup history");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [team, opp]);

  return { data, loading, error };
}
