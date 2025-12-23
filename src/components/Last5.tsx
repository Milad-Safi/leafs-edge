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
  const lRec = left?.record;
  const rRec = right?.record;

  const lPP = left?.powerPlay;
  const rPP = right?.powerPlay;

  const lPK = left?.penaltyKill;
  const rPK = right?.penaltyKill;

  return (
    <div style={{ padding: 16, opacity: 0.95 }}>
      <div style={{ margin: "13px -16px 10px" }}>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>

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

      <div style={{ margin: "0 -16px 20px" }}>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>

      {loading && (
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
          Loading last 5…
        </div>
      )}

      <StatRow
        leftVal={typeof lRec?.w === "number" ? lRec.w : null}
        rightVal={typeof rRec?.w === "number" ? rRec.w : null}
        label="Record (W-L-OTL)"
        leftText={lRec ? `${lRec.w}-${lRec.l}-${lRec.otl}` : "—"}
        rightText={rRec ? `${rRec.w}-${rRec.l}-${rRec.otl}` : "—"}
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
        leftVal={lPP?.pct ?? null}
        rightVal={rPP?.pct ?? null}
        label="Power Play % (L5)"
        leftText={
          lPP?.pct != null
            ? `${lPP.pct}% (${lPP.goals}/${lPP.opps})`
            : "—"
        }
        rightText={
          rPP?.pct != null
            ? `${rPP.pct}% (${rPP.goals}/${rPP.opps})`
            : "—"
        }
        leftColor={leftColor}
        rightColor={rightColor}
      />
      <div style={{ height: 10 }} />

      <StatRow
        leftVal={lPK?.pct ?? null}
        rightVal={rPK?.pct ?? null}
        label="Penalty Kill % (L5)"
        leftText={
          lPK?.pct != null
            ? `${lPK.pct}% (${lPK.oppPPGoals}/${lPK.oppPPOpps})`
            : "—"
        }
        rightText={
          rPK?.pct != null
            ? `${rPK.pct}% (${rPK.oppPPGoals}/${rPK.oppPPOpps})`
            : "—"
        }
        leftColor={leftColor}
        rightColor={rightColor}
      />

      <div style={{ height: 10 }} />

      <HotPlayersRows
        left={hotLeft}
        right={hotRight}
        leftColor={leftColor}
        rightColor={rightColor}
      />
    </div>
  );
}
