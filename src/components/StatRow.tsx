"use client";

// Reusable stat comparison row component

import React from "react";

// Render a single comparison row with proportional bar fills and values
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
  // Normalize inputs to finite numbers or null
  const l =
    typeof leftVal === "number" && Number.isFinite(leftVal) ? leftVal : null;
  const r =
    typeof rightVal === "number" && Number.isFinite(rightVal) ? rightVal : null;

  // Use absolute values to compute proportional bar widths
  const lAbs = l != null ? Math.abs(l) : null;
  const rAbs = r != null ? Math.abs(r) : null;

  const total = lAbs != null && rAbs != null ? lAbs + rAbs : null;

  // Default to a 50/50 split when values are missing or zero
  const leftPct = total && total > 0 ? (lAbs! / total) * 100 : 50;
  const rightPct = total && total > 0 ? (rAbs! / total) * 100 : 50;

  return (
    <div className="StatRow">
      {/* Team color fills */}
      <div className="StatRowFill">
        <div style={{ width: `${leftPct}%`, background: leftColor }} />
        <div style={{ width: `${rightPct}%`, background: rightColor }} />
      </div>

      {/* Content */}
      <div className="StatRowContent">
        <div className="StatRowValue left">
          {leftText ?? (l != null ? l : "—")}
        </div>

        <div className="StatRowLabel">{label}</div>

        <div className="StatRowValue right">
          {rightText ?? (r != null ? r : "—")}
        </div>
      </div>
    </div>
  );
}
