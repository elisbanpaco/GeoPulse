"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Activity } from "lucide-react";

interface CentralTrendChartProps {
  selectedRegion?: { code: string; name: string; total: number } | null;
}

export default function CentralTrendChart({ selectedRegion }: CentralTrendChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = selectedRegion 
      ? `http://localhost:8000/api/v1/dashboard/trend?region=${selectedRegion.code}`
      : "http://localhost:8000/api/v1/dashboard/trend";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching trend data:", err);
        setLoading(false);
      });
  }, [selectedRegion]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center animate-pulse">
        <Activity className="text-teal-200 w-8 h-8 mb-2" />
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Cargando datos...</span>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={selectedRegion ? "#0ea5e9" : "#0f766e"} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={selectedRegion ? "#0ea5e9" : "#0f766e"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#cbd5e1" 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
              tickLine={false} 
              axisLine={{ stroke: '#cbd5e1' }} 
            />
            <YAxis 
              stroke="#cbd5e1" 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
              formatter={(value: number) => [Math.round(value).toLocaleString(), 'Incidentes']}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={selectedRegion ? "#0ea5e9" : "#0f766e"} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTrend)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
