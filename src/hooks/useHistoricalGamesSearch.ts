"use client";

import { useCallback, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import type {
    HistoricalGamesSearchResponse,
    HistoricalSeasonOption,
} from "@/types/games";

export type HistoricalSearchRequest = {
    team: string;
    season: HistoricalSeasonOption;
    opponent: string | null;
    page: number;
};

export function useHistoricalGamesSearch(pageSize = 12) {
    const [data, setData] = useState<HistoricalGamesSearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(
        async (request: HistoricalSearchRequest) => {
            const params = new URLSearchParams({
                team: request.team,
                season: request.season,
                page: String(request.page),
                pageSize: String(pageSize),
            });

            if (request.opponent) {
                params.set("opponent", request.opponent);
            }

            setLoading(true);
            setError(null);

            try {
                const payload = await fetchJson<HistoricalGamesSearchResponse>(
                    `/api/games/search?${params.toString()}`,
                    { cache: "no-store" }
                );

                setData(payload);
                return payload;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Could not load games";
                setError(message);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [pageSize]
    );

    return {
        data,
        loading,
        error,
        search,
    };
}
