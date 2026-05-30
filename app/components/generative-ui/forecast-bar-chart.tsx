"use client";
import React from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
} from "recharts";
import { BarChart2 } from "lucide-react";
import type { Forecast } from "@311pulse/contracts";
import { EmptyState } from "@/components/shared/empty-state";
import { CHART } from "@/lib/chart-theme";

type ForecastBarChartProps = {
  data: Forecast[];
  title?: string;
};

const ForecastBarChart = React.memo(function ForecastBarChart({
  data,
  title = "Forecast",
}: ForecastBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4">
        <EmptyState
          icon={<BarChart2 className="h-5 w-5" />}
          title="No forecast data"
          subtitle="Try a different category or ward"
        />
      </div>
    );
  }

  const chartData = [...data]
    .sort((a, b) => b.predictedCount - a.predictedCount)
    .slice(0, 8)
    .map((d) => ({
      wardId: d.wardId,
      predictedCount: d.predictedCount,
      errorY: [
        d.predictedCount - d.confidenceLow,
        d.confidenceHigh - d.predictedCount,
      ] as [number, number],
      category: d.category,
    }));

  return (
    <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-foreground">{title}</p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
            7-Day Horizon
          </p>
        </div>
        <span className="ml-auto text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {data[0]?.category ?? "all"}
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART.grid} />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: CHART.muted, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="wardId"
            width={70}
            tick={{ fontSize: 9, fill: CHART.muted, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: CHART.grid }}
            contentStyle={{
              background: CHART.card,
              border: `1px solid ${CHART.border}`,
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: 700,
            }}
            formatter={(value, _name, props) => {
              const v = Number(value ?? 0);
              const e = (props.payload as { errorY?: [number, number] } | undefined)?.errorY;
              const lo = e ? Math.round(v - e[0]) : "—";
              const hi = e ? Math.round(v + e[1]) : "—";
              return [`${v} (${lo}–${hi})`, "Predicted (CI)"];
            }}
          />
          <Bar dataKey="predictedCount" radius={[0, 6, 6, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={entry.wardId} fill={i === 0 ? CHART.primary : CHART.mutedBar} />
            ))}
            <ErrorBar dataKey="errorY" width={4} strokeWidth={2} stroke={CHART.primarySoft} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Footer */}
      <p className="text-[9px] text-muted-foreground font-bold">
        Powered by Nemotron · method: {data[0]?.method ?? "—"}
      </p>
    </div>
  );
});

export { ForecastBarChart };
