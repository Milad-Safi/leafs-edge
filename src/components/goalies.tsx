"use client";

import React, { useEffect, useState } from "react";
import StatRow from "@/components/StatRow";

/* =========================
   Types
========================= */

type GoalieRecord = { wins: number; losses: number; ot: number };

type Last5GoalieSplits = {
  games: number;
  record: { w: number; l: number; ot: number };
  svPct: number | null; // 0.xxx
  gaa: number | null; // float
};

type ProjectedStarter = {
  playerId: number;
  name: string;
  headshot: string | null;

  record: GoalieRecord;
  gamesPlayed: number;

  savePct: number | null;
  gaa: number | null;

  last5Starts?: number | null;
  last5Splits?: Last5GoalieSplits | null;
};

type GoalieApiPayload = {
  team: string;
  projectedStarter: ProjectedStarter | null;
  meta?: any;
  error?: string;
};

/* =========================
   Helpers
========================= */

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[p.length - 1]?.[0] ?? "")).toUpperCase();
}

function fmtSvDecimal(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(3); // 0.911
}

function fmtNum(v: number | null | undefined, digits = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

/**
 * Exponential weighting for SV% so .890 vs .920 looks dramatic.
 * Baseline ~ league average.
 */
function svStrength(sv: number | null | undefined) {
  if (sv == null || !Number.isFinite(sv)) return null;
  const baseline = 0.904;
  const k = 20;
  return Math.exp(k * (sv - baseline));
}

/**
 * Record goodness:
 * uses "lost points" so 0-3-0 < 0-2-0 even if both have 0 wins.
 */
function recordGoodness(s: Last5GoalieSplits | null): number | null {
  if (!s || !s.games) return null;
  const pts = s.record.w * 2 + s.record.ot;
  const maxPts = s.games * 2;
  const lostPts = Math.max(0, maxPts - pts);
  return 1 / (lostPts + 1);
}

/** Lower GAA is better */
function inversePositive(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v) || v <= 0) return null;
  return 1 / v;
}

/* =========================
   Small stat line
========================= */

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      <div
        style={{
          width: 90,
          color: "rgba(255,255,255,0.55)",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div style={{ color: "rgba(255,255,255,0.92)", fontSize: 15, fontWeight: 950 }}>
        {value}
      </div>
    </div>
  );
}

/* =========================
   Goalie Card (rounded bottom ON)
========================= */

function GoalieCard({
  title,
  loading,
  starter,
}: {
  title: string;
  loading: boolean;
  starter: ProjectedStarter | null;
}) {
  return (
    <div
      style={{
        borderRadius: 18, // ✅ rounded bottom stays
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.22)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.30)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 22 }}>
        <div style={{ fontWeight: 950, fontSize: 18, color: "rgba(255,255,255,0.92)" }}>
          {title}
        </div>

        <div style={{ marginTop: 14 }}>
          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.65)" }}>Loading projected starter…</div>
          ) : !starter ? (
            <div style={{ color: "rgba(255,255,255,0.65)" }}>No projected starter.</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "92px 1fr",
                gap: 18,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              {/* Headshot */}
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {starter.headshot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={starter.headshot}
                    alt={starter.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ fontWeight: 950, fontSize: 24, color: "rgba(255,255,255,0.85)" }}>
                    {initials(starter.name)}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 950,
                    fontSize: 18,
                    color: "rgba(255,255,255,0.95)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={starter.name}
                >
                  {starter.name}
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  <StatLine
                    label="Record"
                    value={`${starter.record.wins}-${starter.record.losses}-${starter.record.ot}`}
                  />
                  <StatLine label="SV%" value={fmtSvDecimal(starter.savePct)} />
                  <StatLine label="GAA" value={fmtNum(starter.gaa, 2)} />
                </div>

                <div style={{ marginTop: 10, color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                  GP: {starter.gamesPlayed}
                  {typeof starter.last5Starts === "number" ? ` • Last 5 starts: ${starter.last5Starts}` : ""}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* subtle bottom fade so it feels finished */}
      <div
        style={{
          height: 14,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.0), rgba(0,0,0,0.22))",
        }}
      />
    </div>
  );
}

/* =========================
   Main Section
========================= */

export default function GoaliesSection({
  leftTeam,
  rightTeam,
  gameDate,
  leftColor,
  rightColor,
}: {
  leftTeam: string;
  rightTeam: string;
  gameDate: string;
  leftColor: string;
  rightColor: string;
}) {
  const [left, setLeft] = useState<GoalieApiPayload | null>(null);
  const [right, setRight] = useState<GoalieApiPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!leftTeam || !rightTeam || !gameDate) {
        setLeft(null);
        setRight(null);
        return;
      }

      setLoading(true);
      try {
        const [a, b] = await Promise.all([
          fetch(`/api/team/goalies?team=${leftTeam}&gameDate=${gameDate}`, { cache: "no-store" }).then((r) =>
            r.json()
          ),
          fetch(`/api/team/goalies?team=${rightTeam}&gameDate=${gameDate}`, { cache: "no-store" }).then((r) =>
            r.json()
          ),
        ]);

        if (cancelled) return;
        setLeft(a);
        setRight(b);
      } catch {
        if (cancelled) return;
        setLeft(null);
        setRight(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [leftTeam, rightTeam, gameDate]);

  const lStarter = left?.projectedStarter ?? null;
  const rStarter = right?.projectedStarter ?? null;

  const l5Left = lStarter?.last5Splits ?? null;
  const l5Right = rStarter?.last5Splits ?? null;

  return (
  <section style={{ width: "100%", marginTop: 26 }}>
    {/* keeps it off the outer site border */}
    <div style={{ padding: "0 18px 18px 18px" }}>
      {/* main module wrapper */}
      <div
        style={{
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.30)",
          overflow: "hidden",
        }}
      >
        {/* TOP: goalie cards */}
        <div style={{ padding: 18, paddingBottom: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1px 1fr",
              alignItems: "stretch",
            }}
          >
            <div style={{ paddingRight: 14 }}>
              <GoalieCard title="Projected Starter:" loading={loading} starter={lStarter} />
            </div>

            {/* middle split between the two cards */}
            <div style={{ background: "rgba(255,255,255,0.08)" }} />

            <div style={{ paddingLeft: 14 }}>
              <GoalieCard title="Projected Starter:" loading={loading} starter={rStarter} />
            </div>
          </div>
        </div>

        {/* DIVIDER between cards + bars (no extra box) */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

        {/* BOTTOM: bars directly on main container */}
        <div style={{ padding: 18, paddingTop: 16 }}>
          <div style={{ fontWeight: 950, fontSize: 16, color: "rgba(255,255,255,0.90)" }}>
            Last 5 Splits (Projected Starters)
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <StatRow
              label="Record"
              leftVal={recordGoodness(l5Left)}
              rightVal={recordGoodness(l5Right)}
              leftText={l5Left ? `${l5Left.record.w}-${l5Left.record.l}-${l5Left.record.ot}` : "—"}
              rightText={l5Right ? `${l5Right.record.w}-${l5Right.record.l}-${l5Right.record.ot}` : "—"}
              leftColor={leftColor}
              rightColor={rightColor}
            />

            <StatRow
              label="Save Percentage"
              leftVal={svStrength(l5Left?.svPct ?? null)}
              rightVal={svStrength(l5Right?.svPct ?? null)}
              leftText={l5Left?.svPct != null ? l5Left.svPct.toFixed(3) : "—"}
              rightText={l5Right?.svPct != null ? l5Right.svPct.toFixed(3) : "—"}
              leftColor={leftColor}
              rightColor={rightColor}
            />

            <StatRow
              label="Goals Against Average"
              leftVal={inversePositive(l5Left?.gaa ?? null)}
              rightVal={inversePositive(l5Right?.gaa ?? null)}
              leftText={l5Left?.gaa != null ? l5Left.gaa.toFixed(2) : "—"}
              rightText={l5Right?.gaa != null ? l5Right.gaa.toFixed(2) : "—"}
              leftColor={leftColor}
              rightColor={rightColor}
            />
          </div>

          <div style={{ marginTop: 10, color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
            *Splits computed from last 5 team games where the projected goalie played (TOI &gt; 0).
          </div>
        </div>
      </div>
    </div>
  </section>
);

}
