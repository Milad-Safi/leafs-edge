import type { VisualizerMetricId } from "@/types/api";

export type VisualizerMetricDefinition = {
    id: VisualizerMetricId;
    label: string;
    shortLabel: string;
    kind: "count" | "percent" | "rate";
    decimals?: number;
};

export type VisualizerPreset = {
    id: string;
    label: string;
    xMetric: VisualizerMetricId;
    yMetric: VisualizerMetricId;
};

export type VisualizerMetricGroup = {
    label: string;
    metricIds: VisualizerMetricId[];
};

export const VISUALIZER_METRICS: Record<
    VisualizerMetricId,
    VisualizerMetricDefinition
> = {
    ppOpportunities: {
        id: "ppOpportunities",
        label: "PP Opportunities",
        shortLabel: "PPO",
        kind: "count",
    },
    overallPowerPlayPct: {
        id: "overallPowerPlayPct",
        label: "PP%",
        shortLabel: "PP%",
        kind: "percent",
        decimals: 2,
    },
    opportunities5v4: {
        id: "opportunities5v4",
        label: "5v4 PP Opportunities",
        shortLabel: "5v4 PPO",
        kind: "count",
    },
    powerPlayPct5v4: {
        id: "powerPlayPct5v4",
        label: "5v4 PP%",
        shortLabel: "5v4 PP%",
        kind: "percent",
        decimals: 2,
    },
    opportunities5v3: {
        id: "opportunities5v3",
        label: "5v3 PP Opportunities",
        shortLabel: "5v3 PPO",
        kind: "count",
    },
    powerPlayPct5v3: {
        id: "powerPlayPct5v3",
        label: "5v3 PP%",
        shortLabel: "5v3 PP%",
        kind: "percent",
        decimals: 2,
    },
    timesShorthanded: {
        id: "timesShorthanded",
        label: "Times Shorthanded",
        shortLabel: "TSH",
        kind: "count",
    },
    penaltyKillPct: {
        id: "penaltyKillPct",
        label: "PK%",
        shortLabel: "PK%",
        kind: "percent",
        decimals: 2,
    },
    penaltyKillNetPct: {
        id: "penaltyKillNetPct",
        label: "PK Net%",
        shortLabel: "PK Net%",
        kind: "percent",
        decimals: 2,
    },
    powerPlayGoalsFor: {
        id: "powerPlayGoalsFor",
        label: "PP Goals",
        shortLabel: "PP Goals",
        kind: "count",
    },
    ppGoalsAgainstPerGame: {
        id: "ppGoalsAgainstPerGame",
        label: "PP Goals Against / Game",
        shortLabel: "PPGA / G",
        kind: "rate",
        decimals: 2,
    },
    shotsAgainstPerGame: {
        id: "shotsAgainstPerGame",
        label: "SOG Against / Game",
        shortLabel: "SA / G",
        kind: "rate",
        decimals: 2,
    },
    shotsForPerGame: {
        id: "shotsForPerGame",
        label: "SOG For / Game",
        shortLabel: "SF / G",
        kind: "rate",
        decimals: 2,
    },
    goalsAgainstPerGame: {
        id: "goalsAgainstPerGame",
        label: "Goals Against / Game",
        shortLabel: "GA / G",
        kind: "rate",
        decimals: 2,
    },
    goalsForPerGame: {
        id: "goalsForPerGame",
        label: "Goals For / Game",
        shortLabel: "GF / G",
        kind: "rate",
        decimals: 2,
    },
    points: {
        id: "points",
        label: "Points",
        shortLabel: "PTS",
        kind: "count",
    },
    pointsPct: {
        id: "pointsPct",
        label: "Points %",
        shortLabel: "PTS%",
        kind: "percent",
        decimals: 2,
    },
};

export const VISUALIZER_PRESETS: VisualizerPreset[] = [
    {
        id: "pp-volume",
        label: "PP Efficiency",
        xMetric: "ppOpportunities",
        yMetric: "overallPowerPlayPct",
    },
    {
        id: "pk-pressure",
        label: "PK Efficiency",
        xMetric: "timesShorthanded",
        yMetric: "penaltyKillPct",
    },
    {
        id: "shot-profile",
        label: "Shot Differential",
        xMetric: "shotsAgainstPerGame",
        yMetric: "shotsForPerGame",
    },
    {
        id: "goal-profile",
        label: "Goal Differential",
        xMetric: "goalsAgainstPerGame",
        yMetric: "goalsForPerGame",
    },
];

export const VISUALIZER_X_GROUPS: VisualizerMetricGroup[] = [
    {
        label: "Suggested X axis",
        metricIds: [
            "ppOpportunities",
            "timesShorthanded",
            "shotsAgainstPerGame",
            "goalsAgainstPerGame",
            "opportunities5v4",
            "opportunities5v3",
            "ppGoalsAgainstPerGame",
        ],
    },
    {
        label: "More X options",
        metricIds: [
            "shotsForPerGame",
            "goalsForPerGame",
            "overallPowerPlayPct",
            "penaltyKillPct",
            "powerPlayPct5v4",
            "powerPlayPct5v3",
            "powerPlayGoalsFor",
            "points",
            "pointsPct",
            "penaltyKillNetPct",
        ],
    },
];

export const VISUALIZER_Y_GROUPS: VisualizerMetricGroup[] = [
    {
        label: "Suggested Y axis",
        metricIds: [
            "overallPowerPlayPct",
            "penaltyKillPct",
            "shotsForPerGame",
            "goalsForPerGame",
            "powerPlayPct5v4",
            "powerPlayPct5v3",
            "pointsPct",
            "powerPlayGoalsFor",
        ],
    },
    {
        label: "More Y options",
        metricIds: [
            "ppOpportunities",
            "timesShorthanded",
            "shotsAgainstPerGame",
            "goalsAgainstPerGame",
            "opportunities5v4",
            "opportunities5v3",
            "ppGoalsAgainstPerGame",
            "points",
            "penaltyKillNetPct",
        ],
    },
];

export function formatVisualizerMetricValue(
    metricId: VisualizerMetricId,
    value: number | null,
) {
    if (value == null || Number.isNaN(value)) {
        return "—";
    }

    const metric = VISUALIZER_METRICS[metricId];

    if (metric.kind === "percent") {
        const decimals = metric.decimals ?? 2;
        return `${value.toFixed(decimals)}%`;
    }

    if (metric.kind === "rate") {
        const decimals = metric.decimals ?? 2;
        return value.toFixed(decimals);
    }

    return Math.round(value).toString();
}