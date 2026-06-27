"use client";

import React, { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface RegionalTrendProps {
  regionCode: string;
  regionName: string;
}

export default function RegionalTrend({ regionCode, regionName }: RegionalTrendProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/v1/dashboard/trend?region=${regionCode}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching trend data:", err);
        setLoading(false);
      });
  }, [regionCode]);

  if (loading) {
    return (
      <div className="bg-[#0f0f11] border border-gray-800 rounded-lg p-5 flex flex-col items-center justify-center h-48 shadow-lg animate-pulse">
        <Activity className="text-gray-600 w-8 h-8 mb-2" />
        <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">Analizando Data Histórica...</span>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  // Calcular métricas rápidas (último año vs anterior)
  const lastYear = data[data.length - 1];
  const prevYear = data.length > 1 ? data[data.length - 2] : null;
  
  let variation = 0;
  let isIncrease = false;

  if (prevYear && prevYear.value > 0) {
    variation = ((lastYear.value - prevYear.value) / prevYear.value) * 100;
    isIncrease = variation > 0;
  }

  return (
    <div className="bg-[#0f0f11] border border-gray-800 rounded-lg p-5 shadow-lg relative overflow-hidden group hover:border-blue-900/50 transition-colors flex flex-col gap-4">
      
      {/* Header del panel */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Evolución Histórica</h3>
          <p className="text-white font-mono text-sm uppercase">{regionName}</p>
        </div>
        
        {/* Badge de Variación */}
        {prevYear && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold font-mono tracking-tighter ${
            isIncrease ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
          }`}>
            {isIncrease ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isIncrease ? "+" : ""}{variation.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Gráfico Recharts */}
      <div className="h-32 w-full mt-2 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isIncrease ? "#ef4444" : "#3b82f6"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isIncrease ? "#ef4444" : "#3b82f6"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
              itemStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
              labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
              formatter={(value: number) => [Math.round(value).toLocaleString(), 'Incidentes']}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isIncrease ? "#ef4444" : "#3b82f6"} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Eje X simplificado */}
        <div className="flex justify-between items-center mt-2 text-[9px] text-gray-600 font-mono">
          <span>{data[0]?.name}</span>
          <span>{data[Math.floor(data.length/2)]?.name}</span>
          <span>{data[data.length-1]?.name}</span>
        </div>
      </div>
    </div>
  );
}
