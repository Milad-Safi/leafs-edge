"use client";

import React from "react";

export default function StatRow({
  leftVal,
  rightVal,
  label,
  leftText,
  rightText,
  leftColor,
  rightColor,
}: {
  leftVal: number | null;
  rightVal: number | null;
  label: string;
  leftText?: string;
  rightText?: string;
  leftColor: string;
  rightColor: string;
}) {
  const l = typeof leftVal === "number" && Number.isFinite(leftVal) ? leftVal : null;
  const r = typeof rightVal === "number" && Number.isFinite(rightVal) ? rightVal : null;

  const lAbs = l != null ? Math.abs(l) : null;
  const rAbs = r != null ? Math.abs(r) : null;

  const total = lAbs != null && rAbs != null ? lAbs + rAbs : null;

  const leftPct = total && total > 0 ? (lAbs! / total) * 100 : 50;
  const rightPct = total && total > 0 ? (rAbs! / total) * 100 : 50;

  return (
    <div className="leStatRow">
      {/* Team color fills */}
      <div className="leStatRowFill">
        <div style={{ width: `${leftPct}%`, background: leftColor }} />
        <div style={{ width: `${rightPct}%`, background: rightColor }} />
      </div>

      {/* Content */}
      <div className="leStatRowContent">
        <div className="leStatRowValue left">
          {leftText ?? (l != null ? l : "—")}
        </div>

        <div className="leStatRowLabel">{label}</div>

        <div className="leStatRowValue right">
          {rightText ?? (r != null ? r : "—")}
        </div>
      </div>
    </div>
  );
}
