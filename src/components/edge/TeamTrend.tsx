"use client";

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

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function pct(conf: number) {
  return Math.round(clamp01(conf) * 100);
}

function trendText(t: string) {
  const key = String(t || "").toUpperCase();
  if (key === "UP") return "improve";
  if (key === "DOWN") return "regress";
  if (key === "FLAT") return "hold steady";
  return "perform unpredictably";
}

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
  const c = useMemo(() => (data ? pct(data.confidence) : 0), [data]);
  const t = useMemo(() => (data ? trendText(data.trend) : "Unknown"), [data]);
  const team = useMemo(() => (data?.team || "TEAM").toUpperCase(), [data]);
  const k = useMemo(() => trendKey(data?.trend ?? ""), [data?.trend]);

  const rangeText = useMemo(() => {
    const oldest = data?.range?.oldest;
    const newest = data?.range?.newest;
    if (!oldest || !newest) return null;
    return `${oldest} → ${newest}`;
  }, [data]);

  // bar color by trend
  const barFillColor = useMemo(() => {
    if (k === "UP") return "rgba(34, 197, 94, 0.9)";
    if (k === "DOWN") return "rgba(239, 68, 68, 0.9)";
    return "rgba(255,255,255,0.75)";
  }, [k]);

  const trendWordColor = useMemo(() => {
    if (k === "UP") return "rgba(134, 239, 172, 1)";
    if (k === "DOWN") return "rgba(253, 164, 175, 1)";
    return "rgba(255,255,255,0.9)";
  }, [k]);

  // styles
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

  const label: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
  };

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

  const barWrap: React.CSSProperties = {
    marginTop: 10,
    height: 10,
    width: "100%",
    borderRadius: 9999,
    background: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  };

  const barFill: React.CSSProperties = {
    height: "100%",
    width: `${c}%`,
    borderRadius: 9999,
    background: barFillColor,
  };

  const metaRow: React.CSSProperties = {
    marginTop: 6,
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  };

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

        {loading ? (
          <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            Loading…
          </div>
        ) : error ? (
          <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            Error: {error}
          </div>
        ) : !data ? (
          <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            No data.
          </div>
        ) : (
          <>
            <div style={headline}>
              <span>We are</span>
              <span>{c}%</span>
              <span>confident that</span>
              <span style={{ fontWeight: 800, color: "white" }}>{team}</span>
              <span>will</span>
              <span style={{ fontWeight: 800, color: trendWordColor }}>{t}</span>
              <span>over their next 5 games</span>
            </div>

            <div style={metaRow}>
              <span>Confidence</span>
              <span style={{ fontWeight: 700 }}>{c}%</span>
            </div>

            <div style={barWrap}>
              <div style={barFill} />
            </div>

            <div style={foot}>
              <div>
                Based on the last <strong>{data.n_used}</strong> games
                {rangeText ? ` (${rangeText})` : ""}
              </div>
              <div>
                Machine-learning model trained on historical NHL games. It compares recent performance
                patterns (goals, shots, special teams, venue effects, opponent strength) against
                similar past situations to estimate short-term performance direction.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
