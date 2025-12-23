"use client";

import { useEffect, useRef, useState } from "react";

export type GoalieRecord = { wins: number; losses: number; ot: number };

export type Last5GoalieSplits = {
  games: number;
  record: { w: number; l: number; ot: number };
  svPct: number | null;
  gaa: number | null;
};

export type ProjectedStarter = {
  playerId: number;
  name: string;
  headshot: string | null;

  record: GoalieRecord;
  gamesPlayed: number;

  savePct: number | null;
  gaa: number | null;

  last5Starts?: number | null;
  last5Splits?: Last5GoalieSplits | null;
};

export type GoalieApiPayload = {
  team: string;
  projectedStarter: ProjectedStarter | null;
  meta?: any;
  error?: string;
};

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

  const seqRef = useRef(0);

  useEffect(() => {
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
        const [a, b] = await Promise.all([
          fetch(`/api/team/goalies?team=${leftTeam}&gameDate=${gameDate}`, {
            cache: "no-store",
            signal: ctrl.signal,
          }).then((r) => r.json()),
          fetch(`/api/team/goalies?team=${rightTeam}&gameDate=${gameDate}`, {
            cache: "no-store",
            signal: ctrl.signal,
          }).then((r) => r.json()),
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
