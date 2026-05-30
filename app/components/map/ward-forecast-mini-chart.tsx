"use client";

import React from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

interface WardForecastMiniChartProps {
  data: DataPoint[];
  color?: string;
}

export function WardForecastMiniChart({ data, color = "#1E5EFF" }: WardForecastMiniChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-xs text-gray-500 font-mono">
        NO DATA
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id="miniChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#miniChartGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
