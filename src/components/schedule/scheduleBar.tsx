"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { styles } from "@/components/schedule/scheduleBar.styles";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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

const LS_SELECTED_ID = "leafsEdge.schedule.selectedId";
const LS_SCROLL_LEFT = "leafsEdge.schedule.scrollLeft";

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

function getResultLabel(
  leafsScore: number | null,
  oppScore: number | null,
  gameState: string
) {
  if (leafsScore == null || oppScore == null) return "";

  if (leafsScore > oppScore) return "W";
  if (leafsScore < oppScore) return "L";
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

  const restoredOnceRef = useRef(false);
  const lastSavedScrollRef = useRef<number>(0);

  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  function setOppParam(opp: string | null) {
    const params = new URLSearchParams(search.toString());

    if (opp) params.set("opp", opp.toUpperCase());
    else params.delete("opp");

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/leafs/schedule");
      const data = await res.json();
      setGames(Array.isArray(data?.games) ? data.games : []);
    })();
  }, []);

  // Save scroll position while user scrolls the schedule bar
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const x = el.scrollLeft;
      if (Math.abs(x - lastSavedScrollRef.current) < 2) return;
      lastSavedScrollRef.current = x;
      try {
        sessionStorage.setItem(LS_SCROLL_LEFT, String(x));
      } catch {}
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const nextGame = useMemo(() => {
    if (games.length === 0) return null;

    const now = Date.now();
    const fut = games.find((g) => isFuture(g.gameState));
    if (fut) return fut;

    return (
      games.find((g) => new Date(g.startTimeUTC).getTime() > now && !isFinished(g.gameState)) ??
      null
    );
  }, [games]);

  // Restore selection + scroll on mount/navigation so the bar doesn't "reset"
  useEffect(() => {
    if (!games.length) return;
    if (restoredOnceRef.current) return;

    restoredOnceRef.current = true;

    // Restore scroll position first (so we don't visibly jump)
    try {
      const rawX = sessionStorage.getItem(LS_SCROLL_LEFT);
      const x = rawX != null ? Number(rawX) : null;
      if (x != null && Number.isFinite(x)) {
        requestAnimationFrame(() => {
          if (scrollerRef.current) scrollerRef.current.scrollLeft = x;
        });
      }
    } catch {}

    // Restore selected game if possible (and if it still exists + isn't finished)
    let restoredId: number | null = null;
    try {
      const raw = sessionStorage.getItem(LS_SELECTED_ID);
      if (raw) {
        const n = Number(raw);
        restoredId = Number.isFinite(n) ? n : null;
      }
    } catch {}

    const restoredGame =
      restoredId != null ? games.find((g) => g.id === restoredId) ?? null : null;

    if (restoredGame && !isFinished(restoredGame.gameState)) {
      const leafsIsHome =
        restoredGame.homeAbbrev?.toUpperCase() === teamAbbrev.toUpperCase();
      const opp = leafsIsHome ? restoredGame.awayAbbrev : restoredGame.homeAbbrev;

      setSelectedId(restoredGame.id);
      onSelectFutureGame?.(restoredGame);
      setOppParam(opp ?? null);
      return;
    }

    // Fallback: normal behavior (select next game + center it)
    if (!nextGame) return;

    const leafsIsHome = nextGame.homeAbbrev?.toUpperCase() === teamAbbrev.toUpperCase();
    const opp = leafsIsHome ? nextGame.awayAbbrev : nextGame.homeAbbrev;

    setSelectedId(nextGame.id);
    onSelectFutureGame?.(nextGame);
    setOppParam(opp ?? null);

    try {
      sessionStorage.setItem(LS_SELECTED_ID, String(nextGame.id));
    } catch {}

    const el = cardRefs.current.get(nextGame.id);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games.length]);

  function scrollByPx(px: number) {
    scrollerRef.current?.scrollBy({ left: px, behavior: "smooth" });
  }

  function handleSelect(game: Game) {
    if (isFinished(game.gameState)) return;

    const leafsIsHome = game.homeAbbrev?.toUpperCase() === teamAbbrev.toUpperCase();
    const opp = leafsIsHome ? game.awayAbbrev : game.homeAbbrev;

    setSelectedId(game.id);
    onSelectFutureGame?.(game);
    setOppParam(opp ?? null);

    try {
      sessionStorage.setItem(LS_SELECTED_ID, String(game.id));
    } catch {}
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
