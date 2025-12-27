"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import EdgeCard from "@/components/edge/EdgeCard";
import FastestSkaters from "@/components/edge/FastestSkaters";
import HardestShooters from "@/components/edge/HardestShooters";
import OffensiveZoneHeatmap from "@/components/edge/OffensiveZoneHeatmap";
import useTeamEdge from "@/hooks/useTeamEdge";

export default function OppPage() {
  const season = "20252026"; // keep hardcoded for now

  const search = useSearchParams();
  const opp = search.get("opp")?.toUpperCase() ?? null;

  const { data, loading, error, baseUrl } = useTeamEdge(opp, !!opp);

  return (
    <main style={{ minHeight: "100vh", color: "white", padding: 24 }}>
      <div style={{ display: "grid", gap: 14 }}>
        <EdgeCard
          title={opp ? `${opp} Edge` : "Opponent Edge"}
          subtitle={
            opp
              ? `Live from ${baseUrl} — skating speed, shot speed, and shot-location areas.`
              : "Pick a game from the schedule bar to set an opponent."
          }
        >
          {!opp ? (
            <div style={{ opacity: 0.75 }}>No opponent selected.</div>
          ) : loading ? (
            <div style={{ opacity: 0.75 }}>Loading…</div>
          ) : error ? (
            <div style={{ opacity: 0.75 }}>Error: {error}</div>
          ) : data ? (
            <div style={{ opacity: 0.85, fontSize: 13 }}>
              Updated via backend: top speeds + area totals.
            </div>
          ) : (
            <div style={{ opacity: 0.75 }}>No data.</div>
          )}
        </EdgeCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          <EdgeCard
            title="astest Skaters"
            subtitle="Fastest recorded skating speeds this season"
          >
            <FastestSkaters
              rows={data?.skating.fastestSkaters ?? []}
              team={opp ?? "TOR"}
              season={season}
            />
          </EdgeCard>

          <EdgeCard
            title="Hardest Shooters"
            subtitle="Hardest recorded shots this season"
          >
            <HardestShooters
              rows={data?.shotSpeed.hardestShooters ?? []}
              team={opp ?? "TOR"}
              season={season}
            />
          </EdgeCard>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 14,
          }}
        >
          <EdgeCard title="Shot Map" subtitle="Shots on goal by zone">
            <OffensiveZoneHeatmap
              areas={data?.shotLocation.areas ?? []}
              mode="shots"
            />
          </EdgeCard>

          <EdgeCard title="Goal Map" subtitle="Goals scored by zone">
            <OffensiveZoneHeatmap
              areas={data?.shotLocation.areas ?? []}
              mode="goals"
            />
          </EdgeCard>
        </div>
      </div>
    </main>
  );
}
