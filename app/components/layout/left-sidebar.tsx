"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Map, LayoutDashboard, MapPin, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/sidebar-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/", icon: Map, label: "Map", section: "navigation" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", section: "navigation" },
  { href: "/wards", icon: MapPin, label: "Wards", section: "navigation" },
  { href: "/alerts", icon: Bell, label: "Alert Center", section: "navigation" },
];

const BOTTOM_ITEMS = [
  { href: "/settings", icon: Settings, label: "System Settings" },
];

export function LeftSidebar() {
  const pathname = usePathname();
  const { isLeftCollapsed } = useSidebar();

  return (
    <TooltipProvider delay={300}>
      <aside
        className={cn(
          "flex flex-col h-full border-r border-border bg-card/60 shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
          isLeftCollapsed ? "w-16" : "w-[280px]"
        )}
      >
        {/* Main nav — logo lives in the header's brand zone, not here */}
        <nav className="flex-1 p-3 space-y-1 overflow-hidden">
          {!isLeftCollapsed && (
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-3 pt-2 pb-1">Navigation</p>
          )}
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Tooltip key={href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group",
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        isLeftCollapsed && "justify-center px-0 py-3"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                      {!isLeftCollapsed && (
                        <span className="truncate font-medium">{label}</span>
                      )}
                      {!isLeftCollapsed && isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="ml-auto size-1.5 rounded-full bg-primary"
                          transition={{ type: "spring", duration: 0.4 }}
                        />
                      )}
                    </Link>
                  }
                />
                {isLeftCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
              </Tooltip>
            );
          })}

          {!isLeftCollapsed && (
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-3 pt-4 pb-1">Configuration</p>
          )}
          {BOTTOM_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Tooltip key={href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                        isActive ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        isLeftCollapsed && "justify-center px-0 py-3"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isLeftCollapsed && <span className="truncate font-medium">{label}</span>}
                    </Link>
                  }
                />
                {isLeftCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer version */}
        {!isLeftCollapsed && (
          <div className="p-4 border-t border-border/50 shrink-0">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 text-center">311 Pulse v0.1.0</p>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
