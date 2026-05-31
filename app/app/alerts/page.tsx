"use client";

import dynamic from "next/dynamic";
import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Bell, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const PulseChat = dynamic(() => import("@/components/chat/pulse-chat").then((m) => m.PulseChat), {
  ssr: false,
});

export default function AlertsPage() {
  const riskScores = useQuery(api.queries.getRiskScores, {});
  const hotspots = useQuery(api.queries.getHotspots, {});

  const highRisk = (riskScores ?? []).filter((r) => r.score >= 55).sort((a, b) => b.score - a.score);
  const criticalHotspots = (hotspots ?? []).filter((h) => h.intensity >= 0.7).sort((a, b) => b.intensity - a.intensity);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-foreground">
                Alert Center
              </h1>
              <p className="text-[10px] text-muted-foreground">
                High-risk wards · active hotspots · predictive alerts
              </p>
            </div>
          </div>

          {/* High Risk Wards */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-4 text-red-400" />
              <h2 className="text-xs font-black uppercase tracking-widest text-red-400">
                High Risk Wards ({highRisk.length})
              </h2>
            </div>
            <div className="space-y-2">
              {highRisk.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">No high-risk wards detected.</p>
              ) : (
                highRisk.map((r) => (
                  <Card
                    key={`${r.wardId}-${r.category}`}
                    className="p-4 bg-red-950/20 border-red-900/40 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-red-900/30 flex items-center justify-center">
                        <Zap className="size-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {r.wardId.toUpperCase()} — {r.category}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{r.drivers[0] ?? "Elevated risk detected"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-red-400">{r.score}</span>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">risk</p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Critical Hotspots */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-4 text-amber-400" />
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">
                Active Hotspots ({criticalHotspots.length})
              </h2>
            </div>
            <div className="space-y-2">
              {criticalHotspots.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">No critical hotspots detected.</p>
              ) : (
                criticalHotspots.slice(0, 10).map((h, i) => (
                  <Card
                    key={i}
                    className="p-4 bg-amber-950/20 border-amber-900/40 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {h.wardId.toUpperCase()} · {h.category}
                      </p>
                      {h.neighbourhood && (
                        <p className="text-[10px] text-muted-foreground">{h.neighbourhood}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-400">
                        {Math.round(h.intensity * 100)}%
                      </span>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">intensity</p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>
        </main>
        <PulseChat />
      </div>
    </div>
  );
}
