// helper for team colours, 

// Colour for every team is available and can be changed if needed
// Colours chosen are either the teams primary, secondary or tertiary colour.
// Secondary and Tertiary chosen to help reduce overlaqp
export const TEAM_COLORS: Record<string, string> = {
  TOR: "rgba(28, 18, 213, 1)",

  ANA: "rgba(181, 111, 63, 1)",

  BOS: "rgba(252, 181, 20, 1)",
  BUF: "rgba(0, 48, 135, 1)",

  CAR: "rgba(206, 17, 38, 1)",
  CBJ: "rgba(0, 38, 84, 1)",

  CGY: "rgba(241, 190, 72, 1)",
  CHI: "rgba(255, 140, 0, 1)",

  COL: "rgba(111, 38, 61, 1)",
  DAL: "rgba(0, 104, 71, 1)",
  DET: "rgba(255, 0, 0, 1)",

  EDM: "rgba(0, 56, 168, 1)",

  FLA: "rgba(200, 76, 46, 1)",
  LAK: "rgba(162, 170, 173, 1)",
  MIN: "rgba(2, 73, 48, 1)",
  MTL: "rgba(175, 30, 45, 1)",

  NJD: "rgba(236, 236, 236, 1)",

  NSH: "rgba(255, 184, 28, 1)",

  NYI: "rgba(179, 84, 0, 1)",
  NYR: "rgba(0, 82, 155, 1)",

  OTT: "rgba(218, 26, 50, 1)",

  PHI: "rgba(255, 102, 0, 1)",

  PIT: "rgba(140, 98, 57, 1)",

  SEA: "rgba(153, 217, 217, 1)",
  SJS: "rgba(0, 109, 117, 1)",
  STL: "rgba(4, 30, 66, 1)",

  TBL: "rgba(56, 119, 255, 1)",
  VAN: "rgba(10, 134, 61, 1)",
  VGK: "rgba(180, 151, 90, 1)",
  WPG: "rgba(71, 83, 99, 1)",
  WSH: "rgba(255, 255, 255, 1)",
  UTA: "rgba(120, 120, 120, 1)",
};
// returns requested teams colour
export function getTeamColor(abbrev?: string) {
  return TEAM_COLORS[(abbrev ?? "").toUpperCase()] ?? "rgba(120,120,120,1)";
}
