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
                        <p className="sectionLabel">NHL analytics platform</p>
                        <h1 className="heroTitle">Go beyond the box score</h1>
                        <p className="heroText">
                            Interactive NHL comparison tools, trend views, and
                            visual analytics built to make raw data easier to
                            read.
                        </p>
                        <div className="heroActions">
                            <button
                                type="button"
                                className="primaryButton"
                                onClick={handleExploreFeaturesClick}
                            >
                                Explore features
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features-container" className="featuresBlackout">
                <div className="featuresContent">
                    <div className="featuresIntro" data-reveal>
                        <h2 className="featuresIntroTitle">Core features</h2>
                        <p className="featuresIntroText">
                            These are the core tools currently available.
                            Glossary contains information about specific
                            terminology and metric definitions used across the
                            platform.
                        </p>
                    </div>

                    <div className="bentoGrid" data-reveal>
                        <div className="bentoCard">
                            <div className="cardBody">
                                <span className="cardTag">Compare</span>
                                <h3 className="cardTitle">Compare Teams</h3>
                                <p className="cardText">
                                    Compare two teams side by side using
                                    record, scoring, special teams, shooting,
                                    and recent form.
                                </p>
                                <Link href="/compare" className="cardButton">
                                    Open Matchups
                                </Link>
                            </div>
                        </div>

                        <div className="bentoCard">
                            <div className="cardBody">
                                <span className="cardTag">Team Trajectory</span>
                                <h3 className="cardTitle">Team Trends</h3>
                                <p className="cardText">
                                    Uses a machine learning model to estimate a
                                    team&apos;s short term trend direction.
                                </p>
                                <Link href="/trends" className="cardButton">
                                    View Trends
                                </Link>
                            </div>
                        </div>

                        <div className="bentoCard">
                            <div className="cardBody">
                                <span className="cardTag">Data</span>
                                <h3 className="cardTitle">Visualizer</h3>
                                <p className="cardText">
                                    Interactive charts and scatter plots for
                                    exploring team level metrics across the
                                    league.
                                </p>
                                <Link href="/visualizer" className="cardButton">
                                    Open Visualizer
                                </Link>
                            </div>
                        </div>

                        <div className="bentoCard">
                            <div className="cardBody">
                                <span className="cardTag">Tracking</span>
                                <h3 className="cardTitle">Advanced Stats</h3>
                                <p className="cardText">
                                    Explore advanced stats like shot strength
                                    and location visualized with heat maps.
                                </p>
                                <Link href="/edge" className="cardButton">
                                    View Advanced Stats
                                </Link>
                            </div>
                        </div>

                        <div className="bentoCard">
                            <div className="cardBody">
                                <span className="cardTag">Reports</span>
                                <h3 className="cardTitle">Injury Reports</h3>
                                <p className="cardText">
                                    View current injury information and
                                    availability updates that affect team
                                    context.
                                </p>
                                <Link href="/injuries" className="cardButton">
                                    View Injury Reports
                                </Link>
                            </div>
                        </div>

                        <div className="bentoCard">
                            <div className="cardBody">
                                <span className="cardTag">Coming Soon</span>
                                <h3 className="cardTitle">More Features</h3>
                                <p className="cardText">
                                    Additional comparison views, data tools, and
                                    project features still in progress.
                                </p>
                                <span className="cardButton cardButtonMuted">
                                    In Progress
                                </span>
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