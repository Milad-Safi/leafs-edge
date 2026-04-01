"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { CompareFilter } from "@/lib/compare";
import { fetchJson } from "@/lib/fetchJson";

type GoalieCompareValue = {
  playerId: number;
  name: string;
  gp: number;
  wins: number;
  savePct: number | null;
  gaa: number | null;
  shutouts: number;
};

type GoalieComparePayload = {
  team: string;
  filterBy: CompareFilter;
  gamesUsed: number;
  starter: GoalieCompareValue | null;
  additional: GoalieCompareValue | null;
};

export default function useGoalieCompare(
  team1: string | null,
  team2: string | null,
  filterBy: CompareFilter
) {
  const [leftData, setLeftData] = useState<GoalieComparePayload | null>(null);
  const [rightData, setRightData] = useState<GoalieComparePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeq = useRef(0);

  useLayoutEffect(() => {
    if (!team1 || !team2) {
      setLeftData(null);
      setRightData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const seq = ++requestSeq.current;

    setLeftData(null);
    setRightData(null);
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [left, right] = await Promise.all([
          fetchJson<GoalieComparePayload>(
            `/api/compare/goalies?team=${encodeURIComponent(
              team1
            )}&filterBy=${encodeURIComponent(filterBy)}`,
            { signal: controller.signal }
          ),
          fetchJson<GoalieComparePayload>(
            `/api/compare/goalies?team=${encodeURIComponent(
              team2
            )}&filterBy=${encodeURIComponent(filterBy)}`,
            { signal: controller.signal }
          ),
        ]);

        if (requestSeq.current !== seq) return;

        setLeftData(left);
        setRightData(right);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        if (requestSeq.current !== seq) return;

        setLeftData(null);
        setRightData(null);
        setError(error?.message ?? "Failed to load goalie compare data");
      } finally {
        if (requestSeq.current === seq) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [team1, team2, filterBy]);

  return { leftData, rightData, loading, error };
}