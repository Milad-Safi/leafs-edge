"use client";

import React from "react";
import type { Game } from "@/components/schedule/scheduleBar";

function formatPrettyDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTimeLocalFromUTC(utcIso: string) {
  const dt = new Date(utcIso);
  return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function logoUrl(teamAbbrev: string) {
  return `https://assets.nhle.com/logos/nhl/svg/${teamAbbrev.toUpperCase()}_light.svg`;
}

export default function MatchupHeader({
  game,
  teamAbbrev = "TOR",
}: {
  game: Game | null;
  teamAbbrev?: string;
}) {
  if (!game) return null;

  const leafsIsHome = game.homeAbbrev.toUpperCase() === teamAbbrev.toUpperCase();
  const opp = leafsIsHome ? game.awayAbbrev : game.homeAbbrev;

  const matchup = `${teamAbbrev} ${leafsIsHome ? "vs" : "@"} ${opp}`;
  const date = formatPrettyDate(game.gameDate);
  const time = formatTimeLocalFromUTC(game.startTimeUTC);

  return (
    <section style={styles.wrap}>
      <div style={styles.topRow}>
        <span style={styles.kicker}>NEXT GAME</span>
        <span style={styles.meta}>
          {date} • {time}
        </span>
      </div>

      <div style={styles.mainRow}>
        <div style={styles.teamSideLeft}>
          <img src={logoUrl(teamAbbrev)} alt={`${teamAbbrev} logo`} style={styles.logo} />
          <div style={styles.teamText}>
            <div style={styles.abbrev}>{teamAbbrev}</div>
            <div style={styles.sub}>Toronto Maple Leafs</div>
          </div>
        </div>

        <div style={styles.center}>
          <div style={styles.matchup}>{matchup}</div>
          <div style={styles.centerSub}>
            {leafsIsHome ? "Home game" : "Away game"}
          </div>
        </div>

        <div style={styles.teamSideRight}>
          <div style={{ ...styles.teamText, textAlign: "right" }}>
            <div style={styles.abbrev}>{opp}</div>
            <div style={styles.sub}> </div>
          </div>
          <img src={logoUrl(opp)} alt={`${opp} logo`} style={styles.logo} />
        </div>
      </div>

      <div style={styles.divider} />
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: "22px 24px 10px",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 14,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 2,
    opacity: 0.85,
  },
  meta: {
    fontSize: 12,
    opacity: 0.75,
  },
  mainRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 18,
  },
  teamSideLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
  },
  teamSideRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 14,
    minWidth: 0,
  },
  logo: {
    width: 70,
    height: 70,
    objectFit: "contain",
    filter: "drop-shadow(0 10px 28px rgba(0,0,0,0.55))",
  },
  teamText: {
    minWidth: 0,
  },
  abbrev: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: 1,
    lineHeight: 1.05,
  },
  sub: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  center: {
    textAlign: "center",
    padding: "0 8px",
  },
  matchup: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  centerSub: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.65,
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    marginTop: 18,
  },
};
