"use client";

import React from "react";
import type { EdgeFastestSkater } from "@/types/api";
import useRosterHeadshots from "@/hooks/useRosterHeadshots";

function formatMph(value: number) {
    return Number.isFinite(value) ? value.toFixed(2) : "--";
}

function formatDate(value: string) {
    if (!value) {
        return "";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function toNumericId(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function FastestSkaters({
    rows,
    team,
    season,
}: {
    rows: EdgeFastestSkater[];
    team: string;
    season: string;
}) {
    const { headshotById } = useRosterHeadshots(team, season);
    const [failedImageIds, setFailedImageIds] = React.useState<Set<number>>(
        () => new Set()
    );

    React.useEffect(() => {
        setFailedImageIds(new Set());
    }, [team, season]);

    if (!rows.length) {
        return <p className="edgeListEmpty">No skating-speed data returned</p>;
    }

    return (
        <ol className="edgeRankList" aria-label="Fastest skaters ranked one to five">
            {rows.slice(0, 5).map((row, index) => {
                const playerId = toNumericId(row.playerId);
                const headshot = playerId != null ? headshotById.get(playerId) : undefined;
                const showHeadshot =
                    !!headshot && playerId != null && !failedImageIds.has(playerId);

                return (
                    <li
                        key={`${row.playerId}-${row.name}-${index}`}
                        className="edgeRankRow"
                    >
                        <div className="edgeRankLeft">
                            {showHeadshot ? (
                                <img
                                    src={headshot}
                                    alt={row.name}
                                    className="edgeRankAvatar"
                                    loading="lazy"
                                    onError={() => {
                                        if (playerId == null) {
                                            return;
                                        }

                                        setFailedImageIds((current) => {
                                            const next = new Set(current);
                                            next.add(playerId);
                                            return next;
                                        });
                                    }}
                                />
                            ) : (
                                <div
                                    className="edgeRankAvatarFallback"
                                    aria-hidden="true"
                                >
                                    {getInitials(row.name)}
                                </div>
                            )}

                            <div className="edgeRankPlayerBlock">
                                <span className="edgeRankPlayerName">{row.name}</span>

                                {row.gameDate ? (
                                    <span className="edgeRankMeta">
                                        {formatDate(row.gameDate)}
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="edgeRankValueBlock">
                            <span className="edgeRankValue">{formatMph(row.mph)}</span>
                            <span className="edgeRankUnit">mph</span>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}