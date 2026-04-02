import type { TeamScatterTeam, VisualizerMetricId } from "@/types/api";

export type TooltipState = {
    teamAbbrev: string;
    x: number;
    y: number;
};

export type PlotPoint = {
    team: TeamScatterTeam;
    x: number;
    y: number;
    rawX: number;
    rawY: number;
};

export type AxisScale = {
    minValue: number;
    maxValue: number;
    average: number;
    scale: (value: number) => number;
};

export const VIEWBOX_WIDTH = 920;
export const VIEWBOX_HEIGHT = 500;
export const PLOT_LEFT = 88;
export const PLOT_RIGHT = 54;
export const PLOT_TOP = 28;
export const PLOT_BOTTOM = 68;
export const GRID_LINES = 5;
export const BASE_POINT_SIZE = 28;
export const ACTIVE_POINT_SIZE = 44;
export const SAMPLE_WARNING_METRICS: VisualizerMetricId[] = [
    "opportunities5v3",
    "powerPlayPct5v3",
];

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function valueOrNull(team: TeamScatterTeam, metricId: VisualizerMetricId) {
    const value = team.metrics[metricId];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildScale(
    values: number[],
    start: number,
    end: number,
    paddingRatio = 0.08,
): AxisScale {
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    if (minValue === maxValue) {
        const midpoint = (start + end) / 2;

        return {
            minValue,
            maxValue,
            average: minValue,
            scale: () => midpoint,
        };
    }

    const span = maxValue - minValue;
    const paddedMin = minValue - span * paddingRatio;
    const paddedMax = maxValue + span * paddingRatio;
    const paddedSpan = paddedMax - paddedMin;
    const average =
        values.reduce((total, value) => total + value, 0) / values.length;

    return {
        minValue,
        maxValue,
        average,
        scale: (value: number) => {
            return start + ((value - paddedMin) / paddedSpan) * (end - start);
        },
    };
}

export function buildPlotPoints(
    teams: TeamScatterTeam[],
    xMetric: VisualizerMetricId,
    yMetric: VisualizerMetricId,
) {
    const innerWidth = VIEWBOX_WIDTH - PLOT_LEFT - PLOT_RIGHT;
    const innerHeight = VIEWBOX_HEIGHT - PLOT_TOP - PLOT_BOTTOM;

    const validTeams = teams.filter((team) => {
        return (
            valueOrNull(team, xMetric) != null &&
            valueOrNull(team, yMetric) != null
        );
    });

    const xValues = validTeams
        .map((team) => valueOrNull(team, xMetric))
        .filter((value): value is number => value != null);

    const yValues = validTeams
        .map((team) => valueOrNull(team, yMetric))
        .filter((value): value is number => value != null);

    if (!xValues.length || !yValues.length) {
        return {
            points: [] as PlotPoint[],
            xScale: null as AxisScale | null,
            yScale: null as AxisScale | null,
        };
    }

    const xScale = buildScale(xValues, PLOT_LEFT, PLOT_LEFT + innerWidth);
    const yScale = buildScale(yValues, PLOT_TOP + innerHeight, PLOT_TOP);

    const points = validTeams.map((team) => {
        const rawX = valueOrNull(team, xMetric)!;
        const rawY = valueOrNull(team, yMetric)!;

        return {
            team,
            x: xScale.scale(rawX),
            y: yScale.scale(rawY),
            rawX,
            rawY,
        } satisfies PlotPoint;
    });

    const nudgedPoints = points.map((point) => ({ ...point }));
    const minDistance = 30;

    for (let iteration = 0; iteration < 10; iteration += 1) {
        for (let index = 0; index < nudgedPoints.length; index += 1) {
            for (
                let nextIndex = index + 1;
                nextIndex < nudgedPoints.length;
                nextIndex += 1
            ) {
                const pointA = nudgedPoints[index];
                const pointB = nudgedPoints[nextIndex];

                const deltaX = pointB.x - pointA.x;
                const deltaY = pointB.y - pointA.y;
                const distance =
                    Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 0.01;

                if (distance >= minDistance) {
                    continue;
                }

                const overlap = (minDistance - distance) / 2;
                const unitX = deltaX / distance;
                const unitY = deltaY / distance;

                pointA.x -= unitX * overlap;
                pointA.y -= unitY * overlap;
                pointB.x += unitX * overlap;
                pointB.y += unitY * overlap;

                pointA.x = clamp(
                    pointA.x,
                    PLOT_LEFT + 18,
                    VIEWBOX_WIDTH - PLOT_RIGHT - 18,
                );
                pointB.x = clamp(
                    pointB.x,
                    PLOT_LEFT + 18,
                    VIEWBOX_WIDTH - PLOT_RIGHT - 18,
                );
                pointA.y = clamp(
                    pointA.y,
                    PLOT_TOP + 18,
                    VIEWBOX_HEIGHT - PLOT_BOTTOM - 18,
                );
                pointB.y = clamp(
                    pointB.y,
                    PLOT_TOP + 18,
                    VIEWBOX_HEIGHT - PLOT_BOTTOM - 18,
                );
            }
        }
    }

    return {
        points: nudgedPoints,
        xScale,
        yScale,
    };
}