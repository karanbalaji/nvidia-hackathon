"use client";

import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useCopilotReadable } from "@copilotkit/react-core";
import { useSidebar } from "@/context/sidebar-context";
import { useWard } from "@/context/ward-context";
import { Activity, Mic, Upload, Sparkles, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function PulseChat() {
  const { isRightCollapsed, toggleRight } = useSidebar();
  const { selectedWardId, activeCategory } = useWard();

  useCopilotReadable({
    description: "Currently active ward filter",
    value: selectedWardId ? `Active ward: ${selectedWardId}` : "No ward selected — city-wide view",
  });

  useCopilotReadable({
    description: "Currently active 311 service category",
    value: `Active category: ${activeCategory}`,
  });

  useCopilotReadable({
    description: "Current date for temporal context",
    value: `TODAY_IS: ${new Date().toLocaleDateString("en-CA")}`,
  });

  return (
    <TooltipProvider delay={300}>
      <aside
        className={cn(
          "border-l border-border bg-card/30 flex flex-col h-full overflow-hidden shadow-xl transition-all duration-300 ease-in-out shrink-0",
          isRightCollapsed ? "w-16" : "w-[380px]"
        )}
      >
        {/* Header */}
        <div className={cn(
          "p-5 border-b border-border/50 bg-primary/[0.03] flex items-center shrink-0",
          isRightCollapsed ? "justify-center px-0" : "justify-between"
        )}>
          {!isRightCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-foreground uppercase tracking-tight">311 Pulse Agent</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Active Intelligence</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button onClick={toggleRight} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
                        <PanelRightClose className="h-4 w-4" />
                      </button>
                    }
                  />
                  <TooltipContent side="left">Collapse agent panel</TooltipContent>
                </Tooltip>
              </div>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button onClick={toggleRight} className="flex items-center justify-center w-full h-full py-4 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
                    <PanelRightOpen className="h-4 w-4" />
                  </button>
                }
              />
              <TooltipContent side="left">Expand agent panel</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Always mounted — hidden class instead of conditional rendering so
            CopilotKit's textarea never remounts and won't expand on reopen */}
        <div className={cn("flex-1 overflow-hidden relative min-h-0", isRightCollapsed && "hidden")}>
          <CopilotChat
            labels={{
              title: "311 Pulse Agent",
              initial: selectedWardId
                ? `Analyzing ${selectedWardId}. Ask me about forecasts, risk scores, or hotspots for this ward.`
                : "I'm your 311 intelligence partner. Ask me about Toronto service request patterns, forecasts, or risk scores.",
              placeholder: "Ask about 311 data...",
            }}
            className="h-full border-none shadow-none rounded-none [&_textarea]:max-h-24 [&_textarea]:resize-none"
          />
        </div>

        <div className={cn("px-4 pb-4 bg-transparent mt-2 shrink-0", isRightCollapsed && "hidden")}>
          <div className="flex justify-between items-center px-1">
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors group">
              <Mic className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              Voice Query
            </button>
            <button className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors group">
              <Upload className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              Export Report
            </button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
