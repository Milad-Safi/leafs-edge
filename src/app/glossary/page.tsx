import SiteHeader from "@/components/SiteHeader";
import { SITE_HEADER_LINKS } from "@/lib/siteNav";

const glossaryItems = [
    {
        term: "Shot Share",
        description:
            "The share of total shots that belong to one team in a matchup or sample",
    },
    {
        term: "Goal Differential",
        description:
            "Goals scored minus goals allowed over the selected sample",
    },
    {
        term: "Power Play Percentage",
        description:
            "How often a team scores when it has a man advantage",
    },
    {
        term: "Penalty Kill Percentage",
        description:
            "How often a team prevents goals while shorthanded",
    },
    {
        term: "Trend Signal",
        description:
            "A simplified model output that labels recent direction as up, flat, or down",
    },
    {
        term: "Confidence",
        description:
            "The model confidence tied to the current signal output",
    },
    {
        term: "EDGE Data",
        description:
            "NHL puck and player tracking data such as speed, shot speed, and location-based events",
    },
    {
        term: "Head-to-Head",
        description:
            "Recent results and comparisons between two specific teams",
    },
];

export default function GlossaryPage() {
    return (
        <main className="homePage glossaryPage">
            <SiteHeader navLinks={SITE_HEADER_LINKS} />

            <section className="contentSection">
                <div className="glossaryShell">
                    <div className="sectionCopy">
                        <p className="sectionLabel">Glossary</p>
                        <h1 className="sectionTitle">Quick stat definitions</h1>

                        <p className="sectionText">
                            A simple reference page for the main labels and
                            metrics used across Leafs Edge.
                        </p>
                    </div>

                    <div className="glossaryGrid">
                        {glossaryItems.map((item) => (
                            <div key={item.term} className="glossaryCard">
                                <h2 className="glossaryTerm">{item.term}</h2>
                                <p className="glossaryDescription">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}