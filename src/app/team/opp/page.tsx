import { Suspense } from "react";
import OppClient from "./OppClient";

// Entry point for the opponent page
// Wraps the client component in Suspense to support async routing hooks

export default function Page() {
  return (
    // Lightweight fallback while the client tree initializes
    <Suspense fallback={<div />}>
      <OppClient />
    </Suspense>
  );
}
