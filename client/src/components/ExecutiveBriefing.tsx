"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Activity } from "lucide-react";
import RegionalTrend from "./RegionalTrend";

interface ExecutiveBriefingProps {
  selectedRegion?: { code: string; name: string; total: number } | null;
  selectedYear?: number | null;
  layout?: "vertical" | "horizontal";
}

export default function ExecutiveBriefing({ selectedRegion, selectedYear, layout = "vertical" }: ExecutiveBriefingProps) {
  const [summary, setSummary] = useState<any>(null);
  const [topRegion, setTopRegion] = useState<any>(null);

  useEffect(() => {
    const qs = selectedYear ? `?year=${selectedYear}` : "";
    // Obtenemos el resumen general
    fetch(`http://localhost:8000/api/v1/dashboard/summary${qs}`)
      .then(res => res.json())
      .then(data => setSummary(data));

    // Obtenemos la "Zona Cero" (Regiones con más delitos)
    const limitQs = selectedYear ? `?year=${selectedYear}&limit=5` : "?limit=5";
    fetch(`http://localhost:8000/api/v1/dashboard/top-regions${limitQs}`)
      .then(res => res.json())
      .then(data => {
        // Ignoramos el 00 (Nacional) para buscar el top real regional
        const regionReal = data.find((d: any) => d.COD_DPTO !== "00");
        setTopRegion(regionReal);
      });
  }, [selectedYear]);

  if (!summary || !topRegion) {
    return (
      <div className="flex flex-col gap-4 w-full animate-pulse">
        <div className="h-28 bg-[#0f0f11] border border-gray-800 rounded-lg"></div>
        <div className="h-28 bg-[#0f0f11] border border-gray-800 rounded-lg"></div>
        <div className="h-28 bg-[#0f0f11] border border-gray-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`w-full gap-4 ${layout === "horizontal" ? "grid grid-cols-1 md:grid-cols-4" : "flex flex-col"}`}>
      {/* Tarjeta 1: Total Nacional o Regional */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
              <Activity className="text-teal-700 w-4 h-4" />
            </div>
            <h3 className="text-[#334155] text-xs font-bold uppercase tracking-wider">
              {selectedRegion ? `Incidentes: ${selectedRegion.name}` : "Total Incidentes"}
            </h3>
          </div>
        </div>
        <div className="flex items-end gap-2 mt-2">
          <span className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
            {selectedRegion 
              ? Math.round(selectedRegion.total).toLocaleString() 
              : Math.round(summary.total_delitos).toLocaleString()}
          </span>
        </div>
        <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
          <span>▲</span> 8.7% vs anterior
        </div>
      </div>

      {/* Tarjeta 2: Zona Cero (O región seleccionada) */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <AlertTriangle className="text-blue-700 w-4 h-4" />
            </div>
            <h3 className="text-[#334155] text-xs font-bold uppercase tracking-wider">
              {selectedRegion ? "Región Seleccionada" : "Zona Crítica"}
            </h3>
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl md:text-3xl font-extrabold text-[#0f172a] tracking-tight uppercase truncate">
            {selectedRegion ? selectedRegion.name : topRegion.NOM_DPTO}
          </span>
        </div>
        <div className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1">
          <span>Volumen:</span> {selectedRegion ? Math.round(selectedRegion.total).toLocaleString() : Math.round(topRegion.total_delitos).toLocaleString()}
        </div>
      </div>

      {/* Tarjeta 3: Estado de Servidor/Registros */}
      {/* Tarjeta 3: Estado de Servidor/Registros */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <ShieldAlert className="text-emerald-700 w-4 h-4" />
            </div>
            <h3 className="text-[#334155] text-xs font-bold uppercase tracking-wider">Filas Auditadas</h3>
          </div>
        </div>
        <div className="flex items-end justify-between mt-2">
          <span className="text-3xl font-extrabold text-[#0f172a] tracking-tight">
            {summary.total_registros.toLocaleString()}
          </span>
          <span className="text-emerald-700 text-xs font-bold tracking-wider px-2 py-1 bg-emerald-50 rounded">
            100%
          </span>
        </div>
      </div>

    </div>
  );
}
