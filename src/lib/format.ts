export function formatPct(n: number | null, digits = 0) {
  if (n == null) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatEur(n: number | null) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `EUR ${(n / 1_000_000).toFixed(1)}m`;
  return `EUR ${n.toLocaleString("en-GB")}`;
}

export function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (min == null || max == null) return null;
  const c = currency ?? "EUR";
  return `${c} ${Math.round(min / 1000)}–${Math.round(max / 1000)}k`;
}
