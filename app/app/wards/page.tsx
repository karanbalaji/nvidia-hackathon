"use client";

import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { PulseChat } from "@/components/chat/pulse-chat";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";

export default function WardsPage() {
  const wards = useQuery(api.queries.listWards);

  return (
    <div className="flex flex-col h-screen bg-background">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Toronto Wards</h1>
              <p className="text-sm text-muted-foreground mt-1">
                All 25 City of Toronto electoral wards with 311 service data.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {wards === undefined
                ? Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-card/60 p-4 animate-pulse h-20" />
                  ))
                : wards.map((ward) => (
                    <div
                      key={ward.wardId}
                      className="rounded-2xl border border-border bg-card/60 p-4 flex flex-col gap-1 hover:border-primary/40 transition-colors"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-mono">
                        {ward.wardId}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{ward.wardName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {ward.neighbourhoods.slice(0, 3).join(" · ")}
                        {ward.neighbourhoods.length > 3 && ` +${ward.neighbourhoods.length - 3}`}
                      </p>
                    </div>
                  ))}
            </div>
          </div>
        </main>
        <PulseChat />
      </div>
    </div>
  );
}
