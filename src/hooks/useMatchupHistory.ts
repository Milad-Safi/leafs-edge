"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { fetchJson } from "@/lib/fetchJson";
import type { CompareFilter } from "@/lib/compare";
import type { MatchupHistoryPayload } from "@/types/api";

export type { MatchupHistoryPayload } from "@/types/api";

export function useMatchupHistory(
  team: string | null,
  opp: string | null,
  filterBy: CompareFilter
) {
  const [data, setData] = useState<MatchupHistoryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeq = useRef(0);

  useLayoutEffect(() => {
    if (!team || !opp) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const seq = ++requestSeq.current;

    setData(null);
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const json = await fetchJson<MatchupHistoryPayload>(
          `/api/matchups/history?team=${encodeURIComponent(team)}&opp=${encodeURIComponent(
            opp
          )}&filterBy=${encodeURIComponent(filterBy)}`,
          { signal: controller.signal }
        );

        if (requestSeq.current !== seq) return;
        setData(json);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        if (requestSeq.current !== seq) return;

        setData(null);
        setError(e?.message ?? "Failed to load matchup history");
      } finally {
        if (requestSeq.current === seq) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [team, opp, filterBy]);

  return { data, loading, error };
}