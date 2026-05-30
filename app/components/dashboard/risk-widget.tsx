"use client";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { useWard } from "@/context/ward-context";
import { RiskPanel } from "@/components/generative-ui/risk-panel";
import { ChartSkeleton } from "@/components/shared/chart-skeleton";

export function RiskWidget() {
  const { activeCategory } = useWard();
  const riskScores = useQuery(api.queries.getRiskScores, {
    category: activeCategory !== "all" ? activeCategory : undefined,
  });

  if (riskScores === undefined) return <ChartSkeleton />;

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 flex flex-col gap-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
        Highest-Risk Wards
      </p>
      <RiskPanel data={riskScores.slice(0, 4)} />
    </div>
  );
}
