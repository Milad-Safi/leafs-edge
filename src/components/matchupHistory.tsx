"use client";

import React from "react";
import StatRow from "@/components/StatRow";
import type { MatchupHistoryPayload } from "@/hooks/useMatchupHistory";
import { UI } from "@/styles/uiStyles";

export default function MatchupHistory({
  data,
  loading,
  leftAbbrev,
  rightAbbrev,
  leftColor,
  rightColor,
}: {
  data: MatchupHistoryPayload | null;
  loading: boolean;
  leftAbbrev: string;
  rightAbbrev: string;
  leftColor: string;
  rightColor: string;
}) {
  if (loading) {
    return (
      <div style={UI.moduleWrapper()}>
        <div style={UI.pad(18)}>
          <div style={UI.headerRow()}>
            <div style={UI.title()}>Matchup history</div>
            <div style={UI.meta()}>Last 2 seasons</div>
          </div>
          <div style={{ opacity: 0.65 }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (!data || data.gamesFound === 0) {
    return (
      <div style={UI.moduleWrapper()}>
        <div style={UI.pad(18)}>
          <div style={UI.headerRow()}>
            <div style={UI.title()}>Matchup history</div>
            <div style={UI.meta()}>Last 2 seasons</div>
          </div>
          <div style={{ opacity: 0.65 }}>
            No head-to-head games found (this + last season).
          </div>
        </div>
      </div>
    );
  }

  const left = data.leaders[leftAbbrev] ?? { topGoals: null, topPoints: null, topSog: null };
  const right = data.leaders[rightAbbrev] ?? { topGoals: null, topPoints: null, topSog: null };

  return (
    <div style={UI.moduleWrapper()}>
      <div style={UI.pad(18)}>
        <div style={{ ...UI.headerRow(), justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div style={UI.title()}>Matchup history</div>
                <div style={{ ...UI.meta(), marginTop: 4 }}>
                    Last 2 seasons • {data.gamesFound} game{data.gamesFound === 1 ? "" : "s"}
                </div>
            </div>
        </div>
        <div style={UI.rowsGrid(12)}>
          <StatRow
            label="Most Goals"
            leftVal={left.topGoals?.goals ?? null}
            rightVal={right.topGoals?.goals ?? null}
            leftText={left.topGoals ? `${left.topGoals.name} (${left.topGoals.goals} G)` : "—"}
            rightText={right.topGoals ? `${right.topGoals.name} (${right.topGoals.goals} G)` : "—"}
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            label="Most Points"
            leftVal={left.topPoints?.points ?? null}
            rightVal={right.topPoints?.points ?? null}
            leftText={left.topPoints ? `${left.topPoints.name} (${left.topPoints.points} P)` : "—"}
            rightText={right.topPoints ? `${right.topPoints.name} (${right.topPoints.points} P)` : "—"}
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            label="Most SOG"
            leftVal={left.topSog?.sog ?? null}
            rightVal={right.topSog?.sog ?? null}
            leftText={left.topSog ? `${left.topSog.name} (${left.topSog.sog} SOG)` : "—"}
            rightText={right.topSog ? `${right.topSog.name} (${right.topSog.sog} SOG)` : "—"}
            leftColor={leftColor}
            rightColor={rightColor}
          />
        </div>
      </div>
    </div>
  );
}
