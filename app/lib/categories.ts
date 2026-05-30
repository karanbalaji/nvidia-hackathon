/**
 * Canonical 311 service category tokens — single source of truth.
 * Colors match designsystem.md §8. Import from here everywhere.
 */
export const CATEGORY_COLOR: Record<string, string> = {
  pothole: "#D97706",
  garbage: "#65A30D",
  flooding: "#2563EB",
  graffiti: "#DB2777",
  tree: "#059669",
  noise: "#7C3AED",
  other: "#64748B",
};

export const CATEGORY_LABELS: Record<string, string> = {
  pothole: "Pothole",
  garbage: "Garbage",
  flooding: "Flooding",
  graffiti: "Graffiti",
  tree: "Tree",
  noise: "Noise",
  other: "Other",
  all: "All",
};

export function categoryColor(category: string): string {
  return CATEGORY_COLOR[category] ?? CATEGORY_COLOR.other;
}

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
