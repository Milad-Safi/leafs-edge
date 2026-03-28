import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { SITE_HEADER_LINKS } from "@/lib/siteNav";

export default function VisualizerPage() {
    return (
        <main className="homePage">
            <SiteHeader navLinks={SITE_HEADER_LINKS} />

            <section className="contentSection sectionDark">
                <div className="sectionGrid">
                    <div className="sectionCopy">
                        <p className="sectionLabel">Visualizer</p>
                        <h1 className="sectionTitle">See the numbers clearly</h1>

                        <p className="sectionText">
                            This route is for scatter plots, league-wide views,
                            and team-focused visual exploration.
                        </p>

                        <p className="sectionText">
                            Right now it acts as a real page target in the nav
                            while the full visual workspace gets built out.
                        </p>

                        <div className="heroActions">
                            <Link href="/" className="primaryButton">
                                Back home
                            </Link>
                        </div>
                    </div>

                    <div className="sectionVisual">
                        <div className="visualShowcase">
                            <div className="chartCard">
                                <div className="chartHeader">
                                    Power Play Opportunities vs Efficiency
                                </div>

                                <div className="chartArea">
                                    <span className="axisLine axisLineY" />
                                    <span className="axisLine axisLineX" />
                                    <span className="plotDot plotDotOne" />
                                    <span className="plotDot plotDotTwo" />
                                    <span className="plotDot plotDotThree" />
                                    <span className="plotDot plotDotFour" />
                                </div>
                            </div>

                            <div className="mapCard">
                                <div className="chartHeader">Team Focus</div>
                                <div className="mapPlaceholder">
                                    <span className="mapBand mapBandTop" />
                                    <span className="mapBand mapBandMid" />
                                    <span className="mapBand mapBandBottom" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}