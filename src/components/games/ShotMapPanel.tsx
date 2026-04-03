import GameEventRink from "@/components/games/Rink";
import type { GameDetailPeriodKey, HistoricalGameDetailResponse } from "@/types/games";

type TeamOption = {
    value: string;
    label: string;
};

type PlayerOption = {
    value: string;
    label: string;
};

type HistoricalGameDetailShotMapPanelProps = {
    data: HistoricalGameDetailResponse;
    chartTeam: string;
    chartMode: "shots" | "goals";
    selectedPlayer: string;
    chartPeriod: GameDetailPeriodKey;
    teamOptions: TeamOption[];
    chartPlayers: PlayerOption[];
    availablePeriodOptions: Array<{
        value: GameDetailPeriodKey;
        label: string;
    }>;
    filteredChartEvents: HistoricalGameDetailResponse["chartEvents"];
    onChartModeChange: (mode: "shots" | "goals") => void;
    onChartTeamChange: (team: string) => void;
    onSelectedPlayerChange: (playerId: string) => void;
    onChartPeriodChange: (period: GameDetailPeriodKey) => void;
};

export default function HistoricalGameDetailShotMapPanel({
    data,
    chartTeam,
    chartMode,
    selectedPlayer,
    chartPeriod,
    teamOptions,
    chartPlayers,
    availablePeriodOptions,
    filteredChartEvents,
    onChartModeChange,
    onChartTeamChange,
    onSelectedPlayerChange,
    onChartPeriodChange,
}: HistoricalGameDetailShotMapPanelProps) {
    const activeTeamLabel =
        chartTeam === data.homeTeam.abbrev
            ? data.homeTeam.label
            : data.awayTeam.label;

    return (
        <article className="historicalGameDetailCard historicalGameTopCard historicalGameRinkCard">
            <div className="historicalGameSectionHeader">
                <div>
                    <p className="historicalGamesEyebrow">Shot map</p>
                    <h2 className="historicalGameDetailCardTitle">
                        {activeTeamLabel}
                    </h2>
                </div>

                <div className="historicalGameToggleGroup">
                    <button
                        type="button"
                        className={`historicalGameSegmentButton${
                            chartMode === "shots"
                                ? " historicalGameSegmentButtonActive"
                                : ""
                        }`}
                        onClick={() => onChartModeChange("shots")}
                    >
                        Shots
                    </button>
                    <button
                        type="button"
                        className={`historicalGameSegmentButton${
                            chartMode === "goals"
                                ? " historicalGameSegmentButtonActive"
                                : ""
                        }`}
                        onClick={() => onChartModeChange("goals")}
                    >
                        Goals
                    </button>
                </div>
            </div>

            <div className="historicalGameFilterRow historicalGameFilterRowCompact">
                <div className="historicalGameToggleGroup">
                    {teamOptions.map((team) => (
                        <button
                            key={team.value}
                            type="button"
                            className={`historicalGameSegmentButton historicalGameSegmentButtonTeam${
                                chartTeam === team.value
                                    ? " historicalGameSegmentButtonActive"
                                    : ""
                            }`}
                            onClick={() => onChartTeamChange(team.value)}
                        >
                            {team.value}
                        </button>
                    ))}
                </div>

                <div className="historicalGameInlineControlGroup">
                    <label className="historicalGameInlineField">
                        <span className="historicalGamesFieldLabel">Player</span>
                        <select
                            className="historicalGamesSelect historicalGameInlineSelect"
                            value={selectedPlayer}
                            onChange={(event) =>
                                onSelectedPlayerChange(event.target.value)
                            }
                        >
                            <option value="ALL">All players</option>
                            {chartPlayers.map((player) => (
                                <option key={player.value} value={player.value}>
                                    {player.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="historicalGameInlineField">
                        <span className="historicalGamesFieldLabel">Period</span>
                        <select
                            className="historicalGamesSelect historicalGameInlineSelect"
                            value={chartPeriod}
                            onChange={(event) =>
                                onChartPeriodChange(
                                    event.target.value as GameDetailPeriodKey
                                )
                            }
                        >
                            {availablePeriodOptions.map((period) => (
                                <option key={period.value} value={period.value}>
                                    {period.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <GameEventRink events={filteredChartEvents} mode={chartMode} />
        </article>
    );
}