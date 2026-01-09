// Shared helpers for comparing stats (used in TeamComparisons + Last5). Pure functions only.

// converts a value into a percentage
export function toPct100(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return null;
  return v <= 1 ? v * 100 : v;
}

// computes a teams strength score, for when higher is better.
// for example, shots on goal. 
// Helps in making the UI bars more fluid and stray away from the middle for small differences
export function higherBetterStrength(
  v: number | null | undefined,
  baseline: number,
  k: number
) {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.exp(k * (v - baseline));
}

// Same thing but for a lower is better stat like goals against.
export function lowerBetterStrength(
  v: number | null | undefined,
  baseline: number,
  k: number
) {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.exp(k * (baseline - v));
}
