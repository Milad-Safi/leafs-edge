"use client";

import React from "react";
import EdgeCard from "@/components/edge/EdgeCard";
import FastestSkaters from "@/components/edge/FastestSkaters";
import HardestShooters from "@/components/edge/HardestShooters";
import OffensiveZoneHeatmap from "@/components/edge/OffensiveZoneHeatmap";
import useTeamEdge from "@/hooks/useTeamEdge";

import TeamTrend from "@/components/edge/TeamTrend";
import { useTeamTrend } from "@/hooks/useTeamTrend";

// Toronto specific EDGE analytics page for Toronto
// Combines ML trend output with NHL EDGE skating, shooting, and shot-location data

export default function TorPage() {
  const team = "TOR";
  const season = "20252026"; // hard coded for now 

  // NHL EDGE data for skating, shooting, and shot locations
  const { data, loading, error, baseUrl } = useTeamEdge(team, true);

  // ML-based short-term trend prediction
  const trend = useTeamTrend(team);

  return (
    <main style={{ minHeight: "100vh", color: "white", padding: 24 }}>
      <div style={{ display: "grid", gap: 14 }}>
        {/* ML trend summary shown at the top */}
        <TeamTrend
          title="TOR ML Trend"
          data={trend.data}
          loading={trend.loading}
          error={trend.error}
        />

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
              team={team}
              season={season}
            />
          </EdgeCard>

          <EdgeCard
            title="Hardest Shooters"
            subtitle="Hardest recorded shots this season"
          >
            <HardestShooters
              rows={data?.shotSpeed.hardestShooters ?? []}
              team={team}
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
          <EdgeCard title="Shot Map" subtitle="Shots on Goal by Zone">
            <OffensiveZoneHeatmap
              areas={data?.shotLocation.areas ?? []}
              mode="shots"
            />
          </EdgeCard>

          <EdgeCard title="Goal Map" subtitle="Goals scored by Zone">
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
