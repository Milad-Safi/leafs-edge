"use client";

import React from "react";
import StatRow from "@/components/StatRow";
import useGoalies, { type ProjectedStarter } from "@/hooks/useGoalies";

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[p.length - 1]?.[0] ?? "")).toUpperCase();
}

function fmtSvDecimal(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(3);
}

function fmtNum(v: number | null | undefined, digits = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

function svStrength(sv: number | null | undefined) {
  if (sv == null || !Number.isFinite(sv)) return null;
  const baseline = 0.904;
  const k = 20;
  return Math.exp(k * (sv - baseline));
}

function recordGoodness(
  s: { games: number; record: { w: number; l: number; ot: number } } | null
): number | null {
  if (!s || !s.games) return null;
  const pts = s.record.w * 2 + s.record.ot;
  const maxPts = s.games * 2;
  const lostPts = Math.max(0, maxPts - pts);
  return 1 / (lostPts + 1);
}

function inversePositive(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v) || v <= 0) return null;
  return 1 / v;
}

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
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.22)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.30)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 18 }}>
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
                gap: 16,
                alignItems: "center",
                marginTop: 8,
              }}
            >
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
                  <img
                    src={starter.headshot}
                    alt={starter.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ fontWeight: 950, fontSize: 24 }}>
                    {initials(starter.name)}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 950, fontSize: 18 }}>{starter.name}</div>

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
                  {typeof starter.last5Starts === "number"
                    ? ` • Last 5 starts: ${starter.last5Starts}`
                    : ""}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const { left, right, loading } = useGoalies({ leftTeam, rightTeam, gameDate });

  const lStarter = left?.projectedStarter ?? null;
  const rStarter = right?.projectedStarter ?? null;

  const l5Left = lStarter?.last5Splits ?? null;
  const l5Right = rStarter?.last5Splits ?? null;

  return (
    <section style={{ width: "100%", marginTop: 26 }}>
      <div style={{ padding: "0 18px 18px" }}>
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 18px 60px rgba(0,0,0,0.30)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: 18, paddingBottom: 16 }}>
            {/* ONLY CHANGE IS THIS className */}
            <div
              className="goaliesGrid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                alignItems: "stretch",
              }}
            >
              <GoalieCard title="Projected Starter:" loading={loading} starter={lStarter} />
              <GoalieCard title="Projected Starter:" loading={loading} starter={rStarter} />
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />

          <div style={{ padding: 18, paddingTop: 16 }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>
              Last 5 Splits (Projected Starters)
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              <StatRow
                label="Record"
                leftVal={recordGoodness(l5Left)}
                rightVal={recordGoodness(l5Right)}
                leftText={
                  l5Left ? `${l5Left.record.w}-${l5Left.record.l}-${l5Left.record.ot}` : "—"
                }
                rightText={
                  l5Right ? `${l5Right.record.w}-${l5Right.record.l}-${l5Right.record.ot}` : "—"
                }
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
                rightText={l5Right?.gaa != null ? l5Right?.gaa.toFixed(2) : "—"}
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
