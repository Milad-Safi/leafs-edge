import React, { Suspense } from "react";
import TeamChrome from "@/components/TeamChrome";

// Shared layout wrapper for team-specific routes (Edge pages)
// Persistent team chrome above the page content (UI)

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Suspense boundary for chrome that depends on client-side data */}
      <Suspense fallback={<div />}>
        <TeamChrome />
      </Suspense>

      {/* Route-specific page content */}
      {children}
    </>
  );
}
