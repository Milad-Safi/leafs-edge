"use client";

import GoalieCompareSection from "@/components/GoalieCompareSection";
import MatchupCompareSection from "@/components/MatchupCompareSection";
import SkaterCompareSection from "@/components/SkaterCompareSection";
import TeamCompareSection from "@/components/TeamCompareSection";
import CompareState from "@/components/compare/CompareState";
import TeamHeroCard from "@/components/compare/TeamHeroCard";
import { useMatchupHistory } from "@/hooks/useMatchupHistory";
import useMatchupData from "@/hooks/useMatchupData";
import { formatCompareBadgeDate } from "@/lib/comparePresentation";
import {
    compareModeLabelMap,
    filterLabelMap,
    type CompareFilter,
    type CompareMode,
} from "@/lib/compare";

type CompareResultsPanelProps = {
    team1: string;
    team2: string;
    compareBy: CompareMode;
    filterBy: CompareFilter;
    canCompare: boolean;
    selectedTeam1Label: string;
    selectedTeam2Label: string;
};

export default function CompareResultsPanel({
    team1,
    team2,
    compareBy,
    filterBy,
    canCompare,
    selectedTeam1Label,
    selectedTeam2Label,
}: CompareResultsPanelProps) {
    const isDuplicateSelection = Boolean(team1 && team2 && team1 === team2);
    const shouldLoadTeamData = compareBy === "team";

    const {
        leftSummary,
        rightSummary,
        loadingSummary,
        leftSplit,
        rightSplit,
        loadingSplit,
        teamRanks,
    } = useMatchupData({
        leftTeamAbbrev: team1,
        rightTeamAbbrev: team2 || null,
        filterBy,
        enabled: shouldLoadTeamData,
    });

    const {
        data: matchupHistoryData,
        loading: matchupHistoryLoading,
        error: matchupHistoryError,
    } = useMatchupHistory(
        compareBy === "matchup" && canCompare ? team1 : null,
        compareBy === "matchup" && canCompare ? team2 : null,
        filterBy
    );

    const showMatchupMeta =
        compareBy === "matchup" &&
        !matchupHistoryLoading &&
        !matchupHistoryError &&
        (matchupHistoryData?.gamesFound ?? 0) > 0;

    return (
        <section className="compareResultsPanel">
            <div className="compareResultsPanelHeader">
                <div>
                    <p className="compareResultsEyebrow">
                        {compareModeLabelMap[compareBy]}
                    </p>

                    <h2 className="compareResultsTitle">
                        {compareModeLabelMap[compareBy]} comparison
                    </h2>
                </div>

                <div className="compareResultsBadges">
                    <span className="compareResultsBadge">
                        {filterLabelMap[filterBy]}
                    </span>

                    {showMatchupMeta && (
                        <span className="compareResultsBadge">
                            {matchupHistoryData?.gamesFound} games used
                        </span>
                    )}

                    {showMatchupMeta && (
                        <span className="compareResultsBadge">
                            Last played:{" "}
                            {formatCompareBadgeDate(
                                matchupHistoryData?.lastPlayedDate
                            )}
                        </span>
                    )}
                </div>
            </div>

            {!team1 && !team2 && (
                <CompareState
                    title="Select two teams"
                    text="Pick Team 1, Team 2, what you want to compare, and the game range filter to build the comparison layout."
                />
            )}

            {(team1 || team2) && !canCompare && !isDuplicateSelection && (
                <CompareState
                    title="One more team needed"
                    text="Choose the second team to unlock the comparison rows."
                />
            )}

            {isDuplicateSelection && (
                <CompareState
                    title="Choose two different teams"
                    text={`${
                        selectedTeam1Label || "That team"
                    } is selected on both sides right now.`}
                    tone="warning"
                />
            )}

            {canCompare && (
                <div className="compareBuiltView">
                    <div className="compareHeroWrap">
                        <TeamHeroCard
                            teamAbbrev={team1}
                            teamLabel={selectedTeam1Label}
                            align="left"
                        />

                        <div className="compareHeroVsWrap">
                            <span className="compareHeroVs">VS</span>
                        </div>

                        <TeamHeroCard
                            teamAbbrev={team2}
                            teamLabel={selectedTeam2Label}
                            align="right"
                        />
                    </div>

                    {compareBy === "team" && (
                        <TeamCompareSection
                            team1={team1}
                            team2={team2}
                            selectedTeam1Label={selectedTeam1Label}
                            selectedTeam2Label={selectedTeam2Label}
                            filterBy={filterBy}
                            leftSummary={leftSummary}
                            rightSummary={rightSummary}
                            leftSplit={leftSplit}
                            rightSplit={rightSplit}
                            ranks={teamRanks}
                            loadingSummary={loadingSummary}
                            loadingSplit={loadingSplit}
                        />
                    )}

                    {compareBy === "matchup" && (
                        <MatchupCompareSection
                            team1={team1}
                            team2={team2}
                            selectedTeam1Label={selectedTeam1Label}
                            selectedTeam2Label={selectedTeam2Label}
                            matchupHistoryData={matchupHistoryData}
                            matchupHistoryLoading={matchupHistoryLoading}
                            matchupHistoryError={matchupHistoryError}
                        />
                    )}

                    {(compareBy === "skaters" ||
                        compareBy === "forwards" ||
                        compareBy === "defenders") && (
                        <SkaterCompareSection
                            team1={team1}
                            team2={team2}
                            compareBy={compareBy}
                            filterBy={filterBy}
                        />
                    )}

                    {compareBy === "goalies" && (
                        <GoalieCompareSection
                            team1={team1}
                            team2={team2}
                            filterBy={filterBy}
                            selectedTeam1Label={selectedTeam1Label}
                            selectedTeam2Label={selectedTeam2Label}
                        />
                    )}
                </div>
            )}
        </section>
    );
}