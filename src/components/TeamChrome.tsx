"use client";

// Team-level chrome wrapper for the Leafs Edge UI
// Render persistent navigation elements tied to a fixed team (TOR)

import React from "react";
import { useSearchParams } from "next/navigation";
import ScheduleBar from "@/components/schedule/ScheduleBar";
import CenterNav from "@/components/CenterNav";

const TEAM = "TOR";

// Layout component that wires team context into top-level navigation UI
export default function TeamChrome() {
  const search = useSearchParams();
  const opp = search.get("opp")?.toUpperCase() ?? null;

  return (
    <>
      <ScheduleBar teamAbbrev={TEAM} />
      <CenterNav teamAbbrev={TEAM} oppAbbrev={opp} />
    </>
  );
}
