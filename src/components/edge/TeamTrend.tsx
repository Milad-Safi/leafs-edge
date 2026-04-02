"use client";

import type { TeamTrendResponse } from "@/types/api";

type TeamTrendProps = {
    data: TeamTrendResponse;
    teamLabel: string;
    teamLogoSrc: string;
};

type TrendDisplay = {
    label: string;
    verb: string;
    pillClass: string;
    wordClass: string;
};

function clamp01(value: number) {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.min(1, value));
}

function toPercent(value: number) {
    return Math.round(clamp01(value) * 100);
}

function getTrendDisplay(trend: string): TrendDisplay {
    const key = String(trend || "").toUpperCase();

    if (key === "UP") {
        return {
            label: "Improvement",
            verb: "improve",
            pillClass: "trendOutcomePillUp",
            wordClass: "trendHeadlineWordUp",
        };
    }

    if (key === "DOWN") {
        return {
            label: "Regression",
            verb: "regress",
            pillClass: "trendOutcomePillDown",
            wordClass: "trendHeadlineWordDown",
        };
    }

    return {
        label: "Stagnation",
        verb: "hold steady",
        pillClass: "trendOutcomePillFlat",
        wordClass: "trendHeadlineWordFlat",
    };
}

function formatDateLabel(value: string | null | undefined) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatDateTimeLabel(value: string | null | undefined) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-CA", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function TeamTrend({
    data,
    teamLabel,
    teamLogoSrc,
}: TeamTrendProps) {
    const trendDisplay = getTrendDisplay(data.trend);
    const confidence = toPercent(data.confidence);

    const probabilityRows = [
        {
            key: "UP",
            label: "Improvement",
            percent: toPercent(data.probs.UP),
            fillClass: "trendProbabilityFillUp",
        },
        {
            key: "FLAT",
            label: "Stagnation",
            percent: toPercent(data.probs.FLAT),
            fillClass: "trendProbabilityFillFlat",
        },
        {
            key: "DOWN",
            label: "Regression",
            percent: toPercent(data.probs.DOWN),
            fillClass: "trendProbabilityFillDown",
        },
    ];

    return (
        <section className="trendCard">
            <div className="trendCardHeader">
                <div className="trendCardTeam">
                    {teamLogoSrc ? (
                        <img
                            src={teamLogoSrc}
                            alt={`${teamLabel} logo`}
                            className="trendCardLogo"
                        />
                    ) : null}

                    <div className="trendCardInfo">
                        <p className="trendCardEyebrow">Current model call</p>
                        <h2 className="trendCardTitle">{teamLabel}</h2>
                    </div>
                </div>

                <div className="trendCardHeaderRight">
                    <span className={`trendOutcomePill ${trendDisplay.pillClass}`}>
                        {trendDisplay.label}
                    </span>

                    <span className="trendConfidencePill">
                        {confidence}% confidence
                    </span>
                </div>
            </div>

            <div className="trendHeadline">
                <span>We are</span>
                <span className="trendHeadlineStrong">{confidence}%</span>
                <span>confident that</span>
                <span className="trendHeadlineStrong">{teamLabel}</span>
                <span>will</span>
                <span className={`trendHeadlineWord ${trendDisplay.wordClass}`}>
                    {trendDisplay.verb}
                </span>
                <span>over their next {data.n_requested} games</span>
            </div>

            <div className="trendProbabilitySection">
                <div className="trendProbabilityHeader">
                    <h3 className="trendProbabilityTitle">Model belief split</h3>
                    <p className="trendProbabilityCopy">
                        This is the current probability distribution across all three
                        trend outcomes
                    </p>
                </div>

                <div className="trendProbabilityGrid">
                    {probabilityRows.map((row) => {
                        const isActive = row.key === data.trend;

                        return (
                            <div
                                key={row.key}
                                className={`trendProbabilityRow${
                                    isActive ? " trendProbabilityRowActive" : ""
                                }`}
                            >
                                <div className="trendProbabilityLabelRow">
                                    <span className="trendProbabilityLabel">
                                        {row.label}
                                    </span>
                                    <span className="trendProbabilityPercent">
                                        {row.percent}%
                                    </span>
                                </div>

                                <div className="trendProbabilityTrack">
                                    <div
                                        className={`trendProbabilityFill ${row.fillClass}`}
                                        style={{ width: `${row.percent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="trendMetaGrid">
                <div className="trendMetaCard">
                    <span className="trendMetaLabel">Window used</span>
                    <strong className="trendMetaValue">
                        Last {data.n_used} games
                    </strong>
                </div>

                <div className="trendMetaCard">
                    <span className="trendMetaLabel">Game range</span>
                    <strong className="trendMetaValue">
                        {formatDateLabel(data.range?.oldest)} to{" "}
                        {formatDateLabel(data.range?.newest)}
                    </strong>
                </div>

                <div className="trendMetaCard">
                    <span className="trendMetaLabel">Model updated</span>
                    <strong className="trendMetaValue">
                        {formatDateTimeLabel(data.as_of)}
                    </strong>
                </div>
            </div>
        </section>
    );
}