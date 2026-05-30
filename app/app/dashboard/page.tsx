"use client";

import dynamic from "next/dynamic";
import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { useWard } from "@/context/ward-context";
import { HotspotWidget } from "@/components/dashboard/hotspot-widget";
import { RiskWidget } from "@/components/dashboard/risk-widget";
import { TrendWidget } from "@/components/dashboard/trend-widget";
import { SparkBenchmarkWidget } from "@/components/dashboard/spark-benchmark-widget";
import { LayoutDashboard } from "lucide-react";

const PulseChat = dynamic(() => import("@/components/chat/pulse-chat").then((m) => m.PulseChat), {
  ssr: false,
});

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "pothole", label: "Pothole" },
  { id: "flooding", label: "Flooding" },
  { id: "garbage", label: "Garbage" },
  { id: "graffiti", label: "Graffiti" },
  { id: "tree", label: "Tree" },
  { id: "noise", label: "Noise" },
];

export default function DashboardPage() {
  const { activeCategory, setActiveCategory } = useWard();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header & Category Selection */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-black uppercase tracking-tight text-foreground">
                  Operations Dashboard
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  Predictions · Risk scores · Spark benchmark
                </p>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-200 cursor-pointer ${
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

          {/* Grid layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
            <HotspotWidget />
            <RiskWidget />
            <TrendWidget />
            <SparkBenchmarkWidget />
          </div>
        </main>

        <PulseChat />
      </div>
    </div>
  );
}
