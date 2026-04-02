"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import type {
    EdgeAreaRow,
    EdgeFastestSkater,
    EdgeHardestShooter,
    TeamEdgeBundle,
    TeamShotLocationResponse,
    TeamShotSpeedResponse,
    TeamSkatingSpeedResponse,
} from "@/types/api";

export type {
    EdgeAreaRow,
    EdgeFastestSkater,
    EdgeHardestShooter,
    TeamEdgeBundle,
    TeamShotLocationResponse,
    TeamShotSpeedResponse,
    TeamSkatingSpeedResponse,
} from "@/types/api";

const API_BASE =
    process.env.NEXT_PUBLIC_EDGE_API_BASE ??
    "https://leafs-edge-api.onrender.com";

function buildUrl(path: string, team: string) {
    const url = new URL(path, API_BASE);
    url.searchParams.set("team", team);
    return url.toString();
}

async function fetchFirstAvailable<T>(
    paths: string[],
    team: string,
    signal: AbortSignal
): Promise<T> {
    let lastError: unknown = null;

    for (const path of paths) {
        try {
            return await fetchJson<T>(buildUrl(path, team), {
                signal,
                cache: "no-store",
            });
        } catch (error) {
            if ((error as { name?: string })?.name === "AbortError") {
                throw error;
            }

            lastError = error;
        }
    }

    throw lastError ?? new Error("Failed to load EDGE endpoint");
}

function asNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function asNullableString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null;
}

function normaliseName(row: any): string {
    return (
        row?.name ??
        row?.playerName ??
        row?.skaterName ??
        row?.fullName ??
        row?.shootingPlayerName ??
        "Unknown Player"
    );
}

function normalisePlayerId(row: any): number {
    return asNumber(
        row?.playerId ?? row?.id ?? row?.playerID ?? row?.skaterId ?? row?.player_id
    );
}

function normaliseGameDate(row: any): string {
    return (
        row?.gameDate ??
        row?.game_date ??
        row?.eventDate ??
        row?.date ??
        ""
    );
}

function normaliseMph(row: any): number {
    return asNumber(row?.mph ?? row?.speed ?? row?.speedMph ?? row?.maxSpeed);
}

function normaliseKph(row: any): number {
    const explicit = asNumber(row?.kph ?? row?.speedKph);
    if (explicit > 0) {
        return explicit;
    }

    const mph = normaliseMph(row);
    return mph > 0 ? mph * 1.60934 : 0;
}

function sortByMphDesc<T extends { mph: number }>(rows: T[]) {
    return [...rows].sort((a, b) => b.mph - a.mph);
}

function normaliseFastestSkaters(payload: any): EdgeFastestSkater[] {
    const rawRows =
        payload?.topSkatingSpeeds ?? payload?.fastestSkaters ?? payload?.rows ?? [];

    if (!Array.isArray(rawRows)) {
        return [];
    }

    return sortByMphDesc(
        rawRows.map((row: any) => ({
            playerId: normalisePlayerId(row),
            name: normaliseName(row),
            mph: normaliseMph(row),
            kph: normaliseKph(row),
            gameDate: normaliseGameDate(row),
        }))
    ).slice(0, 5);
}

function normaliseHardestShooters(payload: any): EdgeHardestShooter[] {
    const rawRows =
        payload?.hardestShots ?? payload?.hardestShooters ?? payload?.rows ?? [];

    if (!Array.isArray(rawRows)) {
        return [];
    }

    return sortByMphDesc(
        rawRows.map((row: any) => ({
            playerId: normalisePlayerId(row),
            name: normaliseName(row),
            mph: normaliseMph(row),
            kph: normaliseKph(row),
            gameDate: normaliseGameDate(row),
        }))
    ).slice(0, 5);
}

function normaliseAreaName(area: string): string {
    const name = area.trim();

    const map: Record<string, string> = {
        "Left Corner": "L Corner",
        "Right Corner": "R Corner",
        "Left Net Side": "L Net Side",
        "Right Net Side": "R Net Side",
        "Left Circle": "L Circle",
        "Right Circle": "R Circle",
        "Left Point": "L Point",
        "Right Point": "R Point",
        "Left Outside": "Outside L",
        "Right Outside": "Outside R",
        "Offensive NZ": "Offensive Neutral Zone",
        "Offensive Neutral": "Offensive Neutral Zone",
        "Center Blue Line": "Offensive Neutral Zone",
    };

    return map[name] ?? name;
}

function normaliseShotAreas(payload: any): EdgeAreaRow[] {
    const rawRows =
        payload?.shotLocationDetails ?? payload?.areas ?? payload?.rows ?? [];

    if (!Array.isArray(rawRows)) {
        return [];
    }

    return rawRows.map((row: any) => ({
        area: normaliseAreaName(String(row?.area ?? row?.label ?? "")),
        sog: asNumber(row?.sog ?? row?.shotsOnGoal ?? row?.shots),
        goals: asNumber(row?.goals),
        shootingPctg: asNumber(
            row?.shootingPctg ?? row?.shootingPct ?? row?.shootingPercentage
        ),
    }));
}

function seasonFromDateValue(value: unknown): string | null {
    if (typeof value !== "string" || !value.trim()) {
        return null;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    const year = parsed.getUTCFullYear();
    const month = parsed.getUTCMonth() + 1;
    const startYear = month >= 7 ? year : year - 1;
    const endYear = startYear + 1;

    return `${startYear}${endYear}`;
}

function extractSeason(...payloads: any[]): string | null {
    for (const payload of payloads) {
        const season = asNullableString(payload?.season);

        if (season) {
            return season;
        }
    }

    for (const payload of payloads) {
        const rows = [
            ...(Array.isArray(payload?.topSkatingSpeeds)
                ? payload.topSkatingSpeeds
                : []),
            ...(Array.isArray(payload?.fastestSkaters)
                ? payload.fastestSkaters
                : []),
            ...(Array.isArray(payload?.hardestShots)
                ? payload.hardestShots
                : []),
            ...(Array.isArray(payload?.hardestShooters)
                ? payload.hardestShooters
                : []),
            ...(Array.isArray(payload?.rows) ? payload.rows : []),
        ];

        for (const row of rows) {
            const derivedSeason = seasonFromDateValue(normaliseGameDate(row));

            if (derivedSeason) {
                return derivedSeason;
            }
        }
    }

    return "20252026";
}

export default function useTeamEdge(team: string | null, refreshKey = 0) {
    const [data, setData] = useState<TeamEdgeBundle | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!team) {
            setData(null);
            setLoading(false);
            setError(null);
            return;
        }

        const ctrl = new AbortController();

        setData(null);
        setLoading(true);
        setError(null);

        Promise.all([
            fetchFirstAvailable<any>(
                [
                    "/v1/nhl/edge/team_skating_speed_detail",
                    "/v1/nhl/edge/team_skating_speed",
                ],
                team,
                ctrl.signal
            ),
            fetchFirstAvailable<any>(
                [
                    "/v1/nhl/edge/team_shot_speed_detail",
                    "/v1/nhl/edge/team_shot_speed",
                ],
                team,
                ctrl.signal
            ),
            fetchFirstAvailable<any>(
                [
                    "/v1/nhl/edge/team_shot_location_detail",
                    "/v1/nhl/edge/team_shot_location",
                ],
                team,
                ctrl.signal
            ),
        ])
            .then(([skatingPayload, shotSpeedPayload, shotLocationPayload]) => {
                const season = extractSeason(
                    skatingPayload,
                    shotSpeedPayload,
                    shotLocationPayload
                );

                const skating: TeamSkatingSpeedResponse = {
                    ok: true,
                    team,
                    season,
                    fastestSkaters: normaliseFastestSkaters(skatingPayload),
                };

                const shotSpeed: TeamShotSpeedResponse = {
                    ok: true,
                    team,
                    season,
                    hardestShooters: normaliseHardestShooters(shotSpeedPayload),
                };

                const shotLocation: TeamShotLocationResponse = {
                    ok: true,
                    team,
                    season,
                    areas: normaliseShotAreas(shotLocationPayload),
                };

                setData({
                    team,
                    season,
                    skating,
                    shotSpeed,
                    shotLocation,
                });
            })
            .catch((err: any) => {
                if (err?.name === "AbortError") {
                    return;
                }

                setError(err?.message ?? "Failed to load EDGE data");
                setData(null);
            })
            .finally(() => {
                if (!ctrl.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => ctrl.abort();
    }, [team, refreshKey]);

    return { data, loading, error };
}