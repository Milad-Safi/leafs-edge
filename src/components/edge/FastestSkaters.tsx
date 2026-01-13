"use client";

import React from "react";
import type { EdgeFastestSkater } from "@/hooks/useTeamEdge";
import useRosterHeadshots from "@/hooks/useRosterHeadshots";

// Renders the top skating-speed leaders as small cards with optional headshots
// Uses roster headshots by playerId and falls back cleanly if images fail to load

// Format a speed value with a stable placeholder for missing data
function fmt(n: number) {
  return Number.isFinite(n) ? n.toFixed(2) : "–";
}

// Coerce unknown playerId values into a usable numeric id
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
  // Headshot lookup map keyed by numeric player id
  const { headshotById } = useRosterHeadshots(team, season);

  // Track image load failures per player id to avoid repeated broken fetches
  const [imgFailed, setImgFailed] = React.useState<Set<number>>(() => new Set());

  // Reset failure cache when the team or season context changes
  React.useEffect(() => {
    setImgFailed(new Set());
  }, [team, season]);

  // Empty state when we have no EDGE speed rows to show
  if (!rows?.length) {
    return <div style={{ opacity: 0.75 }}>No skating-speed data.</div>;
  }

  return (
    // Card list container with list semantics for accessibility
    <div className="EdgeCards" role="list" aria-label="Fastest skaters">
      {/* Show only the top 3 entries for this section */}
      {rows.slice(0, 3).map((r, idx) => {
        // Resolve a stable numeric player id for headshot lookup
        const pid = toNumId((r as any).playerId);

        // Pull headshot url if available in the roster map
        const headshot = pid != null ? headshotById.get(pid) : undefined;

        // Only show the image if we have a url and it has not failed before
        const showImg = !!headshot && pid != null && !imgFailed.has(pid);

        return (
          <div
            key={`${(r as any).playerId ?? r.name}-${idx}`}
            className="EdgeCard"
            role="listitem"
          >
            {/* Headshot when available, otherwise a consistent placeholder block */}
            {showImg ? (
              <img
                className="EdgeCardImg"
                src={headshot}
                alt={r.name}
                loading="lazy"
                onError={() => {
                  // Cache failures to prevent rerender loops of broken images
                  if (pid == null) return;
                  setImgFailed((prev) => {
                    const next = new Set(prev);
                    next.add(pid);
                    return next;
                  });
                }}
              />
            ) : (
              <div className="EdgeCardImgFallback" aria-hidden="true" />
            )}

            {/* Player name */}
            <div className="EdgeCardName">{r.name}</div>

            {/* Numeric speed value formatted to 2 decimals */}
            <div className="EdgeCardValue">{fmt(r.mph)}</div>

            {/* Static label describing the metric */}
            <div className="EdgeCardLabel">Fastest Skating Speed · MPH</div>
          </div>
        );
      })}
    </div>
  );
}
