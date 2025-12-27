import React from "react";

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
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 18, opacity: 0.95 }}>
        {title}
      </div>
      {subtitle ? (
        <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
          {subtitle}
        </div>
      ) : null}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}
