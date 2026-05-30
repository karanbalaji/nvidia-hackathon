"use client";

import dynamic from "next/dynamic";
import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { PulseChat } from "@/components/chat/pulse-chat";
import { HotspotWidget } from "@/components/dashboard/hotspot-widget";
import { RiskWidget } from "@/components/dashboard/risk-widget";
import { TrendWidget } from "@/components/dashboard/trend-widget";
import { SparkBenchmarkWidget } from "@/components/dashboard/spark-benchmark-widget";
import { useWard } from "@/context/ward-context";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["all", "pothole", "flooding", "garbage", "graffiti", "tree", "noise"];

export default function DashboardPage() {
  const { activeCategory, setActiveCategory } = useWard();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
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

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all border",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border/30 hover:border-primary/30"
                )}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          {/* Widget grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
