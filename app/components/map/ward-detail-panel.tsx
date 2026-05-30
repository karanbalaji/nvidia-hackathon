"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldAlert, Sparkles, MapPin } from "lucide-react";
import { severityBand } from "@/lib/severity";
import { WardForecastMiniChart } from "./ward-forecast-mini-chart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Ward, RiskScore, Forecast } from "@311pulse/contracts";

interface WardDetailPanelProps {
  ward: Ward | null;
  riskScore: RiskScore | null;
  forecast: Forecast | null;
  miniChartData?: { date: string; count: number }[];
  onClose: () => void;
}

export function WardDetailPanel({
  ward,
  riskScore,
  forecast,
  miniChartData = [],
  onClose,
}: WardDetailPanelProps) {
  if (!ward) return null;

  const scoreDetails = riskScore ? severityBand(riskScore.score) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "-100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute top-4 bottom-4 left-4 z-[490] w-96 bg-gray-950/95 border border-gray-800 shadow-2xl rounded-2xl backdrop-blur-md overflow-hidden flex flex-col font-sans"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-start justify-between bg-gray-900/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-[9px] border-blue-500/30 text-blue-400 uppercase tracking-widest">
                WARD {ward.wardId.replace("ward-", "")}
              </Badge>
              <div className="flex items-center gap-1 text-gray-500 text-[10px] font-mono">
                <MapPin className="h-3 w-3" />
                <span>Toronto</span>
              </div>
            </div>
            <h2 className="text-base font-bold text-gray-100 tracking-tight">{ward.wardName}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Neighbourhoods */}
          <div>
            <label className="text-[9px] font-semibold text-gray-400 tracking-wider uppercase mb-2 block font-mono">
              Neighbourhoods Covered
            </label>
            <div className="flex flex-wrap gap-1">
              {ward.neighbourhoods.map((n) => (
                <Badge
                  key={n}
                  variant="secondary"
                  className="bg-gray-900 border-gray-800 text-gray-300 text-[10px] py-0.5"
                >
                  {n}
                </Badge>
              ))}
            </div>
          </div>

          {/* Risk Card */}
          {riskScore && scoreDetails && (
            <Card className="p-4 bg-gray-900/40 border-gray-800">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <label className="text-[9px] font-semibold text-gray-400 tracking-wider uppercase mb-1 block font-mono">
                    Predictive Risk Level
                  </label>
                  <span className={`text-sm font-bold ${scoreDetails.textClass}`}>
                    {scoreDetails.label} Risk
                  </span>
                </div>
                <div className={`px-2 py-1 rounded-lg border text-xs font-mono font-bold ${scoreDetails.ringClass} ${scoreDetails.textClass}`}>
                  {riskScore.score}/100
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${riskScore.score}%`,
                    backgroundColor: scoreDetails.hex,
                  }}
                />
              </div>

              {/* Drivers */}
              {riskScore.drivers && riskScore.drivers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider font-mono">
                      Key Risk Drivers
                    </span>
                  </div>
                  <ul className="text-xs text-gray-400 space-y-1 pl-4 list-disc">
                    {riskScore.drivers.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Forecast Card */}
          {forecast && (
            <Card className="p-4 bg-gray-900/40 border-gray-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <label className="text-[9px] font-semibold text-gray-400 tracking-wider uppercase mb-1 block font-mono">
                    7-Day Horizon Forecast
                  </label>
                  <span className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                    {forecast.predictedCount} Predicted Complaints
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-[9px] border-purple-500/30 text-purple-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>AI MODEL</span>
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-gray-800/40 py-2 font-mono">
                <div>
                  <span className="text-gray-500 uppercase text-[9px]">Confidence (Low)</span>
                  <div className="text-gray-200">{forecast.confidenceLow}</div>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[9px]">Confidence (High)</span>
                  <div className="text-gray-200">{forecast.confidenceHigh}</div>
                </div>
              </div>

              {/* Mini Sparkline Chart */}
              {miniChartData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Trend Sparkline
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">7D Horizon</span>
                  </div>
                  <div className="h-16 w-full bg-gray-950/40 border border-gray-800/60 rounded-xl p-1 overflow-hidden">
                    <WardForecastMiniChart data={miniChartData} />
                  </div>
                </div>
              )}

              <div className="text-[9px] text-gray-500 uppercase font-mono tracking-wider flex justify-between">
                <span>Method: {forecast.method}</span>
                <span>As of: {new Date(forecast.horizonStart).toLocaleDateString()}</span>
              </div>
            </Card>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
