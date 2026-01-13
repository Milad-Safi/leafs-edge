// Parsing and normalization helpers 

// Ensures a value is a clean string and trims whitespace
export function cleanStr(v: any): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

// Normalize a value into a finite number
export function toNum(v: any): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
