"use client";

import { useState, useEffect } from "react";
import MapChart from "../components/Map";
import ExecutiveBriefing from "../components/ExecutiveBriefing";
import ComparativeMatrix from "../components/ComparativeMatrix";
import CentralTrendChart from "../components/CentralTrendChart";
import TopRegionsChart from "../components/TopRegionsChart";
import DistributionChart from "../components/DistributionChart";

export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState<{ code: string; name: string; total: number } | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [regions, setRegions] = useState<{ code: string; name: string; total: number }[]>([]);
  useEffect(() => {
    fetch("http://localhost:8000/api/v1/dashboard/top-regions?limit=30")
      .then(res => res.json())
      .then(data => {
        const mapped = data
          .filter((d: any) => d.COD_DPTO !== "00")
          .map((d: any) => ({ code: d.COD_DPTO, name: d.NOM_DPTO, total: d.total_delitos }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        setRegions(mapped);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f3f4f6] text-[#1e293b] font-sans">
      {/* Sidebar Izquierda (Filtros y Branding) */}
      <aside className="w-[280px] bg-white border-r border-[#e5e7eb] flex flex-col hidden md:flex">
        <div className="p-4 border-b border-[#e5e7eb] flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-700 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            GP
          </div>
          <div>
            <h1 className="font-bold text-[#0f172a] leading-tight">GEOPULSE</h1>
            <p className="text-xs text-teal-700 font-semibold">Análisis Delictivo</p>
          </div>
        </div>
        
        <div className="bg-teal-700 text-white p-3 flex justify-between items-center text-sm font-semibold">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </div>
          <button className="text-xs text-teal-100 hover:text-white">Limpiar filtros ↻</button>
        </div>

        <div className="p-4 flex flex-col gap-4 flex-1">
          {/* Filtro: Región */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#334155] flex items-center gap-2">
              <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Región
            </label>
            <select 
              className="bg-[#f8fafc] border border-[#cbd5e1] text-[#475569] text-sm rounded-md p-2 outline-none focus:border-teal-500"
              value={selectedRegion?.code || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setSelectedRegion(null);
                } else {
                  const reg = regions.find(r => r.code === val);
                  if (reg) setSelectedRegion(reg);
                }
              }}
            >
              <option value="">Nacional (Todas)</option>
              {regions.map(r => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro: Año */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#334155] flex items-center gap-2">
              <svg className="w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Año
            </label>
            <select 
              className="bg-[#f8fafc] border border-[#cbd5e1] text-[#475569] text-sm rounded-md p-2 outline-none focus:border-teal-500"
              value={selectedYear || ""}
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Todos los años</option>
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 bg-[#f8fafc] m-4 rounded-xl border border-[#e2e8f0]">
          <h4 className="font-bold text-teal-800 text-sm mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Guía didáctica
          </h4>
          <p className="text-xs text-[#64748b] mb-3">Explora los filtros y visuales para analizar los índices delictivos a nivel nacional y regional.</p>
          <button className="text-teal-700 bg-teal-50 border border-teal-200 w-full py-1.5 rounded-md text-xs font-bold hover:bg-teal-100 transition">▶ Ver tutorial</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
        
        {/* Header Superior */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between pb-6 gap-4 border-b border-[#e5e7eb] mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] tracking-tight uppercase">
              DASHBOARD INTELIGENTE DE CRIMINALIDAD
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-teal-700 font-semibold text-lg">
                {selectedRegion ? `Región ${selectedRegion.name}` : "Nivel Nacional"}
              </p>
              <span className="bg-white text-teal-700 border border-teal-200 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                Propuesta visual ejecutiva
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-[#e2e8f0] shadow-sm">
             <button className="px-6 py-2 bg-teal-700 text-white rounded-lg text-sm font-bold shadow-md">General</button>
             <button className="px-6 py-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-lg text-sm font-semibold transition">Comparativo</button>
          </div>
        </header>

        {/* Panel Superior de KPIs (Horizontal) */}
        <div className="mb-6">
          <ExecutiveBriefing selectedRegion={selectedRegion} selectedYear={selectedYear} layout="horizontal" />
        </div>
        
        {/* Cuadrícula Principal (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Columna Izquierda (Mapa) */}
          <div className="lg:col-span-3 bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between">
               <h3 className="text-[#334155] font-bold text-xs uppercase tracking-wider">Avance por Provincia</h3>
               <span className="w-5 h-5 bg-[#f1f5f9] rounded-full flex items-center justify-center text-[#94a3b8] text-xs font-serif font-bold italic border border-[#e2e8f0]">i</span>
            </div>
            <div className="flex-1 p-2 relative h-[500px]">
              <MapChart onRegionSelect={setSelectedRegion} selectedYear={selectedYear} />
            </div>
          </div>

          {/* Columna Central (Evolución y Pie) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm flex flex-col h-[350px]">
              <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between">
                 <h3 className="text-[#334155] font-bold text-xs uppercase tracking-wider">Comparación Histórica (Incidentes)</h3>
                 <span className="w-5 h-5 bg-[#f1f5f9] rounded-full flex items-center justify-center text-[#94a3b8] text-xs font-serif font-bold italic border border-[#e2e8f0]">i</span>
              </div>
              <div className="flex-1 p-4">
                <CentralTrendChart selectedRegion={selectedRegion} />
              </div>
            </div>
            
            {/* Aquí iría el Pie Chart o más info */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm flex flex-col h-[280px]">
               <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between">
                 <h3 className="text-[#334155] font-bold text-xs uppercase tracking-wider">Distribución por Indicador</h3>
                 <span className="w-5 h-5 bg-[#f1f5f9] rounded-full flex items-center justify-center text-[#94a3b8] text-xs font-serif font-bold italic border border-[#e2e8f0]">i</span>
              </div>
              <div className="flex-1 p-4 flex items-center justify-center text-[#94a3b8] text-sm">
                 <DistributionChart selectedRegion={selectedRegion} selectedYear={selectedYear} />
              </div>
            </div>
          </div>

          {/* Columna Derecha (Top Regiones y Alertas) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm flex flex-col h-[350px]">
               <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between">
                 <h3 className="text-[#334155] font-bold text-xs uppercase tracking-wider">Top Regiones por Incidentes</h3>
                 <span className="w-5 h-5 bg-[#f1f5f9] rounded-full flex items-center justify-center text-[#94a3b8] text-xs font-serif font-bold italic border border-[#e2e8f0]">i</span>
              </div>
              <div className="flex-1 p-4">
                <TopRegionsChart selectedYear={selectedYear} />
              </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm flex flex-col h-[280px]">
               <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between">
                 <h3 className="text-[#334155] font-bold text-xs uppercase tracking-wider">Insights y Alertas</h3>
                 <span className="w-5 h-5 bg-[#f1f5f9] rounded-full flex items-center justify-center text-[#94a3b8] text-xs font-serif font-bold italic border border-[#e2e8f0]">i</span>
              </div>
              <div className="flex-1 p-4 flex flex-col justify-center gap-4">
                 <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-3">
                       <span className="text-amber-500 font-bold text-lg">⚠️</span>
                       <span className="text-sm font-semibold text-[#334155]">Zonas sin datos</span>
                    </div>
                    <span className="font-bold text-amber-600">3</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-3">
                       <span className="text-emerald-500 font-bold text-lg">⬆️</span>
                       <div className="flex flex-col">
                         <span className="text-xs text-[#64748b]">Mayor reducción</span>
                         <span className="text-sm font-bold text-[#334155]">San Román</span>
                       </div>
                    </div>
                    <span className="font-bold text-emerald-600">-12.6%</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-3">
                       <span className="text-red-500 font-bold text-lg">⬇️</span>
                       <div className="flex flex-col">
                         <span className="text-xs text-[#64748b]">Mayor incremento</span>
                         <span className="text-sm font-bold text-[#334155]">El Collao</span>
                       </div>
                    </div>
                    <span className="font-bold text-red-600">+8.3%</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
