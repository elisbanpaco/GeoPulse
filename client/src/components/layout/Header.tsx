"use client";

import React from "react";
import {
  Menu,
  Download,
  Share2,
  Bell,
  ChevronRight,
} from "lucide-react";
import type { Region, ViewMode } from "@/lib/types";

interface HeaderProps {
  selectedRegion: Region | null;
  selectedYear: number | null;
  activeView: ViewMode;
  onToggleSidebar: () => void;
}

const VIEW_TITLES: Record<ViewMode, string> = {
  general: "Resumen Nacional",
  comparative: "Análisis Comparativo",
  intelligence: "Inteligencia Criminal",
  reports: "Reportes y Exportación",
};

const VIEW_DESCRIPTIONS: Record<ViewMode, string> = {
  general: "Panorama integral de indicadores de seguridad ciudadana",
  comparative: "Comparación entre regiones y periodos temporales",
  intelligence: "Detección de anomalías, patrones y tendencias",
  reports: "Generación de reportes ejecutivos y exportación de datos",
};

export default function Header({
  selectedRegion,
  selectedYear,
  activeView,
  onToggleSidebar,
}: HeaderProps) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="bg-white border-b border-[#e2e8f0] px-4 md:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left section: Breadcrumbs + Title */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-[11px] text-[#94a3b8] mb-1.5">
            <button
              className="lg:hidden mr-2 p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors"
              onClick={onToggleSidebar}
            >
              <Menu className="w-5 h-5 text-[#64748b]" />
            </button>
            <span className="font-medium">GeoPulse</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-[#334155]">
              {VIEW_TITLES[activeView]}
            </span>
            {selectedRegion && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="font-semibold text-[#0f766e]">
                  {selectedRegion.name}
                </span>
              </>
            )}
            {selectedYear && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="font-semibold text-[#334155]">
                  {selectedYear}
                </span>
              </>
            )}
          </nav>

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            {VIEW_TITLES[activeView]}
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5 hidden sm:block">
            {VIEW_DESCRIPTIONS[activeView]}
          </p>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-2">
          {/* Data freshness indicator */}
          <div className="hidden md:flex items-center gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-[10px] leading-tight">
              <span className="block text-[#64748b] font-medium capitalize">
                {formattedDate}
              </span>
              <span className="block text-[#94a3b8]">
                Última sincronización: {formattedTime}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <button
            className="p-2 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155] transition-colors"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155] transition-colors"
            title="Compartir"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0f766e] text-white text-xs font-semibold hover:bg-[#0d9488] transition-colors shadow-sm"
            title="Exportar"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
