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
    background: "var(--le-sched-wrap-bg)",
    borderBottom: "1px solid var(--le-sched-wrap-border)",
    boxShadow: "var(--le-sched-wrap-shadow)",
  },

  arrowBtn: {
    width: 35,
    height: 40,
    borderRadius: 10,
    border: "1px solid var(--le-sched-arrow-border)",
    background: "var(--le-sched-arrow-bg)",
    color: "var(--le-sched-arrow-text)",
    cursor: "pointer",
    fontSize: 18,
    transition:
      "background 140ms ease, border-color 140ms ease, transform 120ms ease",
  },

  arrowBtnHover: {
    background: "var(--le-sched-arrow-hover-bg)",
    border: "1px solid var(--le-sched-arrow-hover-border)",
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
    border: "1px solid var(--le-sched-card-border)",
    background: "var(--le-sched-card-bg)",
    color: "var(--le-sched-card-text)",
    textAlign: "left",
    cursor: "pointer",
    scrollSnapAlign: "center",
    transition:
      "background 140ms ease, border-color 140ms ease, transform 120ms ease, filter 140ms ease",
  },

  cardHover: {
    background: "var(--le-sched-card-hover-bg)",
    border: "1px solid var(--le-sched-card-hover-border)",
  },

  cardSelected: {
    background: "var(--le-sched-card-selected-bg)",
    border: "1px solid var(--le-sched-card-selected-border)",
  },

  // Past games: locked/inactive look (NOT opacity-faded)
  cardDisabled: {
    opacity: 1,
    cursor: "not-allowed",

    background: "var(--le-sched-card-disabled-bg)",
    border: "1px solid var(--le-sched-card-disabled-border)",
    boxShadow: "none",

    color: "var(--le-sched-card-disabled-text)",
    filter: "var(--le-sched-card-disabled-filter)",

    transform: "none",
  },

  cardTop: {
    fontSize: 11,
    opacity: 0.70,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "var(--le-sched-top-text)",
  },

  cardMid: {
    fontSize: 12.5,
    marginTop: 3,
    fontWeight: 800,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "var(--le-sched-mid-text)",
  },

  cardBotRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.4,
    color: "var(--le-sched-bot-text)",
  },

  resultBadge: {
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid var(--le-sched-badge-border)",
    background: "var(--le-sched-badge-bg)",
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: 1.0,
    textTransform: "uppercase",
  },

  resultWin: {
    border: "1px solid var(--le-sched-win-border)",
    background: "var(--le-sched-win-bg)",
    color: "var(--le-sched-win-text)",
  },

  resultLoss: {
    border: "1px solid var(--le-sched-loss-border)",
    background: "var(--le-sched-loss-bg)",
    color: "var(--le-sched-loss-text)",
  },
};
