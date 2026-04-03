import type { HistoricalSeasonOption } from "@/types/games";

const VALID_SEASONS: HistoricalSeasonOption[] = [
    "2025-2026",
    "2024-2025",
    "2023-2024",
];

const DEFAULT_PAGE_SIZE = 12;

export function isHistoricalSeasonOption(
    value: string | null | undefined
): value is HistoricalSeasonOption {
    return VALID_SEASONS.includes(value as HistoricalSeasonOption);
}

export const HISTORICAL_SEASON_OPTIONS = VALID_SEASONS;
export const HISTORICAL_GAMES_PAGE_SIZE = DEFAULT_PAGE_SIZE;