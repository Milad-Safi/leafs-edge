import {
    higherBetterStrength,
    lowerBetterStrength,
    pointsFromWinsOtl,
    teamStreakStrength,
    toPct100,
} from "@/lib/statsMath";
import type { TeamRanks, TeamSplit, TeamSummary } from "@/types/api";

export type TeamCompareRow = {
    label: string;
    leftVal: number | null;
    rightVal: number | null;
    leftText: string;
    rightText: string;
};

function ordinal(n: number) {
    const mod100 = n % 100;

    if (mod100 >= 11 && mod100 <= 13) {
        return `${n}th`;
    }

    const mod10 = n % 10;

    if (mod10 === 1) return `${n}st`;
    if (mod10 === 2) return `${n}nd`;
    if (mod10 === 3) return `${n}rd`;

    return `${n}th`;
}

function formatRecord(
    record:
        | { w: number; l: number; otl: number }
        | { w: number; l: number }
        | null
        | undefined
) {
    if (!record) return "—";

    if ("otl" in record) {
        return `${record.w}-${record.l}-${record.otl}`;
    }

    return `${record.w}-${record.l}`;
}

function formatSeasonRecordText(summary: TeamSummary | null | undefined) {
    if (!summary) return "—";

    const recordText = formatRecord({
        w: summary.wins ?? 0,
        l: summary.losses ?? 0,
        otl: summary.otLosses ?? 0,
    });

    const rankText =
        summary.leagueSequence != null
            ? ` (${ordinal(summary.leagueSequence)})`
            : "";

    return `${recordText}${rankText}`;
}

function formatSplitRecordText(
    record: { w: number; l: number; otl: number } | null | undefined
) {
    return formatRecord(record);
}

function formatStreak(summary: TeamSummary | null | undefined) {
    if (!summary?.streakCode || summary.streakCount == null) return "—";

    const code = summary.streakCode.toUpperCase();

    if (code === "W") return `W${summary.streakCount}`;
    if (code === "L") return `L${summary.streakCount}`;
    if (code === "OT") return `OT${summary.streakCount}`;

    return `${code}${summary.streakCount}`;
}

function rankFor(
    ranks: TeamRanks | null,
    metricKey: keyof TeamRanks["ranks"],
    team: string
) {
    const key = (team ?? "").toUpperCase().trim();
    return ranks?.ranks?.[metricKey]?.[key] ?? null;
}

function rankSuffix(
    ranks: TeamRanks | null,
    metricKey: keyof TeamRanks["ranks"],
    team: string
) {
    const rank = rankFor(ranks, metricKey, team);
    return rank != null ? ` (${ordinal(rank)})` : "";
}

function rankPrefix(
    ranks: TeamRanks | null,
    metricKey: keyof TeamRanks["ranks"],
    team: string
) {
    const rank = rankFor(ranks, metricKey, team);
    return rank != null ? `(${ordinal(rank)}) ` : "";
}

export function buildSeasonTeamCompareRows({
    team1,
    team2,
    leftSummary,
    rightSummary,
    ranks,
}: {
    team1: string;
    team2: string;
    leftSummary: TeamSummary | null;
    rightSummary: TeamSummary | null;
    ranks: TeamRanks | null;
}): TeamCompareRow[] {
    const leftSeasonPoints =
        leftSummary?.points ??
        pointsFromWinsOtl(
            leftSummary?.wins ?? null,
            leftSummary?.otLosses ?? null
        );

    const rightSeasonPoints =
        rightSummary?.points ??
        pointsFromWinsOtl(
            rightSummary?.wins ?? null,
            rightSummary?.otLosses ?? null
        );

    return [
        {
            label: "Record",
            leftVal: leftSeasonPoints,
            rightVal: rightSeasonPoints,
            leftText: formatSeasonRecordText(leftSummary),
            rightText: formatSeasonRecordText(rightSummary),
        },
        {
            label: "Streak",
            leftVal: teamStreakStrength(
                leftSummary?.streakCode ?? null,
                leftSummary?.streakCount ?? null,
                rightSummary?.streakCode ?? null,
                rightSummary?.streakCount ?? null
            ),
            rightVal: teamStreakStrength(
                rightSummary?.streakCode ?? null,
                rightSummary?.streakCount ?? null,
                leftSummary?.streakCode ?? null,
                leftSummary?.streakCount ?? null
            ),
            leftText: formatStreak(leftSummary),
            rightText: formatStreak(rightSummary),
        },
        {
            label: "Goals For / Game",
            leftVal: higherBetterStrength(
                leftSummary?.goalsForPerGame ?? null,
                3,
                0.75
            ),
            rightVal: higherBetterStrength(
                rightSummary?.goalsForPerGame ?? null,
                3,
                0.75
            ),
            leftText:
                leftSummary?.goalsForPerGame != null
                    ? `${leftSummary.goalsForPerGame}${rankSuffix(
                        ranks,
                        "goalsForPerGame",
                        team1
                    )}`
                    : "—",
            rightText:
                rightSummary?.goalsForPerGame != null
                    ? `${rankPrefix(
                        ranks,
                        "goalsForPerGame",
                        team2
                    )}${rightSummary.goalsForPerGame}`
                    : "—",
        },
        {
            label: "Goals Against / Game",
            leftVal: lowerBetterStrength(
                leftSummary?.goalsAgainstPerGame ?? null,
                3,
                0.9
            ),
            rightVal: lowerBetterStrength(
                rightSummary?.goalsAgainstPerGame ?? null,
                3,
                0.9
            ),
            leftText:
                leftSummary?.goalsAgainstPerGame != null
                    ? `${leftSummary.goalsAgainstPerGame}${rankSuffix(
                        ranks,
                        "goalsAgainstPerGame",
                        team1
                    )}`
                    : "—",
            rightText:
                rightSummary?.goalsAgainstPerGame != null
                    ? `${rankPrefix(
                        ranks,
                        "goalsAgainstPerGame",
                        team2
                    )}${rightSummary.goalsAgainstPerGame}`
                    : "—",
        },
        {
            label: "Power Play %",
            leftVal: higherBetterStrength(
                toPct100(leftSummary?.powerPlayPct ?? null),
                20,
                0.08
            ),
            rightVal: higherBetterStrength(
                toPct100(rightSummary?.powerPlayPct ?? null),
                20,
                0.08
            ),
            leftText:
                leftSummary?.powerPlayPct != null
                    ? `${toPct100(leftSummary.powerPlayPct)?.toFixed(1)}%${rankSuffix(
                        ranks,
                        "powerPlayPct",
                        team1
                    )}`
                    : "—",
            rightText:
                rightSummary?.powerPlayPct != null
                    ? `${rankPrefix(
                        ranks,
                        "powerPlayPct",
                        team2
                    )}${toPct100(rightSummary.powerPlayPct)?.toFixed(1)}%`
                    : "—",
        },
        {
            label: "Penalty Kill %",
            leftVal: higherBetterStrength(
                toPct100(leftSummary?.penaltyKillPct ?? null),
                80,
                0.2
            ),
            rightVal: higherBetterStrength(
                toPct100(rightSummary?.penaltyKillPct ?? null),
                80,
                0.2
            ),
            leftText:
                leftSummary?.penaltyKillPct != null
                    ? `${toPct100(leftSummary.penaltyKillPct)?.toFixed(1)}%${rankSuffix(
                        ranks,
                        "penaltyKillPct",
                        team1
                    )}`
                    : "—",
            rightText:
                rightSummary?.penaltyKillPct != null
                    ? `${rankPrefix(
                        ranks,
                        "penaltyKillPct",
                        team2
                    )}${toPct100(rightSummary.penaltyKillPct)?.toFixed(1)}%`
                    : "—",
        },
        {
            label: "Shots For / Game",
            leftVal: higherBetterStrength(
                leftSummary?.shotsForPerGame ?? null,
                30,
                0.2
            ),
            rightVal: higherBetterStrength(
                rightSummary?.shotsForPerGame ?? null,
                30,
                0.2
            ),
            leftText:
                leftSummary?.shotsForPerGame != null
                    ? `${leftSummary.shotsForPerGame}${rankSuffix(
                        ranks,
                        "shotsForPerGame",
                        team1
                    )}`
                    : "—",
            rightText:
                rightSummary?.shotsForPerGame != null
                    ? `${rankPrefix(
                        ranks,
                        "shotsForPerGame",
                        team2
                    )}${rightSummary.shotsForPerGame}`
                    : "—",
        },
        {
            label: "Shots Against / Game",
            leftVal: lowerBetterStrength(
                leftSummary?.shotsAgainstPerGame ?? null,
                30,
                0.12
            ),
            rightVal: lowerBetterStrength(
                rightSummary?.shotsAgainstPerGame ?? null,
                30,
                0.12
            ),
            leftText:
                leftSummary?.shotsAgainstPerGame != null
                    ? `${leftSummary.shotsAgainstPerGame}${rankSuffix(
                        ranks,
                        "shotsAgainstPerGame",
                        team1
                    )}`
                    : "—",
            rightText:
                rightSummary?.shotsAgainstPerGame != null
                    ? `${rankPrefix(
                        ranks,
                        "shotsAgainstPerGame",
                        team2
                    )}${rightSummary.shotsAgainstPerGame}`
                    : "—",
        },
    ];
}

export function buildSplitTeamCompareRows({
    leftSplit,
    rightSplit,
}: {
    leftSplit: TeamSplit | null;
    rightSplit: TeamSplit | null;
}): TeamCompareRow[] {
    const leftSplitPoints = pointsFromWinsOtl(
        leftSplit?.record?.w ?? null,
        leftSplit?.record?.otl ?? null
    );

    const rightSplitPoints = pointsFromWinsOtl(
        rightSplit?.record?.w ?? null,
        rightSplit?.record?.otl ?? null
    );

    return [
        {
            label: "Record",
            leftVal: leftSplitPoints,
            rightVal: rightSplitPoints,
            leftText: formatSplitRecordText(leftSplit?.record),
            rightText: formatSplitRecordText(rightSplit?.record),
        },
        {
            label: "Goals For / Game",
            leftVal: higherBetterStrength(
                leftSplit?.goalsForPerGame ?? null,
                3,
                0.75
            ),
            rightVal: higherBetterStrength(
                rightSplit?.goalsForPerGame ?? null,
                3,
                0.75
            ),
            leftText:
                leftSplit?.goalsForPerGame != null
                    ? leftSplit.goalsForPerGame.toFixed(2)
                    : "—",
            rightText:
                rightSplit?.goalsForPerGame != null
                    ? rightSplit.goalsForPerGame.toFixed(2)
                    : "—",
        },
        {
            label: "Goals Against / Game",
            leftVal: lowerBetterStrength(
                leftSplit?.goalsAgainstPerGame ?? null,
                3,
                0.9
            ),
            rightVal: lowerBetterStrength(
                rightSplit?.goalsAgainstPerGame ?? null,
                3,
                0.9
            ),
            leftText:
                leftSplit?.goalsAgainstPerGame != null
                    ? leftSplit.goalsAgainstPerGame.toFixed(2)
                    : "—",
            rightText:
                rightSplit?.goalsAgainstPerGame != null
                    ? rightSplit.goalsAgainstPerGame.toFixed(2)
                    : "—",
        },
        {
            label: "Power Play %",
            leftVal: higherBetterStrength(
                leftSplit?.powerPlay?.pct ?? null,
                20,
                0.08
            ),
            rightVal: higherBetterStrength(
                rightSplit?.powerPlay?.pct ?? null,
                20,
                0.08
            ),
            leftText:
                leftSplit?.powerPlay?.pct != null
                    ? `${leftSplit.powerPlay.pct.toFixed(1)}%`
                    : "—",
            rightText:
                rightSplit?.powerPlay?.pct != null
                    ? `${rightSplit.powerPlay.pct.toFixed(1)}%`
                    : "—",
        },
        {
            label: "Penalty Kill %",
            leftVal: higherBetterStrength(
                leftSplit?.penaltyKill?.pct ?? null,
                80,
                0.2
            ),
            rightVal: higherBetterStrength(
                rightSplit?.penaltyKill?.pct ?? null,
                80,
                0.2
            ),
            leftText:
                leftSplit?.penaltyKill?.pct != null
                    ? `${leftSplit.penaltyKill.pct.toFixed(1)}%`
                    : "—",
            rightText:
                rightSplit?.penaltyKill?.pct != null
                    ? `${rightSplit.penaltyKill.pct.toFixed(1)}%`
                    : "—",
        },
        {
            label: "Shots For / Game",
            leftVal: higherBetterStrength(
                leftSplit?.shotsForPerGame ?? null,
                30,
                0.2
            ),
            rightVal: higherBetterStrength(
                rightSplit?.shotsForPerGame ?? null,
                30,
                0.2
            ),
            leftText:
                leftSplit?.shotsForPerGame != null
                    ? leftSplit.shotsForPerGame.toFixed(2)
                    : "—",
            rightText:
                rightSplit?.shotsForPerGame != null
                    ? rightSplit.shotsForPerGame.toFixed(2)
                    : "—",
        },
        {
            label: "Shots Against / Game",
            leftVal: lowerBetterStrength(
                leftSplit?.shotsAgainstPerGame ?? null,
                30,
                0.12
            ),
            rightVal: lowerBetterStrength(
                rightSplit?.shotsAgainstPerGame ?? null,
                30,
                0.12
            ),
            leftText:
                leftSplit?.shotsAgainstPerGame != null
                    ? leftSplit.shotsAgainstPerGame.toFixed(2)
                    : "—",
            rightText:
                rightSplit?.shotsAgainstPerGame != null
                    ? rightSplit.shotsAgainstPerGame.toFixed(2)
                    : "—",
        },
    ];
}