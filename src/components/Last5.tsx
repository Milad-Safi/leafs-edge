"use client";

import React from "react";
import StatRow from "@/components/StatRow";
import HotPlayersRows from "@/components/HotPlayers";
import { UI } from "@/styles/uiStyles";

import type { HotL5Payload, TeamLast5 } from "@/types/api";
import { higherBetterStrength, lowerBetterStrength, toPct100 } from "@/lib/statsMath";

// Re-export types for backwards-compat with existing imports.
export type { TeamLast5 } from "@/types/api";

export default function Last5Section({
  left,
  right,
  loading,
  leftColor,
  rightColor,
  hotLeft,
  hotRight,
}: {
  left: TeamLast5 | null;
  right: TeamLast5 | null;
  loading: boolean;
  leftColor: string;
  rightColor: string;
  hotLeft: HotL5Payload | null;
  hotRight: HotL5Payload | null;
}) {
  const lRec = left?.record;
  const rRec = right?.record;

  const lPP = left?.powerPlay;
  const rPP = right?.powerPlay;

  const lPK = left?.penaltyKill;
  const rPK = right?.penaltyKill;

  return (
    <div style={UI.moduleWrapper()}>
      <div style={{ ...UI.pad(18), opacity: 0.95 }}>
        {/* TITLE */}
        <div
          style={{
            paddingTop: 3,
            paddingBottom: 14,
            fontWeight: 900,
            opacity: 0.92,
            textAlign: "center",
          }}
        >
          Last 5 Games:
        </div>

        {loading && (
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
            Loading last 5 Games…
          </div>
        )}

        {/* STATS */}
        <div style={UI.rowsGrid(10)}>
          <StatRow
            leftVal={typeof lRec?.w === "number" ? lRec.w : null}
            rightVal={typeof rRec?.w === "number" ? rRec.w : null}
            label="Record"
            leftText={lRec ? `${lRec.w}-${lRec.l}-${lRec.otl}` : "—"}
            rightText={rRec ? `${rRec.w}-${rRec.l}-${rRec.otl}` : "—"}
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            leftVal={higherBetterStrength(left?.goalsForPerGame ?? null, 3.0, 1)}
            rightVal={higherBetterStrength(right?.goalsForPerGame ?? null, 3.0, 1)}
            label="Goals For / Game"
            leftText={left?.goalsForPerGame != null ? left.goalsForPerGame.toFixed(2) : "—"}
            rightText={right?.goalsForPerGame != null ? right.goalsForPerGame.toFixed(2) : "—"}
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            leftVal={lowerBetterStrength(left?.goalsAgainstPerGame ?? null, 3.0, 1.4)}
            rightVal={lowerBetterStrength(right?.goalsAgainstPerGame ?? null, 3.0, 1.4)}
            label="Goals Against / Game"
            leftText={left?.goalsAgainstPerGame != null ? left.goalsAgainstPerGame.toFixed(2) : "—"}
            rightText={right?.goalsAgainstPerGame != null ? right.goalsAgainstPerGame.toFixed(2) : "—"}
            leftColor={leftColor}
            rightColor={rightColor}
          />


          <StatRow
            leftVal={higherBetterStrength(left?.shotsForPerGame ?? null, 30, 0.4)}
            rightVal={higherBetterStrength(right?.shotsForPerGame ?? null, 30, 0.4)}
            label="Shots For / Game"
            leftText={left?.shotsForPerGame != null ? `${left.shotsForPerGame}` : "—"}
            rightText={right?.shotsForPerGame != null ? `${right.shotsForPerGame}` : "—"}
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            leftVal={lowerBetterStrength(left?.shotsAgainstPerGame ?? null, 30, 0.25)}
            rightVal={lowerBetterStrength(right?.shotsAgainstPerGame ?? null, 30, 0.25)}
            label="Shots Against / Game"
            leftText={left?.shotsAgainstPerGame != null ? `${left.shotsAgainstPerGame}` : "—"}
            rightText={right?.shotsAgainstPerGame != null ? `${right.shotsAgainstPerGame}` : "—"}
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            leftVal={higherBetterStrength(toPct100(lPP?.pct ?? null), 20, 0.05)}
            rightVal={higherBetterStrength(toPct100(rPP?.pct ?? null), 20, 0.05)}
            label="Power Play %"
            leftText={
              lPP?.pct != null
                ? `${toPct100(lPP.pct)?.toFixed(1)}% (${lPP.goals}/${lPP.opps})`
                : "—"
            }
            rightText={
              rPP?.pct != null
                ? `(${rPP.goals}/${rPP.opps}) ${toPct100(rPP.pct)?.toFixed(1)}%`
                : "—"
            }
            leftColor={leftColor}
            rightColor={rightColor}
          />

          <StatRow
            leftVal={higherBetterStrength(toPct100(lPK?.pct ?? null), 80, 0.04)}
            rightVal={higherBetterStrength(toPct100(rPK?.pct ?? null), 80, 0.04)}
            label="Penalty Kill %"
            leftText={
              lPK?.pct != null
                ? `${toPct100(lPK.pct)?.toFixed(1)}% (${lPK.oppPPGoals}/${lPK.oppPPOpps})`
                : "—"
            }
            rightText={
              rPK?.pct != null
                ? `(${rPK.oppPPGoals}/${rPK.oppPPOpps}) ${toPct100(rPK.pct)?.toFixed(1)}% `
                : "—"
            }
            leftColor={leftColor}
            rightColor={rightColor}
          />
        </div>

        <div style={{ height: 18 }} />

        <HotPlayersRows
          left={hotLeft}
          right={hotRight}
          leftColor={leftColor}
          rightColor={rightColor}
          hideHeader
        />
      </div>
    </div>
  );
}
