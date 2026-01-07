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
    <div className="leEdgeCards" role="list" aria-label="Fastest skaters">
      {rows.slice(0, 3).map((r, idx) => {
        const pid = toNumId((r as any).playerId);
        const headshot = pid != null ? headshotById.get(pid) : undefined;
        const showImg = !!headshot && pid != null && !imgFailed.has(pid);

        return (
          <div
            key={`${(r as any).playerId ?? r.name}-${idx}`}
            className="leEdgeCard"
            role="listitem"
          >
            {showImg ? (
              <img
                className="leEdgeCardImg"
                src={headshot}
                alt={r.name}
                loading="lazy"
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
              <div className="leEdgeCardImgFallback" aria-hidden="true" />
            )}

            <div className="leEdgeCardName">{r.name}</div>

            <div className="leEdgeCardValue">{fmt(r.mph)}</div>

            <div className="leEdgeCardLabel">Fastest Skating Speed · MPH</div>
          </div>
        );
      })}
    </div>
  );
}
