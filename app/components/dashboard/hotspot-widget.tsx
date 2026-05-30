"use client";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { useWard } from "@/context/ward-context";
import { ForecastBarChart } from "@/components/generative-ui/forecast-bar-chart";
import { ChartSkeleton } from "@/components/shared/chart-skeleton";
import { Flame } from "lucide-react";

export function HotspotWidget() {
  const { activeCategory } = useWard();
  const forecasts = useQuery(api.queries.getForecast, {
    category: activeCategory !== "all" ? activeCategory : undefined,
  });

  if (forecasts === undefined) return <ChartSkeleton />;

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Flame className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
            Top Predicted Hotspots
          </p>
          <p className="text-[9px] text-muted-foreground">Next 7 days</p>
        </div>
      </div>
      <ForecastBarChart data={forecasts.slice(0, 5)} />
    </div>
  );
}
