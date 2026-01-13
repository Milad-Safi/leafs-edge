// Inline style definitions for the matchup header (hero) component

import type React from "react";

export const styles: Record<string, React.CSSProperties> = {
  wrap: { padding: "22px 24px 38px" },

  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 17,
  },

  // "NEXT GAME"
  kicker: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 2,
    color: "var(--mh-kicker)",
  },

  // "Thu, Jan 8 • 7:00 PM"
  meta: {
    fontSize: 12,
    color: "var(--mh-meta)",
    fontWeight: 600,
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
    filter: "var(--mh-logo-shadow)",
  },

  teamText: { minWidth: 0 },

  abbrev: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: "var(--mh-abbrev)",
  },

  // "Season: ..." / "Away: ..." etc
  recordLine: {
    fontSize: 12,
    marginTop: 4,
    color: "var(--mh-record-line)",
  },

  // "Season:" label
  recordLabel: { color: "var(--mh-record-label)" },

  recordValue: { fontWeight: 800, color: "var(--mh-record-value)" },

  center: { textAlign: "center", padding: "0 8px" },

  matchup: {
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: 0.5,
    color: "var(--mh-matchup)",
  },

  // "Away game"
  centerSub: {
    marginTop: 8,
    fontSize: 12,
    color: "var(--mh-center-sub)",
    fontWeight: 600,
  },

  divider: {
    height: 1,
    background: "var(--mh-divider)",
    marginTop: 18,
  },
};
