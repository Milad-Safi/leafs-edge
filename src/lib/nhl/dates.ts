// Date helpers to normalize date formatting for API parameters and UI labeling

// convert JS date to simple yyyy-mm-dd
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// find differnece in full days between 2 iso dates
export function diffDays(aISO: string, bISO: string): number {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

// parse iso string to utc
export function toUtcMs(v: any): number | null {
  if (typeof v !== "string") return null;
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? ms : null;
}

// convert UTC ISO timestampy to EST calender date yyyy-mm-dd
// helps when nhl provides start times only
export function torontoDateISO(utcIso: any): string | null {
  if (typeof utcIso !== "string") return null;

  const dt = new Date(utcIso);
  if (!Number.isFinite(dt.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(dt);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;

  if (!y || !m || !d) return null;
  return `${y}-${m}-${d}`;
}
