import HistoricalGameCard from "@/components/games/Card";
import { NHL_TEAM_OPTIONS } from "@/lib/compare";
import type { HistoricalGamesSearchResponse } from "@/types/games";

type HistoricalGamesResultsProps = {
    data: HistoricalGamesSearchResponse;
    loading: boolean;
    error: string | null;
    onPageChange: (nextPage: number) => void;
};

function getTeamLabel(teamAbbrev: string) {
    return (
        NHL_TEAM_OPTIONS.find((team) => team.value === teamAbbrev)?.label ??
        teamAbbrev
    );
}

export default function HistoricalGamesResults({
    data,
    loading,
    error,
    onPageChange,
}: HistoricalGamesResultsProps) {
    if (loading) {
        return (
            <div
                className="historicalGamesStateCard historicalGamesStateCardLoading"
                role="status"
            >
                <div className="historicalGamesSpinner" aria-hidden="true" />
                <h2 className="historicalGamesStateTitle">Loading historical games</h2>
                <p className="historicalGamesStateText">
                    Pulling the schedule list and building the game cards
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="historicalGamesStateCard historicalGamesStateCardError">
                <h2 className="historicalGamesStateTitle">Could not load games</h2>
                <p className="historicalGamesStateText">{error}</p>
            </div>
        );
    }

    if (data.games.length === 0) {
        return (
            <div className="historicalGamesStateCard">
                <h2 className="historicalGamesStateTitle">No games matched</h2>
                <p className="historicalGamesStateText">
                    Try removing the opponent filter or switching the season
                </p>
            </div>
        );
    }

    const { page, totalPages, totalGames } = data.pagination;
    const { opponent } = data.filters;
    const opponentLabel = opponent ? getTeamLabel(opponent) : null;

    return (
        <section className="historicalGamesResultsWrap">
            <div className="historicalGamesResultsHeader">
                <h2 className="historicalGamesResultsTitle">Select a game</h2>

                <p className="historicalGamesResultsMeta">
                    {totalGames} games
                    {opponentLabel ? ` · vs ${opponentLabel}` : ""}
                </p>
            </div>

            <div className="historicalGamesCardList">
                {data.games.map((game) => (
                    <HistoricalGameCard key={game.gameId} game={game} />
                ))}
            </div>

            <div className="historicalGamesPagination">
                <button
                    type="button"
                    className="historicalGamesPageButton"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                >
                    Previous
                </button>

                <p className="historicalGamesPageText">
                    Page {page} of {totalPages}
                </p>

                <button
                    type="button"
                    className="historicalGamesPageButton"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                >
                    Next
                </button>
            </div>
        </section>
    );
}