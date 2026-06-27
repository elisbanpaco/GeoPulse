"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TopRegionsChartProps {
  selectedYear?: number | null;
}

export default function TopRegionsChart({ selectedYear }: TopRegionsChartProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const qs = selectedYear ? `?limit=8&year=${selectedYear}` : "?limit=8";
    fetch(`http://localhost:8000/api/v1/dashboard/top-regions${qs}`)
      .then(res => res.json())
      .then(apiData => {
        // Exclude the '00' (Nacional)
        const regionalData = apiData.filter((d: any) => d.COD_DPTO !== "00");
        setData(regionalData);
      })
      .catch(err => console.error("Error cargando top regiones:", err));
  }, [selectedYear]);

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center animate-pulse">
        <div className="text-slate-400 text-xs font-semibold">Cargando ranking...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="NOM_DPTO" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: '#f1f5f9', opacity: 0.6 }}
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              formatter={(value: number) => [Math.round(value).toLocaleString(), 'Incidentes']}
            />
            <Bar dataKey="total_delitos" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#0f766e' : '#0ea5e9'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
