import { formatVisualizerMetricValue, VISUALIZER_METRICS } from "@/lib/visualizer";
import type { TeamScatterTeam, VisualizerMetricId } from "@/types/api";
import { clamp, type TooltipState } from "@/components/visualizer/teamScatterPlot";

type Props = {
    tooltip: TooltipState;
    tooltipTeam: TeamScatterTeam;
    xMetric: VisualizerMetricId;
    yMetric: VisualizerMetricId;
    tooltipMaxLeft: number;
    tooltipMaxTop: number;
};

export default function VisualizerTooltip({
    tooltip,
    tooltipTeam,
    xMetric,
    yMetric,
    tooltipMaxLeft,
    tooltipMaxTop,
}: Props) {
    return (
        <div
            className="visualizerTooltip"
            style={{
                left: `${clamp(tooltip.x + 14, 18, tooltipMaxLeft)}px`,
                top: `${clamp(tooltip.y + 14, 18, tooltipMaxTop)}px`,
            }}
        >
            <div className="visualizerTooltipHeader">
                <img
                    src={tooltipTeam.logoSrc}
                    alt={`${tooltipTeam.teamFullName} logo`}
                    className="visualizerTooltipLogo"
                />
                <div>
                    <p className="visualizerTooltipName">
                        {tooltipTeam.teamFullName}
                    </p>
                    <p className="visualizerTooltipAbbrev">
                        {tooltipTeam.teamAbbrev}
                    </p>
                </div>
            </div>

            <div className="visualizerTooltipRow">
                <span>{VISUALIZER_METRICS[xMetric].shortLabel}</span>
                <strong>
                    {formatVisualizerMetricValue(
                        xMetric,
                        tooltipTeam.metrics[xMetric],
                    )}
                </strong>
            </div>
            <div className="visualizerTooltipRow">
                <span>{VISUALIZER_METRICS[yMetric].shortLabel}</span>
                <strong>
                    {formatVisualizerMetricValue(
                        yMetric,
                        tooltipTeam.metrics[yMetric],
                    )}
                </strong>
            </div>
        </div>
    );
}