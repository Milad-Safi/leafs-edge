import React from "react";
import TeamChrome from "@/components/TeamChrome";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TeamChrome />
      {children}
    </>
  );
}
