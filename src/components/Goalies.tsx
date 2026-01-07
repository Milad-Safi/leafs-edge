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
    <div className="leGoalieStatLine">
      <div className="leGoalieStatLabel">{label}</div>
      <div className="leGoalieStatValue">{value}</div>
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
    <div className="leGoalieCard">
      <div className="leGoalieCardInner">
        <div className="leGoalieCardTitle">{title}</div>

        {loading ? (
          <div className="leGoalieLoading">Loading projected starter…</div>
        ) : !starter ? (
          <div className="leGoalieEmpty">No projected starter.</div>
        ) : (
          <div className="leGoalieMain">
            <div className="leGoalieHeadshot">
              {starter.headshot ? (
                <img
                  src={starter.headshot}
                  alt={starter.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="leGoalieInitials">{initials(starter.name)}</div>
              )}
            </div>

            <div>
              <div className="leGoalieName">{starter.name}</div>

              <div className="leGoalieStats">
                <StatLine
                  label="Record"
                  value={`${starter.record.wins}-${starter.record.losses}-${starter.record.ot}`}
                />
                <StatLine label="SV%" value={fmtSvDecimal(starter.savePct)} />
                <StatLine label="GAA" value={fmtNum(starter.gaa, 2)} />
              </div>

              <div className="leGoalieMeta">
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
    <section style={{ width: "100%", marginTop: 34 }}>
      <div style={{ padding: "0 18px 18px" }}>
        <div className="leGoaliesShell">
          <div style={{ padding: 18, paddingBottom: 16 }}>
            <div className="goaliesGrid">
              <GoalieCard title="Projected Starter:" loading={loading} starter={lStarter} />
              <GoalieCard title="Projected Starter:" loading={loading} starter={rStarter} />
            </div>
          </div>

          <div className="leGoaliesDivider" />

          <div style={{ padding: 18, paddingTop: 16 }}>
            <div className="leGoaliesLast5Title">Last 5 Splits (Projected Starters)</div>

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

            <div className="leGoaliesFootnote">
              *Splits computed from last 5 team games where the projected goalie played (TOI &gt; 0).
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
