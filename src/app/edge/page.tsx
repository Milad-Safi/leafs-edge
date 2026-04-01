import Link from "next/link";

export default function EdgePage() {
    return (
        <main className="homePage">
            <section className="contentSection">
                <div className="sectionGrid sectionGridReverse">
                    <div className="sectionVisual">
                        <div className="mockWorkspace">
                            <div className="workspaceToolbar">
                                <span className="toolbarChip">Mode: EDGE</span>
                                <span className="toolbarChip">Team: TOR</span>
                                <span className="toolbarChip">View: Leaders</span>
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
                                            EDGE Leaders
                                        </span>
                                    </div>

                                    <div className="reportRows">
                                        <div className="reportRow">
                                            <span>Hardest Shot</span>
                                            <span>96.4</span>
                                            <span>mph</span>
                                        </div>
                                        <div className="reportRow">
                                            <span>Top Speed</span>
                                            <span>23.1</span>
                                            <span>mph</span>
                                        </div>
                                        <div className="reportRow">
                                            <span>Goal Heat Map</span>
                                            <span>High</span>
                                            <span>Slot</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sectionCopy">
                        <p className="sectionLabel">EDGE</p>
                        <h1 className="sectionTitle">Physical game data</h1>

                        <p className="sectionText">
                            This page is the dedicated route for skating speed,
                            shot speed, heat maps, and other EDGE views.
                        </p>

                        <p className="sectionText">
                            The current live EDGE content is already available
                            on the Toronto team page.
                        </p>

                        <div className="heroActions">
                            <Link href="/team/tor" className="primaryButton">
                                Open current EDGE view
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