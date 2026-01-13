"use client";

/**
 * Team trend prediction card
 *
 * Purpose:
 * - Render the ML trend output as a single card with a confidence bar
 * - Map raw model fields into human text like "improve" and a color-coded bar
 * - Handle loading, error, and empty states without breaking layout
 */

import React, { useMemo } from "react";

export type TeamTrendPayload = {
  team: string;
  as_of: string;
  n_requested: number;
  n_used: number;
  range?: { newest?: string; oldest?: string };
  trend: "UP" | "FLAT" | "DOWN" | string;
  confidence: number; // 0..1
};

// Clamp any number into [0, 1] for safe percent math
function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

// Convert 0..1 confidence into a 0..100 percent integer
function pct(conf: number) {
  return Math.round(clamp01(conf) * 100);
}

// Convert model trend class into readable verb for the sentence
function trendText(t: string) {
  const key = String(t || "").toUpperCase();
  if (key === "UP") return "improve";
  if (key === "DOWN") return "regress";
  if (key === "FLAT") return "hold steady";
  return "perform unpredictably";
}

// Normalize trend string into a stable uppercase key for styling logic
function trendKey(t: string) {
  return String(t || "").toUpperCase();
}

export default function TeamTrend({
  data,
  loading,
  error,
  title,
}: {
  data: TeamTrendPayload | null;
  loading?: boolean;
  error?: string | null;
  title?: string;
}) {
  // Derived values for display text and styling
  const c = useMemo(() => (data ? pct(data.confidence) : 0), [data]);
  const t = useMemo(() => (data ? trendText(data.trend) : "Unknown"), [data]);
  const team = useMemo(() => (data?.team || "TEAM").toUpperCase(), [data]);
  const k = useMemo(() => trendKey(data?.trend ?? ""), [data?.trend]);

  // Optional date range text for the last-N window
  const rangeText = useMemo(() => {
    const oldest = data?.range?.oldest;
    const newest = data?.range?.newest;
    if (!oldest || !newest) return null;
    return `${oldest} → ${newest}`;
  }, [data]);

  // Pick bar fill color based on predicted direction
  const barFillColor = useMemo(() => {
    if (k === "UP") return "rgba(34, 197, 94, 0.9)";
    if (k === "DOWN") return "rgba(239, 68, 68, 0.9)";
    return "rgba(255,255,255,0.75)";
  }, [k]);

  // Pick the verb color in the sentence so the direction pops
  const trendWordColor = useMemo(() => {
    if (k === "UP") return "rgba(134, 239, 172, 1)";
    if (k === "DOWN") return "rgba(253, 164, 175, 1)";
    return "rgba(255,255,255,0.9)";
  }, [k]);

  // Card container styles
  const card: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    padding: 18,
  };

  // Small uppercase label at the top
  const label: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
  };

  // Main sentence that explains the prediction
  const headline: React.CSSProperties = {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 700,
    color: "rgba(255,255,255,0.92)",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    lineHeight: 1.2,
  };

  // Confidence bar wrapper
  const barWrap: React.CSSProperties = {
    marginTop: 10,
    height: 10,
    width: "100%",
    borderRadius: 9999,
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  };

  // Confidence bar fill sized by c percent
  const barFill: React.CSSProperties = {
    height: "100%",
    width: `${c}%`,
    borderRadius: 9999,
    background: barFillColor,
  };

  // Row that labels the confidence number
  const metaRow: React.CSSProperties = {
    marginTop: 6,
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  };

  // Footnote block explaining the window and model reasoning
  const foot: React.CSSProperties = {
    marginTop: 10,
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.35,
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={card}>
        <div style={label}>{title ?? `${team} Performance Trend`}</div>

        {/* Loading state */}
        {loading ? (
          <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            Loading…
          </div>
        ) : error ? (
          /* Error state */
          <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            Error: {error}
          </div>
        ) : !data ? (
          /* Empty state */
          <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            No data.
          </div>
        ) : (
          <>
            {/* Main prediction sentence */}
            <div style={headline}>
              <span>We are</span>
              <span>{c}%</span>
              <span>confident that</span>
              <span style={{ fontWeight: 800, color: "white" }}>{team}</span>
              <span>will</span>
              <span style={{ fontWeight: 800, color: trendWordColor }}>{t}</span>
              <span>over their next 5 games</span>
            </div>

            {/* Confidence label row */}
            <div style={metaRow}>
              <span>Confidence</span>
              <span style={{ fontWeight: 700 }}>{c}%</span>
            </div>

            {/* Confidence bar */}
            <div style={barWrap}>
              <div style={barFill} />
            </div>

            {/* Model context and data window explanation */}
            <div style={foot}>
              <div>
                Based on the last <strong>{data.n_used}</strong> games
                {rangeText ? ` (${rangeText})` : ""}
              </div>
              <div>
                Machine-learning model trained on historical NHL games. It compares recent performance
                patterns (goals, shots, special teams, venue effects, opponent strength) against
                similar past situations to estimate short-term performance direction (Improve/Regress)
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
