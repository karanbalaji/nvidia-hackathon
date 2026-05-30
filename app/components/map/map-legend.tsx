"use client";
import { CATEGORY_COLORS } from "@/lib/category-colors";

type ActiveLayer = "heat" | "hotspot" | "risk" | "none";

type MapLegendProps = {
  activeLayer: ActiveLayer;
};

export function MapLegend({ activeLayer }: MapLegendProps) {
  if (activeLayer === "none") return null;

  return (
    <div className="absolute bottom-10 left-4 z-[500] bg-card/90 backdrop-blur border border-border/50 shadow-xl rounded-2xl p-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Legend</p>

      {activeLayer === "heat" && (
        <div className="flex flex-col gap-1">
          {[
            { label: "Max", color: "rgb(219,30,112)" },
            { label: "75%", color: "rgb(180,60,180)" },
            { label: "50%", color: "rgb(130,80,210)" },
            { label: "25%", color: "rgb(80,100,220)" },
            { label: "Low", color: "rgb(39,110,242)" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-4 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeLayer === "risk" && (
        <div className="flex flex-col gap-1">
          {[
            { label: "High 67–100", color: "#EF4444" },
            { label: "Med 34–66", color: "#F59E0B" },
            { label: "Low 0–33", color: "#10B981" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-4 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeLayer === "hotspot" && (
        <div className="flex flex-col gap-1">
          {Object.entries(CATEGORY_COLORS)
            .filter(([k]) => k !== "other")
            .map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest capitalize">
                  {category}
                </span>
              </div>
            ))}
          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-border/30">
            <div className="flex gap-0.5 items-end">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/60" />
              <div className="w-4 h-4 rounded-full bg-muted-foreground/80" />
            </div>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
              Intensity
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
