// src/lib/nhl/toi.ts

/**
 * Convert "MM:SS" TOI into minutes as a float.
 * Returns 0 for invalid input.
 */
export function toiToMinutes(toi: any): number {
  if (typeof toi !== "string") return 0;

  const parts = toi.split(":");
  if (parts.length !== 2) return 0;

  const mm = Number(parts[0]);
  const ss = Number(parts[1]);

  if (!Number.isFinite(mm) || !Number.isFinite(ss)) return 0;

  return mm + ss / 60;
}
