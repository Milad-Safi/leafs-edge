"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FastestSkaters from "@/components/edge/FastestSkaters";
import HardestShooters from "@/components/edge/HardestShooters";
import OffensiveZoneHeatmap from "@/components/edge/OffensiveZoneHeatmap";
import useTeamEdge from "@/hooks/useTeamEdge";
import { NHL_TEAM_OPTIONS } from "@/lib/compare";
import { getTeamLogoSrc } from "@/lib/teamAssets";

const LOADING_MESSAGES = [
    "Loading EDGE team data",
    "Pulling the top speed leaders",
    "Building the shot map",
    "Still waking up the backend",
];

export default function EdgePage() {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [requestKey, setRequestKey] = useState(0);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [heatmapMode, setHeatmapMode] = useState<"shots" | "goals">("shots");

    const resultsRef = useRef<HTMLElement | null>(null);

    const { data, loading, error } = useTeamEdge(selectedTeam, requestKey);

    const selectedTeamOption = useMemo(() => {
        return NHL_TEAM_OPTIONS.find((team) => team.value === selectedTeam) ?? null;
    }, [selectedTeam]);

    const selectedTeamLabel = selectedTeamOption?.label ?? "Select a team";
    const selectedTeamLogoSrc = selectedTeamOption
        ? getTeamLogoSrc(selectedTeamOption.label, selectedTeamOption.value)
        : "";

    useEffect(() => {
        if (!loading) {
            setLoadingMessageIndex(0);
            return;
        }

        const timer = window.setInterval(() => {
            setLoadingMessageIndex((current) => {
                return (current + 1) % LOADING_MESSAGES.length;
            });
        }, 3200);

        return () => window.clearInterval(timer);
    }, [loading]);

    useEffect(() => {
        if (!selectedTeam) {
            return;
        }

        const timer = window.setTimeout(() => {
            resultsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 120);

        return () => window.clearTimeout(timer);
    }, [selectedTeam, requestKey]);

    function handleTeamSelect(teamAbbrev: string) {
        setSelectedTeam(teamAbbrev);
        setRequestKey((current) => current + 1);
        setLoadingMessageIndex(0);
    }

    function handleRetry() {
        if (!selectedTeam) {
            return;
        }

        setRequestKey((current) => current + 1);
        setLoadingMessageIndex(0);
    }

    return (
        <main className="edgePage">
            <section className="edgeWorkspace">
                <section className="edgeSelectionCard">
                    <div className="edgeSelectionHeader">
                        <p className="edgeSectionEyebrow">Select a team</p>
                        <h1 className="edgeSelectionTitle">NHL EDGE team leaders</h1>
                        <p className="edgeSelectionHint">
                            Pick a logo to load the team’s hardest shooters, fastest
                            recorded skating speeds, and offensive-zone heat map
                        </p>
                    </div>

                    <div className="trendsLogoGrid">
                        {NHL_TEAM_OPTIONS.map((team) => {
                            const logoSrc = getTeamLogoSrc(team.label, team.value);
                            const isSelected = selectedTeam === team.value;

                            return (
                                <button
                                    key={team.value}
                                    type="button"
                                    className={`trendsLogoButton${
                                        isSelected ? " trendsLogoButtonSelected" : ""
                                    }`}
                                    aria-pressed={isSelected}
                                    onClick={() => handleTeamSelect(team.value)}
                                >
                                    <span className="trendsLogoMark">
                                        <img
                                            src={logoSrc}
                                            alt={`${team.label} logo`}
                                            className="trendsLogoImage"
                                            loading="lazy"
                                        />
                                    </span>

                                    <span className="trendsLogoName">{team.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section
                    ref={resultsRef}
                    className="edgeResultsRegion"
                    aria-live="polite"
                >
                    {!selectedTeam ? (
                        <div className="edgeStateCard">
                            <h2 className="edgeStateTitle">Select a team to begin</h2>
                            <p className="edgeStateText">
                                Once you click a logo, this page will load that club’s
                                EDGE team view with the top five shot-speed leaders, top
                                five skating-speed leaders, and a toggle between SOG and
                                goal heat maps
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="edgeStateCard edgeStateCardLoading" role="status">
                            <div className="edgeStateTop">
                                {selectedTeamLogoSrc ? (
                                    <img
                                        src={selectedTeamLogoSrc}
                                        alt={`${selectedTeamLabel} logo`}
                                        className="edgeStateLogo"
                                    />
                                ) : null}

                                <div>
                                    <p className="edgeSectionEyebrow">Loading EDGE</p>
                                    <h2 className="edgeStateTitle">{selectedTeamLabel}</h2>
                                </div>
                            </div>

                            <div className="edgeStateSpinnerWrap">
                                <div className="edgeStateSpinner" aria-hidden="true" />
                            </div>

                            <p className="edgeStateText">
                                {LOADING_MESSAGES[loadingMessageIndex]}
                            </p>
                            <p className="edgeStateNote">
                                Render cold starts can take a few seconds on the first
                                request
                            </p>
                        </div>
                    ) : error ? (
                        <div className="edgeStateCard edgeStateCardError">
                            <div className="edgeStateTop">
                                {selectedTeamLogoSrc ? (
                                    <img
                                        src={selectedTeamLogoSrc}
                                        alt={`${selectedTeamLabel} logo`}
                                        className="edgeStateLogo"
                                    />
                                ) : null}

                                <div>
                                    <p className="edgeSectionEyebrow">EDGE issue</p>
                                    <h2 className="edgeStateTitle">
                                        Could not load {selectedTeamLabel}
                                    </h2>
                                </div>
                            </div>

                            <p className="edgeStateText">{error}</p>

                            <button
                                type="button"
                                className="edgeRetryButton"
                                onClick={handleRetry}
                            >
                                Try again
                            </button>
                        </div>
                    ) : data ? (
                        <div className="edgeResultsShell">
                            <section className="edgeHeroCard">
                                <div className="edgeHeroTeam">
                                    {selectedTeamLogoSrc ? (
                                        <img
                                            src={selectedTeamLogoSrc}
                                            alt={`${selectedTeamLabel} logo`}
                                            className="edgeHeroLogo"
                                        />
                                    ) : null}

                                    <div className="edgeHeroCopy">
                                        <p className="edgeSectionEyebrow">Team EDGE</p>
                                        <h2 className="edgeHeroTitle">
                                            {selectedTeamLabel}
                                        </h2>
                                        <p className="edgeHeroText">
                                            Top five shot-speed leaders, top five
                                            skating-speed leaders, and offensive-zone heat
                                            map data for this club
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="edgeLeadersGrid">
                                <article className="edgePanelCard">
                                    <div className="edgePanelHeader">
                                        <h3 className="edgePanelTitle">
                                            Hardest Shooters
                                        </h3>
                                    </div>

                                    <HardestShooters
                                        rows={data.shotSpeed.hardestShooters}
                                        team={selectedTeam ?? ""}
                                        season={data.season ?? ""}
                                    />
                                </article>

                                <article className="edgePanelCard">
                                    <div className="edgePanelHeader">
                                        <h3 className="edgePanelTitle">
                                            Fastest Recorded Skating Speeds
                                        </h3>
                                    </div>

                                    <FastestSkaters
                                        rows={data.skating.fastestSkaters}
                                        team={selectedTeam ?? ""}
                                        season={data.season ?? ""}
                                    />
                                </article>
                            </section>

                            <section className="edgeHeatmapCard">
                                <div className="edgeHeatmapHeader">
                                    <div>
                                        <h3 className="edgePanelTitle">
                                            {heatmapMode === "shots"
                                                ? "SOG Heat Map"
                                                : "Goal Heat Map"}
                                        </h3>
                                    </div>

                                    <div
                                        className="edgeHeatmapToggle"
                                        role="tablist"
                                        aria-label="Heat map mode"
                                    >
                                        <button
                                            type="button"
                                            className={`edgeToggleButton${
                                                heatmapMode === "shots"
                                                    ? " edgeToggleButtonActive"
                                                    : ""
                                            }`}
                                            aria-pressed={heatmapMode === "shots"}
                                            onClick={() => setHeatmapMode("shots")}
                                        >
                                            SOG Heat Map
                                        </button>

                                        <button
                                            type="button"
                                            className={`edgeToggleButton${
                                                heatmapMode === "goals"
                                                    ? " edgeToggleButtonActive"
                                                    : ""
                                            }`}
                                            aria-pressed={heatmapMode === "goals"}
                                            onClick={() => setHeatmapMode("goals")}
                                        >
                                            Goal Heat Map
                                        </button>
                                    </div>
                                </div>

                                <div className="edgeHeatmapBody">
                                    <OffensiveZoneHeatmap
                                        areas={data.shotLocation.areas}
                                        mode={heatmapMode}
                                        height={560}
                                    />
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="edgeStateCard">
                            <h2 className="edgeStateTitle">No EDGE data returned</h2>
                            <p className="edgeStateText">
                                The request finished, but the API did not return a usable
                                team EDGE payload for this club
                            </p>
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}