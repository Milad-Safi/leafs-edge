"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

export default function OppPage() {
  const search = useSearchParams();
  const opp = search.get("opp")?.toUpperCase() ?? null;

  return (
    <main style={{ minHeight: "100vh", color: "white", padding: 24 }}>
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 14,
          padding: 18,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 22, opacity: 0.95 }}>
          {opp ? `${opp} Stats` : "Opponent Stats"}
        </div>

        <div style={{ marginTop: 8, opacity: 0.75 }}>
          {opp
            ? "(Hook this page to your backend endpoints for the opponent.)"
            : "Pick a game from the schedule bar to set an opponent."}
        </div>
      </div>
    </main>
  );
}
