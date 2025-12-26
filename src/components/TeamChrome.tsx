"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import ScheduleBar from "@/components/schedule/scheduleBar";
import CenterNav from "@/components/centerNav";

const TEAM = "TOR";

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
