"use client";

import { useEffect, useRef, useState } from "react";
import type { TeamSummary } from "@/components/TeamComparisons";
import type { TeamLast5 } from "@/components/Last5";
import type { HotL5Payload } from "@/components/HotPlayers";

type MatchupData = {
  torSummary: TeamSummary | null;
  oppSummary: TeamSummary | null;
  loadingSummary: boolean;

  torLast5: TeamLast5 | null;
  oppLast5: TeamLast5 | null;
  loadingLast5: boolean;

  teamRanks: any | null;

  torHot: HotL5Payload | null;
  oppHot: HotL5Payload | null;
  loadingHot: boolean;
};

export default function useMatchupData({
  teamAbbrev,
  oppAbbrev,
}: {
  teamAbbrev: string;
  oppAbbrev: string | null;
}): MatchupData {
  const [torSummary, setTorSummary] = useState<TeamSummary | null>(null);
  const [oppSummary, setOppSummary] = useState<TeamSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [torLast5, setTorLast5] = useState<TeamLast5 | null>(null);
  const [oppLast5, setOppLast5] = useState<TeamLast5 | null>(null);
  const [loadingLast5, setLoadingLast5] = useState(false);

  const [teamRanks, setTeamRanks] = useState<any | null>(null);

  const [torHot, setTorHot] = useState<HotL5Payload | null>(null);
  const [oppHot, setOppHot] = useState<HotL5Payload | null>(null);
  const [loadingHot, setLoadingHot] = useState(false);

  // Prevent stale responses from overwriting newer matchup selections.
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!oppAbbrev) {
      setTorSummary(null);
      setOppSummary(null);
      setTorLast5(null);
      setOppLast5(null);
      setTeamRanks(null);
      setTorHot(null);
      setOppHot(null);
      setLoadingSummary(false);
      setLoadingLast5(false);
      setLoadingHot(false);
      return;
    }

    const seq = ++requestSeq.current;
    const ctrl = new AbortController();

    async function run() {
      // Summary
      try {
        setLoadingSummary(true);
        const [tor, opp] = await Promise.all([
          fetch(`/api/team/summary?team=${teamAbbrev}`, {
            signal: ctrl.signal,
          }).then((r) => r.json()),
          fetch(`/api/team/summary?team=${oppAbbrev}`, {
            signal: ctrl.signal,
          }).then((r) => r.json()),
        ]);

        if (requestSeq.current !== seq) return;
        setTorSummary(tor?.teamAbbrev ? tor : null);
        setOppSummary(opp?.teamAbbrev ? opp : null);
      } catch {
        if (requestSeq.current !== seq) return;
        setTorSummary(null);
        setOppSummary(null);
      } finally {
        if (requestSeq.current === seq) setLoadingSummary(false);
      }

      // Last 5
      try {
        setLoadingLast5(true);
        const [tor, opp] = await Promise.all([
          fetch(`/api/team/last5?team=${teamAbbrev}`, {
            signal: ctrl.signal,
          }).then((r) => r.json()),
          fetch(`/api/team/last5?team=${oppAbbrev}`, {
            signal: ctrl.signal,
          }).then((r) => r.json()),
        ]);

        if (requestSeq.current !== seq) return;
        setTorLast5(tor?.team ? tor : null);
        setOppLast5(opp?.team ? opp : null);
      } catch {
        if (requestSeq.current !== seq) return;
        setTorLast5(null);
        setOppLast5(null);
      } finally {
        if (requestSeq.current === seq) setLoadingLast5(false);
      }

      // Ranks
      try {
        const j = await fetch(
          `/api/team/ranks?teamA=${teamAbbrev}&teamB=${oppAbbrev}`,
          { signal: ctrl.signal }
        ).then((r) => r.json());

        if (requestSeq.current !== seq) return;
        setTeamRanks(j?.ranks ? j : null);
      } catch {
        if (requestSeq.current !== seq) return;
        setTeamRanks(null);
      }

      // Hot last 5
      try {
        setLoadingHot(true);
        const [tor, opp] = await Promise.all([
          fetch(`/api/team/hotLast5?team=${teamAbbrev}`, {
            signal: ctrl.signal,
          }).then((r) => r.json()),
          fetch(`/api/team/hotLast5?team=${oppAbbrev}`, {
            signal: ctrl.signal,
          }).then((r) => r.json()),
        ]);

        if (requestSeq.current !== seq) return;
        setTorHot(tor?.leaders ? tor : null);
        setOppHot(opp?.leaders ? opp : null);
      } catch {
        if (requestSeq.current !== seq) return;
        setTorHot(null);
        setOppHot(null);
      } finally {
        if (requestSeq.current === seq) setLoadingHot(false);
      }
    }

    run();

    return () => {
      ctrl.abort();
    };
  }, [teamAbbrev, oppAbbrev]);

  return {
    torSummary,
    oppSummary,
    loadingSummary,
    torLast5,
    oppLast5,
    loadingLast5,
    teamRanks,
    torHot,
    oppHot,
    loadingHot,
  };
}
