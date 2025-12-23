// src/styles/uiStyles.ts
import type React from "react";

export const UI = {
  moduleWrapper: (): React.CSSProperties => ({
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.30)",
    overflow: "hidden",
  }),

  pad: (n = 18): React.CSSProperties => ({
  paddingTop: n,
  paddingRight: n,
  paddingBottom: n,
  paddingLeft: n, }),
  
  hairline: (alpha = 0.08): React.CSSProperties => ({
  height: 1,
  background: `rgba(255,255,255,${alpha})`, }),
  
  spacer: (h = 10): React.CSSProperties => ({
  height: h, }),

  headerRow: (): React.CSSProperties => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  }),

  title: (): React.CSSProperties => ({
    fontWeight: 800,
    opacity: 0.92,
  }),

  meta: (): React.CSSProperties => ({
    fontSize: 12,
    opacity: 0.75,
    whiteSpace: "nowrap",
  }),

  rowsGrid: (gap = 12): React.CSSProperties => ({
    display: "grid",
    gap,
  }),
};

