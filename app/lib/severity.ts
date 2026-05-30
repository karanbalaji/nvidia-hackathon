/**
 * Risk severity scale — single source for score (0-100) → band.
 * Bands and colors match designsystem.md §7.
 */
export type SeverityBand = {
  key: "low" | "guarded" | "elevated" | "high" | "severe";
  label: string;
  hex: string;
};

export function severityBand(score: number): SeverityBand {
  if (score <= 20) return { key: "low", label: "Low", hex: "#10B981" };
  if (score <= 40) return { key: "guarded", label: "Guarded", hex: "#84CC16" };
  if (score <= 60) return { key: "elevated", label: "Elevated", hex: "#F59E0B" };
  if (score <= 80) return { key: "high", label: "High", hex: "#F97316" };
  return { key: "severe", label: "Severe", hex: "#EF4444" };
}
