"use client";

import { useEffect, useState } from "react";
import { getTeamLogoSrc } from "@/lib/teamAssets";
import { getTeamColor } from "@/lib/teamColours";

type TeamLogoProps = {
    teamAbbrev: string;
    teamLabel: string;
};

type TeamHeroCardProps = {
    teamAbbrev: string;
    teamLabel: string;
    align: "left" | "right";
};

function TeamLogo({ teamAbbrev, teamLabel }: TeamLogoProps) {
    const logoSrc = getTeamLogoSrc(teamLabel, teamAbbrev);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [logoSrc]);

    return (
        <div className="compareHeroLogoShell">
            {!imageFailed && (
                <img
                    key={logoSrc}
                    src={logoSrc}
                    alt={`${teamLabel} logo`}
                    className="compareHeroLogo"
                    onError={() => setImageFailed(true)}
                />
            )}

            {imageFailed && (
                <span className="compareHeroLogoFallback">{teamAbbrev}</span>
            )}
        </div>
    );
}

export default function TeamHeroCard({
    teamAbbrev,
    teamLabel,
    align,
}: TeamHeroCardProps) {
    const accent = getTeamColor(teamAbbrev);

    return (
        <div
            className={`compareHeroCard compareHeroCard${
                align === "left" ? "Left" : "Right"
            }`}
        >
            <div
                className={`compareHeroAccent compareHeroAccent${
                    align === "left" ? "Left" : "Right"
                }`}
                style={{ backgroundColor: accent }}
            />

            <div className="compareHeroCardInner">
                <TeamLogo teamAbbrev={teamAbbrev} teamLabel={teamLabel} />

                <div className="compareHeroContent">
                    <h3 className="compareHeroName">{teamLabel}</h3>
                </div>
            </div>
        </div>
    );
}