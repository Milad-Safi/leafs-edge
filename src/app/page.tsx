"use client";

import ScheduleBar from "@/components/schedule/scheduleBar";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", background: "#070a0f", color: "white" }}>
      <ScheduleBar
        teamAbbrev="TOR"
        onSelectFutureGame={(game) => {
          // For now just log it.
          // Later: use this to set opponent + gameId for the comparison page.
          console.log("Selected future game:", game);
        }}
      />

      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Leafs Game Viewer</h1>
        <p style={{ opacity: 0.8 }}>
          Schedule bar is the only thing implemented right now. Next stage: when you select a future game,
          we render Leafs vs opponent header + stats below.
        </p>
      </div>
    </main>
  );
}
