import React from "react";
import { Badge } from "@/components/ui/badge";

export const CATEGORY_COLOR: Record<string, string> = {
  pothole: "#D97706",
  garbage: "#65A30D",
  flooding: "#2563EB",
  graffiti: "#DB2777",
  tree: "#059669",
  noise: "#7C3AED",
  other: "#64748B",
};

const CATEGORY_LABELS: Record<string, string> = {
  pothole: "Pothole",
  flooding: "Flooding",
  garbage: "Garbage",
  graffiti: "Graffiti",
  tree: "Tree",
  noise: "Noise",
  other: "Other",
};

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "md" }: CategoryBadgeProps) {
  const normCat = category.toLowerCase();
  const label = CATEGORY_LABELS[normCat] || "Unknown";
  const color = CATEGORY_COLOR[normCat] || "#64748B";

  return (
    <Badge
      variant="outline"
      className={`font-mono inline-flex items-center gap-1.5 border-border/50 bg-background/50 hover:bg-background/80 ${
        size === "sm" ? "text-[10px] px-1.5 h-4.5" : "text-xs px-2 h-5.5"
      }`}
    >
      <span
        className="shrink-0 rounded-full"
        style={{
          width: size === "sm" ? "6px" : "8px",
          height: size === "sm" ? "6px" : "8px",
          backgroundColor: color,
        }}
        data-testid="category-dot"
      />
      <span>{label}</span>
    </Badge>
  );
}
