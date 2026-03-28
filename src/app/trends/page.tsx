import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { SITE_HEADER_LINKS } from "@/lib/siteNav";

export default function TrendsPage() {
    return (
        <main className="homePage">
            <SiteHeader navLinks={SITE_HEADER_LINKS} />

            <section className="contentSection">
                <div className="sectionGrid sectionGridReverse">
                    <div className="sectionVisual">
                        <div className="modelPreview">
                            <div className="modelPreviewTop">
                                <span className="modelTag">Trend model</span>
                                <span className="modelConfidence">
                                    Confidence 0.43
                                </span>
                            </div>

                            <div className="modelSignal">UP</div>

                            <div className="modelBreakdown">
                                <div className="modelBreakdownRow">
                                    <span>Shot Share</span>
                                    <span>0.469</span>
                                </div>
                                <div className="modelBreakdownRow">
                                    <span>Power Play %</span>
                                    <span>0.240</span>
                                </div>
                                <div className="modelBreakdownRow">
                                    <span>Rolling Goal Diff</span>
                                    <span>-0.10</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sectionCopy">
                        <p className="sectionLabel">Trends</p>
                        <h1 className="sectionTitle">Momentum and direction</h1>

                        <p className="sectionText">
                            This page is the dedicated route for model output,
                            confidence, and the feature signals driving recent
                            team momentum.
                        </p>

                        <p className="sectionText">
                            The current live version of trend output is still
                            easiest to see in the existing Toronto team page.
                        </p>

                        <div className="heroActions">
                            <Link href="/team/tor" className="primaryButton">
                                Open current trend view
                            </Link>

                            <Link href="/" className="secondaryButton">
                                Back home
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}