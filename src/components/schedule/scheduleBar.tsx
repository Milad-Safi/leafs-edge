"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { styles } from "@/components/schedule/scheduleBar.styles";

export type Game = {
  id: number;
  gameDate: string;
  startTimeUTC: string;
  gameState: string; 
  homeAbbrev: string;
  awayAbbrev: string;
  homeScore: number | null;
  awayScore: number | null;
};

type Props = {
  teamAbbrev?: string; 
  onSelectFutureGame?: (game: Game) => void; 
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

function getResultLabel(leafsScore: number | null, oppScore: number | null, gameState: string) {
  if (leafsScore == null || oppScore == null) return "";

  if (leafsScore > oppScore) {
    return "W";
  }
  if (leafsScore < oppScore) {
    return "L";
  }
  return "T";
}

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
    const fut = games.find((g) => isFuture(g.gameState));
    if (fut) return fut;

    return (
      games.find((g) => new Date(g.startTimeUTC).getTime() > now && !isFinished(g.gameState)) ?? null
    );
  }, [games]);

  useEffect(() => {
    if (!nextGame) return;

    setSelectedId(nextGame.id);
    onSelectFutureGame?.(nextGame);

    const el = cardRefs.current.get(nextGame.id);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [nextGame?.id]); 

  function scrollByPx(px: number) {
    scrollerRef.current?.scrollBy({ left: px, behavior: "smooth" });
  }

  function handleSelect(game: Game) {
    if (isFinished(game.gameState)) return; 

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
          const topLine = formatDateShortFromUTC(g.startTimeUTC);

          const midLine = `${teamAbbrev} ${leafsIsHome ? "vs" : "@"} ${opp}`;

          let bottomLine = "";
          let resultLabel = "";
          let resultTone: "win" | "loss" | "neutral" = "neutral";

          if (finished) {
            const leafsScore = leafsIsHome ? g.homeScore : g.awayScore;
            const oppScore = leafsIsHome ? g.awayScore : g.homeScore;
            bottomLine = `${leafsScore ?? "-"} - ${oppScore ?? "-"}`;
            resultLabel = getResultLabel(leafsScore, oppScore, g.gameState);

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
