// src/styles/uiStyles.ts
// Design helper , reused

import type React from "react";

export const UI = {
  // outer wrapper, border, background, rounded corners.
  moduleWrapper: (): React.CSSProperties => ({
    borderRadius: 18,
    border: "1px solid var(--le-surface-border)",
    boxShadow: "var(--le-shadow)",
    background: "var(--le-module-bg)",
    overflow: "hidden",
  }),

  // padding helper, default currently at 18
  pad: (n = 18): React.CSSProperties => ({
    paddingTop: n,
    paddingRight: n,
    paddingBottom: n,
    paddingLeft: n,
  }),

  // thin divider line 
  hairline: (alpha = 0.08): React.CSSProperties => ({
    height: 1,
    background: `rgba(255,255,255,${alpha})`,
  }),

  // header row layout 
  headerRow: (): React.CSSProperties => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  }),

  // section title style 
  title: (): React.CSSProperties => ({
    fontWeight: 800,
    opacity: 0.92,
  }),

  // small secondary text style
  meta: (): React.CSSProperties => ({
    fontSize: 12,
    opacity: 0.75,
    whiteSpace: "nowrap",
  }),

  // grid layout for stacking rows
  rowsGrid: (gap = 12): React.CSSProperties => ({
    display: "grid",
    gap,
  }),
};
