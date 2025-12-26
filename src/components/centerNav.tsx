"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function Tab({
  href,
  label,
  disabled,
}: {
  href: string;
  label: string;
  disabled?: boolean;
}) {
  const pathname = usePathname();
  const targetPath = href.split("?")[0];
  const active = !disabled && pathname === targetPath;

  const base: React.CSSProperties = {
    padding: "10px 18px",
    borderRadius: 999,
    fontWeight: 800,
    letterSpacing: 0.3,
    textDecoration: "none",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.035)",
    color: "rgba(255,255,255,0.88)",
    transition:
      "transform 120ms ease, background 120ms ease, border-color 120ms ease, opacity 120ms ease, box-shadow 120ms ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
    fontSize: 14,
    opacity: disabled ? 0.35 : 1,
    pointerEvents: disabled ? "none" : "auto",
    boxShadow: "none",
  };

  const activeStyle: React.CSSProperties = active
    ? {
        background: "rgba(255,255,255,0.08)",
        borderColor: "rgba(255,255,255,0.22)",
        color: "rgba(255,255,255,0.98)",
      }
    : {};

  return (
    <Link
      href={href}
      style={{ ...base, ...activeStyle }}
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.transform = "translateY(-1px)";
        el.style.background = "rgba(255,255,255,0.07)";
        el.style.borderColor = "rgba(255,255,255,0.18)";
        el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.35)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.transform = "translateY(0px)";
        el.style.background = active
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.035)";
        el.style.borderColor = active
          ? "rgba(255,255,255,0.22)"
          : "rgba(255,255,255,0.10)";
        el.style.boxShadow = "none";
      }}
    >
      {label}
    </Link>
  );
}

export default function CenterNav({
  teamAbbrev,
  oppAbbrev,
}: {
  teamAbbrev: string;
  oppAbbrev: string | null;
}) {
  const search = useSearchParams();

  const team = teamAbbrev.toUpperCase();
  const oppFromQuery = search.get("opp")?.toUpperCase() ?? null;
  const opp = (oppAbbrev?.toUpperCase() ?? oppFromQuery) || null;

  const withOpp = (path: string) =>
    opp ? `${path}?opp=${encodeURIComponent(opp)}` : path;

  return (
    <div
      style={{
        width: "100%",
        paddingTop: 16,
        paddingBottom: 16,
        display: "flex",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
      }}
    >
      <div
        className="centerNavCapsule"
        style={{
          width: "100%",
          maxWidth: 1120,
          margin: "0 16px",
          padding: "10px 14px",
          borderRadius: 999,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 26px rgba(0,0,0,0.45)",
          display: "flex",
          gap: 18,
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Tab href="/" label="Home" />
        <Tab href={withOpp("/team/tor")} label={`${team} Stats`} />
        <Tab
          href={opp ? withOpp("/team/opp") : "/"}
          label={opp ? `${opp} Stats` : "Opponent Stats"}
          disabled={!opp}
        />
      </div>
    </div>
  );
}
