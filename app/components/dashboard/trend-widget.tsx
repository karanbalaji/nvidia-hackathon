"use client";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { useWard } from "@/context/ward-context";
import { useMemo } from "react";
import { subDays, format } from "date-fns";
import { TrendLineChart } from "@/components/generative-ui/trend-line-chart";
import { ChartSkeleton } from "@/components/shared/chart-skeleton";

export function TrendWidget() {
  const { activeCategory } = useWard();

  const from = useMemo(() => format(subDays(new Date(), 30), "yyyy-MM-dd"), []);

  const dailyAggregates = useQuery(api.queries.getDailyAggregates, {
    category: activeCategory !== "all" ? activeCategory : undefined,
    from,
  });

  if (dailyAggregates === undefined) return <ChartSkeleton />;

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 flex flex-col gap-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
        City-Wide Trend
      </p>
      <TrendLineChart data={dailyAggregates} category={activeCategory} />
    </div>
  );
}
