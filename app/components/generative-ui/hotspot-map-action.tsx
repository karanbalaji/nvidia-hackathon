"use client";
import React, { useEffect } from "react";
import { Flame, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useMap311 } from "@/context/map-context";
import type { Hotspot } from "@311pulse/contracts";

interface HotspotMapActionProps {
  data: Hotspot[];
  category?: string;
}

export function HotspotMapAction({ data }: HotspotMapActionProps) {
  const { pushHeatLayer, setActiveLayer } = useMap311();

  useEffect(() => {
    if (data && data.length > 0) {
      pushHeatLayer(data);
      setActiveLayer("hotspot");
    }
    return () => {
      setActiveLayer("none");
    };
  }, [data, pushHeatLayer, setActiveLayer]);

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Flame className="size-8 text-amber-500" />}
        title="No hotspots detected"
        subtitle="No significant clusters found for this category"
      />
    );
  }

  // Sort and take top 5
  const topHotspots = [...data]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5);

  return (
    <Card className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Flame className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground font-sans">
              HOTSPOT CLUSTERS
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Density Analysis
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="font-mono text-[9px]">
          {data.length} CLUSTERS
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-border/30 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              <th className="pb-2 font-semibold">Ward / Area</th>
              <th className="pb-2 text-center font-semibold">Intensity</th>
              <th className="pb-2 text-right font-semibold">Volume</th>
            </tr>
          </thead>
          <tbody>
            {topHotspots.map((h, i) => (
              <tr key={i} className="border-b border-border/10 last:border-0 hover:bg-muted/10">
                <td className="py-2.5">
                  <div className="font-bold text-foreground">{h.neighbourhood || h.wardId}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-mono">{h.wardId}</div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">
                      {(h.intensity * 100).toFixed(0)}%
                    </span>
                    <div className="w-16 bg-muted/40 rounded-full h-1.5 overflow-hidden shrink-0">
                      <div
                        className="bg-amber-500 rounded-full h-full"
                        style={{ width: `${h.intensity * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-2.5 text-right font-mono font-bold text-foreground">
                  {h.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-1.5 text-[9px] text-amber-500 border-t border-border/20 pt-2 font-mono uppercase tracking-widest">
        <MapPin className="size-3.5" />
        <span>Hotspot markers plotted on the map above</span>
      </div>
    </Card>
  );
}
