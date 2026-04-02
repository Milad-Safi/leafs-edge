import { formatVisualizerMetricValue } from "@/lib/visualizer";
import type {
    TeamScatterTeam,
    VisualizerMetricId,
} from "@/types/api";
import type { PlotPoint } from "@/components/visualizer/teamScatterPlot";

type Props = {
    sortedTeams: TeamScatterTeam[];
    pointByTeamAbbrev: Map<string, PlotPoint>;
    hoveredTeamAbbrev: string | null;
    pinnedTeamAbbrev: string | null;
    xMetric: VisualizerMetricId;
    yMetric: VisualizerMetricId;
    onTeamHover: (teamAbbrev: string | null) => void;
    onTeamClick: (teamAbbrev: string) => void;
};

export default function VisualizerTeamRail({
    sortedTeams,
    pointByTeamAbbrev,
    hoveredTeamAbbrev,
    pinnedTeamAbbrev,
    xMetric,
    yMetric,
    onTeamHover,
    onTeamClick,
}: Props) {
    return (
        <aside className="visualizerRailCard">
            <div className="visualizerRailHeader">
                <h3 className="visualizerRailTitle">Teams</h3>
                <span className="visualizerRailCount">{sortedTeams.length}</span>
            </div>

            <div className="visualizerTeamList">
                {sortedTeams.map((team) => {
                    const point = pointByTeamAbbrev.get(team.teamAbbrev) ?? null;
                    const isHovered = hoveredTeamAbbrev === team.teamAbbrev;
                    const isPinned = pinnedTeamAbbrev === team.teamAbbrev;
                    const isFocused = isHovered || isPinned;
                    const isUnavailable = point == null;

                    return (
                        <button
                            key={team.teamAbbrev}
                            type="button"
                            className={`visualizerTeamRow${
                                isFocused ? " visualizerTeamRowFocused" : ""
                            }${
                                isUnavailable
                                    ? " visualizerTeamRowUnavailable"
                                    : ""
                            }`}
                            onMouseEnter={() => {
                                onTeamHover(team.teamAbbrev);
                            }}
                            onMouseLeave={() => {
                                onTeamHover(null);
                            }}
                            onClick={() => {
                                onTeamClick(team.teamAbbrev);
                            }}
                        >
                            <span className="visualizerTeamRowMain">
                                <img
                                    src={team.logoSrc}
                                    alt={`${team.teamFullName} logo`}
                                    className="visualizerTeamRowLogo"
                                />

                                <span className="visualizerTeamRowCopy">
                                    <span className="visualizerTeamRowName">
                                        {team.teamFullName}
                                    </span>
                                    <span className="visualizerTeamRowAbbrev">
                                        {team.teamAbbrev}
                                    </span>
                                </span>
                            </span>

                            <span className="visualizerTeamRowValues">
                                <span>
                                    X{" "}
                                    {formatVisualizerMetricValue(
                                        xMetric,
                                        team.metrics[xMetric],
                                    )}
                                </span>
                                <span>
                                    Y{" "}
                                    {formatVisualizerMetricValue(
                                        yMetric,
                                        team.metrics[yMetric],
                                    )}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}