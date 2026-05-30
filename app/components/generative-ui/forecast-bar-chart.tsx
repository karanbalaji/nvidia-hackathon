"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { Forecast } from "@311pulse/contracts";

interface ForecastBarChartProps {
  data: Forecast[];
  title?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as Forecast;
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-lg font-sans text-xs space-y-1">
        <p className="font-bold text-foreground uppercase tracking-wider font-mono">
          {item.wardId.toUpperCase()}
        </p>
        <p className="text-muted-foreground flex gap-1">
          Predicted:{" "}
          <span className="font-mono font-bold text-foreground">
            {item.predictedCount}
          </span>
        </p>
        <p className="text-muted-foreground/80 text-[10px] flex gap-1">
          Confidence:{" "}
          <span className="font-mono">
            {item.confidenceLow} - {item.confidenceHigh}
          </span>
        </p>
      </div>
    );
  }
  return null;
}

export function ForecastBarChart({ data, title = "7-Day Complaint Forecast" }: ForecastBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="size-8" />}
        title="No forecast data"
        subtitle="Try a different category or ward"
      />
    );
  }

  // Sort by predictedCount descending to display ranked list
  const sortedData = [...data].sort((a, b) => b.predictedCount - a.predictedCount);

  // Confidence interval mapper for error bar
  // ErrorBar expects an array of numbers representing relative offsets,
  // or a custom data structure. In Recharts, ErrorBar bound to 'predictedCount'
  // requires an array of low/high values or error values.
  // Alternatively, we can pass [low, high] via error range.
  // In Recharts, ErrorBar expects dataIndex/dataKey mapping:
  const chartData = sortedData.map((d) => ({
    ...d,
    errorRange: [d.confidenceLow, d.confidenceHigh],
  }));

  return (
    <Card className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Forecast Model
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-widest">
          7-Day Horizon
        </Badge>
      </div>

      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 15, left: -25, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(156, 163, 175, 0.15)" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="wardId"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 10, fontFamily: "var(--font-jetbrains-mono)" }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(30, 94, 255, 0.05)" }} />
            <Bar dataKey="predictedCount" fill="#1E5EFF" radius={[0, 6, 6, 0]} barSize={12}>
              <ErrorBar
                dataKey="errorRange"
                width={4}
                stroke="#1E5EFF"
                strokeWidth={1.5}
                opacity={0.4}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 border-t border-border/20 pt-2 font-mono uppercase tracking-widest">
        <span>Powered by Nemotron (NIM)</span>
        <span>Method: {sortedData[0]?.method || "movingavg"}</span>
      </div>
    </Card>
  );
}
