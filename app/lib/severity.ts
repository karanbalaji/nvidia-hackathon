export function severityBand(score: number) {
  if (score <= 20) {
    return {
      key: "low",
      label: "Low",
      hex: "#10B981",
      textClass: "text-emerald-500",
      ringClass: "ring-emerald-500/30 border-emerald-500/20",
    };
  }
  if (score <= 40) {
    return {
      key: "guarded",
      label: "Guarded",
      hex: "#84CC16",
      textClass: "text-lime-500",
      ringClass: "ring-lime-500/30 border-lime-500/20",
    };
  }
  if (score <= 60) {
    return {
      key: "elevated",
      label: "Elevated",
      hex: "#F59E0B",
      textClass: "text-amber-500",
      ringClass: "ring-amber-500/30 border-amber-500/20",
    };
  }
  if (score <= 80) {
    return {
      key: "high",
      label: "High",
      hex: "#F97316",
      textClass: "text-orange-500",
      ringClass: "ring-orange-500/30 border-orange-500/20",
    };
  }
  return {
    key: "severe",
    label: "Severe",
    hex: "#EF4444",
    textClass: "text-red-500",
    ringClass: "ring-red-500/30 border-red-500/20",
  };
}
