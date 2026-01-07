"use client";

import React from "react";
import StatRow from "@/components/StatRow";
import { UI } from "@/styles/uiStyles";

import type { HotL5Payload, HotLeader } from "@/types/api";

// Re-export types for backwards-compat with existing imports.
export type { HotL5Payload } from "@/types/api";

type Leader = HotLeader;

function shortName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return full;
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (first.endsWith(".")) return full;
  return `${first[0]}. ${last}`;
}

function fmtGoals(p: Leader | null) {
  return p ? `${shortName(p.name)} — ${p.goals} G` : "-";
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
  hideHeader = false,
}: {
  left: HotL5Payload | null;
  right: HotL5Payload | null;
  leftColor: string;
  rightColor: string;
  hideHeader?: boolean;
}) {
  const lg = left?.leaders.goals ?? null;
  const rg = right?.leaders.goals ?? null;

  const lp = left?.leaders.points ?? null;
  const rp = right?.leaders.points ?? null;

  const ls = left?.leaders.shots ?? null;
  const rs = right?.leaders.shots ?? null;

  return (
    <>
      {!hideHeader && (
        <div style={{ marginTop: 6, marginBottom: 12 }}>
          <div style={{ marginTop: 0, marginRight: -16, marginBottom: 10, marginLeft: -16 }}>
            <div style={UI.hairline(0.08)} />
          </div>

          <div
            style={{
              paddingTop: 10,
              paddingRight: 0,
              paddingBottom: 10,
              paddingLeft: 0,
              fontWeight: 900,
              letterSpacing: 0.7,
              textTransform: "uppercase",
              opacity: 0.9,
              textAlign: "center",
            }}
          >
          </div>

          <div style={{ marginTop: 10, marginRight: -16, marginBottom: 0, marginLeft: -16 }}>
            <div style={UI.hairline(0.08)} />
          </div>
        </div>
      )}

      <div style={UI.rowsGrid(10)}>
        <StatRow
          leftVal={lg ? lg.goals : null}
          rightVal={rg ? rg.goals : null}
          label="Goals Leader"
          leftText={fmtGoals(lg)}
          rightText={fmtGoals(rg)}
          leftColor={leftColor}
          rightColor={rightColor}
        />

        <StatRow
          leftVal={lp ? lp.points : null}
          rightVal={rp ? rp.points : null}
          label="Points Leader"
          leftText={fmtPoints(lp)}
          rightText={fmtPoints(rp)}
          leftColor={leftColor}
          rightColor={rightColor}
        />

        <StatRow
          leftVal={ls ? ls.shots : null}
          rightVal={rs ? rs.shots : null}
          label="SOG Leader"
          leftText={fmtShots(ls)}
          rightText={fmtShots(rs)}
          leftColor={leftColor}
          rightColor={rightColor}
        />
      </div>
    </>
  );
}
