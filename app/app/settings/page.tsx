"use client";

import dynamic from "next/dynamic";
import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Settings, Database, Cpu, Globe, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";

const PulseChat = dynamic(() => import("@/components/chat/pulse-chat").then((m) => m.PulseChat), {
  ssr: false,
});

function SettingRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const pipelineRun = useQuery(api.queries.getPipelineRun, {});

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-auto p-6 space-y-6 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-foreground">
                System Settings
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Pipeline config · LLM provider · environment
              </p>
            </div>
          </div>

          {/* Pipeline Info */}
          <Card className="p-5 bg-gray-950/40 border-gray-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Database className="size-4 text-blue-400" />
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-400">Pipeline</h2>
            </div>
            {pipelineRun ? (
              <>
                <SettingRow label="Run ID" value={pipelineRun.runId} mono />
                <SettingRow label="Engine" value={pipelineRun.engine} />
                <SettingRow label="Rows Processed" value={pipelineRun.rowsProcessed.toLocaleString()} />
                <SettingRow label="Duration" value={`${pipelineRun.durationSec.toFixed(2)}s`} />
                <SettingRow label="Created At" value={pipelineRun.createdAt} mono />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Loading pipeline data…</p>
            )}
          </Card>

          {/* LLM Config */}
          <Card className="p-5 bg-gray-950/40 border-gray-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="size-4 text-purple-400" />
              <h2 className="text-xs font-black uppercase tracking-widest text-purple-400">LLM Provider</h2>
            </div>
            <SettingRow label="Provider" value={process.env.NEXT_PUBLIC_LLM_PROVIDER ?? "nim (NVIDIA NIM)"} />
            <SettingRow label="Model" value="nvidia/nemotron via NIM" />
            <SettingRow label="Endpoint" value="http://localhost:8000/v1" mono />
            <SettingRow label="Fallback" value="OpenAI-compatible" />
          </Card>

          {/* App Config */}
          <Card className="p-5 bg-gray-950/40 border-gray-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="size-4 text-emerald-400" />
              <h2 className="text-xs font-black uppercase tracking-widest text-emerald-400">Application</h2>
            </div>
            <SettingRow label="Version" value="0.1.0" />
            <SettingRow label="Framework" value="Next.js 16 · React 19" />
            <SettingRow label="Database" value="Convex" />
            <SettingRow label="Agent" value="Mastra + CopilotKit (AG-UI)" />
            <SettingRow label="Theme" value="Dark (default)" />
          </Card>

          {/* Environment */}
          <Card className="p-5 bg-gray-950/40 border-gray-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="size-4 text-amber-400" />
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">Environment Keys</h2>
            </div>
            <SettingRow label="CONVEX_DEPLOYMENT" value={process.env.NEXT_PUBLIC_CONVEX_URL ? "✓ Set" : "⚠ Missing"} />
            <SettingRow label="NIM_API_KEY" value="✓ Configured" />
            <SettingRow label="COPILOTKIT_URL" value="/api/copilotkit" mono />
          </Card>
        </main>
        <PulseChat />
      </div>
    </div>
  );
}
