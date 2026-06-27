"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { TopRegion } from "@/lib/types";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { formatNumber, formatFullNumber } from "@/lib/utils";
import { SkeletonChart } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface RankingChartProps {
  selectedYear?: number | null;
  limit?: number;
}

export default function RankingChart({
  selectedYear,
  limit = 10,
}: RankingChartProps) {
  // Pedimos un límite un poco mayor por si hay que filtrar el nacional "00"
  const fetchLimit = limit + 1;
  const { data, status } = useApi<TopRegion[]>(
    () => api.getTopRegions(selectedYear, fetchLimit),
    [selectedYear, fetchLimit]
  );

  // Filtrar nacional y limitar al valor solicitado
  const chartData = useMemo(() => {
    if (!data) return [];
    return data
      .filter((d) => d.COD_DPTO !== "00")
      .slice(0, limit);
  }, [data, limit]);

  if (status === "loading") {
    return <SkeletonChart height={250} />;
  }

  if (chartData.length === 0) {
    return (
      <EmptyState
        title="Sin datos de ranking"
        description="No hay información de criminalidad por regiones disponible."
      />
    );
  }

  // Renderizador personalizado para etiquetas al final de la barra
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width + 8}
        y={y + 13}
        fill="#475569"
        fontSize={10}
        fontWeight={600}
        textAnchor="start"
      >
        {formatNumber(value, 0)}
      </text>
    );
  };

  return (
    <div className="w-full h-full relative" style={{ minHeight: "220px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="NOM_DPTO"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#334155", fontSize: 11, fontWeight: 500 }}
            width={90}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc", opacity: 0.5 }}
            contentStyle={{
              backgroundColor: "#ffffff",
              borderColor: "#e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
            itemStyle={{ color: "#0f172a", fontWeight: "bold" }}
            formatter={(value: any) => [
              `${formatFullNumber(Number(value))} incidentes`,
              "Total",
            ]}
          />
          <Bar
            dataKey="total_delitos"
            radius={[0, 4, 4, 0]}
            barSize={14}
            background={{ fill: "#f1f5f9", radius: 4 }}
          >
            <LabelList dataKey="total_delitos" content={renderCustomBarLabel} />
            {chartData.map((entry, index) => {
              // El primer lugar (top 1) tiene el color institucional principal Teal
              // El resto de barras tienen un gradiente o tonalidad azul
              const fill = index === 0 ? "#0f766e" : "#3b82f6";
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
