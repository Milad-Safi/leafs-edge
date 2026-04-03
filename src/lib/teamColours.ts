// helper for team colours
// Colours spread across distinct shades to eliminate UI overlap on dark themes
export const TEAM_COLORS: Record<string, string> = {
    TOR: "rgba(28, 18, 213, 1)",   // Classic Leafs Blue

    ANA: "rgba(184, 115, 51, 1)",  // Bronze (From Orange Chart)

    BOS: "rgba(255, 184, 28, 1)",  // Boston Gold
    BUF: "rgba(30, 144, 255, 1)",  // Dodger Blue (From Blue Chart)

    CAR: "rgba(226, 24, 54, 1)",   // Candy Red (From Red Chart)
    CBJ: "rgba(0, 38, 84, 1)",     // Navy Blue

    CGY: "rgba(241, 190, 72, 1)",  // Yellow/Gold
    CHI: "rgba(206, 17, 38, 1)",   // Scarlet (From Red Chart)

    COL: "rgba(111, 38, 61, 1)",   // Burgundy
    DAL: "rgba(0, 104, 71, 1)",    // Victory Green
    DET: "rgba(255, 0, 0, 1)",     // Pure Red (From Red Chart)

    EDM: "rgba(255, 120, 0, 1)",   // Cadmium Orange (From Orange Chart)

    FLA: "rgba(200, 76, 46, 1)",   // Florida Red/Orange
    LAK: "rgba(162, 170, 173, 1)", // Silver/Gray
    MIN: "rgba(2, 73, 48, 1)",     // Forest Green
    MTL: "rgba(163, 38, 56, 1)",   // Brick Red (From Red Chart)

    NJD: "rgba(166, 12, 12, 1)",   // Blood Red (From Red Chart)

    NSH: "rgba(255, 184, 28, 1)",  // Predators Gold

    NYI: "rgba(179, 84, 0, 1)",    // Dark Orange
    NYR: "rgba(0, 82, 155, 1)",    // Rangers Blue

    OTT: "rgba(170, 20, 40, 1)",   // Garnet (From Red Chart)

    PHI: "rgba(255, 85, 0, 1)",    // Neon Orange (From Orange Chart)

    PIT: "rgba(207, 196, 147, 1)", // Retro/Vegas Yellow to avoid Boston clash

    SEA: "rgba(153, 217, 217, 1)", // Ice Blue (From Blue Chart)
    SJS: "rgba(0, 109, 117, 1)",   // Turquoise (From Blue Chart)
    STL: "rgba(0, 71, 171, 1)",    // Cobalt Blue (From Blue Chart)

    TBL: "rgba(0, 85, 255, 1)",    // Bright Blue (From Blue Chart)
    VAN: "rgba(10, 134, 61, 1)",   // Canucks Green (to avoid the blue pileup)
    VGK: "rgba(180, 151, 90, 1)",  // Vegas Gold
    WPG: "rgba(71, 83, 99, 1)",    // Jets Gray/Blue
    
    WSH: "rgba(4, 30, 66, 1)",     // Midnight Blue (From Blue Chart)
    UTA: "rgba(113, 175, 229, 1)", // Sky Blue (From Blue Chart)
};

// returns requested teams colour
export function getTeamColor(abbrev?: string) {
    return TEAM_COLORS[(abbrev ?? "").toUpperCase()] ?? "rgba(120,120,120,1)";
}