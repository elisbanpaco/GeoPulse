"use client";

import React from "react";
import {
  LayoutDashboard,
  Map,
  Brain,
  FileBarChart,
  Filter,
  Globe,
  Calendar,
  RotateCcw,
} from "lucide-react";
import type { Region, ViewMode } from "@/lib/types";
import { AVAILABLE_YEARS } from "@/lib/constants";

interface SidebarProps {
  regions: { code: string; name: string; total: number }[];
  selectedRegion: Region | null;
  selectedYear: number | null;
  activeView: ViewMode;
  onRegionChange: (region: Region | null) => void;
  onYearChange: (year: number | null) => void;
  onViewChange: (view: ViewMode) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "Resumen Nacional", icon: LayoutDashboard },
  { id: "comparative", label: "Análisis Comparativo", icon: Map },
  { id: "intelligence", label: "Inteligencia Criminal", icon: Brain },
  { id: "reports", label: "Reportes", icon: FileBarChart },
];

export default function Sidebar({
  regions,
  selectedRegion,
  selectedYear,
  activeView,
  onRegionChange,
  onYearChange,
  onViewChange,
  isOpen,
  onClose,
}: SidebarProps) {
  const handleClearFilters = () => {
    onRegionChange(null);
    onYearChange(null);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`gp-sidebar ${isOpen ? "open" : ""}`}>
        {/* Brand */}
        <div className="gp-sidebar-brand">
          <div className="gp-sidebar-logo">GP</div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight leading-none">
              GEOPULSE
            </h1>
            <p className="text-[10px] font-medium text-teal-400 tracking-wider uppercase mt-0.5">
              Inteligencia Criminal
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="gp-sidebar-nav">
          <div className="gp-sidebar-section">
            <div className="gp-sidebar-section-title">Navegación</div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`gp-sidebar-item w-full ${
                    activeView === item.id ? "active" : ""
                  }`}
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filters Section */}
          <div className="gp-sidebar-section">
            <div className="gp-sidebar-section-title flex items-center justify-between pr-2">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3 h-3" />
                Filtros
              </span>
              {(selectedRegion || selectedYear) && (
                <button
                  onClick={handleClearFilters}
                  className="text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
                  title="Limpiar filtros"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Region Filter */}
            <div className="gp-filter-group px-2">
              <label className="gp-filter-label">
                <Globe className="w-3 h-3" />
                Región
              </label>
              <select
                className="gp-select"
                value={selectedRegion?.code || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    onRegionChange(null);
                  } else {
                    const reg = regions.find((r) => r.code === val);
                    if (reg) onRegionChange(reg);
                  }
                }}
              >
                <option value="">Nacional (Todas)</option>
                {regions.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="gp-filter-group px-2">
              <label className="gp-filter-label">
                <Calendar className="w-3 h-3" />
                Período
              </label>
              <select
                className="gp-select"
                value={selectedYear || ""}
                onChange={(e) =>
                  onYearChange(e.target.value ? parseInt(e.target.value) : null)
                }
              >
                <option value="">Todos los años</option>
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(selectedRegion || selectedYear) && (
            <div className="px-2 mt-2">
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3">
                <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-2">
                  Filtros activos
                </div>
                {selectedRegion && (
                  <div className="flex items-center justify-between text-xs text-teal-200 mb-1">
                    <span className="text-teal-400/70">Región:</span>
                    <span className="font-semibold">{selectedRegion.name}</span>
                  </div>
                )}
                {selectedYear && (
                  <div className="flex items-center justify-between text-xs text-teal-200">
                    <span className="text-teal-400/70">Año:</span>
                    <span className="font-semibold">{selectedYear}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="text-[9px] text-slate-500 text-center leading-relaxed">
            <span className="block">GeoPulse v2.0 — Inteligencia Criminal</span>
            <span className="block mt-0.5">
              Fuente: INEI — Plan de Acción Seg. Ciudadana
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
