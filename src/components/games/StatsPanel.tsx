import type { GameDetailPeriodKey, HistoricalGameDetailResponse } from "@/types/games";

import {
    formatNumber,
    getStatWidths,
    TEAM_STAT_ROWS,
} from "@/components/games/Shared";

type HistoricalGameDetailTeamStatsPanelProps = {
    data: HistoricalGameDetailResponse;
    statsPeriod: GameDetailPeriodKey;
    availablePeriodOptions: Array<{
        value: GameDetailPeriodKey;
        label: string;
    }>;
    onStatsPeriodChange: (period: GameDetailPeriodKey) => void;
};

export default function HistoricalGameDetailTeamStatsPanel({
    data,
    statsPeriod,
    availablePeriodOptions,
    onStatsPeriodChange,
}: HistoricalGameDetailTeamStatsPanelProps) {
    const xGoalsAway =
        data.teamStats[statsPeriod][data.awayTeam.abbrev].estimatedXGoals;
    const xGoalsHome =
        data.teamStats[statsPeriod][data.homeTeam.abbrev].estimatedXGoals;
    const xGoalWidths = getStatWidths(xGoalsAway, xGoalsHome);

    return (
        <article className="historicalGameDetailCard historicalGameTeamStatsCardSide">
            <div className="historicalGameSectionHeader historicalGameSectionHeaderStatsSide">
                <div>
                    <p className="historicalGamesEyebrow">Game totals</p>
                    <h2 className="historicalGameDetailCardTitle">Team Stats</h2>
                </div>

                <div className="historicalGameToggleGroup historicalGameToggleGroupPeriods historicalGameToggleGroupPeriodsSide">
                    {availablePeriodOptions.map((period) => (
                        <button
                            key={period.value}
                            type="button"
                            className={`historicalGameSegmentButton${
                                statsPeriod === period.value
                                    ? " historicalGameSegmentButtonActive"
                                    : ""
                            }`}
                            onClick={() => onStatsPeriodChange(period.value)}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="historicalGameStatsFeature">
                <div className="historicalGameStatsFeatureRow">
                    <div className="historicalGameStatsFeatureTeam historicalGameStatsFeatureTeamAway">
                        <span className="historicalGameStatsFeatureAbbrev">
                            {data.awayTeam.abbrev}
                        </span>
                        <span className="historicalGameStatsFeatureValue">
                            {formatNumber(xGoalsAway, 2)}
                        </span>
                    </div>

                    <div className="historicalGameStatsFeatureMiddle">
                        <span className="historicalGameStatsFeatureLabel">
                            Expected goals
                        </span>
                    </div>

                    <div className="historicalGameStatsFeatureTeam historicalGameStatsFeatureTeamHome">
                        <span className="historicalGameStatsFeatureAbbrev">
                            {data.homeTeam.abbrev}
                        </span>
                        <span className="historicalGameStatsFeatureValue">
                            {formatNumber(xGoalsHome, 2)}
                        </span>
                    </div>
                </div>

                <div className="historicalGameStatsFeatureTrack">
                    <div
                        className="historicalGameStatsBar historicalGameStatsBarAway"
                        style={{ width: `${xGoalWidths.left}%` }}
                    />
                    <div
                        className="historicalGameStatsBar historicalGameStatsBarHome"
                        style={{ width: `${xGoalWidths.right}%` }}
                    />
                </div>
            </div>

            <div className="historicalGameStatsCompareList">
                {TEAM_STAT_ROWS.map((row) => {
                    const awayValue =
                        data.teamStats[statsPeriod][data.awayTeam.abbrev][row.key];
                    const homeValue =
                        data.teamStats[statsPeriod][data.homeTeam.abbrev][row.key];
                    const widths = getStatWidths(awayValue, homeValue);

                    return (
                        <div
                            key={row.key}
                            className="historicalGameStatsCompareRow"
                        >
                            <div className="historicalGameStatsCompareValues">
                                <span className="historicalGameStatsValue historicalGameStatsValueLeft">
                                    {formatNumber(awayValue, row.decimals ?? 0)}
                                </span>
                                <span className="historicalGameStatsLabel">
                                    {row.label}
                                </span>
                                <span className="historicalGameStatsValue historicalGameStatsValueRight">
                                    {formatNumber(homeValue, row.decimals ?? 0)}
                                </span>
                            </div>

                            <div className="historicalGameStatsBarTrack">
                                <div
                                    className="historicalGameStatsBar historicalGameStatsBarAway"
                                    style={{ width: `${widths.left}%` }}
                                />
                                <div
                                    className="historicalGameStatsBar historicalGameStatsBarHome"
                                    style={{ width: `${widths.right}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}