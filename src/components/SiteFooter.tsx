import Link from "next/link";

export default function SiteFooter() {
    return (
        <footer className="siteFooter">
            <div className="siteFooterInner">
                <div className="siteFooterTop">
                    <a
                        href="https://github.com/Milad-Safi"
                        target="_blank"
                        rel="noreferrer"
                        className="siteFooterExternalLink"
                    >
                        Github
                    </a>

                    <div className="siteFooterLinks">
                        <Link href="/glossary" className="siteFooterLink">
                            Glossary
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}