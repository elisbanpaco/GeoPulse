"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Region, DistributionItem } from "@/lib/types";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { COLORS } from "@/lib/constants";
import { formatNumber, formatFullNumber } from "@/lib/utils";
import { SkeletonChart } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface DistributionChartProps {
  selectedRegion?: Region | null;
  selectedYear?: number | null;
}

export default function DistributionChart({
  selectedRegion,
  selectedYear,
}: DistributionChartProps) {
  const { data, status } = useApi<DistributionItem[]>(
    () => api.getDistribution(selectedRegion?.code, selectedYear),
    [selectedRegion?.code, selectedYear]
  );

  // Calcular el total de todos los delitos mostrados
  const totalValue = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  if (status === "loading") {
    return <SkeletonChart height={200} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Sin datos de distribución"
        description="No hay información disponible sobre tipos de delitos para esta selección."
      />
    );
  }

  // Mapeamos los colores de la constante al gráfico
  const sliceColors = COLORS.chart;

  return (
    <div className="w-full h-full flex items-center justify-center relative" style={{ minHeight: "220px" }}>
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="40%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={sliceColors[index % sliceColors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#e2e8f0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              }}
              itemStyle={{ color: "#0f172a", fontWeight: "bold" }}
              formatter={(value: any, name: any, props: any) => {
                const percentage = props.payload.percentage ?? 0;
                return [
                  `${formatFullNumber(Number(value))} (${percentage}%)`,
                  name,
                ];
              }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{
                fontSize: "11px",
                color: "#334155",
                fontWeight: 500,
                maxWidth: "50%",
              }}
              iconType="circle"
              formatter={(value, entry: any) => {
                const item = entry.payload;
                return (
                  <span className="text-slate-700 font-medium">
                    {value}{" "}
                    <span className="text-slate-400 font-normal ml-1">
                      ({item.percentage}%)
                    </span>
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Texto al centro del Donut */}
      <div
        className="absolute top-1/2 transform -translate-y-1/2 text-center pointer-events-none flex flex-col justify-center"
        style={{ left: "40%", transform: "translate(-50%, -50%)" }}
      >
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Total
        </span>
        <span className="text-base font-extrabold text-[#0f172a] leading-none mt-0.5">
          {formatNumber(totalValue, 0)}
        </span>
      </div>
    </div>
  );
}
