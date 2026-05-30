"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Zap, Activity } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { formatDistanceToNow } from "date-fns";

export function SparkBenchmarkWidget() {
  const pipelineRun = useQuery(api.queries.getPipelineRun);

  if (pipelineRun === undefined) {
    return (
      <div
        data-testid="benchmark-skeleton"
        className="grid grid-cols-2 gap-4 h-[320px] bg-gray-950/40 border border-gray-800 rounded-3xl p-6 animate-pulse"
      >
        <div className="h-24 bg-gray-900 rounded-2xl" />
        <div className="h-24 bg-gray-900 rounded-2xl" />
        <div className="h-24 bg-gray-900 rounded-2xl" />
        <div className="h-24 bg-gray-900 rounded-2xl" />
      </div>
    );
  }

  if (!pipelineRun) {
    return (
      <Card className="p-6 bg-gray-950/40 border-gray-800 rounded-3xl h-[320px] flex items-center justify-center font-sans">
        <div className="text-center text-gray-500 font-mono text-xs">
          NO BENCHMARK DATA AVAILABLE
        </div>
      </Card>
    );
  }

  const isGPU = pipelineRun.engine === "rapids";
  const lastRunTime = new Date(pipelineRun.createdAt);
  const relativeTime = formatDistanceToNow(lastRunTime, { addSuffix: true });

  return (
    <Card className="p-6 bg-gray-950/40 border-gray-800 rounded-3xl flex flex-col justify-between h-[320px] font-sans">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-green-600/10 flex items-center justify-center text-green-500">
              <Cpu className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-gray-100">
                PIPELINE EXECUTION BENCHMARKS
              </h3>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest font-mono">
                RAPIDS & Spark Metrics
              </p>
            </div>
          </div>
          {isGPU && (
            <Badge
              variant="outline"
              className="bg-blue-950/40 border-blue-500/30 text-blue-400 font-mono text-[9px] uppercase tracking-widest flex items-center gap-1 py-1"
            >
              <Zap className="h-3 w-3 fill-blue-400" />
              <span>⚡ GPU Accelerated</span>
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Processing Engine"
            value={pipelineRun.engine.toUpperCase()}
            delta={isGPU ? "RAPIDS GPU Mode" : "CPU Bound"}
            deltaPositive={isGPU}
            icon={<Cpu className="h-4 w-4 text-gray-500" />}
          />
          <StatCard
            title="Rows Processed"
            value={pipelineRun.rowsProcessed.toLocaleString("en-CA")}
            delta="Ingested & Cleaned"
            deltaPositive={true}
            icon={<Activity className="h-4 w-4 text-gray-500" />}
          />
          <StatCard
            title="Execution Duration"
            value={`${pipelineRun.durationSec.toFixed(2)}s`}
            delta={isGPU ? "⚡ Accelerated" : "Normal latency"}
            deltaPositive={isGPU}
          />
          <StatCard
            title="Last Run Time"
            value={relativeTime}
            delta="Schedule Triggered"
            deltaPositive={true}
          />
        </div>
      </div>

      <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest border-t border-gray-900 pt-2 mt-4 flex justify-between">
        <span>Powered by NVIDIA DGX Spark</span>
        <span>Run ID: {pipelineRun.runId.slice(0, 8)}</span>
      </div>
    </Card>
  );
}
