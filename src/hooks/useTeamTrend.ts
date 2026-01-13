/**
 * React hook for fetching a team trend prediction from the backend API
 * Fetch ML-based trend data for a given NHL team
 * Manage loading and error state for UI components
 * Automatically re-fetch when the selected team changes
 * Safely abort in-flight requests on unmount or team change
 */

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import type { TeamTrendResponse } from "@/types/api";

// Re-export types for backwards-compat 
export type { TeamTrendResponse } from "@/types/api";

// Base URL for the Edge API (env override for local/dev, fallback to prod)
const API_BASE =
  process.env.NEXT_PUBLIC_EDGE_API_BASE ??
  "https://leafs-edge-api.onrender.com";

// 
export function useTeamTrend(team: string | null) {

  // Response from backend shown, data, loading or error
  const [data, setData] = useState<TeamTrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no team is selected, reset state and skip fetching
    if (!team) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Abort controller to cancel fetches on team change
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    // Fetch trend prediction for the selected team
    fetchJson<TeamTrendResponse>(
      `${API_BASE}/v1/trend/team?team=${encodeURIComponent(team)}`,
      { signal: ctrl.signal }
    )
      .then((json) => setData(json))
      .catch((err: any) => {
        if (err?.name === "AbortError") return;
        setError(err?.message ?? "Failed to load trend");
      })
      .finally(() => setLoading(false));

    // abort in-flight request when team changes 
    return () => ctrl.abort();
  }, [team]);

  // Expose state to consuming components
  return { data, loading, error };
}
