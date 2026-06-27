"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RegionTrendSeries } from "@/lib/types";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { COLORS } from "@/lib/constants";
import { formatNumber, formatFullNumber } from "@/lib/utils";
import { SkeletonChart } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function ComparisonChart() {
  const { data, status } = useApi<RegionTrendSeries[]>(
    () => api.getRegionTrends(5),
    []
  );

  // Transformar los datos para que Recharts los consuma por año:
  // De: [{ NOM_DPTO: "Lima", data: [{ year: 2020, value: 100 }] }]
  // A: [{ year: 2020, "Lima": 100 }]
  const transformedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Encontrar todos los años únicos en todas las series
    const yearsSet = new Set<number>();
    data.forEach((series) => {
      series.data.forEach((pt) => {
        yearsSet.add(pt.year);
      });
    });

    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);

    // Mapear cada año a su valor por región
    return sortedYears.map((year) => {
      const point: any = { year };
      data.forEach((series) => {
        const pt = series.data.find((p) => p.year === year);
        if (pt) {
          point[series.NOM_DPTO] = pt.value;
        }
      });
      return point;
    });
  }, [data]);

  // Obtener los nombres de las regiones para las líneas del gráfico
  const regionNames = useMemo(() => {
    if (!data) return [];
    return data.map((series) => series.NOM_DPTO);
  }, [data]);

  if (status === "loading") {
    return <SkeletonChart height={350} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Sin datos comparativos"
        description="No hay tendencias históricas suficientes para realizar la comparación."
      />
    );
  }

  const lineColors = COLORS.chart;

  return (
    <div className="w-full h-full relative" style={{ minHeight: "300px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={transformedData}
          margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="year"
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
            itemStyle={{ fontSize: "11px", fontWeight: "bold" }}
            labelStyle={{ color: "#64748b", marginBottom: "6px", fontWeight: "bold" }}
            formatter={(value: any) => [
              `${formatFullNumber(Number(value))} incidentes`,
            ]}
          />
          <Legend
            verticalAlign="top"
            height={40}
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", color: "#334155", fontWeight: 500 }}
          />
          {regionNames.map((name, index) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={lineColors[index % lineColors.length]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
