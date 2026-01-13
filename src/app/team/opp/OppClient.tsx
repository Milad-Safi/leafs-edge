"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import EdgeCard from "@/components/edge/EdgeCard";
import FastestSkaters from "@/components/edge/FastestSkaters";
import HardestShooters from "@/components/edge/HardestShooters";
import OffensiveZoneHeatmap from "@/components/edge/OffensiveZoneHeatmap";
import useTeamEdge from "@/hooks/useTeamEdge";

import TeamTrend from "@/components/edge/TeamTrend";
import { useTeamTrend } from "@/hooks/useTeamTrend";

// EDGE analytics page for the selected opponent
// Team is derived from the URL search param and drives all data on this page

export default function OppClient() {
  // Fixed season context for EDGE endpoints
  const season = "20252026"; // keep hardcoded for now

  // Read opponent abbreviation from query string
  const search = useSearchParams();
  const opp = search.get("opp")?.toUpperCase() ?? null;

  // NHL EDGE data scoped to the opponent team
  const { data, loading, error, baseUrl } = useTeamEdge(opp, !!opp);

  // ML-based short-term trend prediction for the opponent
  const trend = useTeamTrend(opp);

  return (
    <main style={{ minHeight: "100vh", color: "white", padding: 24 }}>
      <div style={{ display: "grid", gap: 14 }}>
        {/* ML trend shown only when an opponent is present */}
        {opp ? (
          <TeamTrend
            title={`${opp} ML Trend`}
            data={trend.data}
            loading={trend.loading}
            error={trend.error}
          />
        ) : (
          <TeamTrend
            title="Opponent ML Trend"
            data={null}
            loading={false}
            error={null}
          />
        )}

        {/* Skating speed and shot speed cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          <EdgeCard
            title="Fastest Skaters"
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

        {/* Shot location heatmaps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 14,
          }}
        >
          <EdgeCard title="Shot Map" subtitle="Shots on Goal by zone">
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
