"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Region } from "@/lib/types";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { formatNumber, formatFullNumber } from "@/lib/utils";
import { SkeletonChart } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface TrendChartProps {
  selectedRegion?: Region | null;
}

export default function TrendChart({ selectedRegion }: TrendChartProps) {
  const { data, status } = useApi(
    () => api.getTrend(selectedRegion?.code),
    [selectedRegion?.code]
  );

  // Computar promedio para la ReferenceLine
  const averageValue = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return Math.round(total / data.length);
  }, [data]);

  if (status === "loading") {
    return <SkeletonChart height={250} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Sin datos de tendencia"
        description="No hay datos históricos disponibles para la selección actual."
      />
    );
  }

  const isRegional = !!selectedRegion;
  const strokeColor = isRegional ? "#2563eb" : "#0f766e"; // Azul si es región, Teal si es nacional
  const gradientId = isRegional ? "colorTrendRegional" : "colorTrendNational";

  return (
    <div className="w-full h-full relative" style={{ minHeight: "220px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#cbd5e1"
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            stroke="#cbd5e1"
            tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => formatNumber(val, 0)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderColor: "#e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
            itemStyle={{ color: "#0f172a", fontWeight: "bold" }}
            labelStyle={{ color: "#64748b", marginBottom: "4px" }}
            formatter={(value: any) => [
              `${formatFullNumber(Number(value))} incidentes`,
              "Cantidad",
            ]}
          />
          <ReferenceLine
            y={averageValue}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            label={{
              value: `Promedio: ${formatNumber(averageValue, 0)}`,
              position: "top",
              fill: "#64748b",
              fontSize: 9,
              fontWeight: 600,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
