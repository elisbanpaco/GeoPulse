"use client";

import React from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import type { MetricCardProps } from "@/lib/types";
import { formatFullNumber, formatVariation, getVariationColor, cn } from "@/lib/utils";
import { SkeletonCard } from "@/components/ui/Skeleton";

// ============================================
// GeoPulse — Metric Card Component
// ============================================

/**
 * MetricCard
 * Displays a single KPI metric with icon, value, variation badge,
 * contextual label, and an optional sparkline mini-chart.
 *
 * When `loading` is true, renders a SkeletonCard placeholder instead.
 */
export function MetricCard({
  title,
  value,
  variation,
  variationLabel,
  icon,
  loading,
  sparklineData,
  onClick,
}: MetricCardProps) {
  // --- Loading state ---
  if (loading) {
    return <SkeletonCard />;
  }

  // --- Variation color/trend resolution ---
  const variationStyle =
    variation !== null && variation !== undefined
      ? getVariationColor(variation)
      : null;

  // --- Sparkline data transformation ---
  const chartData = sparklineData
    ? sparklineData.map((v, i) => ({ index: i, value: v }))
    : null;

  return (
    <div
      className={cn(
        "gp-metric-card group",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Header: icon + label */}
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center flex-shrink-0 text-teal-700">
            {icon}
          </div>
        )}
        <span className="gp-metric-label">{title}</span>
      </div>

      {/* Value */}
      <div className="gp-metric-value">
        {typeof value === "number" ? formatFullNumber(value) : value}
      </div>

      {/* Variation indicator */}
      {variationStyle && variation !== null && variation !== undefined && (
        <div
          className={cn(
            "gp-metric-variation",
            variationStyle.text
          )}
        >
          <span className="mr-0.5">
            {variation > 0 ? "↑" : variation < 0 ? "↓" : "→"}
          </span>
          {formatVariation(variation)}
        </div>
      )}

      {/* Contextual label */}
      {variationLabel && (
        <div className="gp-metric-context">{variationLabel}</div>
      )}

      {/* Sparkline mini-chart */}
      {chartData && chartData.length > 1 && (
        <div className="mt-3 -mx-1">
          <ResponsiveContainer width="100%" height={48}>
            <AreaChart
              data={chartData}
              margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
            >
              <defs>
                <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0d9488"
                strokeWidth={1.5}
                fill="url(#sparkGradient)"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default MetricCard;
