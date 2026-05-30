import React from "react";
import { CategoryBadge } from "./category-badge";

interface RecommendationCardProps {
  text: string;
  drivers?: string[];
  wardIds?: string[];
}

export function RecommendationCard({ text, drivers, wardIds }: RecommendationCardProps) {
  return (
    <div className="border-l-4 border-primary bg-primary/[0.03] rounded-2xl p-4 space-y-3">
      <div className="text-[9px] font-black uppercase tracking-widest text-primary">
        RECOMMENDATION
      </div>
      <p className="text-sm text-foreground leading-normal">{text}</p>
      {((drivers && drivers.length > 0) || (wardIds && wardIds.length > 0)) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {drivers?.map((driver) => (
            <CategoryBadge key={driver} category={driver} size="sm" />
          ))}
          {wardIds?.map((wardId) => (
            <span
              key={wardId}
              className="font-mono text-[10px] font-black bg-muted/65 text-muted-foreground border border-border/50 rounded px-1.5 py-0.5"
            >
              {wardId.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
