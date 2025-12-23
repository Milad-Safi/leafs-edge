"use client";

import { useEffect, useState } from "react";

export type HistoryLeader = {
  playerId: number;
  name: string;
  goals: number;
  points: number;
  sog: number;
};

export type MatchupHistoryPayload = {
  team: string;
  opp: string;
  seasons: number[];
  gamesFound: number;
  leaders: Record<
    string,
    {
      topGoals: HistoryLeader | null;
      topPoints: HistoryLeader | null;
      topSog: HistoryLeader | null;
    }
  >;
};

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

        const res = await fetch(
          `/api/matchups/history?team=${encodeURIComponent(team)}&opp=${encodeURIComponent(opp)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }

        const json = (await res.json()) as MatchupHistoryPayload;
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
