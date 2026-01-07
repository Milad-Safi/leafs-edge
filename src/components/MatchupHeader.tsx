"use client";

import React from "react";
import type { Game } from "@/components/schedule/ScheduleBar";
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

function formatPrettyDateFromUTC(utcIso: string) {
  const dt = new Date(utcIso);
  return dt.toLocaleDateString(undefined, {
    timeZone: "America/Toronto",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTimeTorontoFromUTC(utcIso: string) {
  const dt = new Date(utcIso);
  return dt.toLocaleTimeString(undefined, {
    timeZone: "America/Toronto",
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
  const date = formatPrettyDateFromUTC(game.startTimeUTC);
  const time = formatTimeTorontoFromUTC(game.startTimeUTC);

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

  const leftSplit = leafsIsHome ? leftSummary?.homeRecord : leftSummary?.awayRecord;
  const rightSplit = leafsIsHome ? rightSummary?.awayRecord : rightSummary?.homeRecord;

  const leftSplitLabel = leafsIsHome ? "Home" : "Away";
  const rightSplitLabel = leafsIsHome ? "Away" : "Home";

  const leftSplitText = leftSplit ? `${leftSplit.w}-${leftSplit.l}` : "—";
  const rightSplitText = rightSplit ? `${rightSplit.w}-${rightSplit.l}` : "—";

  return (
    <section className="leHeroHeader leFullBleed">
      <div className="leFullBleedInner">
        <div style={styles.wrap}>
          <div style={styles.topRow}>
            <span style={styles.kicker}>NEXT GAME</span>
            <span style={styles.meta}>
              {date} • {time}
            </span>
          </div>

          {/* ===== DESKTOP LAYOUT ===== */}
          <div className="mhDesktop">
            <div className="mhRow" style={styles.mainRow}>
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
                <div className="mhTitle" style={styles.matchup}>
                  {matchup}
                </div>
                <div style={styles.centerSub}>{leafsIsHome ? "Home game" : "Away game"}</div>
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
          </div>

          {/* ===== MOBILE LAYOUT===== */}
          <div className="mhMobile">
            <div className="mhMobileTitle">{matchup}</div>
            <div className="mhMobileSub">{leafsIsHome ? "Home game" : "Away game"}</div>

            <div className="mhMobileTeams">
              <div className="mhMobileTeam">
                <img className="mhMobileLogo" src={logoUrl(TEAM)} alt={`${TEAM} logo`} />
                <div className="mhMobileAbbrev">{TEAM}</div>
                <div className="mhMobileLine">
                  <span className="mhMobileLabel">Season:</span>{" "}
                  <span className="mhMobileValue">{leftOverall}</span>
                </div>
                <div className="mhMobileLine">
                  <span className="mhMobileLabel">{leftSplitLabel}:</span>{" "}
                  <span className="mhMobileValue">{leftSplitText}</span>
                </div>
              </div>

              <div className="mhMobileVs">{leafsIsHome ? "VS" : "@"}</div>

              <div className="mhMobileTeam">
                <img className="mhMobileLogo" src={logoUrl(opp)} alt={`${opp} logo`} />
                <div className="mhMobileAbbrev">{opp}</div>
                <div className="mhMobileLine">
                  <span className="mhMobileLabel">Overall:</span>{" "}
                  <span className="mhMobileValue">{rightOverall}</span>
                </div>
                <div className="mhMobileLine">
                  <span className="mhMobileLabel">{rightSplitLabel}:</span>{" "}
                  <span className="mhMobileValue">{rightSplitText}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mhDivider" style={styles.divider} />
        </div>
      </div>
    </section>
  );
}
