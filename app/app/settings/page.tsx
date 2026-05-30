"use client";

import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { PulseChat } from "@/components/chat/pulse-chat";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";

export default function SettingsPage() {
  const pipelineRun = useQuery(api.queries.getPipelineRun);

  return (
    <div className="flex flex-col h-screen bg-background">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Pipeline configuration and infrastructure details.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pipeline</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Engine</p>
                  <p className="font-mono font-semibold">{pipelineRun?.engine ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rows Processed</p>
                  <p className="font-mono font-semibold">{pipelineRun?.rowsProcessed.toLocaleString() ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Duration</p>
                  <p className="font-mono font-semibold">{pipelineRun ? `${pipelineRun.durationSec.toFixed(2)}s` : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last Run</p>
                  <p className="font-mono font-semibold text-xs">{pipelineRun?.createdAt ?? "—"}</p>
                </div>
              </div>
              {pipelineRun?.engine === "rapids" && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">⚡ GPU Accelerated</span>
                  <span className="text-[10px] text-muted-foreground">Powered by NVIDIA DGX Spark</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">LLM Provider</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Provider</p>
                  <p className="font-mono font-semibold">NVIDIA NIM</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Model</p>
                  <p className="font-mono font-semibold text-xs">meta/llama-3.1-8b-instruct</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Endpoint</p>
                  <p className="font-mono font-semibold text-xs">integrate.api.nvidia.com</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Agent</p>
                  <p className="font-mono font-semibold">311-pulse-agent</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Sources</p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Open Data Toronto — 311 Service Requests 2023–2025</li>
                <li>• Open-Meteo — Historical weather + 7-day forecast</li>
                <li>• City of Toronto — Ward boundary GeoJSON</li>
              </ul>
            </div>
          </div>
        </main>
        <PulseChat />
      </div>
    </div>
  );
}
