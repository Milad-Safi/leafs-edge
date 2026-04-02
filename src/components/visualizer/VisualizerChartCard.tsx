import type { MouseEvent, RefObject } from "react";
import {
    formatVisualizerMetricValue,
    VISUALIZER_METRICS,
    VISUALIZER_X_GROUPS,
    VISUALIZER_Y_GROUPS,
} from "@/lib/visualizer";
import type {
    TeamScatterTeam,
    VisualizerMetricId,
} from "@/types/api";
import VisualizerTooltip from "@/components/visualizer/VisualizerToolTip";
import {
    ACTIVE_POINT_SIZE,
    BASE_POINT_SIZE,
    GRID_LINES,
    PLOT_BOTTOM,
    PLOT_LEFT,
    PLOT_RIGHT,
    PLOT_TOP,
    VIEWBOX_HEIGHT,
    VIEWBOX_WIDTH,
    type AxisScale,
    type PlotPoint,
    type TooltipState,
} from "@/components/visualizer/teamScatterPlot";

type Props = {
    loading: boolean;
    error: string | null;
    points: PlotPoint[];
    renderPoints: PlotPoint[];
    xScale: AxisScale | null;
    yScale: AxisScale | null;
    xMetric: VisualizerMetricId;
    yMetric: VisualizerMetricId;
    activePresetLabel: string;
    warningVisible: boolean;
    hoveredTeamAbbrev: string | null;
    pinnedTeamAbbrev: string | null;
    tooltip: TooltipState | null;
    tooltipTeam: TeamScatterTeam | null;
    tooltipMaxLeft: number;
    tooltipMaxTop: number;
    chartShellRef: RefObject<HTMLDivElement | null>;
    onMetricChange: (
        axis: "x" | "y",
        metricId: VisualizerMetricId,
    ) => void;
    onPointHover: (
        teamAbbrev: string,
        event: MouseEvent<SVGGElement>,
    ) => void;
    onPointMove: (
        teamAbbrev: string,
        event: MouseEvent<SVGGElement>,
    ) => void;
    onPointLeave: () => void;
    onPointClick: (teamAbbrev: string) => void;
};

function getYAxisLabelLines(label: string): string[] {
    const slashParts = label.split(" / ").map((part) => part.trim()).filter(Boolean);

    if (slashParts.length === 2) {
        const firstWords = slashParts[0].split(" ").filter(Boolean);

        if (firstWords.length >= 3) {
            const midpoint = Math.ceil(firstWords.length / 2);

            return [
                firstWords.slice(0, midpoint).join(" "),
                firstWords.slice(midpoint).join(" "),
                slashParts[1],
            ].filter(Boolean);
        }

        return [slashParts[0], slashParts[1]];
    }

    const words = label.split(" ").filter(Boolean);

    if (words.length <= 2) {
        return [label];
    }

    if (words.length <= 4) {
        const midpoint = Math.ceil(words.length / 2);

        return [
            words.slice(0, midpoint).join(" "),
            words.slice(midpoint).join(" "),
        ].filter(Boolean);
    }

    return [
        words.slice(0, 2).join(" "),
        words.slice(2, 4).join(" "),
        words.slice(4).join(" "),
    ].filter(Boolean);
}

export default function VisualizerChartCard({
    loading,
    error,
    points,
    renderPoints,
    xScale,
    yScale,
    xMetric,
    yMetric,
    activePresetLabel,
    warningVisible,
    hoveredTeamAbbrev,
    pinnedTeamAbbrev,
    tooltip,
    tooltipTeam,
    tooltipMaxLeft,
    tooltipMaxTop,
    chartShellRef,
    onMetricChange,
    onPointHover,
    onPointMove,
    onPointLeave,
    onPointClick,
}: Props) {
    const yAxisLines = getYAxisLabelLines(VISUALIZER_METRICS[yMetric].label);
    const yAxisCentreY = (PLOT_TOP + (VIEWBOX_HEIGHT - PLOT_BOTTOM)) / 2;
    const yAxisLabelX = PLOT_LEFT / 2 + 4;
    const yAxisFontSize =
        yAxisLines.length >= 3 ? "10px" : "11px";

    return (
        <section className="visualizerChartCard">
            {loading ? (
                <div className="visualizerStateCard" role="status">
                    <div className="visualizerSpinner" aria-hidden="true" />
                    <h2 className="visualizerStateTitle">Loading chart</h2>
                </div>
            ) : error ? (
                <div className="visualizerStateCard visualizerStateCardError">
                    <h2 className="visualizerStateTitle">
                        Could not load the visualizer
                    </h2>
                    <p className="visualizerStateText">{error}</p>
                </div>
            ) : !points.length || !xScale || !yScale ? (
                <div className="visualizerStateCard">
                    <h2 className="visualizerStateTitle">No chartable teams</h2>
                    <p className="visualizerStateText">
                        The selected axis pair does not have enough valid data.
                    </p>
                </div>
            ) : (
                <>
                    <div className="visualizerChartToolbar">
                        <div className="visualizerChartToolbarMain">
                            <p className="visualizerChartEyebrow">Scatter plot</p>
                            <h2 className="visualizerChartTitle">
                                {VISUALIZER_METRICS[xMetric].label} vs{" "}
                                {VISUALIZER_METRICS[yMetric].label}
                            </h2>
                            <div className="visualizerChartMeta">
                                <span>{points.length} teams</span>
                                <span>League averages</span>
                                <span>Preset: {activePresetLabel}</span>
                            </div>
                        </div>

                        <div className="visualizerChartControls">
                            <label className="visualizerCompactSelectCard">
                                <span className="visualizerCompactSelectLabel">
                                    Y axis
                                </span>
                                <select
                                    className="visualizerCompactSelect"
                                    value={yMetric}
                                    onChange={(event) => {
                                        onMetricChange(
                                            "y",
                                            event.target.value as VisualizerMetricId,
                                        );
                                    }}
                                >
                                    {VISUALIZER_Y_GROUPS.map((group) => {
                                        return (
                                            <optgroup
                                                key={group.label}
                                                label={group.label}
                                            >
                                                {group.metricIds.map((metricId) => {
                                                    const metric =
                                                        VISUALIZER_METRICS[metricId];

                                                    return (
                                                        <option
                                                            key={metric.id}
                                                            value={metric.id}
                                                        >
                                                            {metric.label}
                                                        </option>
                                                    );
                                                })}
                                            </optgroup>
                                        );
                                    })}
                                </select>
                            </label>

                            <label className="visualizerCompactSelectCard">
                                <span className="visualizerCompactSelectLabel">
                                    X axis
                                </span>
                                <select
                                    className="visualizerCompactSelect"
                                    value={xMetric}
                                    onChange={(event) => {
                                        onMetricChange(
                                            "x",
                                            event.target.value as VisualizerMetricId,
                                        );
                                    }}
                                >
                                    {VISUALIZER_X_GROUPS.map((group) => {
                                        return (
                                            <optgroup
                                                key={group.label}
                                                label={group.label}
                                            >
                                                {group.metricIds.map((metricId) => {
                                                    const metric =
                                                        VISUALIZER_METRICS[metricId];

                                                    return (
                                                        <option
                                                            key={metric.id}
                                                            value={metric.id}
                                                        >
                                                            {metric.label}
                                                        </option>
                                                    );
                                                })}
                                            </optgroup>
                                        );
                                    })}
                                </select>
                            </label>
                        </div>
                    </div>

                    {warningVisible ? (
                        <div className="visualizerWarning">
                            5v3 sample warning
                        </div>
                    ) : null}

                    <div className="visualizerChartShell" ref={chartShellRef}>
                        <svg
                            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                            className="visualizerSvg"
                            aria-label={`${VISUALIZER_METRICS[xMetric].label} versus ${VISUALIZER_METRICS[yMetric].label}`}
                            role="img"
                        >
                            {Array.from({
                                length: GRID_LINES + 1,
                            }).map((_, index) => {
                                const ratio = index / GRID_LINES;
                                const y =
                                    PLOT_TOP +
                                    ratio *
                                        (VIEWBOX_HEIGHT - PLOT_TOP - PLOT_BOTTOM);

                                return (
                                    <line
                                        key={`horizontal-${index}`}
                                        x1={PLOT_LEFT}
                                        x2={VIEWBOX_WIDTH - PLOT_RIGHT}
                                        y1={y}
                                        y2={y}
                                        className="visualizerGridLine"
                                    />
                                );
                            })}

                            {Array.from({
                                length: GRID_LINES + 1,
                            }).map((_, index) => {
                                const ratio = index / GRID_LINES;
                                const x =
                                    PLOT_LEFT +
                                    ratio *
                                        (VIEWBOX_WIDTH - PLOT_LEFT - PLOT_RIGHT);

                                return (
                                    <line
                                        key={`vertical-${index}`}
                                        x1={x}
                                        x2={x}
                                        y1={PLOT_TOP}
                                        y2={VIEWBOX_HEIGHT - PLOT_BOTTOM}
                                        className="visualizerGridLine"
                                    />
                                );
                            })}

                            <line
                                x1={xScale.scale(xScale.average)}
                                x2={xScale.scale(xScale.average)}
                                y1={PLOT_TOP}
                                y2={VIEWBOX_HEIGHT - PLOT_BOTTOM}
                                className="visualizerAverageLine"
                            />
                            <line
                                x1={PLOT_LEFT}
                                x2={VIEWBOX_WIDTH - PLOT_RIGHT}
                                y1={yScale.scale(yScale.average)}
                                y2={yScale.scale(yScale.average)}
                                className="visualizerAverageLine"
                            />

                            <line
                                x1={PLOT_LEFT}
                                x2={VIEWBOX_WIDTH - PLOT_RIGHT}
                                y1={VIEWBOX_HEIGHT - PLOT_BOTTOM}
                                y2={VIEWBOX_HEIGHT - PLOT_BOTTOM}
                                className="visualizerAxisLine"
                            />
                            <line
                                x1={PLOT_LEFT}
                                x2={PLOT_LEFT}
                                y1={PLOT_TOP}
                                y2={VIEWBOX_HEIGHT - PLOT_BOTTOM}
                                className="visualizerAxisLine"
                            />

                            <text
                                x={VIEWBOX_WIDTH / 2}
                                y={VIEWBOX_HEIGHT - 18}
                                textAnchor="middle"
                                className="visualizerAxisLabel"
                            >
                                {VISUALIZER_METRICS[xMetric].label}
                            </text>

                            <text
                                x={yAxisLabelX}
                                y={yAxisCentreY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="visualizerAxisLabel"
                                style={{
                                    fontSize: yAxisFontSize,
                                }}
                            >
                                {yAxisLines.map((line, index) => {
                                    return (
                                        <tspan
                                            key={`${line}-${index}`}
                                            x={yAxisLabelX}
                                            dy={
                                                index === 0
                                                    ? `${-((yAxisLines.length - 1) * 0.58)}em`
                                                    : "1.12em"
                                            }
                                        >
                                            {line}
                                        </tspan>
                                    );
                                })}
                            </text>

                            <text
                                x={xScale.scale(xScale.average) + 8}
                                y={PLOT_TOP + 14}
                                className="visualizerAverageLabel"
                            >
                                Avg X
                            </text>
                            <text
                                x={PLOT_LEFT + 10}
                                y={yScale.scale(yScale.average) - 8}
                                className="visualizerAverageLabel"
                            >
                                Avg Y
                            </text>

                            {renderPoints.map((point) => {
                                const isHovered =
                                    hoveredTeamAbbrev === point.team.teamAbbrev;
                                const isPinned =
                                    pinnedTeamAbbrev === point.team.teamAbbrev;
                                const isFocused = isHovered || isPinned;
                                const pointSize = isFocused
                                    ? ACTIVE_POINT_SIZE
                                    : BASE_POINT_SIZE;
                                const haloRadius = isFocused ? 24 : 15;

                                return (
                                    <g
                                        key={point.team.teamAbbrev}
                                        transform={`translate(${point.x}, ${point.y})`}
                                        className="visualizerPoint"
                                        onMouseEnter={(event) => {
                                            onPointHover(
                                                point.team.teamAbbrev,
                                                event,
                                            );
                                        }}
                                        onMouseMove={(event) => {
                                            onPointMove(
                                                point.team.teamAbbrev,
                                                event,
                                            );
                                        }}
                                        onMouseLeave={onPointLeave}
                                        onClick={() => {
                                            onPointClick(point.team.teamAbbrev);
                                        }}
                                        style={{
                                            cursor: "pointer",
                                        }}
                                    >
                                        <circle
                                            r={haloRadius}
                                            className={`visualizerPointHalo${
                                                isFocused
                                                    ? " visualizerPointHaloFocused"
                                                    : ""
                                            }`}
                                        />
                                        <image
                                            href={point.team.logoSrc}
                                            x={-pointSize / 2}
                                            y={-pointSize / 2}
                                            width={pointSize}
                                            height={pointSize}
                                            preserveAspectRatio="xMidYMid meet"
                                        />
                                        <title>
                                            {point.team.teamFullName}:{" "}
                                            {VISUALIZER_METRICS[xMetric].label}{" "}
                                            {formatVisualizerMetricValue(
                                                xMetric,
                                                point.rawX,
                                            )}
                                            , {VISUALIZER_METRICS[yMetric].label}{" "}
                                            {formatVisualizerMetricValue(
                                                yMetric,
                                                point.rawY,
                                            )}
                                        </title>
                                    </g>
                                );
                            })}
                        </svg>

                        {tooltip && tooltipTeam ? (
                            <VisualizerTooltip
                                tooltip={tooltip}
                                tooltipTeam={tooltipTeam}
                                xMetric={xMetric}
                                yMetric={yMetric}
                                tooltipMaxLeft={tooltipMaxLeft}
                                tooltipMaxTop={tooltipMaxTop}
                            />
                        ) : null}
                    </div>
                </>
            )}
        </section>
    );
}