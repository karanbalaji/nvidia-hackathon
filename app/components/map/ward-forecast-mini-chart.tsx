"use client";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Forecast } from "@311pulse/contracts";

type WardForecastMiniChartProps = {
  data: Forecast[];
};

export function WardForecastMiniChart({ data }: WardForecastMiniChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center text-[9px] text-muted-foreground uppercase tracking-widest font-black">
        No forecast data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: d.category,
    value: d.predictedCount,
    low: d.confidenceLow,
    high: d.confidenceHigh,
  }));

  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#miniGrad)"
            dot={false}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "10px",
            }}
            formatter={(v) => [Number(v ?? 0), "Predicted"]}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
