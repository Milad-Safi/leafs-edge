"use client";

// React hook for loading goalie data for a head to head matchup

import { useEffect, useRef, useState } from "react";

import { fetchJson } from "@/lib/fetchJson";
import type {
  GoalieApiPayload,
  GoalieRecord,
  Last5GoalieSplits,
  ProjectedStarter,
} from "@/types/api";

// Re-export types for backwards-compat with existing imports
export type {
  GoalieApiPayload,
  GoalieRecord,
  Last5GoalieSplits,
  ProjectedStarter,
} from "@/types/api";

// Hook that fetches goalie matchup data for two teams on a given game date
export default function useGoalies({
  leftTeam,
  rightTeam,
  gameDate,
}: {
  leftTeam: string;
  rightTeam: string;
  gameDate: string;
}) {
  const [left, setLeft] = useState<GoalieApiPayload | null>(null);
  const [right, setRight] = useState<GoalieApiPayload | null>(null);
  const [loading, setLoading] = useState(false);

  // Sequence ref to ignore stale responses from previous requests
  const seqRef = useRef(0);

  useEffect(() => {
    // Reset state if required inputs are missing
    if (!leftTeam || !rightTeam || !gameDate) {
      setLeft(null);
      setRight(null);
      setLoading(false);
      return;
    }

    const seq = ++seqRef.current;
    const ctrl = new AbortController();

    async function run() {
      setLoading(true);
      try {
        // Fetch goalie data for both teams in parallel
        const [a, b] = await Promise.all([
          fetchJson<GoalieApiPayload>(
            `/api/team/goalies?team=${leftTeam}&gameDate=${gameDate}`,
            { cache: "no-store", signal: ctrl.signal }
          ),
          fetchJson<GoalieApiPayload>(
            `/api/team/goalies?team=${rightTeam}&gameDate=${gameDate}`,
            { cache: "no-store", signal: ctrl.signal }
          ),
        ]);

        if (seqRef.current !== seq) return;
        setLeft(a);
        setRight(b);
      } catch {
        if (seqRef.current !== seq) return;
        setLeft(null);
        setRight(null);
      } finally {
        if (seqRef.current === seq) setLoading(false);
      }
    }

    run();

    return () => {
      ctrl.abort();
    };
  }, [leftTeam, rightTeam, gameDate]);

  return { left, right, loading };
}
