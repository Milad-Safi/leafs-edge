"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";
import { NHL_TEAM_OPTIONS } from "@/lib/compare";
import { getTeamLogoSrc } from "@/lib/teamAssets";

type ApiInjury = {
    playerId: number | null;
    player: string;
    pos: string | null;
    status: string | null;
    date: string | null;
    description: string | null;
    headshot: string | null;
};

type ApiPayload = {
    team: string;
    teamName: string | null;
    teamSeo: string | null;
    source: string;
    lastUpdated: string;
    injuries: ApiInjury[];
    error?: string;
};

type StatusInfo = {
    code: string;
    label: string;
    tone: "danger" | "warning" | "muted";
};

function normalizeStatus(status: string | null): StatusInfo {
    const raw = status?.trim();

    if (!raw) {
        return {
            code: "UNK",
            label: "Unknown",
            tone: "muted",
        };
    }

    const upper = raw.toUpperCase();

    if (upper === "IR" || upper.includes("INJURED")) {
        return {
            code: "IR",
            label: raw,
            tone: "danger",
        };
    }

    if (upper === "OUT") {
        return {
            code: "OUT",
            label: raw,
            tone: "danger",
        };
    }

    if (upper.includes("DAY") || upper === "DTD") {
        return {
            code: "DTD",
            label: raw,
            tone: "warning",
        };
    }

    if (upper.includes("QUESTION") || upper === "GTD") {
        return {
            code: "GTD",
            label: raw,
            tone: "warning",
        };
    }

    return {
        code: upper.slice(0, 4),
        label: raw,
        tone: "muted",
    };
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";

    return (first + last).toUpperCase() || "--";
}

function formatUpdatedAt(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString();
}

function buildSubtitle(injury: ApiInjury) {
    const pieces = [injury.description, injury.pos].filter(Boolean);
    return pieces.join(" • ");
}

function Headshot({ name, src }: { name: string; src: string | null }) {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [src]);

    return (
        <div className="injuriesAvatar" aria-hidden="true">
            {src && !imageFailed ? (
                <img
                    className="injuriesAvatarImage"
                    src={src}
                    alt={name}
                    loading="lazy"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <span className="injuriesAvatarFallback">{getInitials(name)}</span>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string | null }) {
    const info = normalizeStatus(status);

    return (
        <span
            className={`injuriesStatusBadge injuriesStatusBadge${info.tone[0].toUpperCase()}${info.tone.slice(1)}`}
            title={info.label}
        >
            {info.code}
        </span>
    );
}

function InjuryRow({ injury }: { injury: ApiInjury }) {
    const subtitle = buildSubtitle(injury);

    return (
        <article className="injuriesRow">
            <div className="injuriesRowLeft">
                <Headshot name={injury.player} src={injury.headshot} />

                <div className="injuriesRowText">
                    <h3 className="injuriesPlayerName">{injury.player}</h3>

                    {subtitle ? (
                        <p className="injuriesPlayerMeta">{subtitle}</p>
                    ) : (
                        <p className="injuriesPlayerMeta injuriesPlayerMetaMuted">
                            No additional injury details listed
                        </p>
                    )}
                </div>
            </div>

            <div className="injuriesRowRight">
                <StatusBadge status={injury.status} />
            </div>
        </article>
    );
}

export default function Injuries() {
    const [selectedTeam, setSelectedTeam] = useState("");
    const [report, setReport] = useState<ApiPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedTeamLabel = useMemo(() => {
        return NHL_TEAM_OPTIONS.find((team) => team.value === selectedTeam)?.label ?? "";
    }, [selectedTeam]);

    const teamLogoSrc = useMemo(() => {
        if (!selectedTeam || !selectedTeamLabel) {
            return "";
        }

        return getTeamLogoSrc(selectedTeamLabel, selectedTeam);
    }, [selectedTeam, selectedTeamLabel]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!selectedTeam) {
                setReport(null);
                setError(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const nextReport = await fetchJson<ApiPayload>(
                    `/api/team/injuries?team=${encodeURIComponent(selectedTeam)}`,
                    { cache: "no-store" }
                );

                if (cancelled) {
                    return;
                }

                setReport(nextReport);
                setError(nextReport.error ?? null);
            } catch (err: any) {
                if (cancelled) {
                    return;
                }

                setReport(null);
                setError(err?.message ?? "Could not load injury report");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [selectedTeam]);

    const injuryCount = report?.injuries.length ?? 0;
    const reportTeamName = report?.teamName ?? selectedTeamLabel;
    const updatedLabel = formatUpdatedAt(report?.lastUpdated);

    return (
        <section className="injuriesWorkspace">
            <div className="injuriesWorkspaceInner">
                <div className="injuriesHero">
                    <div className="injuriesHeroText">
                        <p className="injuriesEyebrow">Reports</p>
                        <h1 className="injuriesTitle">Injury reports</h1>
                        <p className="injuriesIntro">
                            Select a team to view the current injury list, player headshots,
                            and latest availability notes from the injury feed.
                        </p>
                    </div>
                </div>

                <div className="injuriesControlsCard">
                    <label className="injuriesControl" htmlFor="injuries-team-select">
                        <span className="injuriesControlLabel">Team</span>
                        <select
                            id="injuries-team-select"
                            className="injuriesSelect"
                            value={selectedTeam}
                            onChange={(event) => setSelectedTeam(event.target.value)}
                        >
                            <option value="">Select a team</option>
                            {NHL_TEAM_OPTIONS.map((team) => (
                                <option key={team.value} value={team.value}>
                                    {team.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {!selectedTeam ? (
                    <div className="injuriesEmptyState">
                        <h2 className="injuriesEmptyTitle">Choose a team to begin</h2>
                        <p className="injuriesEmptyText">
                            Once a team is selected, the injury page will load that club’s
                            current report and player cards.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="injuriesEmptyState">
                        <div className="injuriesSpinner" aria-hidden="true" />
                        <h2 className="injuriesEmptyTitle">Loading injury report</h2>
                        <p className="injuriesEmptyText">
                            Pulling the latest injuries for {selectedTeamLabel}.
                        </p>
                    </div>
                ) : error ? (
                    <div className="injuriesEmptyState injuriesEmptyStateWarning">
                        <h2 className="injuriesEmptyTitle">Could not load injuries</h2>
                        <p className="injuriesEmptyText">{error}</p>
                    </div>
                ) : (
                    <section className="injuriesCard" aria-label="Team injury report">
                        <div className="injuriesCardHeader">
                            <div className="injuriesCardHeaderLeft">
                                {teamLogoSrc ? (
                                    <img
                                        className="injuriesTeamLogo"
                                        src={teamLogoSrc}
                                        alt={reportTeamName}
                                    />
                                ) : null}

                                <div>
                                    <p className="injuriesCardEyebrow">Current report</p>
                                    <h2 className="injuriesCardTitle">{reportTeamName}</h2>
                                </div>
                            </div>

                            <div className="injuriesCardMeta">
                                <span className="injuriesMetaPill">
                                    {injuryCount} {injuryCount === 1 ? "injury" : "injuries"}
                                </span>
                                {updatedLabel ? (
                                    <span className="injuriesMetaText">
                                        Updated {updatedLabel}
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="injuriesCardDivider" />

                        {injuryCount === 0 ? (
                            <div className="injuriesCardEmpty">
                                <h3 className="injuriesCardEmptyTitle">
                                    No reported injuries right now
                                </h3>
                                <p className="injuriesCardEmptyText">
                                    The feed did not return any active injury entries for this
                                    team.
                                </p>
                            </div>
                        ) : (
                            <div className="injuriesList">
                                {report?.injuries.map((injury, index) => (
                                    <InjuryRow
                                        key={`${injury.playerId ?? injury.player}-${index}`}
                                        injury={injury}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </section>
    );
}