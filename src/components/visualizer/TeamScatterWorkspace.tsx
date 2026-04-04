"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { VISUALIZER_PRESETS } from "@/lib/visualizer";
import type {
    TeamScatterApiResponse,
    VisualizerMetricId,
} from "@/types/api";
import VisualizerChartCard from "@/components/visualizer/VisualizerChartCard";
import VisualizerHeaderCard from "@/components/visualizer/VisualizerHeaderCard";
import VisualizerTeamRail from "@/components/visualizer/VisualizerTeamRail";
import {
    SAMPLE_WARNING_METRICS,
    buildPlotPoints,
    type TooltipState,
} from "@/components/visualizer/teamScatterPlot";

export default function TeamScatterWorkspace() {
    const [data, setData] = useState<TeamScatterApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPresetId, setSelectedPresetId] = useState(
        VISUALIZER_PRESETS[0].id,
    );
    const [xMetric, setXMetric] = useState<VisualizerMetricId>(
        VISUALIZER_PRESETS[0].xMetric,
    );
    const [yMetric, setYMetric] = useState<VisualizerMetricId>(
        VISUALIZER_PRESETS[0].yMetric,
    );
    const [hoveredTeamAbbrev, setHoveredTeamAbbrev] = useState<string | null>(
        null,
    );
    const [pinnedTeamAbbrev, setPinnedTeamAbbrev] = useState<string | null>(
        null,
    );
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    const chartShellRef = useRef<HTMLDivElement | null>(null);

    function mobilePointPinningDisabled() {
        if (typeof window === "undefined") {
            return false;
        }

        return (
            window.innerWidth <= 820 ||
            window.matchMedia("(hover: none) and (pointer: coarse)").matches
        );
    }

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        async function loadData() {
            setLoading(true);
            setError(null);

            try {
                const payload = await fetchJson<TeamScatterApiResponse>(
                    "/api/visualizer/team-scatter",
                    { signal: controller.signal, cache: "no-store" },
                );

                if (!isMounted) {
                    return;
                }

                setData(payload);
            } catch (loadError: any) {
                if (!isMounted || controller.signal.aborted) {
                    return;
                }

                setError(String(loadError?.message ?? loadError));
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    useEffect(() => {
        function syncMobileState() {
            if (mobilePointPinningDisabled()) {
                setPinnedTeamAbbrev(null);
                setTooltip(null);
            }
        }

        syncMobileState();
        window.addEventListener("resize", syncMobileState);

        return () => {
            window.removeEventListener("resize", syncMobileState);
        };
    }, []);

    const activePreset = useMemo(() => {
        return (
            VISUALIZER_PRESETS.find((preset) => preset.id === selectedPresetId) ??
            null
        );
    }, [selectedPresetId]);

    const sortedTeams = useMemo(() => {
        if (!data) {
            return [];
        }

        return [...data.teams].sort((teamA, teamB) => {
            return teamA.teamFullName.localeCompare(teamB.teamFullName);
        });
    }, [data]);

    const { points, xScale, yScale } = useMemo(() => {
        return buildPlotPoints(sortedTeams, xMetric, yMetric);
    }, [sortedTeams, xMetric, yMetric]);

    const pointByTeamAbbrev = useMemo(() => {
        return new Map(points.map((point) => [point.team.teamAbbrev, point]));
    }, [points]);

    const renderPoints = useMemo(() => {
        return [...points].sort((pointA, pointB) => {
            const focusA =
                pointA.team.teamAbbrev === hoveredTeamAbbrev ||
                pointA.team.teamAbbrev === pinnedTeamAbbrev;
            const focusB =
                pointB.team.teamAbbrev === hoveredTeamAbbrev ||
                pointB.team.teamAbbrev === pinnedTeamAbbrev;

            if (focusA === focusB) {
                return 0;
            }

            return focusA ? 1 : -1;
        });
    }, [hoveredTeamAbbrev, pinnedTeamAbbrev, points]);

    const warningVisible =
        SAMPLE_WARNING_METRICS.includes(xMetric) ||
        SAMPLE_WARNING_METRICS.includes(yMetric);

    function syncPresetFromMetrics(
        nextXMetric: VisualizerMetricId,
        nextYMetric: VisualizerMetricId,
    ) {
        const matchingPreset = VISUALIZER_PRESETS.find((preset) => {
            return (
                preset.xMetric === nextXMetric &&
                preset.yMetric === nextYMetric
            );
        });

        setSelectedPresetId(matchingPreset?.id ?? "custom");
    }

    function handlePresetClick(presetId: string) {
        const preset = VISUALIZER_PRESETS.find((entry) => entry.id === presetId);

        if (!preset) {
            return;
        }

        setSelectedPresetId(preset.id);
        setXMetric(preset.xMetric);
        setYMetric(preset.yMetric);
    }

    function handleMetricChange(
        axis: "x" | "y",
        metricId: VisualizerMetricId,
    ) {
        if (axis === "x") {
            setXMetric(metricId);
            syncPresetFromMetrics(metricId, yMetric);
            return;
        }

        setYMetric(metricId);
        syncPresetFromMetrics(xMetric, metricId);
    }

    function handlePointHover(
        teamAbbrev: string,
        event: MouseEvent<SVGGElement>,
    ) {
        const shellBounds = chartShellRef.current?.getBoundingClientRect();

        if (!shellBounds) {
            setHoveredTeamAbbrev(teamAbbrev);
            return;
        }

        setHoveredTeamAbbrev(teamAbbrev);
        setTooltip({
            teamAbbrev,
            x: event.clientX - shellBounds.left,
            y: event.clientY - shellBounds.top,
        });
    }

    function handlePointMove(
        teamAbbrev: string,
        event: MouseEvent<SVGGElement>,
    ) {
        const shellBounds = chartShellRef.current?.getBoundingClientRect();

        if (!shellBounds) {
            return;
        }

        setTooltip({
            teamAbbrev,
            x: event.clientX - shellBounds.left,
            y: event.clientY - shellBounds.top,
        });
        setHoveredTeamAbbrev(teamAbbrev);
    }

    function handlePointLeave() {
        setHoveredTeamAbbrev(null);
        setTooltip(null);
    }

    function togglePinnedTeam(teamAbbrev: string) {
        if (mobilePointPinningDisabled()) {
            setPinnedTeamAbbrev(null);
            setTooltip(null);
            return;
        }

        setPinnedTeamAbbrev((current) => {
            return current === teamAbbrev ? null : teamAbbrev;
        });
    }

    const tooltipTeam = tooltip
        ? sortedTeams.find((team) => team.teamAbbrev === tooltip.teamAbbrev) ??
          null
        : null;

    const tooltipMaxLeft = chartShellRef.current
        ? Math.max(chartShellRef.current.clientWidth - 210, 18)
        : 640;
    const tooltipMaxTop = chartShellRef.current
        ? Math.max(chartShellRef.current.clientHeight - 120, 18)
        : 420;

    return (
        <main className="visualizerPage">
            <section className="visualizerWorkspace">
                <VisualizerHeaderCard
                    selectedPresetId={selectedPresetId}
                    onPresetClick={handlePresetClick}
                />

                <div className="visualizerBody">
                    <VisualizerChartCard
                        loading={loading}
                        error={error}
                        points={points}
                        renderPoints={renderPoints}
                        xScale={xScale}
                        yScale={yScale}
                        xMetric={xMetric}
                        yMetric={yMetric}
                        activePresetLabel={activePreset ? activePreset.label : "custom"}
                        warningVisible={warningVisible}
                        hoveredTeamAbbrev={hoveredTeamAbbrev}
                        pinnedTeamAbbrev={pinnedTeamAbbrev}
                        tooltip={tooltip}
                        tooltipTeam={tooltipTeam}
                        tooltipMaxLeft={tooltipMaxLeft}
                        tooltipMaxTop={tooltipMaxTop}
                        chartShellRef={chartShellRef}
                        onMetricChange={handleMetricChange}
                        onPointHover={handlePointHover}
                        onPointMove={handlePointMove}
                        onPointLeave={handlePointLeave}
                        onPointClick={togglePinnedTeam}
                    />

                    <VisualizerTeamRail
                        sortedTeams={sortedTeams}
                        pointByTeamAbbrev={pointByTeamAbbrev}
                        hoveredTeamAbbrev={hoveredTeamAbbrev}
                        pinnedTeamAbbrev={pinnedTeamAbbrev}
                        xMetric={xMetric}
                        yMetric={yMetric}
                        onTeamHover={setHoveredTeamAbbrev}
                        onTeamClick={togglePinnedTeam}
                    />
                </div>
            </section>
        </main>
    );
}