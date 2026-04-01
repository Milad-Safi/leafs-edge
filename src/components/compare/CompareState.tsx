type CompareStateTone = "default" | "warning";

type CompareStateProps = {
    title: string;
    text?: string;
    tone?: CompareStateTone;
    spinnerOnly?: boolean;
    ariaLive?: "off" | "polite" | "assertive";
};

export default function CompareState({
    title,
    text,
    tone = "default",
    spinnerOnly = false,
    ariaLive = "off",
}: CompareStateProps) {
    if (spinnerOnly) {
        return (
            <div className="compareLoadingPanel" aria-live={ariaLive}>
                <div className="compareLoadingSpinner" />
            </div>
        );
    }

    return (
        <div
            className={`compareEmptyState ${
                tone === "warning" ? "compareEmptyStateWarning" : ""
            }`.trim()}
            aria-live={ariaLive}
        >
            <h3 className="compareEmptyTitle">{title}</h3>

            {text && <p className="compareEmptyText">{text}</p>}
        </div>
    );
}