"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MapPin,
  Users,
} from "lucide-react";

// Layout
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

// Cards
import MetricCard from "@/components/cards/MetricCard";

// Charts
import TrendChart from "@/components/charts/TrendChart";
import RankingChart from "@/components/charts/RankingChart";
import DistributionChart from "@/components/charts/DistributionChart";
import ComparisonChart from "@/components/charts/ComparisonChart";

// Map
import CrimeMap from "@/components/map/CrimeMap";

// Panels
import AlertPanel from "@/components/panels/AlertPanel";
import InsightPanel from "@/components/panels/InsightPanel";

// Lib
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { formatFullNumber, formatVariation, getVariationColor } from "@/lib/utils";
import type { Region, ViewMode, TopRegion, DashboardSummary } from "@/lib/types";

export default function DashboardPage() {
  // --- State ---
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>("general");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Data Fetching ---
  const { data: summaryData, status: summaryStatus } = useApi<DashboardSummary>(
    () => api.getSummary(selectedRegion?.code, selectedYear),
    [selectedRegion?.code, selectedYear]
  );

  const { data: allRegions, status: regionsStatus } = useApi<TopRegion[]>(
    () => api.getAllRegions(),
    []
  );

  const { data: topRegions } = useApi<TopRegion[]>(
    () => api.getTopRegions(selectedYear, 10),
    [selectedYear]
  );

  // --- Computed Values ---
  const regionsList = useMemo(() => {
    if (!allRegions) return [];
    return allRegions
      .filter((d) => d.COD_DPTO !== "00")
      .map((d) => ({ code: d.COD_DPTO, name: d.NOM_DPTO, total: d.total_delitos }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allRegions]);

  const filteredTopRegions = useMemo(() => {
    if (!topRegions) return [];
    return topRegions.filter((d) => d.COD_DPTO !== "00");
  }, [topRegions]);

  const topRegionName = filteredTopRegions.length > 0 ? filteredTopRegions[0].NOM_DPTO : "—";
  const totalRegionsCount = regionsList.length;

  // Close sidebar on view change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeView]);

  // --- Handle Map Region Selection ---
  const handleRegionSelect = (region: Region | null) => {
    setSelectedRegion(region);
  };

  // --- Render ---
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <Sidebar
        regions={regionsList}
        selectedRegion={selectedRegion}
        selectedYear={selectedYear}
        activeView={activeView}
        onRegionChange={setSelectedRegion}
        onYearChange={setSelectedYear}
        onViewChange={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-[272px] min-h-screen">
        {/* Header */}
        <Header
          selectedRegion={selectedRegion}
          selectedYear={selectedYear}
          activeView={activeView}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {activeView === "general" && (
            <GeneralView
              selectedRegion={selectedRegion}
              selectedYear={selectedYear}
              summaryData={summaryData}
              summaryLoading={summaryStatus === "loading"}
              topRegions={filteredTopRegions}
              topRegionName={topRegionName}
              totalRegionsCount={totalRegionsCount}
              onRegionSelect={handleRegionSelect}
            />
          )}

          {activeView === "comparative" && (
            <ComparativeView
              selectedRegion={selectedRegion}
              selectedYear={selectedYear}
            />
          )}

          {activeView === "intelligence" && (
            <IntelligenceView
              selectedYear={selectedYear}
              topRegions={filteredTopRegions}
            />
          )}

          {activeView === "reports" && <ReportsView />}
        </main>
      </div>
    </div>
  );
}

// ==========================================================
// VIEW: General — National Overview
// ==========================================================
function GeneralView({
  selectedRegion,
  selectedYear,
  summaryData,
  summaryLoading,
  topRegions,
  topRegionName,
  totalRegionsCount,
  onRegionSelect,
}: {
  selectedRegion: Region | null;
  selectedYear: number | null;
  summaryData: DashboardSummary | null;
  summaryLoading: boolean;
  topRegions: TopRegion[];
  topRegionName: string;
  totalRegionsCount: number;
  onRegionSelect: (region: Region | null) => void;
}) {
  const variation = summaryData?.yoy_variation_percent ?? 0;
  const variationColor = getVariationColor(variation);

  return (
    <div className="space-y-6 gp-fade-in">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title={selectedRegion ? `Incidentes — ${selectedRegion.name}` : "Total Incidentes"}
          value={
            selectedRegion
              ? selectedRegion.total
              : summaryData?.total_delitos ?? 0
          }
          variation={variation}
          variationLabel="vs periodo anterior"
          icon={<Activity className="w-4 h-4 text-[#0f766e]" />}
          loading={summaryLoading}
        />
        <MetricCard
          title="Zona de Mayor Incidencia"
          value={topRegionName}
          subtitle={
            topRegions.length > 0
              ? `${formatFullNumber(topRegions[0]?.total_delitos ?? 0)} incidentes`
              : undefined
          }
          icon={<AlertTriangle className="w-4 h-4 text-[#d97706]" />}
          severity="warning"
          loading={summaryLoading}
        />
        <MetricCard
          title="Registros Procesados"
          value={summaryData?.total_registros ?? 0}
          icon={<BarChart3 className="w-4 h-4 text-[#2563eb]" />}
          subtitle="Filas analíticas auditadas"
          loading={summaryLoading}
        />
        <MetricCard
          title="Regiones Monitoreadas"
          value={totalRegionsCount}
          icon={<MapPin className="w-4 h-4 text-[#7c3aed]" />}
          subtitle="Cobertura nacional completa"
          severity="success"
          loading={summaryLoading}
        />
      </div>

      {/* Main Grid: Map + Charts + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Map */}
        <div className="lg:col-span-4">
          <div className="gp-card flex flex-col h-[520px]">
            <div className="gp-card-header">
              <h3 className="gp-card-title">Mapa de Incidencia</h3>
              <span className="text-[10px] text-[#94a3b8] font-medium">
                {selectedYear ? `Año ${selectedYear}` : "Histórico acumulado"}
              </span>
            </div>
            <div className="flex-1 relative">
              <CrimeMap
                onRegionSelect={onRegionSelect}
                selectedYear={selectedYear}
                selectedRegionCode={selectedRegion?.code}
              />
            </div>
          </div>
        </div>

        {/* Center Column: Charts */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Trend Chart */}
          <div className="gp-card flex flex-col h-[320px]">
            <div className="gp-card-header">
              <h3 className="gp-card-title">
                {selectedRegion
                  ? `Evolución — ${selectedRegion.name}`
                  : "Evolución Histórica Nacional"}
              </h3>
              <span className="text-[10px] text-[#94a3b8] font-medium">
                Incidentes por año
              </span>
            </div>
            <div className="gp-card-body flex-1 pb-2">
              <TrendChart selectedRegion={selectedRegion} />
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="gp-card flex flex-col" style={{ minHeight: "260px" }}>
            <div className="gp-card-header">
              <h3 className="gp-card-title">Distribución por Indicador</h3>
              <span className="text-[10px] text-[#94a3b8] font-medium">
                Clasificación de delitos
              </span>
            </div>
            <div className="gp-card-body flex-1 flex items-center justify-center" style={{ minHeight: "200px" }}>
              <DistributionChart
                selectedRegion={selectedRegion}
                selectedYear={selectedYear}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Ranking + Alerts */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Ranking */}
          <div className="gp-card flex flex-col h-[320px]">
            <div className="gp-card-header">
              <h3 className="gp-card-title">Ranking Regional</h3>
              <span className="text-[10px] text-[#94a3b8] font-medium">
                Top por volumen
              </span>
            </div>
            <div className="gp-card-body flex-1">
              <RankingChart selectedYear={selectedYear} limit={8} />
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="gp-card flex flex-col" style={{ minHeight: "260px" }}>
            <div className="gp-card-header">
              <h3 className="gp-card-title">Alertas e Insights</h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] text-red-500 font-semibold">
                  Live
                </span>
              </div>
            </div>
            <div className="gp-card-body flex-1">
              <AlertPanel
                selectedYear={selectedYear}
                regions={topRegions ?? []}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// VIEW: Comparative — Multi-Region Analysis
// ==========================================================
function ComparativeView({
  selectedRegion,
  selectedYear,
}: {
  selectedRegion: Region | null;
  selectedYear: number | null;
}) {
  return (
    <div className="space-y-6 gp-fade-in">
      <div className="gp-card">
        <div className="gp-card-header">
          <h3 className="gp-card-title">
            Tendencias Comparativas — Top 5 Regiones
          </h3>
          <span className="text-[10px] text-[#94a3b8] font-medium">
            Evolución histórica comparada
          </span>
        </div>
        <div className="gp-card-body" style={{ height: "420px" }}>
          <ComparisonChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gp-card">
          <div className="gp-card-header">
            <h3 className="gp-card-title">Ranking Regional Completo</h3>
          </div>
          <div className="gp-card-body" style={{ height: "400px" }}>
            <RankingChart selectedYear={selectedYear} limit={15} />
          </div>
        </div>

        <div className="gp-card">
          <div className="gp-card-header">
            <h3 className="gp-card-title">Distribución por Tipo de Delito</h3>
          </div>
          <div className="gp-card-body flex items-center justify-center" style={{ height: "400px" }}>
            <DistributionChart
              selectedRegion={selectedRegion}
              selectedYear={selectedYear}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// VIEW: Intelligence — Anomaly Detection
// ==========================================================
function IntelligenceView({
  selectedYear,
  topRegions,
}: {
  selectedYear: number | null;
  topRegions: TopRegion[];
}) {
  return (
    <div className="space-y-6 gp-fade-in">
      {/* Intelligence Header */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3054] rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Motor de Inteligencia Criminal</h2>
            <p className="text-sm text-slate-400">
              Detección automática de anomalías, patrones y tendencias en datos de seguridad ciudadana
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights Panel */}
        <div className="gp-card">
          <div className="gp-card-header">
            <h3 className="gp-card-title">Insights Computados</h3>
            <span className="gp-badge gp-badge-success">Automático</span>
          </div>
          <div className="gp-card-body">
            <InsightPanel />
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="gp-card">
          <div className="gp-card-header">
            <h3 className="gp-card-title">Alertas de Seguridad</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-500 font-semibold">
                Live
              </span>
            </div>
          </div>
          <div className="gp-card-body">
            <AlertPanel
              selectedYear={selectedYear}
              regions={topRegions}
            />
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="gp-card">
        <div className="gp-card-header">
          <h3 className="gp-card-title">
            Análisis de Tendencias Multi-Regional
          </h3>
        </div>
        <div className="gp-card-body" style={{ height: "400px" }}>
          <ComparisonChart />
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// VIEW: Reports — Export & Sharing
// ==========================================================
function ReportsView() {
  return (
    <div className="space-y-6 gp-fade-in">
      <div className="gp-card">
        <div className="gp-card-body p-8">
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-[#94a3b8]" />
            </div>
            <h2 className="text-xl font-bold text-[#0f172a] mb-2">
              Centro de Reportes
            </h2>
            <p className="text-sm text-[#64748b] max-w-md mb-6">
              Genera reportes ejecutivos personalizados, exporta datos en
              múltiples formatos y comparte análisis con tu equipo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#e2e8f0] hover:border-[#0f766e] hover:bg-[#f0fdfa] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#334155]">
                  Exportar PDF
                </span>
              </button>

              <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#e2e8f0] hover:border-[#0f766e] hover:bg-[#f0fdfa] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#334155]">
                  Exportar Excel
                </span>
              </button>

              <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#e2e8f0] hover:border-[#0f766e] hover:bg-[#f0fdfa] transition-all group">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#334155]">
                  Compartir
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
