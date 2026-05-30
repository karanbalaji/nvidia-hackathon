"use client";

import { GlobalHeader } from "@/components/layout/global-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { PulseChat } from "@/components/chat/pulse-chat";
import { MapPin, Sparkles, Search } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <GlobalHeader />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />

        {/* Main content area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Workbench content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 relative overflow-hidden">
            {/* Background grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/30)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/30)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-xl px-8">
              {/* Icon */}
              <div className="size-20 rounded-3xl bg-muted/50 border border-border flex items-center justify-center">
                <MapPin className="h-8 w-8 text-muted-foreground/30" />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                  City Intelligence Map
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  GPU-accelerated 311 predictions · Agentic analysis · Live risk overlays
                </p>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-2 gap-3 w-full mt-2">
                <div className="rounded-2xl border border-border bg-card/60 p-4 text-left space-y-2 hover:border-primary/20 hover:bg-primary/[0.02] transition-all cursor-pointer group">
                  <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Search className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-foreground">Ward Search</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[9px] font-black">⌘K</kbd> to search wards by name or ID.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card/60 p-4 text-left space-y-2 hover:border-primary/20 hover:bg-primary/[0.02] transition-all cursor-pointer group">
                  <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-foreground">Agentic Analysis</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Ask the agent to forecast hotspots, explain risk drivers, or recommend actions.
                  </p>
                </div>
              </div>

              {/* CTA hint */}
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Select a ward to begin analysis
              </p>
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="h-8 border-t border-border/50 bg-card/40 flex items-center px-6 gap-4 shrink-0">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">311 Pulse</span>
            <div className="h-3 w-px bg-border/50" />
            <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
              <span className="size-1.5 bg-emerald-500 rounded-full" />
              Engine: Pandas
            </span>
            <div className="h-3 w-px bg-border/50" />
            <span className="text-[9px] font-bold text-muted-foreground">LLM: NIM / Nemotron</span>
          </div>
        </main>

        <PulseChat />
      </div>
    </div>
  );
}
