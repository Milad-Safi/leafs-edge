"use client";

import React from "react";
import StatRow from "@/components/StatRow";

export type TeamLast5 = {
  team: string;
  games: number;
  record: { w: number; l: number; otl: number };
  goalsForPerGame: number;
  goalsAgainstPerGame: number;
  shotsForPerGame: number;
  shotsAgainstPerGame: number;
  powerPlay: { goals: number; opps: number; pct: number | null };
  penaltyKill: { oppPPGoals: number; oppPPOpps: number; pct: number | null };
  gameIds: number[];
  skippedPPGames?: number[];
  note?: string;
};

export default function Last5Section({
  left,
  right,
  loading,
  leftColor,
  rightColor,
}: {
  left: TeamLast5 | null;
  right: TeamLast5 | null;
  loading: boolean;
  leftColor: string;
  rightColor: string;
}) {
  return (
    <div style={{ padding: 16, opacity: 0.95 }}>
      <div style={{ height: 18 }} />
      <div
        style={{
          marginTop: 30,
          marginBottom: 10,
          fontWeight: 900,
          letterSpacing: 0.6,
          opacity: 0.92,
          textAlign: "center",
        }}
      >
        LAST 5 GAMES
      </div>

      {loading && (
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>Loading last 5…</div>
      )}

      <StatRow
        leftVal={left ? left.record.w : null}
        rightVal={right ? right.record.w : null}
        label="Record (W-L-OTL)"
        leftText={left ? `${left.record.w}-${left.record.l}-${left.record.otl}` : "—"}
        rightText={right ? `${right.record.w}-${right.record.l}-${right.record.otl}` : "—"}
        leftColor={leftColor}
        rightColor={rightColor}
      />
      <div style={{ height: 10 }} />

      <StatRow
        leftVal={left?.goalsForPerGame ?? null}
        rightVal={right?.goalsForPerGame ?? null}
        label="Goals For / Game (L5)"
        leftColor={leftColor}
        rightColor={rightColor}
      />
      <div style={{ height: 10 }} />

      <StatRow
        leftVal={left?.goalsAgainstPerGame ?? null}
        rightVal={right?.goalsAgainstPerGame ?? null}
        label="Goals Against / Game (L5)"
        leftColor={leftColor}
        rightColor={rightColor}
      />
      <div style={{ height: 10 }} />

      <StatRow
        leftVal={left?.shotsForPerGame ?? null}
        rightVal={right?.shotsForPerGame ?? null}
        label="Shots For / Game (L5)"
        leftColor={leftColor}
        rightColor={rightColor}
      />
      <div style={{ height: 10 }} />

      <StatRow
        leftVal={left?.shotsAgainstPerGame ?? null}
        rightVal={right?.shotsAgainstPerGame ?? null}
        label="Shots Against / Game (L5)"
        leftColor={leftColor}
        rightColor={rightColor}
      />
      <div style={{ height: 10 }} />

      <StatRow
        leftVal={left?.powerPlay.pct ?? null}
        rightVal={right?.powerPlay.pct ?? null}
        label="Power Play % (L5)"
        leftText={
          left?.powerPlay.pct != null
            ? `${left.powerPlay.pct}% (${left.powerPlay.goals}/${left.powerPlay.opps})`
            : "—"
        }
        rightText={
          right?.powerPlay.pct != null
            ? `${right.powerPlay.pct}% (${right.powerPlay.goals}/${right.powerPlay.opps})`
            : "—"
        }
        leftColor={leftColor}
        rightColor={rightColor}
      />
      <div style={{ height: 10 }} />

      <StatRow
        leftVal={left?.penaltyKill.pct ?? null}
        rightVal={right?.penaltyKill.pct ?? null}
        label="Penalty Kill % (L5)"
        leftText={
          left?.penaltyKill.pct != null
            ? `${left.penaltyKill.pct}% (${left.penaltyKill.oppPPGoals}/${left.penaltyKill.oppPPOpps})`
            : "—"
        }
        rightText={
          right?.penaltyKill.pct != null
            ? `${right.penaltyKill.pct}% (${right.penaltyKill.oppPPGoals}/${right.penaltyKill.oppPPOpps})`
            : "—"
        }
        leftColor={leftColor}
        rightColor={rightColor}
      />
    </div>
  );
}