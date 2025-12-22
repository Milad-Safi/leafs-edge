export const TEAM_COLORS: Record<string, string> = {
  TOR: "rgba(11, 0, 216, 1)",

  ANA: "rgba(245, 121, 58, 1)",
  BOS: "rgba(255, 184, 28, 1)",
  BUF: "rgba(0, 89, 255, 1)",
  CAR: "rgba(204, 0, 0, 1)",
  CBJ: "rgba(0, 38, 84, 1)",
  CGY: "rgba(255, 39, 75, 1)",
  CHI: "rgba(207, 10, 44, 1)",
  COL: "rgba(202, 16, 75, 1)",
  DAL: "rgba(0, 104, 71, 1)",
  DET: "rgba(255, 0, 30, 1)",
  EDM: "rgba(255, 76, 0, 1)",
  FLA: "rgba(110, 0, 18, 1)",
  LAK: "rgba(162, 170, 173, 1)",
  MIN: "rgba(9, 137, 71, 1)",
  MTL: "rgba(175, 30, 45, 1)",
  NJD: "rgba(206, 17, 38, 1)",
  NSH: "rgba(255, 184, 28, 1)",
  NYI: "rgba(5, 102, 187, 1)",
  NYR: "rgba(0, 85, 255, 1)",
  OTT: "rgba(197, 32, 50, 1)",
  PHI: "rgba(247, 73, 2, 1)",
  PIT: "rgba(252, 181, 20, 1)",
  SEA: "rgba(99, 162, 194, 1)",
  SJS: "rgba(0, 109, 117, 1)",
  STL: "rgba(26, 64, 135, 1)",
  TBL: "rgba(32, 76, 206, 1)",
  VAN: "rgba(0, 19, 54, 1)",
  VGK: "rgba(180, 151, 90, 1)",
  WPG: "rgba(0, 10, 24, 1)",
  WSH: "rgba(23, 85, 171, 1)",
  UTA: "rgba(120, 120, 120, 1)",
};

export function getTeamColor(abbrev?: string) {
  return TEAM_COLORS[(abbrev ?? "").toUpperCase()] ?? "rgba(120,120,120,1)";
}
