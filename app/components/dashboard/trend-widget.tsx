"use client";

import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { useWard } from "@/context/ward-context";
import { api } from "@/../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { ChartSkeleton } from "@/components/shared/chart-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendLineChart } from "@/components/generative-ui/trend-line-chart";
import { CategoryBadge } from "@/components/shared/category-badge";

export function TrendWidget() {
  const { activeCategory } = useWard();

  // Compute date string for 30 days ago
  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  }, []);

  // Fetch daily aggregates for active category city-wide (wardId omitted)
  const dailyData = useQuery(api.queries.getDailyAggregates, {
    category: activeCategory,
    from: thirtyDaysAgoStr,
  });

  if (dailyData === undefined) {
    return <ChartSkeleton />;
  }

  if (!dailyData || dailyData.length === 0) {
    return (
      <Card className="p-6 bg-gray-950/40 border-gray-800 rounded-3xl h-[320px] flex items-center justify-center">
        <EmptyState
          icon={<TrendingUp className="size-8 text-gray-600 animate-pulse" />}
          title="No trend data"
          subtitle={`No request trends recorded in the last 30 days for "${activeCategory}"`}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-950/40 border-gray-800 rounded-3xl flex flex-col justify-between h-[320px] font-sans">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-500">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-gray-100">
              CITY-WIDE COMPLAINT TREND
            </h3>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest font-mono">
              Weather Correlation
            </p>
          </div>
        </div>
        <CategoryBadge category={activeCategory} size="sm" />
      </div>

      <div className="flex-1 min-h-0 w-full">
        <TrendLineChart data={dailyData} category={activeCategory} />
      </div>
    </Card>
  );
}
