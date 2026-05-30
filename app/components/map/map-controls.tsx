"use client";

import { useWard } from "@/context/ward-context";
import { useMap311 } from "@/context/map-context";
import { Card } from "@/components/ui/card";
import { Flame, MapPin, Shield, Ban } from "lucide-react";

interface MapControlsProps {
  dateRange: string;
  setDateRange: (range: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "pothole", label: "Pothole" },
  { id: "flooding", label: "Flooding" },
  { id: "garbage", label: "Garbage" },
  { id: "graffiti", label: "Graffiti" },
  { id: "tree", label: "Tree" },
  { id: "noise", label: "Noise" },
];

const LAYERS = [
  { id: "heat", label: "Heat", icon: Flame },
  { id: "hotspot", label: "Hotspots", icon: MapPin },
  { id: "risk", label: "Risk", icon: Shield },
  { id: "none", label: "None", icon: Ban },
] as const;

const DATE_RANGES = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "1y", label: "1Y" },
];

export function MapControls({ dateRange, setDateRange }: MapControlsProps) {
  const { activeCategory, setActiveCategory } = useWard();
  const { activeLayer, setActiveLayer } = useMap311();

  return (
    <div className="absolute top-4 left-4 z-[500] flex flex-col gap-3 w-80 max-w-sm">
      <Card className="p-4 bg-gray-950/90 border-gray-800 shadow-xl backdrop-blur-md rounded-2xl flex flex-col gap-4">
        {/* Category Selector */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-2 block font-mono">
            Service Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-all duration-200 cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-blue-600 border-blue-500 text-white font-medium shadow-md shadow-blue-900/30"
                    : "bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layer Selector */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-2 block font-mono">
            Active Map Layer
          </label>
          <div className="grid grid-cols-4 gap-1 bg-gray-900/80 p-1 rounded-xl border border-gray-800">
            {LAYERS.map((layer) => {
              const Icon = layer.icon;
              const isSelected = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-gray-800 text-blue-400 font-medium"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-medium">{layer.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range Selector */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-2 block font-mono">
            Time Range
          </label>
          <div className="flex gap-1">
            {DATE_RANGES.map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-all duration-200 font-mono cursor-pointer ${
                  dateRange === range.id
                    ? "bg-gray-800 border-gray-700 text-gray-200 font-medium"
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/40"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
