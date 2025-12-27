/**
 * Shared helpers for comparing stats (used in TeamComparisons + Last5).
 * Pure functions only.
 */

export function toPct100(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return null;
  return v <= 1 ? v * 100 : v;
}

export function higherBetterStrength(
  v: number | null | undefined,
  baseline: number,
  k: number
) {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.exp(k * (v - baseline));
}

export function lowerBetterStrength(
  v: number | null | undefined,
  baseline: number,
  k: number
) {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.exp(k * (baseline - v));
}
