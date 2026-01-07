// src/styles/uiStyles.ts
import type React from "react";

export const UI = {
  moduleWrapper: (): React.CSSProperties => ({
    borderRadius: 18,
    border: "1px solid var(--le-surface-border)",
    boxShadow: "var(--le-shadow)",
    background: "var(--le-module-bg)",
    overflow: "hidden",
  }),

  pad: (n = 18): React.CSSProperties => ({
    paddingTop: n,
    paddingRight: n,
    paddingBottom: n,
    paddingLeft: n,
  }),

  hairline: (alpha = 0.08): React.CSSProperties => ({
    height: 1,
    background: `rgba(255,255,255,${alpha})`,
  }),

  spacer: (h = 10): React.CSSProperties => ({
    height: h,
  }),

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
