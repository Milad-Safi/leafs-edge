import React from "react";

// Reusable card wrapper for Leafs Edge sections
// Provides consistent border, background, spacing, and header styling
export default function EdgeCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    // Outer card container with shared visual treatment
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 14,
        padding: 18,
      }}
    >
      {/* Primary card title */}
      <div style={{ fontWeight: 900, fontSize: 18, opacity: 0.95 }}>
        {title}
      </div>

      {/* Optional subtitle shown only when provided */}
      {subtitle ? (
        <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
          {subtitle}
        </div>
      ) : null}

      {/* Card body content */}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}
