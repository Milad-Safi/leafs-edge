"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { SITE_HEADER_LINKS } from "@/lib/siteNav";

type SiteChromeProps = {
    children: ReactNode;
};

export default function SiteChrome({ children }: SiteChromeProps) {
    const pathname = usePathname();
    const isHome = pathname === "/";

    return (
        <>
            <SiteHeader isHome={isHome} navLinks={SITE_HEADER_LINKS} />
            {children}
            <SiteFooter />
        </>
    );
}