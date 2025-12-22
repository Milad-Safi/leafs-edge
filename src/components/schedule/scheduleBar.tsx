"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type Game = {
  id: number;
  gameDate: string;
  startTimeUTC: string;
  gameState: string; // FUT, OFF, etc.
  homeAbbrev: string;
  awayAbbrev: string;
  homeScore: number | null;
  awayScore: number | null;
};

type Props = {
  teamAbbrev?: string; // "TOR"
  onSelectFutureGame?: (game: Game) => void; // for later (main page)
};

function normalizeGameState(state: string) {
  return (state || "").toUpperCase();
}

function isFinished(gameState: string) {
  const s = normalizeGameState(gameState);
  return s === "OFF" || s === "FINAL" || s === "F";
}

function isFuture(gameState: string) {
  const s = normalizeGameState(gameState);
  return s === "FUT";
}

function isOTLossGameState(state: string) {
  // If the API provides these, we'll show OTL instead of L
  const s = normalizeGameState(state);
  return s === "OTL" || s === "SOL";
}

function isOTWinGameState(state: string) {
  // If the API provides these, we'll show OTW instead of W
  const s = normalizeGameState(state);
  return s === "OTW" || s === "SOW";
}

function getResultLabel(leafsScore: number | null, oppScore: number | null, gameState: string) {
  if (leafsScore == null || oppScore == null) return "";

  if (leafsScore > oppScore) {
    return isOTWinGameState(gameState) ? "OTW" : "W";
  }
  if (leafsScore < oppScore) {
    return isOTLossGameState(gameState) ? "OTL" : "L";
  }
  return "T";
}

/**
 * ✅ FIX:
 * Show the date using startTimeUTC rendered in America/Toronto
 * (not gameDate + Date.UTC which can go 1 day behind).
 */
function formatDateShortFromUTC(startTimeUTC: string) {
  const dt = new Date(startTimeUTC);
  return dt
    .toLocaleDateString(undefined, {
      timeZone: "America/Toronto",
      month: "short",
      day: "2-digit",
    })
    .toUpperCase();
}

function formatTimeLocalFromUTC(utcIso: string) {
  const dt = new Date(utcIso);
  return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function ScheduleBar({ teamAbbrev = "TOR", onSelectFutureGame }: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/leafs/schedule");
      const data = await res.json();
      setGames(Array.isArray(data?.games) ? data.games : []);
    })();
  }, []);

  const nextGame = useMemo(() => {
    if (games.length === 0) return null;

    const now = Date.now();

    // Prefer explicit FUT
    const fut = games.find((g) => isFuture(g.gameState));
    if (fut) return fut;

    // Fallback: anything in the future that isn't finished
    return (
      games.find((g) => new Date(g.startTimeUTC).getTime() > now && !isFinished(g.gameState)) ?? null
    );
  }, [games]);

  useEffect(() => {
    if (!nextGame) return;

    setSelectedId(nextGame.id);

    // Tell the page what game is selected (so header updates by default)
    onSelectFutureGame?.(nextGame);

    const el = cardRefs.current.get(nextGame.id);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [nextGame?.id]); // keep this

  function scrollByPx(px: number) {
    scrollerRef.current?.scrollBy({ left: px, behavior: "smooth" });
  }

  function handleSelect(game: Game) {
    if (isFinished(game.gameState)) return; // past games not clickable

    setSelectedId(game.id);
    onSelectFutureGame?.(game);
  }

  return (
    <div style={styles.wrap}>
      <button style={styles.arrowBtn} onClick={() => scrollByPx(-520)} aria-label="Previous games">
        ◀
      </button>

      <div ref={scrollerRef} className="scheduleScroller" style={styles.scroller}>
        {games.map((g) => {
          const finished = isFinished(g.gameState);
          const selected = selectedId === g.id;

          const leafsIsHome = g.homeAbbrev?.toUpperCase() === teamAbbrev.toUpperCase();
          const opp = leafsIsHome ? g.awayAbbrev : g.homeAbbrev;

          // ✅ FIX: use startTimeUTC (Toronto timezone) for date label
          const topLine = formatDateShortFromUTC(g.startTimeUTC);

          const midLine = `${teamAbbrev} ${leafsIsHome ? "vs" : "@"} ${opp}`;

          let bottomLine = "";
          let resultLabel = "";
          let resultTone: "win" | "loss" | "neutral" = "neutral";

          if (finished) {
            const leafsScore = leafsIsHome ? g.homeScore : g.awayScore;
            const oppScore = leafsIsHome ? g.awayScore : g.homeScore;

            // Leafs-perspective score (matches label)
            bottomLine = `${leafsScore ?? "-"} - ${oppScore ?? "-"}`;

            // W/L badge
            resultLabel = getResultLabel(leafsScore, oppScore, g.gameState);

            // red/green tone
            if (leafsScore != null && oppScore != null) {
              if (leafsScore > oppScore) resultTone = "win";
              else if (leafsScore < oppScore) resultTone = "loss";
            }
          } else {
            bottomLine = formatTimeLocalFromUTC(g.startTimeUTC);
          }

          return (
            <button
              key={g.id}
              ref={(el) => {
                if (el) cardRefs.current.set(g.id, el);
                else cardRefs.current.delete(g.id);
              }}
              onClick={() => handleSelect(g)}
              disabled={finished}
              style={{
                ...styles.card,
                ...(selected ? styles.cardSelected : null),
                ...(finished ? styles.cardDisabled : null),
              }}
              title={finished ? "Finished game" : "Select game"}
            >
              <div style={styles.cardTop}>{topLine}</div>
              <div style={styles.cardMid}>{midLine}</div>

              <div style={styles.cardBotRow}>
                <span>{bottomLine}</span>

                {finished && resultLabel && (
                  <span
                    style={{
                      ...styles.resultBadge,
                      ...(resultTone === "win" ? styles.resultWin : null),
                      ...(resultTone === "loss" ? styles.resultLoss : null),
                    }}
                  >
                    {resultLabel}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button style={styles.arrowBtn} onClick={() => scrollByPx(520)} aria-label="Next games">
        ▶
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
