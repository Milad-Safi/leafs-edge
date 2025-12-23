"use client";

import React, { useState } from "react";
import ScheduleBar, { type Game } from "@/components/schedule/scheduleBar";
import MatchupHeader from "@/components/MatchupHeader";
import GoaliesSection from "@/components/goalies";
import TeamComparisonSection from "@/components/TeamComparisons";
import Last5Section from "@/components/Last5";
import HotPlayersLast5 from "@/components/HotPlayers";
import InjuriesSection from "@/components/Injuries";

import useMatchupData from "@/hooks/useMatchupData";
import { getTeamColor } from "@/lib/teamColours";
import MatchupHistory from "@/components/matchupHistory";
import { useMatchupHistory } from "@/hooks/useMatchupHistory";


function getOppFromGame(game: Game | null, teamAbbrev: string) {
  if (!game) return null;
  const leafsIsHome =
    String(game.homeAbbrev).toUpperCase() === teamAbbrev.toUpperCase();
  return (
    (leafsIsHome ? game.awayAbbrev : game.homeAbbrev)?.toUpperCase?.() ?? null
  );
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

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const oppAbbrev = getOppFromGame(selectedGame, TEAM);

  const {
    torSummary,
    oppSummary,
    loadingSummary,
    torLast5,
    oppLast5,
    loadingLast5,
    torHot,
    oppHot,
    teamRanks,
  } = useMatchupData({ teamAbbrev: TEAM, oppAbbrev });

  const leftColor = getTeamColor(TEAM);
  const rightColor = getTeamColor(oppAbbrev ?? "");
  const gameDayToronto = torontoDateFromUTC(selectedGame?.startTimeUTC ?? null);
  const { data: history, loading: historyLoading } = useMatchupHistory(TEAM, oppAbbrev);

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


          <MatchupHistory
            data={history}
            loading={historyLoading}
            leftAbbrev="TOR"
            rightAbbrev={oppAbbrev ?? ""}
            leftColor={leftColor}
            rightColor={rightColor}
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
