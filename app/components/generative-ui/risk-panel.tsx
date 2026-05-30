"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/category-badge";
import { RiskScoreBadge } from "@/components/shared/risk-score-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import type { RiskScore } from "@311pulse/contracts";

interface RiskPanelProps {
  data: RiskScore[];
  wardId?: string;
}

export function RiskPanel({ data }: RiskPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<ShieldAlert className="size-8 text-emerald-500" />}
        title="No risk scores"
        subtitle="No risk evaluations available for the active filters"
      />
    );
  }

  // Sort by score descending
  const sortedData = [...data].sort((a, b) => b.score - a.score);

  // Determine display count
  const limit = 4;
  const displayedData = expanded ? sortedData : sortedData.slice(0, limit);
  const hasMore = sortedData.length > limit;
  const extraCount = sortedData.length - limit;

  return (
    <div className="space-y-3 my-4">
      {displayedData.map((item, i) => (
        <Card
          key={`${item.wardId}-${item.category}-${i}`}
          className="rounded-2xl border border-border/50 bg-card/60 p-4 flex gap-4 items-center shadow-sm"
        >
          <div className="shrink-0">
            <RiskScoreBadge score={item.score} showLabel={false} />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-foreground truncate">
                {item.wardId.toUpperCase()}
              </span>
              <CategoryBadge category={item.category} size="sm" />
            </div>
            <div className="flex flex-wrap gap-1">
              {item.drivers.map((driver, idx) => (
                <span
                  key={idx}
                  className="text-[9px] bg-muted/80 text-muted-foreground rounded-full px-2 py-0.5 font-bold tracking-wide border border-border/10"
                >
                  {driver}
                </span>
              ))}
            </div>
            <div className="text-[9px] text-muted-foreground/60 font-mono">
              AS OF {item.asOf}
            </div>
          </div>
        </Card>
      ))}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs font-bold font-mono tracking-wider text-primary hover:text-primary/80 flex items-center justify-center gap-1.5"
        >
          {expanded ? (
            <>
              <span>Show Less</span>
              <ChevronUp className="size-3.5" />
            </>
          ) : (
            <>
              <span>Show {extraCount} More</span>
              <ChevronDown className="size-3.5" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
