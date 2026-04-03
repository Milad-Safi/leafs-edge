import type { HistoricalGameDetailResponse } from "@/types/games";

import {
    formatCompactGameDate,
    formatDecisionLabel,
    formatGameDate,
    formatNumber,
    formatVenueLabel,
    getStatWidths,
} from "@/components/games/Shared";

type HistoricalGameDetailHeroProps = {
    data: HistoricalGameDetailResponse;
};

export default function Hero({
    data,
}: HistoricalGameDetailHeroProps) {
    const awayGameStats = data.teamStats.ALL[data.awayTeam.abbrev];
    const homeGameStats = data.teamStats.ALL[data.homeTeam.abbrev];

    const awayExpectedGoals = awayGameStats.estimatedXGoals;
    const homeExpectedGoals = homeGameStats.estimatedXGoals;
    const xGoalWidths = getStatWidths(awayExpectedGoals, homeExpectedGoals);

    return (
        <section className="historicalGameDetailHero historicalGameDetailHeroMatchup">
            <p className="historicalGameHeroVenue">
                {data.venueName ?? formatVenueLabel(data)}
            </p>

            <div className="historicalGameHeroBoard">
                <div className="historicalGameHeroTeam historicalGameHeroTeamAway">
                    <div className="historicalGameHeroTeamInner">
                        <img
                            src={data.awayTeam.logoSrc}
                            alt={`${data.awayTeam.label} logo`}
                            className="historicalGameHeroLogo"
                        />

                        <div className="historicalGameHeroTeamCopy">
                            <p className="historicalGameHeroTeamLabel">Away</p>
                            <p className="historicalGameHeroTeamName">
                                {data.awayTeam.label}
                            </p>

                            <p className="historicalGameHeroMetaInline">
                                <span className="historicalGameHeroMetaInlineLabel">
                                    SOG:
                                </span>{" "}
                                <span className="historicalGameHeroMetaInlineValue">
                                    {formatNumber(awayGameStats.shotsOnGoal)}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="historicalGameHeroMiddle">
                    <div className="historicalGameHeroScoreRow">
                        <p className="historicalGameHeroScore">
                            {data.awayTeam.score}
                        </p>

                        <div className="historicalGameHeroMiddleMeta">
                            <p className="historicalGameHeroDate">
                                {formatCompactGameDate(data.gameDate)}
                            </p>
                            <p className="historicalGameHeroFinal">Final</p>
                        </div>

                        <p className="historicalGameHeroScore">
                            {data.homeTeam.score}
                        </p>
                    </div>

                    <div className="historicalGameHeroSubline">
                        <span>{data.awayTeam.abbrev}</span>
                        <span>@</span>
                        <span>{data.homeTeam.abbrev}</span>
                        <span>•</span>
                        <span>{formatDecisionLabel(data.decision)}</span>
                    </div>
                </div>

                <div className="historicalGameHeroTeam historicalGameHeroTeamHome">
                    <div className="historicalGameHeroTeamInner historicalGameHeroTeamInnerHome">
                        <div className="historicalGameHeroTeamCopy historicalGameHeroTeamCopyHome">
                            <p className="historicalGameHeroTeamLabel">Home</p>
                            <p className="historicalGameHeroTeamName">
                                {data.homeTeam.label}
                            </p>

                            <p className="historicalGameHeroMetaInline historicalGameHeroMetaInlineHome">
                                <span className="historicalGameHeroMetaInlineLabel">
                                    SOG:
                                </span>{" "}
                                <span className="historicalGameHeroMetaInlineValue">
                                    {formatNumber(homeGameStats.shotsOnGoal)}
                                </span>
                            </p>
                        </div>

                        <img
                            src={data.homeTeam.logoSrc}
                            alt={`${data.homeTeam.label} logo`}
                            className="historicalGameHeroLogo"
                        />
                    </div>
                </div>
            </div>

            <div className="historicalGameHeroFeature">
                <div className="historicalGameHeroFeatureHeader">
                    <p className="historicalGamesEyebrow">Game edge</p>
                    <h2 className="historicalGameHeroFeatureTitle">
                        Expected Goals
                    </h2>
                </div>

                <div className="historicalGameStatsFeature">
                    <div className="historicalGameStatsFeatureRow">
                        <div className="historicalGameStatsFeatureTeam historicalGameStatsFeatureTeamAway">
                            <span className="historicalGameStatsFeatureAbbrev">
                                {data.awayTeam.abbrev}
                            </span>
                            <span className="historicalGameStatsFeatureValue">
                                {formatNumber(awayExpectedGoals, 2)}
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
                                {formatNumber(homeExpectedGoals, 2)}
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
            </div>

            <p className="historicalGameDetailSubtitle historicalGameDetailSubtitleHero">
                {formatGameDate(data.gameDate)}
            </p>
        </section>
    );
}