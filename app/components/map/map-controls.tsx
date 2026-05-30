"use client";
import { useWard } from "@/context/ward-context";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/category-colors";
import { Flame, Thermometer, AlertTriangle, Eye, EyeOff } from "lucide-react";

type ActiveLayer = "heat" | "hotspot" | "risk" | "none";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "pothole", label: "Pothole" },
  { id: "flooding", label: "Flooding" },
  { id: "garbage", label: "Garbage" },
  { id: "graffiti", label: "Graffiti" },
  { id: "tree", label: "Tree" },
  { id: "noise", label: "Noise" },
];

const DATE_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
];

const LAYERS: { id: ActiveLayer; label: string; icon: React.ReactNode }[] = [
  { id: "heat", label: "Heat", icon: <Thermometer className="h-3 w-3" /> },
  { id: "hotspot", label: "Hotspots", icon: <Flame className="h-3 w-3" /> },
  { id: "risk", label: "Risk", icon: <AlertTriangle className="h-3 w-3" /> },
  { id: "none", label: "None", icon: <EyeOff className="h-3 w-3" /> },
];

type MapControlsProps = {
  activeLayer: ActiveLayer;
  onLayerChange: (layer: ActiveLayer) => void;
  dateRangeDays: number;
  onDateRangeChange: (days: number) => void;
};

export function MapControls({
  activeLayer,
  onLayerChange,
  dateRangeDays,
  onDateRangeChange,
}: MapControlsProps) {
  const { activeCategory, setActiveCategory } = useWard();

  return (
    <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
      {/* Category pills */}
      <div className="bg-card/90 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl p-3 flex flex-wrap gap-1.5">
        {CATEGORIES.map(({ id, label }) => {
          const color = id !== "all" ? CATEGORY_COLORS[id] : undefined;
          const isActive = activeCategory === id || (id === "all" && activeCategory === "all");
          return (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              aria-label={`Filter by ${label}`}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full transition-all border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-muted/50 text-muted-foreground border-border/30 hover:border-primary/30 hover:text-foreground"
              )}
              style={isActive && color ? { backgroundColor: color, borderColor: color } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Layer + date range */}
      <div className="bg-card/90 backdrop-blur-md border border-border/50 shadow-xl rounded-2xl p-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3 text-muted-foreground" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Layer</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {LAYERS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => onLayerChange(id)}
              aria-label={`Set layer to ${label}`}
              className={cn(
                "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all border",
                activeLayer === id
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-muted/30 text-muted-foreground border-border/30 hover:text-foreground"
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 mt-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Range</span>
        </div>
        <div className="flex gap-1">
          {DATE_RANGES.map(({ label, days }) => (
            <button
              key={label}
              onClick={() => onDateRangeChange(days)}
              aria-label={`Date range ${label}`}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all border",
                dateRangeDays === days
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-muted/30 text-muted-foreground border-border/30 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
