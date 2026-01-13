"use client";

// React hook for loading all matchup-related data between two teams

import { useEffect, useRef, useState } from "react";
import type {
  HotL5Payload,
  TeamLast5,
  TeamRanks,
  TeamSummary,
} from "@/types/api";
import { fetchJson } from "@/lib/fetchJson";

type MatchupData = {
  torSummary: TeamSummary | null;
  oppSummary: TeamSummary | null;
  loadingSummary: boolean;

  torLast5: TeamLast5 | null;
  oppLast5: TeamLast5 | null;
  loadingLast5: boolean;

  teamRanks: TeamRanks | null;

  torHot: HotL5Payload | null;
  oppHot: HotL5Payload | null;
  loadingHot: boolean;
};

// Hook that aggregates all matchup data needed for the comparison page
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

  const [teamRanks, setTeamRanks] = useState<TeamRanks | null>(null);

  const [torHot, setTorHot] = useState<HotL5Payload | null>(null);
  const [oppHot, setOppHot] = useState<HotL5Payload | null>(null);
  const [loadingHot, setLoadingHot] = useState(false);

  // Sequence counter to ignore stale async responses
  const requestSeq = useRef(0);

  useEffect(() => {
    // Reset all matchup state if no opponent is selected
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
      // Fetch season summary stats for both teams
      try {
        setLoadingSummary(true);
        const [tor, opp] = await Promise.all([
          fetchJson<TeamSummary>(`/api/team/summary?team=${teamAbbrev}`, {
            signal: ctrl.signal,
          }),
          fetchJson<TeamSummary>(`/api/team/summary?team=${oppAbbrev}`, {
            signal: ctrl.signal,
          }),
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

      // Fetch last-5-games performance for both teams
      try {
        setLoadingLast5(true);
        const [tor, opp] = await Promise.all([
          fetchJson<TeamLast5>(
            `/api/team/last5?team=${teamAbbrev}&opp=${oppAbbrev}`,
            { signal: ctrl.signal }
          ),
          fetchJson<TeamLast5>(
            `/api/team/last5?team=${oppAbbrev}&opp=${teamAbbrev}`,
            { signal: ctrl.signal }
          ),
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

      // Fetch comparative league rankings for the matchup
      try {
        const j = await fetchJson<TeamRanks>(
          `/api/team/ranks?teamA=${teamAbbrev}&teamB=${oppAbbrev}`,
          { signal: ctrl.signal }
        );

        if (requestSeq.current !== seq) return;
        setTeamRanks(j?.ranks ? j : null);
      } catch {
        if (requestSeq.current !== seq) return;
        setTeamRanks(null);
      }

      // Fetch hot players over the last 5 games for both teams
      try {
        setLoadingHot(true);
        const [tor, opp] = await Promise.all([
          fetchJson<HotL5Payload>(
            `/api/team/hotLast5?team=${teamAbbrev}`,
            { signal: ctrl.signal }
          ),
          fetchJson<HotL5Payload>(
            `/api/team/hotLast5?team=${oppAbbrev}`,
            { signal: ctrl.signal }
          ),
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
