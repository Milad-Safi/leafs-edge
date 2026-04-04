import type { HistoricalGameDetailResponse } from "@/types/games";

import {
    formatSavePct,
    sortLabel,
    type SkaterSortKey,
    type SortDirection,
} from "@/components/games/Shared";

type TeamOption = {
    value: string;
    label: string;
};

type HistoricalGameDetailBoxscorePanelProps = {
    data: HistoricalGameDetailResponse;
    teamOptions: TeamOption[];
    boxscoreTeam: string;
    sortedSkaterRows: HistoricalGameDetailResponse["playerStats"]["home"]["skaters"];
    goalieRows: HistoricalGameDetailResponse["playerStats"]["home"]["goalies"];
    skaterSortKey: SkaterSortKey;
    sortDirection: SortDirection;
    onBoxscoreTeamChange: (team: string) => void;
    onSkaterSort: (key: SkaterSortKey) => void;
};

export default function HistoricalGameDetailBoxscorePanel({
    data,
    teamOptions,
    boxscoreTeam,
    sortedSkaterRows,
    goalieRows,
    skaterSortKey,
    sortDirection,
    onBoxscoreTeamChange,
    onSkaterSort,
}: HistoricalGameDetailBoxscorePanelProps) {
    const activeTeamLabel =
        boxscoreTeam === data.homeTeam.abbrev
            ? data.homeTeam.label
            : data.awayTeam.label;

    return (
        <article className="historicalGameDetailCard historicalGameTopCard historicalGameBoxscoreCard">
            <div className="historicalGameSectionHeader historicalGameSectionHeaderBoxscore">
                <div>
                    <p className="historicalGamesEyebrow">Box score</p>
                    <h2 className="historicalGameDetailCardTitle">
                        {activeTeamLabel}
                    </h2>
                </div>

                <div className="historicalGameTopRightControls">
                    <div className="historicalGameToggleGroup">
                        {teamOptions.map((team) => (
                            <button
                                key={team.value}
                                type="button"
                                className={`historicalGameSegmentButton historicalGameSegmentButtonTeam${
                                    boxscoreTeam === team.value
                                        ? " historicalGameSegmentButtonActive"
                                        : ""
                                }`}
                                onClick={() => onBoxscoreTeamChange(team.value)}
                            >
                                {team.value}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="historicalGameBoxscoreTableWrap">
                <table
                    className={`historicalGameBoxscoreTable historicalGameBoxscoreTableSkaters historicalGameBoxscoreSort-${skaterSortKey}`}
                >
                    <thead>
                        <tr>
                            <th>
                                <button
                                    type="button"
                                    onClick={() => onSkaterSort("name")}
                                >
                                    Name
                                    {sortLabel(
                                        "name",
                                        skaterSortKey,
                                        sortDirection
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    onClick={() => onSkaterSort("goals")}
                                >
                                    G
                                    {sortLabel(
                                        "goals",
                                        skaterSortKey,
                                        sortDirection
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    onClick={() => onSkaterSort("assists")}
                                >
                                    A
                                    {sortLabel(
                                        "assists",
                                        skaterSortKey,
                                        sortDirection
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    onClick={() => onSkaterSort("points")}
                                >
                                    P
                                    {sortLabel(
                                        "points",
                                        skaterSortKey,
                                        sortDirection
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    onClick={() => onSkaterSort("shots")}
                                >
                                    S
                                    {sortLabel(
                                        "shots",
                                        skaterSortKey,
                                        sortDirection
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    onClick={() => onSkaterSort("toiSeconds")}
                                >
                                    TOI
                                    {sortLabel(
                                        "toiSeconds",
                                        skaterSortKey,
                                        sortDirection
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    onClick={() => onSkaterSort("hits")}
                                >
                                    H
                                    {sortLabel(
                                        "hits",
                                        skaterSortKey,
                                        sortDirection
                                    )}
                                </button>
                            </th>
                            <th>
                                <button
                                    type="button"
                                    onClick={() => onSkaterSort("blocks")}
                                >
                                    B
                                    {sortLabel(
                                        "blocks",
                                        skaterSortKey,
                                        sortDirection
                                    )}
                                </button>
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {sortedSkaterRows.map((player) => (
                            <tr key={`skater-${player.playerId}`}>
                                <td>
                                    <div className="historicalGamePlayerCell">
                                        <span className="historicalGamePlayerNumber">
                                            {player.sweaterNumber || "—"}
                                        </span>
                                        <span className="historicalGamePlayerNameText">
                                            {player.name}
                                        </span>
                                    </div>
                                </td>
                                <td>{player.goals}</td>
                                <td>{player.assists}</td>
                                <td>{player.points}</td>
                                <td>{player.shots}</td>
                                <td>{player.toi || "—"}</td>
                                <td>{player.hits}</td>
                                <td>{player.blocks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {goalieRows.length > 0 ? (
                    <div className="historicalGameBoxscoreGoalies">
                        <p className="historicalGameBoxscoreSectionLabel">Goalies</p>

                        <table className="historicalGameBoxscoreTable historicalGameBoxscoreTableGoalies">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>SA</th>
                                    <th>SV</th>
                                    <th>SV%</th>
                                    <th>GA</th>
                                    <th>TOI</th>
                                </tr>
                            </thead>

                            <tbody>
                                {goalieRows.map((player) => (
                                    <tr key={`goalie-${player.playerId}`}>
                                        <td>
                                            <div className="historicalGamePlayerCell">
                                                <span className="historicalGamePlayerNumber">
                                                    {player.sweaterNumber || "—"}
                                                </span>

                                                <span className="historicalGamePlayerNameWrap">
                                                    <span className="historicalGamePlayerNameText">
                                                        {player.name}
                                                    </span>

                                                    {player.starter ? (
                                                        <span className="historicalGamePlayerBadge">
                                                            Starter
                                                        </span>
                                                    ) : null}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{player.shotsAgainst}</td>
                                        <td>{player.saves}</td>
                                        <td>{formatSavePct(player.savePct)}</td>
                                        <td>{player.goalsAgainst}</td>
                                        <td>{player.toi || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>
        </article>
    );
}