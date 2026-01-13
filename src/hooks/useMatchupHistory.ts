"use client";

// React hook for fetching matchup data between two teams

import { useEffect, useState } from "react";

import { fetchJson } from "@/lib/fetchJson";
import type { MatchupHistoryPayload } from "@/types/api";

// Re-export types for backwards-compat with existing imports
export type { MatchupHistoryPayload } from "@/types/api";

// Hook that loads head-to-head matchup history for two teams
export function useMatchupHistory(team: string | null, opp: string | null) {
  const [data, setData] = useState<MatchupHistoryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetching if either team is missing
    if (!team || !opp) return;

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch matchup history from internal API
        const json = await fetchJson<MatchupHistoryPayload>(
          `/api/matchups/history?team=${encodeURIComponent(team)}&opp=${encodeURIComponent(opp)}`,
          { signal: controller.signal }
        );
        setData(json);
      } catch (e: any) {
        // Ignore abort errors, surface real failures
        if (e?.name !== "AbortError")
          setError(e?.message ?? "Failed to load matchup history");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [team, opp]);

  return { data, loading, error };
}
