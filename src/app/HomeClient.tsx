"use client";

import React, { useState } from "react";

import ScheduleBar, { type Game } from "@/components/schedule/ScheduleBar";
import CenterNav from "@/components/CenterNav";
import MatchupHeader from "@/components/MatchupHeader";

import TeamComparisonSection from "@/components/TeamComparisons";
import Last5Section from "@/components/LastFive";
import MatchupHistory from "@/components/MatchupHistory";
import GoaliesSection from "@/components/Goalies";
import InjuriesSection from "@/components/Injuries";

import CollapsibleSection from "@/components/CollapsibleSection";

import useMatchupData from "@/hooks/useMatchupData";
import { useMatchupHistory } from "@/hooks/useMatchupHistory";
import { getTeamColor } from "@/lib/teamColours";

// Main client-side page for Leafs Edge
// Orchestrates schedule selection, matchup context, and all major sections

// Resolve the opposing team abbreviation from a selected game
function getOppFromGame(game: Game | null, teamAbbrev: string) {
  if (!game) return null;

  const isHome =
    String(game.homeAbbrev).toUpperCase() === teamAbbrev.toUpperCase();

  return (
    (isHome ? game.awayAbbrev : game.homeAbbrev)?.toUpperCase?.() ?? null
  );
}

// Convert a UTC game timestamp into a Toronto-local YYYY-MM-DD string
function torontoDateFromUTC(utcIso?: string | null): string | null {
  if (!utcIso) return null;
  const d = new Date(utcIso);
  if (!Number.isFinite(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!y || !m || !day) return null;
  return `${y}-${m}-${day}`;
}

export default function HomeClient() {
  const TEAM = "TOR";

  // Currently selected game from the schedule bar
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Derived opponent based on the selected game
  const oppAbbrev = getOppFromGame(selectedGame, TEAM);

  // Primary matchup data used across multiple sections
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
  } = useMatchupData({
    teamAbbrev: TEAM,
    oppAbbrev,
  });

  // matchup data between the two teams
  const { data: history, loading: historyLoading } = useMatchupHistory(
    TEAM,
    oppAbbrev
  );

  // Team-specific colors used for side-by-side visuals
  const leftColor = getTeamColor(TEAM);
  const rightColor = getTeamColor(oppAbbrev ?? "");

  // Localized game date used by the goalie projection section
  const gameDateToronto = torontoDateFromUTC(selectedGame?.startTimeUTC);

  return (
    <main className="Shell">
      {/* Schedule selector for upcoming and recent games */}
      <ScheduleBar
        teamAbbrev={TEAM}
        onSelectFutureGame={(g) => setSelectedGame(g)}
      />

      {/* Center navigation that reflects the current matchup */}
      <CenterNav teamAbbrev={TEAM} oppAbbrev={oppAbbrev} />

      {/* Main content surface */}
      <div className="Surface">
        <div className="ContentPad">
          <div className="DarkPanel">
            {/* Header summarizing the selected matchup */}
            <MatchupHeader
              game={selectedGame}
              teamAbbrev={TEAM}
              leftSummary={torSummary}
              rightSummary={oppSummary}
            />

            {/* Grouped expandable sections for comparisons and trends */}
            <div className="SectionGroup">
              <CollapsibleSection title="Team Comparisons" defaultOpen>
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
              </CollapsibleSection>

              <CollapsibleSection title="Last 5 Games" defaultOpen>
                <Last5Section
                  left={torLast5}
                  right={oppLast5}
                  loading={loadingLast5}
                  leftColor={leftColor}
                  rightColor={rightColor}
                  hotLeft={torHot}
                  hotRight={oppHot}
                />
              </CollapsibleSection>

              <CollapsibleSection title="Matchup History" defaultOpen>
                <MatchupHistory
                  data={history}
                  loading={historyLoading}
                  leftAbbrev={TEAM}
                  rightAbbrev={oppAbbrev ?? ""}
                  leftColor={leftColor}
                  rightColor={rightColor}
                />
              </CollapsibleSection>
            </div>

            {/* Goalie comparison shown only when matchup context is complete */}
            {oppAbbrev && gameDateToronto && (
              <GoaliesSection
                leftTeam={TEAM}
                rightTeam={oppAbbrev}
                gameDate={gameDateToronto}
                leftColor={leftColor}
                rightColor={rightColor}
              />
            )}

            {/* Injury report for both teams */}
            <InjuriesSection leftTeam={TEAM} rightTeam={oppAbbrev} />
          </div>
        </div>
      </div>
    </main>
  );
}
