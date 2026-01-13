import { Suspense } from "react";
import HomeClient from "./HomeClient";

// Root page entry for the app route
// Wraps the client-rendered homepage in Suspense to support hooks that suspend during routing

export default function Page() {
  return (
    // Minimal fallback to avoid layout shifts while the client tree initializes
    <Suspense fallback={<div />}>
      <HomeClient />
    </Suspense>
  );
}
