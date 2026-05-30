"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/category-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { DailyAggregate } from "@311pulse/contracts";

interface TrendLineChartProps {
  data: DailyAggregate[];
  category?: string;
  wardId?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as DailyAggregate;
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-lg font-sans text-xs space-y-1">
        <p className="font-bold text-foreground font-mono">
          {new Date(item.date).toLocaleDateString("en-CA", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}
        </p>
        <p className="text-muted-foreground flex gap-1.5">
          Requests:{" "}
          <span className="font-mono font-bold text-foreground">{item.count}</span>
        </p>
        {item.precipMm !== null && item.precipMm !== undefined && (
          <p className="text-muted-foreground flex gap-1.5">
            Precipitation:{" "}
            <span className="font-mono font-bold text-blue-400">
              {item.precipMm.toFixed(1)} mm
            </span>
          </p>
        )}
        {item.tempC !== null && item.tempC !== undefined && (
          <p className="text-muted-foreground/80 text-[10px] flex gap-1.5">
            Temperature:{" "}
            <span className="font-mono">{item.tempC.toFixed(1)}°C</span>
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function TrendLineChart({ data, category, wardId }: TrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="size-8" />}
        title="No trend data"
        subtitle="Try a different category, ward, or date range"
      />
    );
  }

  // Check if there is any precipitation data to render the secondary axis
  const hasPrecip = data.some(
    (d) => d.precipMm !== null && d.precipMm !== undefined && d.precipMm > 0
  );

  // Formatter for date ticks (e.g. Mon/Wed/Fri or just short labels)
  const formatXAxis = (tickItem: string) => {
    try {
      const d = new Date(tickItem);
      return d.toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return tickItem;
    }
  };

  return (
    <Card className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Request Trend
            </h3>
            {wardId ? (
              <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                {wardId}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                City Wide
              </p>
            )}
          </div>
        </div>
        {category && <CategoryBadge category={category} />}
      </div>

      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 9, fontFamily: "var(--font-jetbrains-mono)" }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 9, fontFamily: "var(--font-jetbrains-mono)" }}
            />
            {hasPrecip && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#60A5FA", fontSize: 9, fontFamily: "var(--font-jetbrains-mono)" }}
                width={20}
              />
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(156, 163, 175, 0.15)", strokeWidth: 1 }} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="count"
              fill="rgba(30, 94, 255, 0.05)"
              stroke="#1E5EFF"
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
            {hasPrecip && (
              <Bar
                yAxisId="right"
                dataKey="precipMm"
                fill="rgba(59, 130, 246, 0.25)"
                radius={[4, 4, 0, 0]}
                barSize={10}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 text-[9px] text-muted-foreground/60 border-t border-border/20 pt-2 font-mono uppercase tracking-widest">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[#1E5EFF] inline-block" />
          <span>Service Requests</span>
        </div>
        {hasPrecip && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2 bg-blue-500/25 inline-block rounded-t-sm" />
            <span>Precipitation (mm)</span>
          </div>
        )}
      </div>
    </Card>
  );
}
