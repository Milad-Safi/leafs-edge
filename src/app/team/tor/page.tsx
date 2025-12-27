"use client";

import React from "react";
import EdgeCard from "@/components/edge/EdgeCard";
import FastestSkaters from "@/components/edge/FastestSkaters";
import HardestShooters from "@/components/edge/HardestShooters";
import OffensiveZoneHeatmap from "@/components/edge/OffensiveZoneHeatmap";
import useTeamEdge from "@/hooks/useTeamEdge";

import TeamTrend from "@/components/edge/TeamTrend";
import { useTeamTrend } from "@/hooks/useTeamTrend";

export default function TorPage() {
  const team = "TOR";
  const season = "20252026"; // keep hardcoded for now

  const { data, loading, error, baseUrl } = useTeamEdge(team, true);
  const trend = useTeamTrend(team);

  return (
    <main style={{ minHeight: "100vh", color: "white", padding: 24 }}>
      <div style={{ display: "grid", gap: 14 }}>
        {/* ML Trend (TOP, above fastest/hardest) */}
        <TeamTrend
          title="TOR ML Trend"
          data={trend.data}
          loading={trend.loading}
          error={trend.error}
        />

        {/* Top cards row */}
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
            <FastestSkaters rows={data?.skating.fastestSkaters ?? []} team={team} season={season} />
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

        {/* Heatmaps row (ONLY 2 cards) */}
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

          <EdgeCard title="Goal Map" subtitle="Goals scored from each Zone">
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
