"use client";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { StatCard } from "@/components/shared/stat-card";
import { formatDistanceToNow } from "date-fns";
import { Cpu, Zap, Clock, Database } from "lucide-react";

export function SparkBenchmarkWidget() {
  const pipelineRun = useQuery(api.queries.getPipelineRun);

  if (pipelineRun === undefined) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
          Spark Benchmark
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <StatCard key={i} title="—" value="—" loading />
          ))}
        </div>
      </div>
    );
  }

  if (!pipelineRun) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground mb-2">
          Spark Benchmark
        </p>
        <p className="text-[10px] text-muted-foreground">No pipeline run recorded yet.</p>
      </div>
    );
  }

  const isGpu = pipelineRun.engine === "rapids";
  const lastRun = (() => {
    try {
      return formatDistanceToNow(new Date(pipelineRun.createdAt), { addSuffix: true });
    } catch {
      return pipelineRun.createdAt;
    }
  })();

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
          Spark Benchmark
        </p>
        {isGpu && (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <Zap className="h-2.5 w-2.5" />
            GPU Accelerated
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Engine"
          value={pipelineRun.engine.toUpperCase()}
          icon={<Cpu className="h-4 w-4" />}
        />
        <StatCard
          title="Rows Processed"
          value={pipelineRun.rowsProcessed.toLocaleString()}
          icon={<Database className="h-4 w-4" />}
        />
        <StatCard
          title="Duration"
          value={`${pipelineRun.durationSec.toFixed(2)}s`}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Last Run"
          value={lastRun}
        />
      </div>

      <p className="text-[9px] text-muted-foreground font-bold">
        Powered by NVIDIA DGX Spark
      </p>
    </div>
  );
}
