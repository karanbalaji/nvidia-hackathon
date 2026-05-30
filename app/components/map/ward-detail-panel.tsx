"use client";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageSquare } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import { RiskScoreBadge } from "@/components/shared/risk-score-badge";
import { CategoryBadge } from "@/components/shared/category-badge";
import { WardForecastMiniChart } from "@/components/map/ward-forecast-mini-chart";
import { Button } from "@/components/ui/button";

type WardDetailPanelProps = {
  wardId: string | null;
  onClose: () => void;
};

export function WardDetailPanel({ wardId, onClose }: WardDetailPanelProps) {
  const riskScores = useQuery(
    api.queries.getRiskScores,
    wardId ? { wardId } : "skip"
  );
  const forecasts = useQuery(
    api.queries.getForecast,
    wardId ? { wardId } : "skip"
  );
  const dailyAggs = useQuery(
    api.queries.getDailyAggregates,
    wardId ? { wardId } : "skip"
  );

  const { appendMessage } = useCopilotChat();

  const topRisk = riskScores?.[0];
  const topCategory = topRisk?.category ?? (dailyAggs?.[0]?.category ?? "pothole");

  const categoryBreakdown = (() => {
    if (!dailyAggs) return [];
    const map = new Map<string, number>();
    dailyAggs.forEach((d) => map.set(d.category, (map.get(d.category) ?? 0) + d.count));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  })();

  function askAgent() {
    appendMessage(
      new TextMessage({ content: `Tell me more about ${wardId}`, role: Role.User })
    );
    onClose();
  }

  return (
    <AnimatePresence>
      {wardId && (
        <motion.div
          key="ward-detail"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 h-full w-80 z-[400] bg-card/95 backdrop-blur-md border-l border-border/50 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-primary/[0.03] flex items-start justify-between shrink-0">
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ward</p>
              <h3 className="text-sm font-black text-foreground">{wardId}</h3>
              {topCategory && <CategoryBadge category={topCategory} />}
            </div>
            <button
              onClick={onClose}
              aria-label="Close ward detail"
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Risk score */}
            {topRisk && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Risk Score</p>
                <div className="flex items-center gap-3">
                  <RiskScoreBadge score={topRisk.score} showLabel />
                  <div className="flex flex-wrap gap-1">
                    {topRisk.drivers.map((d) => (
                      <span
                        key={d}
                        className="text-[9px] bg-muted rounded-full px-2 py-0.5 font-bold text-muted-foreground"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7-day forecast sparkline */}
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">7-Day Forecast</p>
              <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                <WardForecastMiniChart data={forecasts ?? []} />
              </div>
            </div>

            {/* Category breakdown */}
            {categoryBreakdown.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Category Breakdown</p>
                <div className="space-y-1.5">
                  {categoryBreakdown.map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between text-xs">
                      <CategoryBadge category={category} size="sm" />
                      <span className="font-black text-foreground">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-4 border-t border-border/50 shrink-0">
            <Button
              onClick={askAgent}
              variant="outline"
              size="sm"
              className="w-full text-[10px] font-black uppercase tracking-widest"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-2" />
              Ask agent about {wardId}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
