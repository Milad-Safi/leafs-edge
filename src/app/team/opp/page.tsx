import { Suspense } from "react";
import OppClient from "./OppClient";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <OppClient />
    </Suspense>
  );
}
