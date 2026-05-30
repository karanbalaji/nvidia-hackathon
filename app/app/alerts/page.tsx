"use client";

import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { PulseChat } from "@/components/chat/pulse-chat";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { RiskScoreBadge } from "@/components/shared/risk-score-badge";
import { CategoryBadge } from "@/components/shared/category-badge";

export default function AlertsPage() {
  const riskScores = useQuery(api.queries.getRiskScores, {});

  const high = riskScores?.filter((r) => r.score >= 67) ?? [];
  const medium = riskScores?.filter((r) => r.score >= 34 && r.score < 67) ?? [];

  return (
    <div className="flex flex-col h-screen bg-background">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Alert Center</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Wards with elevated risk scores based on forecast, trend, and weather data.
              </p>
            </div>

            {riskScores === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card/60 p-4 animate-pulse h-16" />
                ))}
              </div>
            ) : (
              <>
                {high.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
                      High Risk ({high.length})
                    </p>
                    {high.map((r, i) => (
                      <div key={i} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-4">
                        <RiskScoreBadge score={r.score} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{r.wardId.toUpperCase()}</span>
                            <CategoryBadge category={r.category} size="sm" />
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{r.drivers.join(" · ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {medium.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                      Medium Risk ({medium.length})
                    </p>
                    {medium.slice(0, 10).map((r, i) => (
                      <div key={i} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-4">
                        <RiskScoreBadge score={r.score} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{r.wardId.toUpperCase()}</span>
                            <CategoryBadge category={r.category} size="sm" />
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{r.drivers.join(" · ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {high.length === 0 && medium.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-sm">No active alerts — all wards within normal parameters.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
        <PulseChat />
      </div>
    </div>
  );
}
