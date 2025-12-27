"use client";

import React from "react";
import type { EdgeFastestSkater } from "@/hooks/useTeamEdge";
import useRosterHeadshots from "@/hooks/useRosterHeadshots";

function fmt(n: number) {
  return Number.isFinite(n) ? n.toFixed(2) : "–";
}

function toNumId(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default function FastestSkaters({
  rows,
  team,
  season,
}: {
  rows: EdgeFastestSkater[];
  team: string;
  season: string;
}) {
  const { headshotById } = useRosterHeadshots(team, season);
  const [imgFailed, setImgFailed] = React.useState<Set<number>>(() => new Set());

  React.useEffect(() => {
    setImgFailed(new Set());
  }, [team, season]);

  if (!rows?.length) {
    return <div style={{ opacity: 0.75 }}>No skating-speed data.</div>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
    >
      {rows.slice(0, 3).map((r) => {
        const pid = toNumId((r as any).playerId);
        const headshot = pid != null ? headshotById.get(pid) : undefined;
        const showImg = !!headshot && pid != null && !imgFailed.has(pid);

        return (
          <div
            key={(r as any).playerId}
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 14,
              padding: "16px 14px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {showImg ? (
              <img
                src={headshot}
                alt={r.name}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: 10,
                  display: "block",
                }}
                onError={() => {
                  if (pid == null) return;
                  setImgFailed((prev) => {
                    const next = new Set(prev);
                    next.add(pid);
                    return next;
                  });
                }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  marginBottom: 10,
                }}
              />
            )}

            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              {r.name}
            </div>

            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                marginBottom: 4,
              }}
            >
              {fmt(r.mph)}
            </div>

            <div style={{ fontSize: 12, opacity: 0.65, letterSpacing: 0.3 }}>
              Fastest Skating Speed · MPH
            </div>
          </div>
        );
      })}
    </div>
  );
}
