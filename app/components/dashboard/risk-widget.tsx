"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { ChartSkeleton } from "@/components/shared/chart-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { RiskPanel } from "@/components/generative-ui/risk-panel";

export function RiskWidget() {
  const riskScores = useQuery(api.queries.getRiskScores, {});

  if (riskScores === undefined) {
    return <ChartSkeleton />;
  }

  if (!riskScores || riskScores.length === 0) {
    return (
      <Card className="p-6 bg-gray-950/40 border-gray-800 rounded-3xl h-[320px] flex items-center justify-center">
        <EmptyState
          icon={<Shield className="size-8 text-gray-600 animate-pulse" />}
          title="No risk scores"
          subtitle="Risk assessment pipeline hasn't executed yet"
        />
      </Card>
    );
  }

  // Display top 4 highest-risk scores
  const topRisks = riskScores.slice(0, 4);

  return (
    <Card className="p-6 bg-gray-950/40 border-gray-800 rounded-3xl flex flex-col h-[320px] overflow-hidden font-sans">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
            <Shield className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-gray-100">
              HIGHEST PREDICTIVE RISK
            </h3>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest font-mono">
              Composite Risk Index
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-widest">
          Ward Breakdown
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <RiskPanel data={topRisks} />
      </div>
    </Card>
  );
}
