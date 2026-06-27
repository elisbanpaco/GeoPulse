"use client";
// ============================================
// GeoPulse — InsightPanel
// Computes statistical insights from multi-
// region trend data (growth, decline,
// volatility, and direction counts).
// ============================================

import React from "react";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RegionTrendSeries } from "@/lib/types";

// --- Types ---

interface Insight {
  label: string;
  region: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  badgeColor: string;
  badgeBg: string;
}

// --- Insight Computation ---

function computeInsights(trends: RegionTrendSeries[]): Insight[] {
  if (!trends || trends.length === 0) return [];

  const insights: Insight[] = [];

  // Compute growth between last two data points for each region
  const growthData: { name: string; growth: number }[] = [];

  trends.forEach((series) => {
    const data = series.data;
    if (data.length >= 2) {
      const last = data[data.length - 1].value;
      const prev = data[data.length - 2].value;
      if (prev > 0) {
        const growth = ((last - prev) / prev) * 100;
        growthData.push({ name: series.NOM_DPTO, growth });
      }
    }
  });

  // Sort by growth descending
  growthData.sort((a, b) => b.growth - a.growth);

  // 1. Region with highest growth
  if (growthData.length > 0) {
    const highest = growthData[0];
    if (highest.growth > 0) {
      insights.push({
        label: "Mayor crecimiento interanual",
        region: highest.name,
        value: `+${highest.growth.toFixed(1)}%`,
        icon: <TrendingUp size={16} />,
        color: "#dc2626",
        bgColor: "#fef2f2",
        badgeColor: "#dc2626",
        badgeBg: "#fef2f2",
      });
    }
  }

  // 2. Region with biggest decline
  if (growthData.length > 0) {
    const lowest = growthData[growthData.length - 1];
    if (lowest.growth < 0) {
      insights.push({
        label: "Mayor reducción interanual",
        region: lowest.name,
        value: `${lowest.growth.toFixed(1)}%`,
        icon: <TrendingDown size={16} />,
        color: "#059669",
        bgColor: "#ecfdf5",
        badgeColor: "#059669",
        badgeBg: "#ecfdf5",
      });
    }
  }

  // 3. Most volatile region (highest standard deviation)
  let maxStdDev = 0;
  let mostVolatileRegion = "";
  let volatilityPercent = 0;

  trends.forEach((series) => {
    const values = series.data.map((d) => d.value);
    if (values.length < 2) return;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return;

    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100; // Coefficient of variation

    if (cv > maxStdDev) {
      maxStdDev = cv;
      mostVolatileRegion = series.NOM_DPTO;
      volatilityPercent = cv;
    }
  });

  if (mostVolatileRegion) {
    insights.push({
      label: "Mayor volatilidad histórica",
      region: mostVolatileRegion,
      value: `σ ${volatilityPercent.toFixed(1)}%`,
      icon: <Activity size={16} />,
      color: "#d97706",
      bgColor: "#fffbeb",
      badgeColor: "#d97706",
      badgeBg: "#fffbeb",
    });
  }

  // 4. Count of regions with increasing trend in last year
  const increasingCount = growthData.filter((d) => d.growth > 0).length;
  const totalWithData = growthData.length;

  if (totalWithData > 0) {
    insights.push({
      label: "Regiones con tendencia al alza",
      region: `${increasingCount} de ${totalWithData} regiones`,
      value: `${Math.round((increasingCount / totalWithData) * 100)}%`,
      icon: <BarChart3 size={16} />,
      color: "#2563eb",
      bgColor: "#eff6ff",
      badgeColor: "#2563eb",
      badgeBg: "#eff6ff",
    });
  }

  return insights;
}

// --- Component ---

export default function InsightPanel() {
  const { data: trends, status } = useApi<RegionTrendSeries[]>(
    () => api.getRegionTrends(10),
    []
  );

  // --- Loading state ---
  if (status === "loading" || status === "idle") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={`skeleton-insight-${i}`} />
        ))}
      </div>
    );
  }

  // --- Empty state ---
  if (!trends || trends.length === 0) {
    return (
      <EmptyState
        title="Sin datos de tendencias"
        description="No hay suficientes datos históricos para generar análisis de tendencias."
      />
    );
  }

  const insights = computeInsights(trends);

  if (insights.length === 0) {
    return (
      <EmptyState
        title="Análisis no disponible"
        description="No se pudieron calcular insights con los datos actuales."
      />
    );
  }

  // --- Render ---
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {insights.map((insight, index) => (
        <div
          key={`insight-${index}`}
          className="gp-fade-in"
          style={{
            animationDelay: `${index * 60}ms`,
            animationFillMode: "both",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "default",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)";
            (e.currentTarget as HTMLDivElement).style.borderColor = "#cbd5e1";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0";
          }}
        >
          {/* Left: Colored Icon */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: insight.bgColor,
              color: insight.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {insight.icon}
          </div>

          {/* Center: Label + Region */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "#64748b",
                lineHeight: "1.3",
                letterSpacing: "0.01em",
              }}
            >
              {insight.label}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: "1.3",
                marginTop: "1px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {insight.region}
            </div>
          </div>

          {/* Right: Badge */}
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: insight.badgeColor,
              background: insight.badgeBg,
              padding: "3px 8px",
              borderRadius: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {insight.value}
          </div>
        </div>
      ))}
    </div>
  );
}
