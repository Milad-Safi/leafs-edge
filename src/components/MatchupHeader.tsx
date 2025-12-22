"use client";

import React from "react";
import type { Game } from "@/components/schedule/scheduleBar";
import { styles } from "@/components/matchupHeader.styles";

type RecordSplit = { w: number; l: number };

type TeamSummaryMini = {
  teamAbbrev: string;
  teamFullName: string | null;
  wins: number | null;
  losses: number | null;
  otLosses: number | null;
  homeRecord?: RecordSplit;
  awayRecord?: RecordSplit;
};

function formatPrettyDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTimeLocalFromUTC(utcIso: string) {
  const dt = new Date(utcIso);
  return dt.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function logoUrl(teamAbbrev: string) {
  return `https://assets.nhle.com/logos/nhl/svg/${teamAbbrev.toUpperCase()}_light.svg`;
}

export default function MatchupHeader({
  game,
  teamAbbrev = "TOR",
  leftSummary,
  rightSummary,
}: {
  game: Game | null;
  teamAbbrev?: string;
  leftSummary?: TeamSummaryMini | null;
  rightSummary?: TeamSummaryMini | null;
}) {
  if (!game) return null;

  const TEAM = teamAbbrev.toUpperCase();
  const leafsIsHome = game.homeAbbrev.toUpperCase() === TEAM;
  const opp = leafsIsHome ? game.awayAbbrev : game.homeAbbrev;

  const matchup = `${TEAM} ${leafsIsHome ? "vs" : "@"} ${opp}`;
  const date = formatPrettyDate(game.gameDate);
  const time = formatTimeLocalFromUTC(game.startTimeUTC);

  // Overall records
  const leftOverall =
    leftSummary?.wins != null &&
    leftSummary?.losses != null &&
    leftSummary?.otLosses != null
      ? `${leftSummary.wins}-${leftSummary.losses}-${leftSummary.otLosses}`
      : "—";

  const rightOverall =
    rightSummary?.wins != null &&
    rightSummary?.losses != null &&
    rightSummary?.otLosses != null
      ? `${rightSummary.wins}-${rightSummary.losses}-${rightSummary.otLosses}`
      : "—";

  const leftSplit = leafsIsHome
    ? leftSummary?.homeRecord
    : leftSummary?.awayRecord;

  const rightSplit = leafsIsHome
    ? rightSummary?.awayRecord
    : rightSummary?.homeRecord;

  const leftSplitLabel = leafsIsHome ? "Home" : "Away";
  const rightSplitLabel = leafsIsHome ? "Away" : "Home";

  const leftSplitText = leftSplit ? `${leftSplit.w}-${leftSplit.l}` : "—";
  const rightSplitText = rightSplit ? `${rightSplit.w}-${rightSplit.l}` : "—";

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
          <img src={logoUrl(TEAM)} alt={`${TEAM} logo`} style={styles.logo} />
          <div style={styles.teamText}>
            <div style={styles.abbrev}>{TEAM}</div>

            <div style={styles.recordLine}>
              <span style={styles.recordLabel}>Season:</span>{" "}
              <span style={styles.recordValue}>{leftOverall}</span>
            </div>

            <div style={styles.recordLine}>
              <span style={styles.recordLabel}>{leftSplitLabel}:</span>{" "}
              <span style={styles.recordValue}>{leftSplitText}</span>
            </div>
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

            <div style={styles.recordLine}>
              <span style={styles.recordLabel}>Overall:</span>{" "}
              <span style={styles.recordValue}>{rightOverall}</span>
            </div>

            <div style={styles.recordLine}>
              <span style={styles.recordLabel}>{rightSplitLabel}:</span>{" "}
              <span style={styles.recordValue}>{rightSplitText}</span>
            </div>
          </div>
          <img src={logoUrl(opp)} alt={`${opp} logo`} style={styles.logo} />
        </div>
      </div>

      <div style={styles.divider} />
    </section>
  );
}