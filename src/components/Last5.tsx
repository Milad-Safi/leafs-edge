"use client";

import React from "react";
import StatRow from "@/components/StatRow";
import HotPlayersRows, { type HotL5Payload } from "@/components/HotPlayers";

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
  return (
    <div style={{ padding: 2, opacity: 0.95 }}>
      {/* top divider */}
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.08)",
          margin: "13px 0 10px",
        }}
      />

      {/* section title */}
      <div
        style={{
          padding: "14px 0",
          fontWeight: 900,
          letterSpacing: 0.67,
          opacity: 0.92,
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        LAST 5 GAMES
      </div>

      {/* bottom divider */}
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.08)",
          marginBottom: 20,
        }}
      />

      {loading && (
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
          Loading last 5…
        </div>
      )}

      {/* Record */}
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

      {/* Shots For */}
      <StatRow
        leftVal={left?.shotsForPerGame ?? null}
        rightVal={right?.shotsForPerGame ?? null}
        label="Shots For / Game (L5)"
        leftColor={leftColor}
        rightColor={rightColor}
      />
      <div style={{ height: 10 }} />

      {/* Shots Against */}
      <StatRow
        leftVal={left?.shotsAgainstPerGame ?? null}
        rightVal={right?.shotsAgainstPerGame ?? null}
        label="Shots Against / Game (L5)"
        leftColor={leftColor}
        rightColor={rightColor}
      />
      <div style={{ height: 10 }} />

      {/* Power Play */}
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

      {/* Penalty Kill */}
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

      <div style={{ height: 10 }} />

      {/* Hot players */}
      <HotPlayersRows
        left={hotLeft}
        right={hotRight}
        leftColor={leftColor}
        rightColor={rightColor}
      />
    </div>
  );
}
