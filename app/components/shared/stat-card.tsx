import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  delta,
  deltaPositive = true,
  icon,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm rounded-2xl animate-pulse">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <div className="size-4 rounded bg-muted/40" />
          </div>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors shadow-sm rounded-2xl">
      <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
          {icon && <span className="text-muted-foreground/60">{icon}</span>}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl font-black tracking-tight text-foreground">
            {value}
          </span>
          {delta && (
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                deltaPositive
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              <span>{deltaPositive ? "▲" : "▼"}</span>
              <span>{delta}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
