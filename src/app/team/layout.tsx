import React, { Suspense } from "react";
import TeamChrome from "@/components/TeamChrome";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div />}>
        <TeamChrome />
      </Suspense>
      {children}
    </>
  );
}
