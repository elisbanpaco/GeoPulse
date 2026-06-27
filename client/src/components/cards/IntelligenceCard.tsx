"use client";

import React from "react";
import {
  AlertTriangle,
  TrendingUp,
  Info,
  Shield,
} from "lucide-react";
import type { IntelligenceCardProps } from "@/lib/types";
import { cn } from "@/lib/utils";

// ============================================
// GeoPulse — Intelligence Card Component
// ============================================

/**
 * Severity-based style configuration.
 * Each severity maps to a border color, background, icon component, and icon color.
 */
const severityConfig = {
  critical: {
    border: "border-l-red-500",
    bg: "bg-red-50/50",
    icon: AlertTriangle,
    iconColor: "text-red-500",
  },
  high: {
    border: "border-l-amber-500",
    bg: "bg-amber-50/50",
    icon: TrendingUp,
    iconColor: "text-amber-500",
  },
  medium: {
    border: "border-l-blue-500",
    bg: "bg-blue-50/50",
    icon: Info,
    iconColor: "text-blue-500",
  },
  info: {
    border: "border-l-slate-400",
    bg: "bg-slate-50/50",
    icon: Shield,
    iconColor: "text-slate-400",
  },
} as const;

/**
 * IntelligenceCard
 * Alert-style card for anomaly detection and intelligence insights.
 * Colored left border and background indicate severity level.
 * Supports an optional highlighted value and an action button.
 */
export function IntelligenceCard({
  title,
  description,
  severity,
  value,
  region,
  actionLabel,
  onAction,
}: IntelligenceCardProps) {
  const config = severityConfig[severity];
  const SeverityIcon = config.icon;

  return (
    <div
      className={cn(
        "rounded-xl border border-[#e2e8f0] p-4",
        "border-l-[3px]",
        config.border,
        config.bg,
        "hover:-translate-y-px hover:shadow-lg",
        "transition-all duration-200 ease-out"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Severity icon */}
        <div
          className={cn(
            "flex-shrink-0 mt-0.5",
            config.iconColor
          )}
        >
          <SeverityIcon size={20} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-[#0f172a] leading-tight truncate">
              {title}
            </h4>
            {region && (
              <span className="text-[10px] font-medium text-[#64748b] bg-white/80 rounded px-1.5 py-0.5 border border-[#e2e8f0] flex-shrink-0">
                {region}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-[#64748b] leading-relaxed mb-2">
            {description}
          </p>

          {/* Value highlight + action row */}
          <div className="flex items-center justify-between gap-3">
            {value && (
              <span className="text-lg font-bold text-[#0f172a] tracking-tight">
                {value}
              </span>
            )}

            {actionLabel && onAction && (
              <button
                type="button"
                onClick={onAction}
                className={cn(
                  "inline-flex items-center justify-center",
                  "px-3 py-1.5 rounded-lg",
                  "text-xs font-semibold",
                  "bg-teal-700 text-white",
                  "hover:bg-teal-800 active:bg-teal-900",
                  "transition-colors duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",
                  "ml-auto"
                )}
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntelligenceCard;
