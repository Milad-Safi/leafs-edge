"use client";

import CompareState from "@/components/compare/CompareState";
import StatRow from "@/components/StatRow";
import type { CompareFilter } from "@/lib/compare";
import { getTeamColor } from "@/lib/teamColours";
import {
    buildSeasonTeamCompareRows,
    buildSplitTeamCompareRows,
} from "@/lib/teamCompareRows";
import type { TeamRanks, TeamSplit, TeamSummary } from "@/types/api";

type TeamCompareSectionProps = {
    team1: string;
    team2: string;
    selectedTeam1Label: string;
    selectedTeam2Label: string;
    filterBy: CompareFilter;
    leftSummary: TeamSummary | null;
    rightSummary: TeamSummary | null;
    leftSplit: TeamSplit | null;
    rightSplit: TeamSplit | null;
    ranks: TeamRanks | null;
    loadingSummary: boolean;
    loadingSplit: boolean;
};

function isSplitFilter(filterBy: CompareFilter) {
    return (
        filterBy === "last1" ||
        filterBy === "last2" ||
        filterBy === "last3" ||
        filterBy === "last4" ||
        filterBy === "last5" ||
        filterBy === "last10"
    );
}

export default function TeamCompareSection({
    team1,
    team2,
    filterBy,
    leftSummary,
    rightSummary,
    leftSplit,
    rightSplit,
    ranks,
    loadingSummary,
    loadingSplit,
}: TeamCompareSectionProps) {
    const leftColor = getTeamColor(team1);
    const rightColor = getTeamColor(team2);

    const showSeason = filterBy === "season";
    const showSplit = isSplitFilter(filterBy);
    const unsupportedFilter = !showSeason && !showSplit;
    const isLoading = (showSeason && loadingSummary) || (showSplit && loadingSplit);

    const safeLeftSummary =
        leftSummary?.teamAbbrev === team1 ? leftSummary : null;

    const safeRightSummary =
        rightSummary?.teamAbbrev === team2 ? rightSummary : null;

    const seasonRows = buildSeasonTeamCompareRows({
        team1,
        team2,
        leftSummary: safeLeftSummary,
        rightSummary: safeRightSummary,
        ranks,
    });

    const splitRows = buildSplitTeamCompareRows({
        leftSplit,
        rightSplit,
    });

    return (
        <div className="compareSectionBlock">
            {unsupportedFilter && (
                <CompareState
                    title="Filter not wired yet"
                    text="Team compare is live for Entire season and Last X games first."
                    tone="warning"
                />
            )}

            {isLoading && (
                <CompareState spinnerOnly ariaLive="polite" title="Loading" />
            )}

            {showSeason && !isLoading && !safeLeftSummary && !safeRightSummary && (
                <CompareState
                    title="No season data returned"
                    text="The season summary request came back empty for both teams."
                    tone="warning"
                />
            )}

            {showSeason && !isLoading && (safeLeftSummary || safeRightSummary) && (
                <div className="compareRows">
                    {seasonRows.map((row) => (
                        <StatRow
                            key={row.label}
                            label={row.label}
                            leftVal={row.leftVal}
                            rightVal={row.rightVal}
                            leftText={row.leftText}
                            rightText={row.rightText}
                            leftColor={leftColor}
                            rightColor={rightColor}
                        />
                    ))}
                </div>
            )}

            {showSplit && !isLoading && !leftSplit && !rightSplit && (
                <CompareState
                    title="No split data returned"
                    text="The selected last X split came back empty for both teams."
                    tone="warning"
                />
            )}

            {showSplit && !isLoading && (leftSplit || rightSplit) && (
                <div className="compareRows">
                    {splitRows.map((row) => (
                        <StatRow
                            key={row.label}
                            label={row.label}
                            leftVal={row.leftVal}
                            rightVal={row.rightVal}
                            leftText={row.leftText}
                            rightText={row.rightText}
                            leftColor={leftColor}
                            rightColor={rightColor}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}