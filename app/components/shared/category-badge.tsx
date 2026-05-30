"use client";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS } from "@/lib/category-colors";

const CATEGORY_LABELS: Record<string, string> = {
  pothole: "Pothole",
  flooding: "Flooding",
  garbage: "Garbage",
  graffiti: "Graffiti",
  tree: "Tree",
  noise: "Noise",
  other: "Other",
  all: "All",
};

type CategoryBadgeProps = {
  category: string;
  size?: "sm" | "md";
};

export function CategoryBadge({ category, size = "md" }: CategoryBadgeProps) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
  const label = CATEGORY_LABELS[category] ?? category;

  return (
    <Badge
      variant="outline"
      className={size === "sm" ? "text-[8px] px-1.5 py-0 gap-1" : "text-[9px] px-2 py-0.5 gap-1.5"}
    >
      <span
        className="rounded-full shrink-0"
        style={{
          width: size === "sm" ? "5px" : "6px",
          height: size === "sm" ? "5px" : "6px",
          backgroundColor: color,
          display: "inline-block",
        }}
      />
      {label}
    </Badge>
  );
}
