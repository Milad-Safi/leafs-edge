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

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function getOppFromGame(game: Game | null, teamAbbrev: string) {
  if (!game) return null;

  const isHome =
    String(game.homeAbbrev).toUpperCase() === teamAbbrev.toUpperCase();

  return (
    (isHome ? game.awayAbbrev : game.homeAbbrev)?.toUpperCase?.() ?? null
  );
}

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

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

export default function HomeClient() {
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
  } = useMatchupData({
    teamAbbrev: TEAM,
    oppAbbrev,
  });

  const { data: history, loading: historyLoading } = useMatchupHistory(
    TEAM,
    oppAbbrev
  );

  const leftColor = getTeamColor(TEAM);
  const rightColor = getTeamColor(oppAbbrev ?? "");
  const gameDateToronto = torontoDateFromUTC(selectedGame?.startTimeUTC);

  return (
    <main className="leShell">
      {/* ───────── Schedule Bar ───────── */}
      <ScheduleBar
        teamAbbrev={TEAM}
        onSelectFutureGame={(g) => setSelectedGame(g)}
      />

      {/* ───────── Center Nav ───────── */}
      <CenterNav teamAbbrev={TEAM} oppAbbrev={oppAbbrev} />

      {/* ───────── Main Surface ───────── */}
      <div className="leSurface">
        <div className="leContentPad">
          <div className="leDarkPanel">
            {/* Matchup Header (no divider under it) */}
            <MatchupHeader
              game={selectedGame}
              teamAbbrev={TEAM}
              leftSummary={torSummary}
              rightSummary={oppSummary}
            />

            {/* ───────── Dropdown Group (boxed) ───────── */}
            <div className="leSectionGroup">
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

            {/* ───────── Goalies (untouched) ───────── */}
            {oppAbbrev && gameDateToronto && (
              <GoaliesSection
                leftTeam={TEAM}
                rightTeam={oppAbbrev}
                gameDate={gameDateToronto}
                leftColor={leftColor}
                rightColor={rightColor}
              />
            )}

            {/* ───────── Injuries (untouched) ───────── */}
            <InjuriesSection leftTeam={TEAM} rightTeam={oppAbbrev} />
          </div>
        </div>
      </div>
    </main>
  );
}
