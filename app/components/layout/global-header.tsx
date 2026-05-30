"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Settings, Activity, XCircle, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWard } from "@/context/ward-context";
import { useSidebar } from "@/context/sidebar-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Map",
  "/dashboard": "Dashboard",
  "/wards": "Wards",
  "/alerts": "Alert Center",
  "/settings": "Settings",
};

const WARD_SUGGESTIONS = [
  { id: "ward-01", name: "Etobicoke North" },
  { id: "ward-02", name: "Scarborough Southwest" },
  { id: "ward-03", name: "Toronto Centre" },
  { id: "ward-04", name: "Scarborough–Guildwood" },
  { id: "ward-05", name: "Don Valley West" },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const pageLabel = ROUTE_LABELS[pathname] ?? "311 Pulse";
  const { selectedWardId, setSelectedWardId } = useWard();
  const { isLeftCollapsed, toggleLeft } = useSidebar();

  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = WARD_SUGGESTIONS.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.id.includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <TooltipProvider delay={300}>
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center sticky top-0 z-50 shrink-0 shadow-sm">

        {/* ── Logo zone: width-synced to sidebar, contains brand + toggle ── */}
        <div
          className="flex items-center shrink-0 border-r border-border/50 h-full transition-all duration-300"
          style={{ width: isLeftCollapsed ? 64 : 280 }}
        >
          {isLeftCollapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button onClick={toggleLeft} className="flex items-center justify-center w-full h-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200" aria-label="Expand sidebar">
                    <PanelLeftOpen className="h-4 w-4" />
                  </button>
                }
              />
              <TooltipContent side="bottom">Expand sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 px-4 w-full">
              <div className="size-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20 shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <span className="text-sm font-black tracking-tight text-foreground uppercase truncate flex-1">
                311 Pulse
              </span>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button onClick={toggleLeft} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 shrink-0" aria-label="Collapse sidebar">
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  }
                />
                <TooltipContent side="bottom">Collapse sidebar</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* ── Breadcrumb + ward filter pill ── */}
        <div className="flex items-center gap-3 px-6 shrink-0">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{pageLabel}</span>
          {selectedWardId && (
            <>
              <div className="size-1 bg-border rounded-full" />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      onClick={() => setSelectedWardId(null)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5 border border-primary/10 hover:bg-red-500/5 hover:border-red-500/20 hover:text-red-600 transition-all group animate-in fade-in slide-in-from-left-2"
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary group-hover:text-red-600 transition-colors">{selectedWardId}</span>
                      <XCircle className="size-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </button>
                  }
                />
                <TooltipContent side="bottom" className="text-[10px] font-bold uppercase tracking-widest">Clear ward filter</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md group hidden md:block mx-6" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              ref={inputRef}
              placeholder="Search wards, categories, areas..."
              className="h-9 pl-9 pr-12 text-[11px] bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-xl shadow-inner"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowResults(e.target.value.length >= 1); }}
              onFocus={() => { if (searchQuery.length >= 1) setShowResults(true); }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:flex items-center gap-1">
              <kbd className="h-5 px-1.5 rounded border border-border bg-background text-[9px] font-black text-muted-foreground/50 shadow-sm uppercase">⌘K</kbd>
            </div>
          </div>

          {showResults && filtered.length > 0 && (
            <div className="absolute top-full mt-3 w-full bg-card border border-border/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Ward Results</p>
                <Badge variant="secondary" className="text-[8px] h-4 px-1 font-black opacity-60">{filtered.length}</Badge>
              </div>
              <div className="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                {filtered.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => { setSelectedWardId(w.id); setSearchQuery(""); setShowResults(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/[0.04] dark:hover:bg-primary/[0.1] transition-all text-left group border border-transparent hover:border-primary/10"
                  >
                    <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-foreground">{w.name}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">{w.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 px-6">
          <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-all duration-300">
            <Settings className="h-4 w-4" />
          </button>
          <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted transition-all duration-300">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 size-1.5 bg-red-500 rounded-full ring-2 ring-card" />
          </button>
          <div className="h-6 w-px bg-border/50 mx-1" />
          <ThemeSwitcher className="scale-90" />
        </div>
      </header>
    </TooltipProvider>
  );
}
