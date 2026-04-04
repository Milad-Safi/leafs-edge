"use client";

import { useEffect, useState } from "react";

import { fetchJson } from "@/lib/fetchJson";
import type { GameExpectedGoalsResponse } from "@/types/api";

const API_BASE =
    process.env.NEXT_PUBLIC_EDGE_API_BASE ??
    "https://leafs-edge-api.onrender.com";

export default function useGameExpectedGoals(
    gameId: string | null,
    refreshKey = 0
) {
    const [data, setData] = useState<GameExpectedGoalsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!gameId) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        const ctrl = new AbortController();
        const url = new URL("/v1/xg/game", API_BASE);
        url.searchParams.set("game_id", gameId);

        setData(null);
        setLoading(true);
        setError(null);

        fetchJson<GameExpectedGoalsResponse>(url.toString(), {
            signal: ctrl.signal,
            cache: "no-store",
        })
            .then((json) => {
                setData(json);
            })
            .catch((err: any) => {
                if (err?.name === "AbortError") {
                    return;
                }

                setError(err?.message ?? "Failed to load expected goals");
            })
            .finally(() => {
                if (!ctrl.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => ctrl.abort();
    }, [gameId, refreshKey]);

    return { data, loading, error };
}