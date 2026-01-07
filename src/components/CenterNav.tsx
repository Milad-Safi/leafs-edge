"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

function NavLink({
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

  const className = [
    "leNavLink",
    active ? "leNavLinkActive" : "",
    disabled ? "leNavLinkDisabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {label}
      </span>
    );
  }

  return (
    <Link className={className} href={href}>
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
    <div className="leNavBar">
      <div className="leNavInner">
        <div className="leNavLinks">
          <NavLink href="/" label="Home" />
          <NavLink href={withOpp("/team/tor")} label={`${team} Stats`} />
          <NavLink
            href={opp ? withOpp("/team/opp") : "/"}
            label={opp ? `${opp} Stats` : "Opponent Stats"}
            disabled={!opp}
          />

          <div style={{ marginLeft: 8, display: "flex", alignItems: "center" }}>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
