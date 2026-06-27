"use client";

import React, { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export default function ComparativeMatrix() {
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/dashboard/trends?limit=5")
      .then(res => res.json())
      .then(data => setTrends(data))
      .catch(err => console.error(err));
  }, []);

  if (trends.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-[#0a0a0c] border border-gray-800/60 rounded-xl">
        <p className="text-gray-500 font-mono text-sm animate-pulse">Compilando matriz comparativa...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0a0a0c] border border-gray-800/60 rounded-xl p-5 shadow-2xl mt-2">
      <div className="flex items-center justify-between border-b border-gray-800/60 pb-3 mb-4">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Matriz Comparativa: Zonas de Alto Riesgo
        </h2>
        <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
          Top 5 Histórico
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {trends.map((region, index) => {
          // Evaluamos tendencia comparando primer y último año
          const firstVal = region.data[0]?.value || 0;
          const lastVal = region.data[region.data.length - 1]?.value || 0;
          const isWorsening = lastVal > firstVal;
          const strokeColor = isWorsening ? "#ef4444" : "#10b981"; // Rojo si empeora, Verde si mejora

          return (
            <div key={region.COD_DPTO} className="bg-[#0f0f11] border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase">Rank 0{index + 1}</div>
                  <div className="text-sm font-bold text-gray-200 truncate" title={region.NOM_DPTO}>
                    {region.NOM_DPTO}
                  </div>
                </div>
                <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isWorsening ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {isWorsening ? 'CRITICAL' : 'STABLE'}
                </div>
              </div>
              
              {/* Gráfico Sparkline */}
              <div className="h-14 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={region.data}>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={strokeColor} 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-3 flex justify-between items-end border-t border-gray-800/80 pt-2">
                <span className="text-[9px] text-gray-500 font-mono uppercase">Último Reg:</span>
                <span className="text-xs text-gray-300 font-mono font-bold">{Math.round(lastVal).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
