"use client";

import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { PulseChat } from "@/components/chat/pulse-chat";
import { LayoutDashboard } from "lucide-react";

const WIDGET_PLACEHOLDERS = [
  { title: "Top Predicted Hotspots", desc: "ForecastBarChart renders here — Phase 3" },
  { title: "Highest-Risk Wards", desc: "RiskPanel renders here — Phase 3" },
  { title: "City-Wide Trend", desc: "TrendLineChart renders here — Phase 3" },
  { title: "Spark Benchmark", desc: "Pipeline run metadata — Phase 1" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-foreground">Operations Dashboard</h1>
              <p className="text-[10px] text-muted-foreground">Predictions · Risk scores · Spark benchmark</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WIDGET_PLACEHOLDERS.map(({ title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card/60 p-5 flex flex-col gap-2 hover:border-primary/20 transition-all">
                <p className="text-xs font-black uppercase tracking-widest text-foreground">{title}</p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
                <div className="h-32 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center mt-2">
                  <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest font-bold">Awaiting Phase 3</span>
                </div>
              </div>
            ))}
          </div>
        </main>

        <PulseChat />
      </div>
    </div>
  );
}
