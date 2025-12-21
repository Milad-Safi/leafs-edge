"use client";

import React, { useState } from "react";
import ScheduleBar, { type Game } from "@/components/schedule/scheduleBar";
import MatchupHeader from "@/components/MatchupHeader";

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  return (
    <main style={{ minHeight: "100vh", color: "white" }}>
      <ScheduleBar
        teamAbbrev="TOR"
        onSelectFutureGame={(game) => {
          setSelectedGame(game);
        }}
      />

      <MatchupHeader game={selectedGame} teamAbbrev="TOR" />

      <section style={{ padding: 24 }}>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontWeight: 900, letterSpacing: 0.6 }}>TEAM COMPARISON</div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
              We’ll fill this with GF/GA, PP/PK, shots, last-5, etc.
            </div>
          </div>

          <div style={{ padding: 16, opacity: 0.75 }}>
            {/* Placeholder row style — this will become your stat rows */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 12,
                alignItems: "center",
                padding: "12px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ textAlign: "left", fontWeight: 800 }}>—</div>
              <div style={{ textAlign: "center", opacity: 0.8 }}>Goals For / Game</div>
              <div style={{ textAlign: "right", fontWeight: 800 }}>—</div>
            </div>

            <div style={{ height: 10 }} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 12,
                alignItems: "center",
                padding: "12px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ textAlign: "left", fontWeight: 800 }}>—</div>
              <div style={{ textAlign: "center", opacity: 0.8 }}>Power Play % (Last 5)</div>
              <div style={{ textAlign: "right", fontWeight: 800 }}>—</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
