"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function HomePage() {
    useEffect(() => {
        const revealNodes = Array.from(
            document.querySelectorAll<HTMLElement>("[data-reveal]")
        );

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("isVisible");
                    }
                });
            },
            {
                threshold: 0.22,
                rootMargin: "0px 0px -14% 0px",
            }
        );

        revealNodes.forEach((node) => observer.observe(node));
        return () => observer.disconnect();
    }, []);

    const handleExploreFeaturesClick = () => {
        const featuresIntro =
            document.querySelector<HTMLElement>(".featuresIntro");
        if (!featuresIntro) return;

        const headerHeight =
            document.querySelector<HTMLElement>(".siteHeader")?.offsetHeight ?? 0;

        const targetTop =
            featuresIntro.getBoundingClientRect().top +
            window.scrollY -
            headerHeight -
            18;

        window.scrollTo({
            top: Math.max(targetTop, 0),
            behavior: "smooth",
        });
    };

    return (
        <main className="homePage">
            <section className="heroSection">
                <div className="heroStack">
                    <div className="heroCopy" data-reveal>
                        {/* Text: hero eyebrow */}
                        <p className="sectionLabel">NHL analytics platform</p>

                        {/* Text: main homepage headline */}
                        <h1 className="heroTitle">Go beyond the box score</h1>

                        {/* Text: hero description */}
                        <p className="heroText">
                            Team comparisons, forecasts, game breakdowns, and
                            league-wide visuals built to make NHL data easier to
                            read.
                        </p>

                        <div className="heroActions">
                            <button
                                type="button"
                                className="primaryButton"
                                onClick={handleExploreFeaturesClick}
                            >
                                {/* Text: hero button label */}
                                Explore features
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features-container" className="featuresBlackout">
                <div className="featuresContent">
                    <div className="featuresIntro" data-reveal>
                        {/* Text: features section title */}
                        <h2 className="featuresIntroTitle">
                            Explore the platform
                        </h2>

                        {/* Text: features section description */}
                        <p className="featuresIntroText">
                            Each page focuses on a different part of the game,
                            from team comparisons to game breakdowns,
                            league metrics, injuries, and advanced NHL EDGE tracking
                            data.
                        </p>
                    </div>

                    <div className="bentoGrid" data-reveal>
                        <div className="bentoCard">
                            <div className="cardBody">
                                {/* Text: compare card tag */}
                                <span className="cardTag">Matchups</span>

                                {/* Text: compare card title */}
                                <h3 className="cardTitle">Compare Teams</h3>

                                {/* Text: compare card description */}
                                <p className="cardText">
                                    Put any two teams side-by-side and see exactly how they stack up across the board
                                </p>

                                <Link href="/compare" className="cardButton">
                                    {/* Text: compare card button */}
                                    View Matchups
                                </Link>
                            </div>
                        </div>

                        <div className="bentoCard">
                            <div className="cardBody">
                                {/* Text: games card tag */}
                                <span className="cardTag">Previous Games</span>

                                {/* Text: games card title */}
                                <h3 className="cardTitle">Past Game Results</h3>

                                {/* Text: games card description */}
                                <p className="cardText">
                                    Browse past games and search previous games since 2023 and view detailed boxscores for each game, including a custom Expected Goals model
                                </p>

                                <Link href="/games" className="cardButton">
                                    {/* Text: games card button */}
                                    Open Boxscores
                                </Link>
                            </div>
                        </div>

                        <div className="bentoCard">
                            <div className="cardBody">
                                {/* Text: metrics card tag */}
                                <span className="cardTag">League Metrics</span>

                                {/* Text: metrics card title */}
                                <h3 className="cardTitle">Teams Visualized</h3>

                                {/* Text: metrics card description */}
                                <p className="cardText">
                                    Build custom visualizations. Plot any two metrics to see exactly where every team stands
                                </p>

                                <Link href="/visualizer" className="cardButton">
                                    {/* Text: metrics card button */}
                                    View Visuals
                                </Link>
                            </div>
                        </div>

                        <div className="bentoCard">
                            <div className="cardBody">
                                {/* Text: injuries card tag */}
                                <span className="cardTag">Injuries</span>

                                {/* Text: injuries card title */}
                                <h3 className="cardTitle">Team Injury Reports</h3>

                                {/* Text: injuries card description */}
                                <p className="cardText">
                                    Check current injury reports and
                                    availability updates for every NHL team, updated automatically based on the latest news and transactions.
                                </p>

                                <Link href="/injuries" className="cardButton">
                                    {/* Text: injuries card button */}
                                    Open Injuries
                                </Link>
                            </div>
                        </div>

                        <div className="bentoCard">
                            <div className="cardBody">
                                {/* Text: momentum card tag */}
                                <span className="cardTag">Model</span>

                                {/* Text: momentum card title */}
                                <h3 className="cardTitle">Team Forecasts</h3>

                                {/* Text: momentum card description */}
                                <p className="cardText">
                                    Track team momentum. Get AI-powered predictions on any teams short-term trajectory
                                </p>

                                <Link href="/trends" className="cardButton">
                                    {/* Text: momentum card button */}
                                    View Forecasts
                                </Link>
                            </div>
                        </div>

                        <div className="bentoCard">
                            <div className="cardBody">
                                {/* Text: EDGE card tag */}
                                <span className="cardTag">Stats</span>

                                {/* Text: EDGE card title */}
                                <h3 className="cardTitle">Advanced Stats</h3>

                                {/* Text: EDGE card description */}
                                <p className="cardText">
                                    Explore miscellaneous statistics and data insights, including advanced NHL EDGE tracking data, player usage stats, and more.
                                </p>

                                <Link href="/edge" className="cardButton">
                                    {/* Text: EDGE card button */}
                                    Open Stats
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="homeShowcase" data-reveal>
                        <div
                            className="homeShowcaseFrame"
                            aria-label="Project visual placeholder"
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}