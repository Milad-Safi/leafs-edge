export function formatCompareBadgeDate(
    date: string | Date | null | undefined
) {
    if (!date) return "—";

    const parsed = date instanceof Date ? date : new Date(date);

    if (Number.isNaN(parsed.getTime())) return "—";

    const month = parsed.toLocaleString("en-US", { month: "long" });
    const day = parsed.getDate();
    const year = parsed.getFullYear();

    return `${month} ${day} ${year}`;
}