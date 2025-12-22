import type React from "react";

export const styles: Record<string, React.CSSProperties> = {
  wrap: { padding: "22px 24px 10px" },
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
  meta: { fontSize: 12, opacity: 0.75 },
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
  teamText: { minWidth: 0 },
  abbrev: {
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: 1,
    lineHeight: 1.05,
  },
  recordLine: { fontSize: 12, marginTop: 4, opacity: 0.85 },
  recordLabel: { opacity: 0.6 },
  recordValue: { fontWeight: 800 },
  center: { textAlign: "center", padding: "0 8px" },
  matchup: { fontSize: 28, fontWeight: 900, letterSpacing: 0.5 },
  centerSub: { marginTop: 8, fontSize: 12, opacity: 0.65 },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    marginTop: 18,
  },
};
