"use client";

import dynamic from "next/dynamic";
import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { MapPin, TrendingUp, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

const PulseChat = dynamic(() => import("@/components/chat/pulse-chat").then((m) => m.PulseChat), {
  ssr: false,
});

export default function WardsPage() {
  const wards = useQuery(api.queries.listWards, {});
  const riskScores = useQuery(api.queries.getRiskScores, {});

  const riskByWard = new Map(
    (riskScores ?? []).map((r) => [r.wardId, r])
  );

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-foreground">
                Ward Intelligence
              </h1>
              <p className="text-[10px] text-muted-foreground">
                25 Toronto wards · risk scores · service request load
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {(wards ?? []).map((ward) => {
              const risk = riskByWard.get(ward.wardId);
              const score = risk?.score ?? null;
              const riskLevel =
                score === null ? "unknown"
                : score >= 60 ? "high"
                : score >= 40 ? "medium"
                : "low";

              return (
                <Card
                  key={ward.wardId}
                  className="p-4 bg-gray-950/40 border-gray-800 rounded-2xl flex flex-col gap-3 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest font-mono">
                        {ward.wardId.toUpperCase()}
                      </p>
                      <h3 className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                        {ward.wardName}
                      </h3>
                    </div>
                    {score !== null && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          riskLevel === "high"
                            ? "bg-red-900/40 text-red-400 border border-red-800"
                            : riskLevel === "medium"
                            ? "bg-yellow-900/40 text-yellow-400 border border-yellow-800"
                            : "bg-emerald-900/40 text-emerald-400 border border-emerald-800"
                        }`}
                      >
                        Risk {score}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {ward.neighbourhoods.slice(0, 3).map((n) => (
                      <span
                        key={n}
                        className="px-1.5 py-0.5 text-[9px] font-medium bg-muted/40 text-muted-foreground rounded"
                      >
                        {n}
                      </span>
                    ))}
                    {ward.neighbourhoods.length > 3 && (
                      <span className="px-1.5 py-0.5 text-[9px] text-muted-foreground/50">
                        +{ward.neighbourhoods.length - 3} more
                      </span>
                    )}
                  </div>

                  {risk?.drivers && risk.drivers.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-500/80">
                      <AlertTriangle className="size-3 shrink-0" />
                      <span className="truncate">{risk.drivers[0]}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {!wards && (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 animate-pulse" />
                <span className="text-sm">Loading ward data…</span>
              </div>
            </div>
          )}
        </main>
        <PulseChat />
      </div>
    </div>
  );
}
