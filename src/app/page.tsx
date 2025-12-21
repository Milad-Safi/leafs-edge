"use client";

import React, { useEffect, useState } from "react";
import ScheduleBar, { type Game } from "@/components/schedule/scheduleBar";
import MatchupHeader from "@/components/MatchupHeader";

type TeamSummary = {
  teamAbbrev: string;
  teamFullName: string | null;
  gamesPlayed: number | null;

  goalsForPerGame: number | null;
  goalsAgainstPerGame: number | null;

  powerPlayPct: number | null;
  penaltyKillPct: number | null;

  shotsForPerGame: number | null;
  shotsAgainstPerGame: number | null;

  wins: number | null;
  losses: number | null;
  otLosses: number | null;
  points: number | null;
};

// Calm team colors (tweak anytime). Leafs fixed; opponent changes by abbrev.
const TEAM_COLORS: Record<string, string> = {
  TOR: "rgba(11, 0, 216, 1)", // Leafs blue (deeper, cleaner)

  ANA: "rgba(245, 121, 58, 1)",   // Ducks orange
  ARI: "rgba(140, 38, 51, 1)",    // Coyotes maroon
  BOS: "rgba(255, 184, 28, 1)",   // Bruins gold
  BUF: "rgba(0, 89, 255, 1)",     // Sabres royal blue
  CAR: "rgba(204, 0, 0, 1)",      // Canes red
  CBJ: "rgba(0, 38, 84, 1)",      // Jackets navy
  CGY: "rgba(255, 39, 75, 1)",    // Flames red
  CHI: "rgba(207, 10, 44, 1)",    // Hawks red
  COL: "rgba(202, 16, 75, 1)",    // Avs burgundy
  DAL: "rgba(0, 104, 71, 1)",     // Stars green
  DET: "rgba(255, 0, 30, 1)",    // Wings red
  EDM: "rgba(255, 76, 0, 1)",     // Oilers orange
  FLA: "rgba(110, 0, 18, 1)",    // Panthers red
  LAK: "rgba(162, 170, 173, 1)",  // Kings silver
  MIN: "rgba(9, 137, 71, 1)",     // Wild green
  MTL: "rgba(175, 30, 45, 1)",    // Canadiens red
  NJD: "rgba(206, 17, 38, 1)",    // Devils red
  NSH: "rgba(255, 184, 28, 1)",   // Preds gold
  NYI: "rgba(5, 102, 187, 1)",     // Islanders blue
  NYR: "rgba(0, 85, 255, 1)",     // Rangers blue
  OTT: "rgba(197, 32, 50, 1)",    // Sens red
  PHI: "rgba(247, 73, 2, 1)",     // Flyers orange
  PIT: "rgba(252, 181, 20, 1)",   // Pens gold
  SEA: "rgba(99, 162, 194, 1)",    // Kraken teal/navy
  SJS: "rgba(0, 109, 117, 1)",    // Sharks teal
  STL: "rgba(26, 64, 135, 1)",     // Blues blue
  TBL: "rgba(32, 76, 206, 1)",     // Bolts blue
  VAN: "rgba(0, 19, 54, 1)",      // Canucks blue
  VGK: "rgba(180, 151, 90, 1)",   // Knights gold
  WPG: "rgba(0, 10, 24, 1)",      // Jets navy
  WSH: "rgba(23, 85, 171, 1)",      // Caps navy/red base
  UTA: "rgba(120, 120, 120, 1)",  // Utah placeholder
};

function getTeamColor(abbrev?: string) {
  return TEAM_COLORS[(abbrev ?? "").toUpperCase()] ?? "rgba(120,120,120,1)";
}

function getOppFromGame(game: Game | null, teamAbbrev: string) {
  if (!game) return null;
  const leafsIsHome = String(game.homeAbbrev).toUpperCase() === teamAbbrev.toUpperCase();
  return (leafsIsHome ? game.awayAbbrev : game.homeAbbrev)?.toUpperCase?.() ?? null;
}

/**
 * Bar Stat Row (NHL compare style):
 * - left + right bars fill the row based on relative values
 * - center divider
 * - numbers stay exactly where they are
 */
function StatRow({
  leftVal,
  rightVal,
  label,
  leftText,
  rightText,
  leftColor,
  rightColor,
}: {
  leftVal: number | null;
  rightVal: number | null;
  label: string;
  leftText?: string;
  rightText?: string;
  leftColor: string;
  rightColor: string;
}) {
  const l = typeof leftVal === "number" && Number.isFinite(leftVal) ? leftVal : null;
  const r = typeof rightVal === "number" && Number.isFinite(rightVal) ? rightVal : null;

  const lAbs = l != null ? Math.abs(l) : null;
  const rAbs = r != null ? Math.abs(r) : null;

  const total = lAbs != null && rAbs != null ? lAbs + rAbs : null;

  const leftPct = total && total > 0 ? (lAbs! / total) * 100 : 50;
  const rightPct = total && total > 0 ? (rAbs! / total) * 100 : 50;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.25)",
      }}
    >
      {/* BAR LAYER */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.22, // subtle
        }}
      >
        <div style={{ width: `${leftPct}%`, background: leftColor }} />
        <div style={{ width: `${rightPct}%`, background: rightColor }} />

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 2,
            transform: "translateX(-1px)",
            background: "rgba(255,255,255,0.18)",
          }}
        />
      </div>

      {/* TEXT LAYER */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 12,
          alignItems: "center",
          padding: "12px 10px",
        }}
      >
        <div style={{ textAlign: "left", fontWeight: 800 }}>
          {leftText ?? (l != null ? l : "—")}
        </div>

        <div style={{ textAlign: "center", opacity: 0.8 }}>{label}</div>

        <div style={{ textAlign: "right", fontWeight: 800 }}>
          {rightText ?? (r != null ? r : "—")}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const TEAM = "TOR";

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const [torSummary, setTorSummary] = useState<TeamSummary | null>(null);
  const [oppSummary, setOppSummary] = useState<TeamSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const oppAbbrev = getOppFromGame(selectedGame, TEAM);

  useEffect(() => {
    if (!oppAbbrev) return;

    setLoadingSummary(true);

    Promise.all([
      fetch(`/api/team/summary?team=${TEAM}`).then((r) => r.json()),
      fetch(`/api/team/summary?team=${oppAbbrev}`).then((r) => r.json()),
    ])
      .then(([tor, oppT]) => {
        setTorSummary(tor);
        setOppSummary(oppT);
      })
      .finally(() => setLoadingSummary(false));
  }, [TEAM, oppAbbrev]);

  const leftColor = getTeamColor(TEAM);
  const rightColor = getTeamColor(oppAbbrev ?? "");

  return (
    <main style={{ minHeight: "100vh", color: "white" }}>
      <ScheduleBar teamAbbrev={TEAM} onSelectFutureGame={(game) => setSelectedGame(game)} />

      <MatchupHeader game={selectedGame} teamAbbrev={TEAM} />

      <section style={{ padding: 24 }}>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontWeight: 900, letterSpacing: 0.6 }}>TEAM COMPARISON</div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
              Season stats (auto-updates based on the selected future game).
            </div>
          </div>

          <div style={{ padding: 16, opacity: 0.95 }}>
            {loadingSummary && (
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>Loading team stats…</div>
            )}

            <StatRow
              leftVal={torSummary?.goalsForPerGame ?? null}
              rightVal={oppSummary?.goalsForPerGame ?? null}
              label="Goals For / Game"
              leftColor={leftColor}
              rightColor={rightColor}
            />
            <div style={{ height: 10 }} />

            <StatRow
              leftVal={torSummary?.goalsAgainstPerGame ?? null}
              rightVal={oppSummary?.goalsAgainstPerGame ?? null}
              label="Goals Against / Game"
              leftColor={leftColor}
              rightColor={rightColor}
            />
            <div style={{ height: 10 }} />

            <StatRow
              leftVal={torSummary?.powerPlayPct ?? null}
              rightVal={oppSummary?.powerPlayPct ?? null}
              label="Power Play %"
              leftText={torSummary?.powerPlayPct != null ? `${torSummary.powerPlayPct}%` : "—"}
              rightText={oppSummary?.powerPlayPct != null ? `${oppSummary.powerPlayPct}%` : "—"}
              leftColor={leftColor}
              rightColor={rightColor}
            />
            <div style={{ height: 10 }} />

            <StatRow
              leftVal={torSummary?.penaltyKillPct ?? null}
              rightVal={oppSummary?.penaltyKillPct ?? null}
              label="Penalty Kill %"
              leftText={torSummary?.penaltyKillPct != null ? `${torSummary.penaltyKillPct}%` : "—"}
              rightText={oppSummary?.penaltyKillPct != null ? `${oppSummary.penaltyKillPct}%` : "—"}
              leftColor={leftColor}
              rightColor={rightColor}
            />
            <div style={{ height: 10 }} />

            <StatRow
              leftVal={torSummary?.shotsForPerGame ?? null}
              rightVal={oppSummary?.shotsForPerGame ?? null}
              label="Shots For / Game"
              leftColor={leftColor}
              rightColor={rightColor}
            />
            <div style={{ height: 10 }} />

            <StatRow
              leftVal={torSummary?.shotsAgainstPerGame ?? null}
              rightVal={oppSummary?.shotsAgainstPerGame ?? null}
              label="Shots Against / Game"
              leftColor={leftColor}
              rightColor={rightColor}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
