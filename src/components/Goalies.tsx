"use client";

// Goalies comparison section

import React from "react";
import StatRow from "@/components/StatRow";
import useGoalies, { type ProjectedStarter } from "@/hooks/useGoalies";

// Build initials from a goalie name (used when headshot is missing)
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[p.length - 1]?.[0] ?? "")).toUpperCase();
}

// Format save percentage as a 3-decimal string
function fmtSvDecimal(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(3);
}

// Format a numeric stat with a fixed number of decimals
function fmtNum(v: number | null | undefined, digits = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

// Convert SV% into a positive comparison strength value (higher SV% => stronger)
function svStrength(sv: number | null | undefined) {
  if (sv == null || !Number.isFinite(sv)) return null;
  const baseline = 0.904;
  const k = 20;
  return Math.exp(k * (sv - baseline));
}

// Convert a last-5 record into a goodness value (fewer lost points => stronger)
function recordGoodness(
  s: { games: number; record: { w: number; l: number; ot: number } } | null
): number | null {
  if (!s || !s.games) return null;
  const pts = s.record.w * 2 + s.record.ot;
  const maxPts = s.games * 2;
  const lostPts = Math.max(0, maxPts - pts);
  return 1 / (lostPts + 1);
}

// Invert a positive metric so “lower is better” becomes “higher is better” for bars. (goals against lower is better)
function inversePositive(v: number | null | undefined): number | null {
  if (v == null || !Number.isFinite(v) || v <= 0) return null;
  return 1 / v;
}

// Small label/value row used inside the goalie cards
function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="GoalieStatLine">
      <div className="GoalieStatLabel">{label}</div>
      <div className="GoalieStatValue">{value}</div>
    </div>
  );
}

// Card UI for a single team’s projected starter
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
    <div className="GoalieCard">
      <div className="GoalieCardInner">
        <div className="GoalieCardTitle">{title}</div>

        {loading ? (
          <div className="GoalieLoading">Loading projected starter…</div>
        ) : !starter ? (
          <div className="GoalieEmpty">No projected starter.</div>
        ) : (
          <div className="GoalieMain">
            <div className="GoalieHeadshot">
              {starter.headshot ? (
                <img
                  src={starter.headshot}
                  alt={starter.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="GoalieInitials">{initials(starter.name)}</div>
              )}
            </div>

            <div>
              <div className="GoalieName">{starter.name}</div>

              <div className="GoalieStats">
                <StatLine
                  label="Record"
                  value={`${starter.record.wins}-${starter.record.losses}-${starter.record.ot}`}
                />
                <StatLine label="SV%" value={fmtSvDecimal(starter.savePct)} />
                <StatLine label="GAA" value={fmtNum(starter.gaa, 2)} />
              </div>

              <div className="GoalieMeta">
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

// Main section that renders projected starters + last-5 split comparisons
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
        <div className="GoaliesShell">
          <div style={{ padding: 18, paddingBottom: 16 }}>
            <div className="goaliesGrid">
              <GoalieCard
                title="Projected Starter:"
                loading={loading}
                starter={lStarter}
              />
              <GoalieCard
                title="Projected Starter:"
                loading={loading}
                starter={rStarter}
              />
            </div>
          </div>

          <div className="GoaliesDivider" />

          <div style={{ padding: 18, paddingTop: 16 }}>
            <div className="GoaliesLast5Title">
              Last 5 Splits (Projected Starters)
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              <StatRow
                label="Record"
                leftVal={recordGoodness(l5Left)}
                rightVal={recordGoodness(l5Right)}
                leftText={
                  l5Left
                    ? `${l5Left.record.w}-${l5Left.record.l}-${l5Left.record.ot}`
                    : "—"
                }
                rightText={
                  l5Right
                    ? `${l5Right.record.w}-${l5Right.record.l}-${l5Right.record.ot}`
                    : "—"
                }
                leftColor={leftColor}
                rightColor={rightColor}
              />

              <StatRow
                label="Save Percentage"
                leftVal={svStrength(l5Left?.svPct ?? null)}
                rightVal={svStrength(l5Right?.svPct ?? null)}
                leftText={l5Left?.svPct != null ? l5Left.svPct.toFixed(3) : "—"}
                rightText={
                  l5Right?.svPct != null ? l5Right.svPct.toFixed(3) : "—"
                }
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

            <div className="GoaliesFootnote">
              *Splits computed from last 5 team games where the projected goalie
              played (TOI &gt; 0).
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
