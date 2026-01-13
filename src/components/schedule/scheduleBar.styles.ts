// Inline style definitions for the schedule bar

import type React from "react";

export const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    background: "var(--sched-wrap-bg)",
    borderBottom: "1px solid var(--sched-wrap-border)",
    boxShadow: "var(--sched-wrap-shadow)",
  },

  arrowBtn: {
    width: 35,
    height: 40,
    borderRadius: 10,
    border: "1px solid var(--sched-arrow-border)",
    background: "var(--sched-arrow-bg)",
    color: "var(--sched-arrow-text)",
    cursor: "pointer",
    fontSize: 18,
    transition:
      "background 140ms ease, border-color 140ms ease, transform 120ms ease",
  },

  arrowBtnHover: {
    background: "var(--sched-arrow-hover-bg)",
    border: "1px solid var(--sched-arrow-hover-border)",
  },

  scroller: {
    flex: 1,
    display: "flex",
    gap: 10,
    overflowX: "auto",
    overflowY: "hidden",
    scrollSnapType: "x mandatory",
    paddingBottom: 4,
  },

  card: {
    minWidth: 168,
    height: 64,
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid var(--sched-card-border)",
    background: "var(--sched-card-bg)",
    color: "var(--sched-card-text)",
    textAlign: "left",
    cursor: "pointer",
    scrollSnapAlign: "center",
    transition:
      "background 140ms ease, border-color 140ms ease, transform 120ms ease, filter 140ms ease",
  },

  cardHover: {
    background: "var(--sched-card-hover-bg)",
    border: "1px solid var(--sched-card-hover-border)",
  },

  cardSelected: {
    background: "var(--sched-card-selected-bg)",
    border: "1px solid var(--sched-card-selected-border)",
  },

  // Past games: locked/inactive look (NOT opacity-faded)
  cardDisabled: {
    opacity: 1,
    cursor: "not-allowed",

    background: "var(--sched-card-disabled-bg)",
    border: "1px solid var(--sched-card-disabled-border)",
    boxShadow: "none",

    color: "var(--sched-card-disabled-text)",
    filter: "var(--sched-card-disabled-filter)",

    transform: "none",
  },

  cardTop: {
    fontSize: 11,
    opacity: 0.7,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--sched-top-text)",
  },

  cardMid: {
    fontSize: 12.5,
    marginTop: 3,
    fontWeight: 800,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "var(--sched-mid-text)",
  },

  cardBotRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.4,
    color: "var(--sched-bot-text)",
  },

  resultBadge: {
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid var(--sched-badge-border)",
    background: "var(--sched-badge-bg)",
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: 1.0,
    textTransform: "uppercase",
  },

  resultWin: {
    border: "1px solid var(--sched-win-border)",
    background: "var(--sched-win-bg)",
    color: "var(--sched-win-text)",
  },

  resultLoss: {
    border: "1px solid var(--sched-loss-border)",
    background: "var(--sched-loss-bg)",
    color: "var(--sched-loss-text)",
  },
};
