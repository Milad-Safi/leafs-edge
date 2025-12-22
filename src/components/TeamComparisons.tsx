"use client";

import React from "react";
import StatRow from "@/components/StatRow";

type RecordSplit = { w: number; l: number };

export type TeamSummary = {
  teamAbbrev: string;
  teamFullName: string | null;
  gamesPlayed: number | null;

  goalsForPerGame: number | null;
  goalsAgainstPerGame: number | null;

  powerPlayPct: number | null;
  penaltyKillPct: number | null;

  shotsForPerGame: number | null;
  shotsAgainstPerGame: number | null;

  wins: number | null;
  losses: number | null;
  otLosses: number | null;
  points: number | null;

  homeRecord: RecordSplit;
  awayRecord: RecordSplit;
};

type RanksForMetric = Record<string, number | null>;

export type TeamRanks = {
  seasonId: number;
  teamsCount: number;
  teamA: string;
  teamB: string;
  ranks: {
    goalsForPerGame: RanksForMetric;
    goalsAgainstPerGame: RanksForMetric;
    powerPlayPct: RanksForMetric;
    penaltyKillPct: RanksForMetric;
    shotsForPerGame: RanksForMetric;
    shotsAgainstPerGame: RanksForMetric;
  };
};

function ordinal(n: number) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

export default function TeamComparisonSection({
  left,
  right,
  loading,
  leftColor,
  rightColor,
  leftAbbrev,
  rightAbbrev,
  ranks,
}: {
  left: TeamSummary | null;
  right: TeamSummary | null;
  loading: boolean;
  leftColor: string;
  rightColor: string;
  leftAbbrev: string;
  rightAbbrev: string;
  ranks: TeamRanks | null;
}) {
  function rankSuffix(metricKey: keyof TeamRanks["ranks"], team: string) {
    const r = ranks?.ranks?.[metricKey]?.[team] ?? null;
    return r != null ? ` (${ordinal(r)})` : "";
  }

  return (
    <>
      {/* HEADER */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontWeight: 900, letterSpacing: 0.6, textAlign: "center" }}>
          TEAM COMPARISON
        </div>
        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4, textAlign: "center" }}>
          2025-2026 Regular Season Stats 
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: 16, opacity: 0.95 }}>
        {loading && (
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>Loading team stats…</div>
        )}

        <StatRow
          leftVal={left?.goalsForPerGame ?? null}
          rightVal={right?.goalsForPerGame ?? null}
          label="Goals For / Game"
          leftText={
            left?.goalsForPerGame != null
              ? `${left.goalsForPerGame}${rankSuffix("goalsForPerGame", leftAbbrev)}`
              : "—"
          }
          rightText={
            right?.goalsForPerGame != null
              ? `${right.goalsForPerGame}${rankSuffix("goalsForPerGame", rightAbbrev)}`
              : "—"
          }
          leftColor={leftColor}
          rightColor={rightColor}
        />
        <div style={{ height: 10 }} />

        <StatRow
          leftVal={left?.goalsAgainstPerGame ?? null}
          rightVal={right?.goalsAgainstPerGame ?? null}
          label="Goals Against / Game"
          leftText={
            left?.goalsAgainstPerGame != null
              ? `${left.goalsAgainstPerGame}${rankSuffix("goalsAgainstPerGame", leftAbbrev)}`
              : "—"
          }
          rightText={
            right?.goalsAgainstPerGame != null
              ? `${right.goalsAgainstPerGame}${rankSuffix("goalsAgainstPerGame", rightAbbrev)}`
              : "—"
          }
          leftColor={leftColor}
          rightColor={rightColor}
        />
        <div style={{ height: 10 }} />

        <StatRow
          leftVal={left?.powerPlayPct ?? null}
          rightVal={right?.powerPlayPct ?? null}
          label="Power Play %"
          leftText={
            left?.powerPlayPct != null
              ? `${left.powerPlayPct}%${rankSuffix("powerPlayPct", leftAbbrev)}`
              : "—"
          }
          rightText={
            right?.powerPlayPct != null
              ? `${right.powerPlayPct}%${rankSuffix("powerPlayPct", rightAbbrev)}`
              : "—"
          }
          leftColor={leftColor}
          rightColor={rightColor}
        />
        <div style={{ height: 10 }} />

        <StatRow
          leftVal={left?.penaltyKillPct ?? null}
          rightVal={right?.penaltyKillPct ?? null}
          label="Penalty Kill %"
          leftText={
            left?.penaltyKillPct != null
              ? `${left.penaltyKillPct}%${rankSuffix("penaltyKillPct", leftAbbrev)}`
              : "—"
          }
          rightText={
            right?.penaltyKillPct != null
              ? `${right.penaltyKillPct}%${rankSuffix("penaltyKillPct", rightAbbrev)}`
              : "—"
          }
          leftColor={leftColor}
          rightColor={rightColor}
        />
        <div style={{ height: 10 }} />

        <StatRow
          leftVal={left?.shotsForPerGame ?? null}
          rightVal={right?.shotsForPerGame ?? null}
          label="Shots For / Game"
          leftText={
            left?.shotsForPerGame != null
              ? `${left.shotsForPerGame}${rankSuffix("shotsForPerGame", leftAbbrev)}`
              : "—"
          }
          rightText={
            right?.shotsForPerGame != null
              ? `${right.shotsForPerGame}${rankSuffix("shotsForPerGame", rightAbbrev)}`
              : "—"
          }
          leftColor={leftColor}
          rightColor={rightColor}
        />
        <div style={{ height: 10 }} />

        <StatRow
          leftVal={left?.shotsAgainstPerGame ?? null}
          rightVal={right?.shotsAgainstPerGame ?? null}
          label="Shots Against / Game"
          leftText={
            left?.shotsAgainstPerGame != null
              ? `${left.shotsAgainstPerGame}${rankSuffix("shotsAgainstPerGame", leftAbbrev)}`
              : "—"
          }
          rightText={
            right?.shotsAgainstPerGame != null
              ? `${right.shotsAgainstPerGame}${rankSuffix("shotsAgainstPerGame", rightAbbrev)}`
              : "—"
          }
          leftColor={leftColor}
          rightColor={rightColor}
        />
      </div>
    </>
  );
}
