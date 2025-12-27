import { useEffect, useState } from "react";

import { fetchJson } from "@/lib/fetchJson";
import type { TeamTrendResponse } from "@/types/api";

// Re-export types for backwards-compat with existing imports.
export type { TeamTrendResponse } from "@/types/api";

const API_BASE =
  process.env.NEXT_PUBLIC_EDGE_API_BASE ?? "http://localhost:8000";

export function useTeamTrend(team: string | null) {
  const [data, setData] = useState<TeamTrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!team) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

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

    return () => ctrl.abort();
  }, [team]);

  return { data, loading, error };
}
