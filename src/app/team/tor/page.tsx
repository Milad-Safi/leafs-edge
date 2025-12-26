import React from "react";

export default function TorPage() {
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
          TOR Stats
        </div>
        <div style={{ marginTop: 8, opacity: 0.75 }}>
          (Hook this page to your backend TOR endpoints.)
        </div>
      </div>
    </main>
  );
}
