"use client";
import {
  X,
  LayoutDashboard,
  GitCompareArrows,
  Activity,
  FlaskConical,
  Download,
} from "lucide-react";
import type {
  DashboardFilters,
  Indicator,
  Region,
  ViewMode,
} from "@/lib/types";
export const VIEW_TITLES: Record<ViewMode, string> = {
  general: "Explorar indicadores",
  comparative: "Comparar regiones",
  intelligence: "Variaciones anuales",
  prediction: "Clasificación experimental",
  reports: "Exportar datos",
};
const icons = {
  general: LayoutDashboard,
  comparative: GitCompareArrows,
  intelligence: Activity,
  prediction: FlaskConical,
  reports: Download,
};
interface Props {
  indicators: Indicator[];
  regions: Region[];
  filters: DashboardFilters;
  onChange: (patch: Partial<DashboardFilters>) => void;
  isOpen: boolean;
  onClose: () => void;
}
export default function Sidebar({
  indicators,
  regions,
  filters,
  onChange,
  isOpen,
  onClose,
}: Props) {
  const current = indicators.find((item) => item.code === filters.indicator)!;
  return (
    <>
      {isOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Cerrar filtros"
          onClick={onClose}
        />
      )}
      <aside
        className={`gp-sidebar ${isOpen ? "open" : ""}`}
        aria-label="Navegación y filtros"
      >
        <div className="gp-sidebar-brand">
          <div className="gp-sidebar-logo">GP</div>
          <div>
            <p className="font-bold tracking-widest">GEOPULSE</p>
            <p className="text-xs text-teal-300">
              Datos para entender el territorio
            </p>
          </div>
          <button
            className="lg:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        <div className="gp-sidebar-nav">
          <nav className="gp-sidebar-section">
            {(Object.keys(VIEW_TITLES) as ViewMode[]).map((view) => {
              const Icon = icons[view];
              return (
                <button
                  key={view}
                  className={`gp-sidebar-item w-full ${filters.view === view ? "active" : ""}`}
                  aria-current={filters.view === view ? "page" : undefined}
                  onClick={() => {
                    onChange({ view });
                    onClose();
                  }}
                >
                  <Icon size={17} />
                  {VIEW_TITLES[view]}
                </button>
              );
            })}
          </nav>
          <div className="gp-filter-group">
            <label className="gp-filter-label" htmlFor="indicator">
              Indicador
            </label>
            <select
              className="gp-select"
              id="indicator"
              value={filters.indicator}
              onChange={(e) => {
                const item = indicators.find(
                  (i) => i.code === Number(e.target.value),
                )!;
                onChange({
                  indicator: item.code,
                  year: item.years.includes(filters.year!)
                    ? filters.year
                    : item.years[0],
                });
              }}
            >
              {indicators.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} · {item.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-2">
              {current.measure} · {current.unit}
            </p>
          </div>
          <div className="gp-filter-group">
            <label className="gp-filter-label" htmlFor="year">
              Año observado
            </label>
            <select
              id="year"
              className="gp-select"
              value={filters.year ?? ""}
              onChange={(e) => onChange({ year: Number(e.target.value) })}
            >
              {current.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="gp-filter-group">
            <label className="gp-filter-label" htmlFor="region">
              Región
            </label>
            <select
              id="region"
              className="gp-select"
              value={filters.region ?? ""}
              onChange={(e) =>
                onChange({
                  region: e.target.value || null,
                  compareRegion:
                    e.target.value === filters.compareRegion
                      ? null
                      : filters.compareRegion,
                })
              }
            >
              <option value="">Perú · dato nacional</option>
              {regions.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          {filters.view === "comparative" && (
            <div className="gp-filter-group">
              <label className="gp-filter-label" htmlFor="compare-region">
                Comparar con
              </label>
              <select
                className="gp-select"
                id="compare-region"
                value={filters.compareRegion ?? ""}
                onChange={(e) =>
                  onChange({ compareRegion: e.target.value || null })
                }
              >
                <option value="">Selecciona otra región</option>
                {regions
                  .filter((r) => r.code !== filters.region)
                  .map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <button
            className="gp-sidebar-item w-full"
            onClick={() => {
              const defaultIndicator =
                indicators.find((i) => i.code === 30) ?? indicators[0];
              onChange({
                indicator: defaultIndicator.code,
                year: defaultIndicator.years[0],
                region: null,
                compareRegion: null,
                view: "general",
              });
            }}
          >
            Restablecer filtros
          </button>
          <div className="mt-8 border-t border-slate-700 pt-4 text-xs leading-relaxed text-slate-400">
            Valores preliminares de la fuente. La cobertura y los años
            disponibles cambian según el indicador.
          </div>
        </div>
      </aside>
    </>
  );
}
