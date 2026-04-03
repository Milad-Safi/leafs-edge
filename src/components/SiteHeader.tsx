"use client";

import Link from "next/link";
import { MouseEvent, useCallback } from "react";
import { usePathname } from "next/navigation";
import type { SiteHeaderLink } from "@/lib/siteNav";

type SiteHeaderProps = {
    isHome?: boolean;
    navLinks: SiteHeaderLink[];
};

const navLabelMap: Record<string, string> = {
    "/compare": "Matchups",
    "/trends": "Forecasts",
    "/visualizer": "Visuals",
    "/games": "Boxscores",
    "/injuries": "Injuries",
    "/edge": "Stats",
};

export default function SiteHeader({
    isHome = false,
    navLinks,
}: SiteHeaderProps) {
    const pathname = usePathname();

    const handleWordmarkClick = useCallback(
        (event: MouseEvent<HTMLAnchorElement>) => {
            if (!isHome) return;

            event.preventDefault();

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

            window.history.replaceState(null, "", window.location.pathname);
        },
        [isHome]
    );

    return (
        <header className="siteHeader">
            <div className="siteHeaderInner">
                <Link
                    href="/"
                    className="siteWordmark"
                    onClick={handleWordmarkClick}
                >
                    Home
                </Link>

                <nav className="siteNav" aria-label="Primary">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        const displayLabel =
                            navLabelMap[link.href] ?? link.label;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`siteNavLink${
                                    isActive ? " siteNavLinkActive" : ""
                                }`}
                            >
                                {displayLabel}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}