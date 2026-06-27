"use client";

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DistributionChartProps {
  selectedRegion?: { code: string; name: string; total: number } | null;
  selectedYear?: number | null;
}

const COLORS = ['#0f766e', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444'];

export default function DistributionChart({ selectedRegion, selectedYear }: DistributionChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = selectedRegion 
      ? `http://localhost:8000/api/v1/dashboard/distribution?region=${selectedRegion.code}`
      : "http://localhost:8000/api/v1/dashboard/distribution";

    if (selectedYear) {
      url += (url.includes('?') ? '&' : '?') + `year=${selectedYear}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedRegion, selectedYear]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center animate-pulse">
        <span className="text-slate-400 text-xs font-semibold">Cargando distribución...</span>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              formatter={(value: number) => [Math.round(value).toLocaleString(), 'Incidentes']}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              wrapperStyle={{ fontSize: '11px', color: '#334155', fontWeight: 500 }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Center text for donut hole */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pr-32">
        <div className="text-xs text-slate-500 font-semibold">Total</div>
        <div className="text-sm font-bold text-teal-800">
          {data.reduce((sum, item) => sum + item.value, 0) > 1000000 
            ? `${(data.reduce((sum, item) => sum + item.value, 0)/1000000).toFixed(1)}M`
            : `${(data.reduce((sum, item) => sum + item.value, 0)/1000).toFixed(0)}K`}
        </div>
      </div>
    </div>
  );
}
