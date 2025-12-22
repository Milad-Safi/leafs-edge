"use client";

import React from "react";
import StatRow from "@/components/StatRow";

type Leader = {
  playerId: number;
  name: string;
  goals: number;
  assists: number;
  points: number;
  shots: number;
};

export type HotL5Payload = {
  team: string;
  leaders: {
    goals: Leader | null;
    points: Leader | null;
    shots: Leader | null;
  };
};

function shortName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return full;
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (first.endsWith(".")) return full; // already "A."
  return `${first[0]}. ${last}`;
}

function fmtGoals(p: Leader | null) {
  return p ? `${shortName(p.name)} — ${p.goals} G` : "—";
}
function fmtPoints(p: Leader | null) {
  return p ? `${shortName(p.name)} — ${p.points} P` : "—";
}
function fmtShots(p: Leader | null) {
  return p ? `${shortName(p.name)} — ${p.shots} SOG` : "—";
}

export default function HotPlayersRows({
  left,
  right,
  leftColor,
  rightColor,
}: {
  left: HotL5Payload | null;
  right: HotL5Payload | null;
  leftColor: string;
  rightColor: string;
}) {
  const lg = left?.leaders.goals ?? null;
  const rg = right?.leaders.goals ?? null;

  const lp = left?.leaders.points ?? null;
  const rp = right?.leaders.points ?? null;

  const ls = left?.leaders.shots ?? null;
  const rs = right?.leaders.shots ?? null;

  return (
  <>
    {/* divider + subheading + divider */}
    <div style={{ marginTop: 6, marginBottom: 12 }}>
      {/* top divider (full width, ignoring parent padding: 16) */}
      <div style={{ margin: "0 -16px 10px" }}>
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.08)",
          }}
        />
      </div>

      {/* subheading */}
      <div
        style={{
          padding: "10px 0",
          fontWeight: 900,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          opacity: 0.9,
          textAlign: "center",
        }}
      >
        LEADERS (LAST 5)
      </div>

      {/* bottom divider (full width) */}
      <div style={{ margin: "10px -16px 0" }}>
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.08)",
          }}
        />
      </div>
    </div>

    <StatRow
      leftVal={lg ? lg.goals : null}
      rightVal={rg ? rg.goals : null}
      label="Goals leader (L5)"
      leftText={fmtGoals(lg)}
      rightText={fmtGoals(rg)}
      leftColor={leftColor}
      rightColor={rightColor}
    />
    <div style={{ height: 10 }} />

    <StatRow
      leftVal={lp ? lp.points : null}
      rightVal={rp ? rp.points : null}
      label="Points leader (L5)"
      leftText={fmtPoints(lp)}
      rightText={fmtPoints(rp)}
      leftColor={leftColor}
      rightColor={rightColor}
    />
    <div style={{ height: 10 }} />

    <StatRow
      leftVal={ls ? ls.shots : null}
      rightVal={rs ? rs.shots : null}
      label="Shots leader (L5)"
      leftText={fmtShots(ls)}
      rightText={fmtShots(rs)}
      leftColor={leftColor}
      rightColor={rightColor}
    />
  </>
);

}
