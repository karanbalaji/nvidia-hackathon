"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton() {
  return (
    <div data-testid="chart-skeleton" className="rounded-3xl border border-border/50 bg-card/50 p-6 my-3 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2 w-20" />
        </div>
      </div>
      <Skeleton className="h-[160px] w-full rounded-2xl" />
    </div>
  );
}
