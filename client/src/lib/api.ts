import { API_BASE_URL } from "./constants";
import type {
  Indicator,
  Region,
  DashboardSummary,
  TrendPoint,
  MapDataPoint,
  TopRegion,
  RegionTrendSeries,
  Anomaly,
  PredictionItem,
  DashboardFilters,
} from "./types";

export function query(
  params: Record<string, string | number | null | undefined>,
): string {
  const result = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "")
      result.set(key, String(value));
  });
  return result.size ? `?${result}` : "";
}
export async function fetchJson<T>(
  endpoint: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      typeof body?.detail === "string"
        ? body.detail
        : `No se pudo completar la consulta (${response.status}).`,
    );
  }
  return response.json();
}
const prefix = "/api/v1/dashboard";
export function endpoint(
  path: string,
  params: Record<string, string | number | null | undefined> = {},
) {
  return `${prefix}/${path}${query(params)}`;
}
export function exportUrl(filters: DashboardFilters): string {
  return `${API_BASE_URL}${endpoint("export", { indicator: filters.indicator, year: filters.year, region: filters.region, compare_region: filters.view === "comparative" ? filters.compareRegion : null })}`;
}
export const api = {
  getIndicators: () => fetchJson<Indicator[]>(endpoint("indicators")),
  getAllRegions: () => fetchJson<Region[]>(endpoint("regions")),
  getSummary: (region?: string | null, year?: number | null, indicator = 30) =>
    fetchJson<DashboardSummary>(
      endpoint("summary", { region, year, indicator }),
    ),
  getMapData: (year?: number | null, indicator = 30) =>
    fetchJson<MapDataPoint[]>(endpoint("map-data", { year, indicator })),
  getTrend: (region?: string | null, indicator = 30) =>
    fetchJson<TrendPoint[]>(endpoint("trend", { region, indicator })),
  getTopRegions: (year?: number | null, limit = 10, indicator = 30) =>
    fetchJson<TopRegion[]>(endpoint("top-regions", { year, limit, indicator })),
  getRegionTrends: (limit = 5, indicator = 30) =>
    fetchJson<RegionTrendSeries[]>(endpoint("trends", { limit, indicator })),
  getAnomalies: (year?: number | null, indicator = 30) =>
    fetchJson<Anomaly[]>(endpoint("anomalies", { year, indicator })),
  getPredictions: (region?: string | null, indicator = 30) =>
    fetchJson<PredictionItem[]>(endpoint("predictions", { region, indicator })),
};
