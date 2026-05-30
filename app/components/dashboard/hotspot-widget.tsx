"use client";

import React from "react";
import { useQuery } from "convex/react";
import { useWard } from "@/context/ward-context";
import { api } from "@/../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, MapPin } from "lucide-react";
import { ChartSkeleton } from "@/components/shared/chart-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { CATEGORY_COLOR } from "@/components/shared/category-badge";

export function HotspotWidget() {
  const { activeCategory } = useWard();
  const hotspots = useQuery(api.queries.getHotspots, { category: activeCategory });

  if (hotspots === undefined) {
    return <ChartSkeleton />;
  }

  if (!hotspots || hotspots.length === 0) {
    return (
      <Card className="p-6 bg-gray-950/40 border-gray-800 rounded-3xl h-[320px] flex items-center justify-center">
        <EmptyState
          icon={<Flame className="size-8 text-gray-600 animate-pulse" />}
          title="No hotspots detected"
          subtitle={`No upcoming clusters for category "${activeCategory}"`}
        />
      </Card>
    );
  }

  // Render top 5 hotspots
  const topHotspots = hotspots.slice(0, 5);

  return (
    <Card className="p-6 bg-gray-950/40 border-gray-800 rounded-3xl flex flex-col justify-between h-[320px] font-sans">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500">
              <Flame className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-gray-100">
                TOP PREDICTED HOTSPOTS
              </h3>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest font-mono">
                Anomaly Clustering
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-widest">
            Next 7 Days
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800/40 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                <th className="pb-2 font-medium">Ward</th>
                <th className="pb-2 font-medium">Area / Neighbourhood</th>
                <th className="pb-2 font-medium">Intensity</th>
                <th className="pb-2 text-right font-medium">Count</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {topHotspots.map((h, i) => {
                const dotColor = CATEGORY_COLOR[h.category.toLowerCase()] || "#64748B";
                return (
                  <tr key={i} className="border-b border-gray-800/20 last:border-0 hover:bg-gray-900/10">
                    <td className="py-2.5 font-mono font-medium text-gray-300">
                      {h.wardId.toUpperCase()}
                    </td>
                    <td className="py-2.5 text-gray-400 truncate max-w-[120px]">
                      {h.neighbourhood || "Unknown Area"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-gray-900 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${h.intensity * 100}%`,
                              backgroundColor: dotColor,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-gray-500 w-8">
                          {h.intensity.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono text-gray-300">
                      {h.count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[9px] text-gray-500 uppercase tracking-widest font-mono border-t border-gray-900 pt-2 mt-auto">
        <MapPin className="h-3.5 w-3.5" />
        <span>Synchronized with central map layer</span>
      </div>
    </Card>
  );
}
