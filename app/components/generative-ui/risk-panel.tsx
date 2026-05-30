"use client";
import React, { useState } from "react";
import type { RiskScore } from "@311pulse/contracts";
import { RiskScoreBadge } from "@/components/shared/risk-score-badge";
import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { severityBand } from "@/lib/severity";

type RiskPanelProps = {
  data: RiskScore[];
  wardId?: string;
};

const RiskPanel = React.memo(function RiskPanel({ data, wardId }: RiskPanelProps) {
  const [showAll, setShowAll] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4">
        <EmptyState
          icon={<AlertTriangle className="h-5 w-5" />}
          title="No risk data"
          subtitle="No risk scores available for this ward"
        />
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.score - a.score);
  const visible = showAll ? sorted : sorted.slice(0, 4);
  const hiddenCount = sorted.length - 4;
  const topBand = severityBand(sorted[0]?.score ?? 0);

  return (
    <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="size-10 rounded-xl flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${topBand.hex} 12%, transparent)` }}
        >
          <AlertTriangle className="h-5 w-5" style={{ color: topBand.hex }} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-foreground">Risk Assessment</p>
          {wardId ? (
            <p className="text-[9px] text-muted-foreground font-bold">{wardId}</p>
          ) : (
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: topBand.hex }}>
              Peak: {topBand.label}
            </p>
          )}
        </div>
      </div>

      {/* Risk cards */}
      {visible.map((r, i) => (
        <div
          key={`${r.wardId}-${r.category}-${i}`}
          className="rounded-2xl border border-border/50 bg-card/60 p-4 flex gap-4"
        >
          <RiskScoreBadge score={r.score} showLabel />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-black text-foreground">{r.wardId}</p>
              <CategoryBadge category={r.category} size="sm" />
            </div>
            <div className="flex flex-wrap gap-1">
              {r.drivers.map((d: string) => (
                <span
                  key={d}
                  className="text-[9px] bg-muted rounded-full px-2 py-0.5 font-bold text-muted-foreground"
                >
                  {d}
                </span>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground font-bold">As of {r.asOf}</p>
          </div>
        </div>
      ))}

      {!showAll && hiddenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="w-full text-[9px] font-black uppercase tracking-widest"
        >
          + {hiddenCount} more
        </Button>
      )}
    </div>
  );
});

export { RiskPanel };
