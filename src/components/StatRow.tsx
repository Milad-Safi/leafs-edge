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
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.22,
        }}
      >
        <div style={{ width: `${leftPct}%`, background: leftColor }} />
        <div style={{ width: `${rightPct}%`, background: rightColor }} />

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 2,
            transform: "translateX(-1px)",
            background: "rgba(255,255,255,0.18)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 12,
          alignItems: "center",
          padding: "12px 10px",
        }}
      >
        <div style={{ textAlign: "left", fontWeight: 800 }}>
          {leftText ?? (l != null ? l : "—")}
        </div>

        <div style={{ textAlign: "center", opacity: 0.8 }}>{label}</div>

        <div style={{ textAlign: "right", fontWeight: 800 }}>
          {rightText ?? (r != null ? r : "—")}
        </div>
      </div>
    </div>
  );
}
