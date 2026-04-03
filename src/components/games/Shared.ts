import type { CSSProperties } from "react";

import { getTeamColor } from "@/lib/teamColours";
import type {
    GameDetailPeriodKey,
    HistoricalGameDetailResponse,
    HistoricalGameGoalieRow,
    HistoricalGamePositionFilter,
    HistoricalGameSkaterRow,
} from "@/types/games";

export type SkaterSortKey =
    | "name"
    | "goals"
    | "assists"
    | "points"
    | "shots"
    | "toiSeconds"
    | "hits"
    | "blocks";

export type GoalieSortKey =
    | "name"
    | "shotsAgainst"
    | "saves"
    | "savePct"
    | "goalsAgainst"
    | "toiSeconds";

export type SortDirection = "asc" | "desc";

export const PERIOD_OPTIONS: Array<{
    value: GameDetailPeriodKey;
    label: string;
}> = [
    { value: "ALL", label: "All" },
    { value: "1", label: "P1" },
    { value: "2", label: "P2" },
    { value: "3", label: "P3" },
    { value: "OT", label: "OT" },
];

export const POSITION_OPTIONS: Array<{
    value: HistoricalGamePositionFilter;
    label: string;
}> = [
    { value: "skaters", label: "Skaters" },
    { value: "forwards", label: "Forwards" },
    { value: "defencemen", label: "Defencemen" },
    { value: "goalies", label: "Goalies" },
];

export const TEAM_STAT_ROWS: Array<{
    key:
        | "estimatedXGoals"
        | "shotAttempts"
        | "shotsOnGoal"
        | "goals"
        | "hits"
        | "blockedShots"
        | "penaltyMinutes"
        | "powerPlayGoals";
    label: string;
    decimals?: number;
}> = [
    { key: "shotAttempts", label: "Shot attempts" },
    { key: "shotsOnGoal", label: "Shots on goal" },
    { key: "goals", label: "Goals" },
    { key: "hits", label: "Hits" },
    { key: "blockedShots", label: "Blocked shots" },
    { key: "penaltyMinutes", label: "Penalty minutes" },
    { key: "powerPlayGoals", label: "PP goals" },
];

export function formatGameDate(date?: string) {
    if (!date) return "Historical game";

    const parsed = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return date;

    return new Intl.DateTimeFormat("en-CA", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(parsed);
}

export function formatCompactGameDate(date?: string) {
    if (!date) return "Date unavailable";

    const parsed = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return date;

    return new Intl.DateTimeFormat("en-CA", {
        month: "short",
        day: "numeric",
    }).format(parsed);
}

export function formatDecisionLabel(
    decision: HistoricalGameDetailResponse["decision"]
) {
    if (decision === "ot") return "OT";
    if (decision === "so") return "SO";
    return "Regulation";
}

export function formatVenueLabel(data: HistoricalGameDetailResponse) {
    return `${data.awayTeam.abbrev} @ ${data.homeTeam.abbrev}`;
}

export function formatNumber(value: number, decimals = 0) {
    if (!Number.isFinite(value)) return "—";
    return decimals > 0 ? value.toFixed(decimals) : String(value);
}

export function formatSavePct(value: number) {
    if (!Number.isFinite(value)) return "—";
    return value.toFixed(3);
}

export function sortLabel(
    column: string,
    activeColumn: string,
    direction: SortDirection
) {
    if (column !== activeColumn) return "";
    return direction === "desc" ? " ↓" : " ↑";
}

export function compareSkaters(
    left: HistoricalGameSkaterRow,
    right: HistoricalGameSkaterRow,
    sortKey: SkaterSortKey,
    direction: SortDirection
) {
    let base = 0;

    if (sortKey === "name") {
        base = left.name.localeCompare(right.name);
    } else {
        base = left[sortKey] - right[sortKey];
    }

    if (base === 0) {
        base =
            right.points - left.points ||
            right.goals - left.goals ||
            left.name.localeCompare(right.name);
    }

    return direction === "asc" ? base : -base;
}

export function compareGoalies(
    left: HistoricalGameGoalieRow,
    right: HistoricalGameGoalieRow,
    sortKey: GoalieSortKey,
    direction: SortDirection
) {
    let base = 0;

    if (sortKey === "name") {
        base = left.name.localeCompare(right.name);
    } else {
        base = left[sortKey] - right[sortKey];
    }

    if (base === 0) {
        base =
            Number(right.starter) - Number(left.starter) ||
            right.toiSeconds - left.toiSeconds ||
            left.name.localeCompare(right.name);
    }

    return direction === "asc" ? base : -base;
}

export function teamSideKey(
    data: HistoricalGameDetailResponse,
    teamAbbrev: string
): "home" | "away" {
    return teamAbbrev === data.homeTeam.abbrev ? "home" : "away";
}

export function getStatWidths(leftValue: number, rightValue: number) {
    const total = leftValue + rightValue;

    if (total <= 0) {
        return {
            left: 50,
            right: 50,
        };
    }

    return {
        left: (leftValue / total) * 100,
        right: (rightValue / total) * 100,
    };
}

function withAlpha(colour: string, alpha: number) {
    const match = colour.match(
        /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/i
    );

    if (!match) {
        return colour;
    }

    const [, red, green, blue] = match;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function buildDetailThemeStyle(
    data: HistoricalGameDetailResponse
): CSSProperties {
    const awayColour = getTeamColor(data.awayTeam.abbrev);
    const homeColour = getTeamColor(data.homeTeam.abbrev);

    return {
        "--historical-away-colour": awayColour,
        "--historical-away-colour-soft": withAlpha(awayColour, 0.16),
        "--historical-away-colour-soft-strong": withAlpha(awayColour, 0.24),
        "--historical-home-colour": homeColour,
        "--historical-home-colour-soft": withAlpha(homeColour, 0.16),
        "--historical-home-colour-soft-strong": withAlpha(homeColour, 0.24),
    } as CSSProperties;
}