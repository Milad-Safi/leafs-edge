export default function InjuriesPage() {
    return (
        <main
            style={{
                minHeight: "100vh",
                background: "#05070b",
                color: "#ffffff",
            }}
        >
            <section
                style={{
                    width: "min(1100px, 92%)",
                    margin: "0 auto",
                    padding: "56px 16px 72px",
                }}
            >
                <div
                    style={{
                        maxWidth: "720px",
                        marginBottom: "28px",
                    }}
                >
                    <p
                        style={{
                            margin: "0 0 10px",
                            color: "rgba(214, 224, 242, 0.78)",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                        }}
                    >
                        Reports
                    </p>

                    <h1
                        style={{
                            margin: "0 0 14px",
                            fontSize: "clamp(2rem, 4vw, 3rem)",
                            lineHeight: 1,
                            letterSpacing: "-0.03em",
                        }}
                    >
                        Injury Reports
                    </h1>

                    <p
                        style={{
                            margin: 0,
                            color: "rgba(255, 255, 255, 0.72)",
                            fontSize: "0.98rem",
                            lineHeight: 1.6,
                        }}
                    >
                        Current injury information and availability updates that
                        affect team context will live here.
                    </p>
                </div>

                <div
                    style={{
                        borderRadius: "18px",
                        border: "1px solid rgba(110, 168, 255, 0.1)",
                        background:
                            "linear-gradient(180deg, rgba(10, 22, 47, 0.94) 0%, rgba(6, 13, 28, 0.98) 100%)",
                        padding: "24px 20px",
                        boxShadow: "0 14px 30px rgba(0, 0, 0, 0.16)",
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            color: "rgba(255, 255, 255, 0.74)",
                            fontSize: "0.95rem",
                            lineHeight: 1.6,
                        }}
                    >
                        This page is set up and ready for injury data once the
                        endpoint or data source is connected.
                    </p>
                </div>
            </section>
        </main>
    );
}