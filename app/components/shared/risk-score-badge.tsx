import React from "react";
import { severityBand } from "@/lib/severity";

interface RiskScoreBadgeProps {
  score: number;
  showLabel?: boolean;
}

export function RiskScoreBadge({ score, showLabel = false }: RiskScoreBadgeProps) {
  const band = severityBand(score);

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div
        className={`flex items-center justify-center rounded-full ring-2 font-mono text-base font-black w-10 h-10 ${band.textClass} ${band.ringClass} bg-background/30`}
      >
        {score}
      </div>
      {showLabel && (
        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
          {band.label} Risk
        </span>
      )}
    </div>
  );
}
