"use client";
import React from "react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Droplets } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DailyAggregate } from "@311pulse/contracts";
import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CHART } from "@/lib/chart-theme";
import { pearson, correlationLabel } from "@/lib/correlation";

type TrendLineChartProps = {
  data: DailyAggregate[];
  category?: string;
  wardId?: string;
};

const TrendLineChart = React.memo(function TrendLineChart({
  data,
  category,
  wardId,
}: TrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4">
        <EmptyState
          icon={<TrendingUp className="h-5 w-5" />}
          title="No trend data"
          subtitle="Try a different category or date range"
        />
      </div>
    );
  }

  const hasPrecip = data.some((d) => d.precipMm !== null);

  // Aggregate by date (sum counts across wards if multiple)
  const byDate = new Map<string, { count: number; precip: number | null }>();
  data.forEach((d) => {
    const existing = byDate.get(d.date);
    byDate.set(d.date, {
      count: (existing?.count ?? 0) + d.count,
      precip: d.precipMm !== null ? (existing?.precip ?? 0) + d.precipMm : (existing?.precip ?? null),
    });
  });

  const chartData = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { count, precip }]) => {
      let label = date;
      try {
        const parsed = parseISO(date);
        const day = parsed.getDay();
        label = [1, 3, 5].includes(day) ? format(parsed, "MMM d") : "";
      } catch {}
      return { date, label, count, precipMm: precip };
    });

  // Correlation between requests and rainfall (only over days with precip data)
  const correlation = (() => {
    if (!hasPrecip) return null;
    const paired = chartData.filter((d) => d.precipMm !== null);
    const r = pearson(
      paired.map((d) => d.count),
      paired.map((d) => d.precipMm as number)
    );
    return r;
  })();

  return (
    <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-foreground">
            Request Trend
          </p>
          {wardId && (
            <p className="text-[9px] text-muted-foreground font-bold">{wardId}</p>
          )}
        </div>
        {category && (
          <div className="ml-auto">
            <CategoryBadge category={category} />
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.25} />
              <stop offset="95%" stopColor={CHART.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: CHART.muted, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 9, fill: CHART.muted, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          {hasPrecip && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 9, fill: CHART.info, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
          )}
          <Tooltip
            contentStyle={{
              background: CHART.card,
              border: `1px solid ${CHART.border}`,
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: 700,
            }}
            labelFormatter={(label, payload) => {
              const d = payload?.[0]?.payload as { date?: string } | undefined;
              return d?.date ?? String(label);
            }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="count"
            stroke={CHART.primary}
            strokeWidth={2}
            fill="url(#trendGrad)"
            dot={false}
            name="Requests"
          />
          {hasPrecip && (
            <Bar
              yAxisId="right"
              dataKey="precipMm"
              fill={CHART.infoSoft}
              radius={[4, 4, 0, 0]}
              name="Precip (mm)"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Correlation callout */}
      {correlation !== null && (
        <div className="flex items-center gap-2 rounded-xl bg-info/5 border border-info/15 px-3 py-2">
          <Droplets className="h-3.5 w-3.5 text-info shrink-0" />
          <p className="text-[10px] font-bold text-muted-foreground">
            Requests show a{" "}
            <span className="text-info font-black">{correlationLabel(correlation)}</span>{" "}
            correlation with rainfall
            <span className="text-foreground font-black tabular-nums"> (r = {correlation.toFixed(2)})</span>
          </p>
        </div>
      )}
    </div>
  );
});

export { TrendLineChart };
