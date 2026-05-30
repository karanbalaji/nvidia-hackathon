"use client";
import { useEffect } from "react";
import { Flame, MapPin } from "lucide-react";
import { useMap311 } from "@/context/map-context";
import { Badge } from "@/components/ui/badge";
import type { Hotspot } from "@311pulse/contracts";
import { CATEGORY_COLORS } from "@/lib/category-colors";

type HotspotMapActionProps = {
  data: Hotspot[];
  category?: string; // reserved for future per-category filtering
};

export function HotspotMapAction({ data, category: _category }: HotspotMapActionProps) {
  const { pushHeatLayer, setActiveLayer } = useMap311();

  useEffect(() => {
    pushHeatLayer(data);
    setActiveLayer("hotspot");
    return () => setActiveLayer("none");
  }, [data, pushHeatLayer, setActiveLayer]);

  const topFive = [...data]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5);

  return (
    <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur p-6 my-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Flame className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-foreground">
            Hotspot Clusters
          </p>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
            Spatial analysis
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto text-[9px] font-black">
          {data.length} clusters
        </Badge>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {topFive.map((h, i) => {
          const color = CATEGORY_COLORS[h.category] ?? CATEGORY_COLORS.other;
          return (
            <div
              key={`${h.wardId}-${h.category}-${i}`}
              className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-foreground truncate">{h.wardId}</p>
                {h.neighbourhood && (
                  <p className="text-[9px] text-muted-foreground truncate">{h.neighbourhood}</p>
                )}
              </div>
              <div className="w-20 shrink-0">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${h.intensity * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-[9px] font-black text-muted-foreground w-10 text-right shrink-0">
                {h.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-[9px] text-muted-foreground font-bold flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        Showing on map ↑
      </p>
    </div>
  );
}
