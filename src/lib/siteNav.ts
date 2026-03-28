export type SiteHeaderLink = {
    label: string;
    href: string;
};

export const SITE_HEADER_LINKS: SiteHeaderLink[] = [
    { label: "Matchups", href: "/matchups" },
    { label: "Trends", href: "/trends" },
    { label: "Visualizer", href: "/visualizer" },
    { label: "Injuries", href: "/injuries" },
    { label: "EDGE", href: "/edge" },
];