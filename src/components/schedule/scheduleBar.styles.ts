import type React from "react";

export const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: "#0b0f14",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  arrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
    fontSize: 18,
  },
  scroller: {
    flex: 1,
    display: "flex",
    gap: 10,
    overflowX: "auto",
    overflowY: "hidden",
    scrollSnapType: "x mandatory",
    paddingBottom: 6,
  },
  card: {
    minWidth: 170,
    height: 70,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    textAlign: "left",
    cursor: "pointer",
    scrollSnapAlign: "center",
  },
  cardSelected: {
    border: "1px solid rgba(255,255,255,0.45)",
    background: "rgba(255,255,255,0.10)",
  },
  cardDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  cardTop: { fontSize: 12, opacity: 0.9, letterSpacing: 0.6 },
  cardMid: { fontSize: 13, marginTop: 4, fontWeight: 600 },

  cardBotRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 12,
    marginTop: 6,
    opacity: 0.9,
  },

  resultBadge: {
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
  },

  resultWin: {
    border: "1px solid rgba(0,255,120,0.35)",
    background: "rgba(0,255,120,0.12)",
  },

  resultLoss: {
    border: "1px solid rgba(255,60,60,0.35)",
    background: "rgba(255,60,60,0.12)",
  },
};
