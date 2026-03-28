import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { SITE_HEADER_LINKS } from "@/lib/siteNav";

export default function MatchupsPage() {
    return (
        <main className="homePage">
            <SiteHeader navLinks={SITE_HEADER_LINKS} />

            <section className="contentSection">
                <div className="sectionGrid">
                    <div className="sectionCopy">
                        <p className="sectionLabel">Matchups</p>
                        <h1 className="sectionTitle">Comparison workspace</h1>

                        <p className="sectionText">
                            This page is the dedicated home for matchup tools,
                            side by side comparisons, and upcoming game views.
                        </p>

                        <p className="sectionText">
                            The current working version still lives in the
                            legacy page until this route is fully built out.
                        </p>

                        <div className="heroActions">
                            <Link href="/legacy" className="primaryButton">
                                Open current version
                            </Link>

                            <Link href="/" className="secondaryButton">
                                Back home
                            </Link>
                        </div>
                    </div>

                    <div className="sectionVisual">
                        <div className="mockWorkspace">
                            <div className="workspaceToolbar">
                                <span className="toolbarChip">Mode: Team</span>
                                <span className="toolbarChip">Filter: Last 5</span>
                                <span className="toolbarChip">Compare: TOR vs BOS</span>
                            </div>

                            <div className="workspaceBody">
                                <div className="workspaceSidebar">
                                    <span className="sidebarLine" />
                                    <span className="sidebarLine" />
                                    <span className="sidebarLine sidebarLineShort" />
                                </div>

                                <div className="workspaceReport">
                                    <div className="reportHeader">
                                        <span className="reportHeaderTitle">
                                            Matchup Summary
                                        </span>
                                    </div>

                                    <div className="reportRows">
                                        <div className="reportRow">
                                            <span>Goals For</span>
                                            <span>3.5</span>
                                            <span>3.1</span>
                                        </div>
                                        <div className="reportRow">
                                            <span>Power Play %</span>
                                            <span>24.1</span>
                                            <span>22.8</span>
                                        </div>
                                        <div className="reportRow">
                                            <span>Shot Share</span>
                                            <span>52.4</span>
                                            <span>50.1</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}