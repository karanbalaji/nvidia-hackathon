"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
};

export function StatCard({ title, value, delta, deltaPositive, icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className="bg-card/60 border-border/50">
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 border-border/50 hover:border-primary/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-black text-foreground leading-none">{value}</p>
            {delta && (
              <p
                className={cn(
                  "text-[9px] font-bold uppercase tracking-wide",
                  deltaPositive ? "text-emerald-500" : "text-red-500"
                )}
              >
                {delta}
              </p>
            )}
          </div>
          {icon && (
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
