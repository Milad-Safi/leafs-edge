import type {
    HistoricalGameDetailResponse,
    HistoricalGamePositionFilter,
} from "@/types/games";

import {
    formatSavePct,
    POSITION_OPTIONS,
    sortLabel,
    type GoalieSortKey,
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
    positionFilter: HistoricalGamePositionFilter;
    sortedSkaterRows: HistoricalGameDetailResponse["playerStats"]["home"]["skaters"];
    sortedGoalieRows: HistoricalGameDetailResponse["playerStats"]["home"]["goalies"];
    skaterSortKey: SkaterSortKey;
    goalieSortKey: GoalieSortKey;
    sortDirection: SortDirection;
    onBoxscoreTeamChange: (team: string) => void;
    onPositionFilterChange: (filter: HistoricalGamePositionFilter) => void;
    onSkaterSort: (key: SkaterSortKey) => void;
    onGoalieSort: (key: GoalieSortKey) => void;
};

export default function HistoricalGameDetailBoxscorePanel({
    data,
    teamOptions,
    boxscoreTeam,
    positionFilter,
    sortedSkaterRows,
    sortedGoalieRows,
    skaterSortKey,
    goalieSortKey,
    sortDirection,
    onBoxscoreTeamChange,
    onPositionFilterChange,
    onSkaterSort,
    onGoalieSort,
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

                    <label className="historicalGameInlineField historicalGameInlineFieldBoxscore">
                        <span className="historicalGamesFieldLabel">Position</span>
                        <select
                            className="historicalGamesSelect historicalGameInlineSelect"
                            value={positionFilter}
                            onChange={(event) =>
                                onPositionFilterChange(
                                    event.target.value as HistoricalGamePositionFilter
                                )
                            }
                        >
                            {POSITION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <div className="historicalGameBoxscoreTableWrap">
                {positionFilter === "goalies" ? (
                    <table
                        className={`historicalGameBoxscoreTable historicalGameBoxscoreTableGoalies historicalGameBoxscoreSort-${goalieSortKey}`}
                    >
                        <thead>
                            <tr>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => onGoalieSort("name")}
                                    >
                                        Name
                                        {sortLabel(
                                            "name",
                                            goalieSortKey,
                                            sortDirection
                                        )}
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => onGoalieSort("shotsAgainst")}
                                    >
                                        SA
                                        {sortLabel(
                                            "shotsAgainst",
                                            goalieSortKey,
                                            sortDirection
                                        )}
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => onGoalieSort("saves")}
                                    >
                                        SV
                                        {sortLabel(
                                            "saves",
                                            goalieSortKey,
                                            sortDirection
                                        )}
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => onGoalieSort("savePct")}
                                    >
                                        SV%
                                        {sortLabel(
                                            "savePct",
                                            goalieSortKey,
                                            sortDirection
                                        )}
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => onGoalieSort("goalsAgainst")}
                                    >
                                        GA
                                        {sortLabel(
                                            "goalsAgainst",
                                            goalieSortKey,
                                            sortDirection
                                        )}
                                    </button>
                                </th>
                                <th>
                                    <button
                                        type="button"
                                        onClick={() => onGoalieSort("toiSeconds")}
                                    >
                                        TOI
                                        {sortLabel(
                                            "toiSeconds",
                                            goalieSortKey,
                                            sortDirection
                                        )}
                                    </button>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedGoalieRows.map((player) => (
                                <tr key={player.playerId}>
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
                ) : (
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
                                <tr key={player.playerId}>
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
                )}
            </div>
        </article>
    );
}