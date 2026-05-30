"use client";
import { MapPin } from "lucide-react";

type RecommendationCardProps = {
  text: string;
  drivers?: string[];
  wardIds?: string[];
};

export function RecommendationCard({ text, drivers, wardIds }: RecommendationCardProps) {
  return (
    <div className="border-l-4 border-primary bg-primary/[0.04] rounded-2xl p-4 my-3 space-y-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-primary">
        Recommendation
      </p>
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
      {drivers && drivers.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pt-1">
          {drivers.map((d) => (
            <span
              key={d}
              className="text-[9px] bg-muted rounded-full px-2 py-0.5 font-bold text-muted-foreground"
            >
              {d}
            </span>
          ))}
        </div>
      )}
      {wardIds && wardIds.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pt-0.5">
          {wardIds.map((w) => (
            <span
              key={w}
              className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary rounded-full px-2 py-0.5 tabular-nums"
            >
              <MapPin className="h-2.5 w-2.5" />
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
