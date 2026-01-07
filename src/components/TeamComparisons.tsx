"use client";

import React from "react";
import StatRow from "@/components/StatRow";
import { UI } from "@/styles/uiStyles";

import type { TeamRanks, TeamSummary } from "@/types/api";
import {
  higherBetterStrength,
  lowerBetterStrength,
  toPct100,
} from "@/lib/statsMath";

// Re-export types for backwards-compat with existing imports.
export type { TeamRanks, TeamSummary } from "@/types/api";

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
  function normTeamKey(t: string) {
    return (t ?? "").toUpperCase().trim();
  }

  function rankFor(metricKey: keyof TeamRanks["ranks"], team: string) {
    const key = normTeamKey(team);

    // Primary lookup
    let r = ranks?.ranks?.[metricKey]?.[key] ?? null;

    // Fallbacks 
    if (r == null) {
      const leftKey = normTeamKey(left?.teamAbbrev ?? "");
      const rightKey = normTeamKey(right?.teamAbbrev ?? "");

      if (key === leftKey) r = ranks?.ranks?.[metricKey]?.[leftKey] ?? null;
      if (r == null && key === rightKey)
        r = ranks?.ranks?.[metricKey]?.[rightKey] ?? null;
    }

    return r;
  }

  function rankSuffix(metricKey: keyof TeamRanks["ranks"], team: string) {
    const r = rankFor(metricKey, team);
    return r != null ? ` (${ordinal(r)})` : "";
  }

  function rankPrefix(metricKey: keyof TeamRanks["ranks"], team: string) {
    const r = rankFor(metricKey, team);
    return r != null ? `(${ordinal(r)}) ` : "";
  }

  return (
    <div style={UI.moduleWrapper()}>
      <div style={{ ...UI.pad(18) }}>
        <div className="leTC_Title">Team Comparisons:</div>

        <div className="leTC_Subtitle">2025–2026 Regular Season Stats</div>

        {loading && <div className="leTC_Loading">Loading team stats…</div>}

        <div style={UI.rowsGrid(10)}>
          <StatRow
            label="Goals For / Game"
            leftVal={higherBetterStrength(left?.goalsForPerGame ?? null, 3.0, 1.2)}
            rightVal={higherBetterStrength(right?.goalsForPerGame ?? null, 3.0, 1.2)}
            leftText={
              left?.goalsForPerGame != null
                ? `${left.goalsForPerGame}${rankSuffix("goalsForPerGame", leftAbbrev)}`
                : "—"
            }
            rightText={
              right?.goalsForPerGame != null
                ? `${rankPrefix("goalsForPerGame", rightAbbrev)}${right.goalsForPerGame}`
                : "—"
            }
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            label="Goals Against / Game"
            leftVal={lowerBetterStrength(left?.goalsAgainstPerGame ?? null, 3.0, 2)}
            rightVal={lowerBetterStrength(right?.goalsAgainstPerGame ?? null, 3.0, 2)}
            leftText={
              left?.goalsAgainstPerGame != null
                ? `${left.goalsAgainstPerGame}${rankSuffix(
                    "goalsAgainstPerGame",
                    leftAbbrev
                  )}`
                : "—"
            }
            rightText={
              right?.goalsAgainstPerGame != null
                ? `${rankPrefix("goalsAgainstPerGame", rightAbbrev)}${right.goalsAgainstPerGame}`
                : "—"
            }
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            leftVal={higherBetterStrength(toPct100(left?.powerPlayPct ?? null), 20, 0.08)}
            rightVal={higherBetterStrength(toPct100(right?.powerPlayPct ?? null), 20, 0.08)}
            label="Power Play %"
            leftText={
              left?.powerPlayPct != null
                ? `${toPct100(left.powerPlayPct)?.toFixed(1)}%${rankSuffix(
                    "powerPlayPct",
                    leftAbbrev
                  )}`
                : "—"
            }
            rightText={
              right?.powerPlayPct != null
                ? `${rankPrefix("powerPlayPct", rightAbbrev)}${toPct100(
                    right.powerPlayPct
                  )?.toFixed(1)}%`
                : "—"
            }
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            leftVal={higherBetterStrength(toPct100(left?.penaltyKillPct ?? null), 80, 0.2)}
            rightVal={higherBetterStrength(toPct100(right?.penaltyKillPct ?? null), 80, 0.2)}
            label="Penalty Kill %"
            leftText={
              left?.penaltyKillPct != null
                ? `${toPct100(left.penaltyKillPct)?.toFixed(1)}%${rankSuffix(
                    "penaltyKillPct",
                    leftAbbrev
                  )}`
                : "—"
            }
            rightText={
              right?.penaltyKillPct != null
                ? `${rankPrefix("penaltyKillPct", rightAbbrev)}${toPct100(
                    right.penaltyKillPct
                  )?.toFixed(1)}%`
                : "—"
            }
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            label="Shots For / Game"
            leftVal={higherBetterStrength(left?.shotsForPerGame ?? null, 30, 0.2)}
            rightVal={higherBetterStrength(right?.shotsForPerGame ?? null, 30, 0.2)}
            leftText={
              left?.shotsForPerGame != null
                ? `${left.shotsForPerGame}${rankSuffix("shotsForPerGame", leftAbbrev)}`
                : "—"
            }
            rightText={
              right?.shotsForPerGame != null
                ? `${rankPrefix("shotsForPerGame", rightAbbrev)}${right.shotsForPerGame}`
                : "—"
            }
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            leftVal={lowerBetterStrength(left?.shotsAgainstPerGame ?? null, 30, 0.12)}
            rightVal={lowerBetterStrength(right?.shotsAgainstPerGame ?? null, 30, 0.12)}
            label="Shots Against / Game"
            leftText={
              left?.shotsAgainstPerGame != null
                ? `${left.shotsAgainstPerGame}${rankSuffix(
                    "shotsAgainstPerGame",
                    leftAbbrev
                  )}`
                : "—"
            }
            rightText={
              right?.shotsAgainstPerGame != null
                ? `${rankPrefix("shotsAgainstPerGame", rightAbbrev)}${right.shotsAgainstPerGame}`
                : "—"
            }
            leftColor={leftColor}
            rightColor={rightColor}
          />
        </div>
      </div>
    </div>
  );
}
