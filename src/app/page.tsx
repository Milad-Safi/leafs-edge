"use client";

import React, { useEffect, useState } from "react";
import ScheduleBar, { type Game } from "@/components/schedule/scheduleBar";
import MatchupHeader from "@/components/MatchupHeader";
import GoaliesSection from "@/components/goalies";
import TeamComparisonSection, {
  type TeamSummary,
} from "@/components/TeamComparisons";
import Last5Section, {
  type TeamLast5,
} from "@/components/Last5";

import { getTeamColor } from "@/lib/teamColours";
import HotPlayersLast5, { type HotL5Payload } from "@/components/HotPlayers";
import InjuriesSection from "@/components/Injuries";


function getOppFromGame(game: Game | null, teamAbbrev: string) {
  if (!game) return null;
  const leafsIsHome =
    String(game.homeAbbrev).toUpperCase() === teamAbbrev.toUpperCase();
  return (leafsIsHome ? game.awayAbbrev : game.homeAbbrev)
    ?.toUpperCase?.() ?? null;
}

function torontoDateFromUTC(utcIso: string | null | undefined): string | null {
  if (!utcIso) return null;
  const dt = new Date(utcIso);
  if (!Number.isFinite(dt.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dt);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) return null;

  return `${y}-${m}-${d}`;
}



export default function Home() {
  const TEAM = "TOR";
  
  const [torHot, setTorHot] = useState<HotL5Payload | null>(null);
  const [oppHot, setOppHot] = useState<HotL5Payload | null>(null);

  const [teamRanks, setTeamRanks] = useState<any | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const [torSummary, setTorSummary] = useState<TeamSummary | null>(null);
  const [oppSummary, setOppSummary] = useState<TeamSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [torLast5, setTorLast5] = useState<TeamLast5 | null>(null);
  const [oppLast5, setOppLast5] = useState<TeamLast5 | null>(null);
  const [loadingLast5, setLoadingLast5] = useState(false);

  const oppAbbrev = getOppFromGame(selectedGame, TEAM);

  useEffect(() => {
    if (!oppAbbrev) return;

    setLoadingSummary(true);

    Promise.all([
      fetch(`/api/team/summary?team=${TEAM}`).then((r) => r.json()),
      fetch(`/api/team/summary?team=${oppAbbrev}`).then((r) => r.json()),
    ])
      .then(([tor, opp]) => {
        setTorSummary(tor?.teamAbbrev ? tor : null);
        setOppSummary(opp?.teamAbbrev ? opp : null);
      })
      .finally(() => setLoadingSummary(false));
  }, [TEAM, oppAbbrev]);

  useEffect(() => {
    if (!oppAbbrev) return;

    setLoadingLast5(true);

    Promise.all([
      fetch(`/api/team/last5?team=${TEAM}`).then((r) => r.json()),
      fetch(`/api/team/last5?team=${oppAbbrev}`).then((r) => r.json()),
    ])
      .then(([tor, opp]) => {
        setTorLast5(tor?.team ? tor : null);
        setOppLast5(opp?.team ? opp : null);
      })
      .finally(() => setLoadingLast5(false));
  }, [TEAM, oppAbbrev]);

  useEffect(() => {
  if (!oppAbbrev) return;

  fetch(`/api/team/ranks?teamA=${TEAM}&teamB=${oppAbbrev}`)
    .then((r) => r.json())
    .then((j) => setTeamRanks(j?.ranks ? j : null))
    .catch(() => setTeamRanks(null));
  }, [TEAM, oppAbbrev]);

  useEffect(() => {
  if (!oppAbbrev) return;

  Promise.all([
    fetch(`/api/team/hotLast5?team=${TEAM}`).then((r) => r.json()),
    fetch(`/api/team/hotLast5?team=${oppAbbrev}`).then((r) => r.json()),
  ])
    .then(([tor, opp]) => {
      setTorHot(tor?.leaders ? tor : null);
      setOppHot(opp?.leaders ? opp : null);
    })
    .catch(() => {
      setTorHot(null);
      setOppHot(null);
    });
}, [TEAM, oppAbbrev]);



  const leftColor = getTeamColor(TEAM);
  const rightColor = getTeamColor(oppAbbrev ?? "");
  const gameDayToronto = torontoDateFromUTC(selectedGame?.startTimeUTC ?? null);


  return (
    <main style={{ minHeight: "100vh", color: "white" }}>
      <ScheduleBar
        teamAbbrev={TEAM}
        onSelectFutureGame={(game) => setSelectedGame(game)}
      />

      <MatchupHeader
        game={selectedGame}
        teamAbbrev={TEAM}
        leftSummary={torSummary}
        rightSummary={oppSummary}
      />

      <section style={{ padding: 24 }}>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <TeamComparisonSection
            left={torSummary}
            right={oppSummary}
            loading={loadingSummary}
            leftColor={leftColor}
            rightColor={rightColor}
            leftAbbrev={TEAM}
            rightAbbrev={oppAbbrev ?? ""}
            ranks={teamRanks}
          />

          <Last5Section
            left={torLast5}
            right={oppLast5}
            loading={loadingLast5}
            leftColor={leftColor}
            rightColor={rightColor}
            hotLeft={torHot}
            hotRight={oppHot}
          />

          {oppAbbrev && gameDayToronto && (
            <GoaliesSection
              leftTeam="TOR"
              rightTeam={oppAbbrev}
              gameDate={gameDayToronto}
              leftColor={leftColor}
              rightColor={rightColor}
            />
          )}

          <InjuriesSection leftTeam="TOR" rightTeam={oppAbbrev} />



        </div>
      </section>
    </main>
  );
}
