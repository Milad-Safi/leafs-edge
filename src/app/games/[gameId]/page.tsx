import HistoricalGameDetailClient from "@/components/games/Client";

type GameDetailPageProps = {
    params: Promise<{
        gameId: string;
    }>;
    searchParams: Promise<{
        team?: string;
    }>;
};

export default async function GameDetailPage({
    params,
    searchParams,
}: GameDetailPageProps) {
    const { gameId } = await params;
    const resolvedSearchParams = await searchParams;

    return (
        <HistoricalGameDetailClient
            gameId={gameId}
            focusTeamAbbrev={resolvedSearchParams.team ?? null}
        />
    );
}