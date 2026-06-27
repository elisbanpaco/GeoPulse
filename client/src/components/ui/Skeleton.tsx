"use client";

import React from "react";

// ============================================
// GeoPulse — Skeleton Loading Components
// ============================================

/**
 * SkeletonCard
 * Full metric-card shaped skeleton placeholder.
 * Mimics the layout of MetricCard: header bar, value block, context line.
 */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-4">
      {/* Header bar */}
      <div className="flex items-center gap-2">
        <div
          className="gp-skeleton rounded-full"
          style={{ width: 32, height: 32 }}
        />
        <div
          className="gp-skeleton rounded"
          style={{ width: 96, height: 8 }}
        />
      </div>

      {/* Value rectangle */}
      <div
        className="gp-skeleton rounded"
        style={{ width: 128, height: 32 }}
      />

      {/* Context line */}
      <div
        className="gp-skeleton rounded"
        style={{ width: 80, height: 8 }}
      />
    </div>
  );
}

/**
 * SkeletonChart
 * Chart-area skeleton placeholder.
 * Accepts a configurable height (default 250px), renders full-width.
 */
export function SkeletonChart({ height = 250 }: { height?: number }) {
  return (
    <div
      className="gp-skeleton rounded-xl w-full"
      style={{ height }}
    />
  );
}

/**
 * SkeletonText
 * Inline text skeleton for paragraph or label placeholders.
 * Accepts width (default '60%') and height (default 12px).
 */
export function SkeletonText({
  width = "60%",
  height = 12,
}: {
  width?: string | number;
  height?: number;
}) {
  return (
    <div
      className="gp-skeleton rounded"
      style={{ width, height }}
    />
  );
}

/**
 * SkeletonMap
 * Full-sized map placeholder with centered loading text.
 */
export function SkeletonMap() {
  return (
    <div className="gp-skeleton rounded-xl w-full h-full min-h-[400px] flex items-center justify-center">
      <span className="text-sm font-medium text-[#94a3b8] animate-pulse">
        Cargando...
      </span>
    </div>
  );
}
