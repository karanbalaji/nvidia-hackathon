"use client";
import { severityBand } from "@/lib/severity";

type RiskScoreBadgeProps = {
  score: number;
  showLabel?: boolean;
};

export function RiskScoreBadge({ score, showLabel = false }: RiskScoreBadgeProps) {
  const { label, hex } = severityBand(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="size-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 tabular-nums"
        style={{
          color: hex,
          boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${hex} 35%, transparent)`,
          background: `color-mix(in srgb, ${hex} 8%, transparent)`,
        }}
      >
        {Math.round(score)}
      </div>
      {showLabel && (
        <span
          className="text-[9px] font-black uppercase tracking-widest"
          style={{ color: hex }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
