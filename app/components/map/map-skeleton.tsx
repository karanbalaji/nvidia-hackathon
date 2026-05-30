import React from "react";

export function MapSkeleton() {
  return (
    <div className="w-full h-full min-h-[300px] bg-muted/10 flex items-center justify-center animate-pulse rounded-3xl border border-border/50">
      <div className="text-center space-y-2 text-muted-foreground">
        <div className="size-12 rounded-2xl bg-muted/30 mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Loading map...</p>
      </div>
    </div>
  );
}
