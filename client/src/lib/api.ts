// ============================================
// GeoPulse — Centralized API Client
// ============================================

import { API_BASE_URL } from "./constants";
import type {
  DashboardSummary,
  TrendPoint,
  MapDataPoint,
  TopRegion,
  DistributionItem,
  RegionTrendSeries,
  Anomaly,
} from "./types";

/**
 * Base fetcher with error handling.
 */
async function fetcher<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Build query string from params object, filtering null/undefined.
 */
function buildQuery(params: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

// --- API Endpoints ---

export const api = {
  /** Get dashboard summary (total incidents, YoY variation) */
  getSummary(region?: string | null, year?: number | null): Promise<DashboardSummary> {
    const qs = buildQuery({ region: region || undefined, year: year || undefined });
    return fetcher(`/api/v1/dashboard/summary${qs}`);
  },

  /** Get map data (incidents per region) */
  getMapData(year?: number | null): Promise<MapDataPoint[]> {
    const qs = buildQuery({ year: year || undefined });
    return fetcher(`/api/v1/dashboard/map-data${qs}`);
  },

  /** Get trend data (annual evolution) */
  getTrend(region?: string | null): Promise<TrendPoint[]> {
    const qs = buildQuery({ region: region || undefined });
    return fetcher(`/api/v1/dashboard/trend${qs}`);
  },

  /** Get top regions by crime volume */
  getTopRegions(year?: number | null, limit = 10): Promise<TopRegion[]> {
    const qs = buildQuery({ year: year || undefined, limit });
    return fetcher(`/api/v1/dashboard/top-regions${qs}`);
  },

  /** Get multi-region trend data (top N regions historically) */
  getRegionTrends(limit = 5): Promise<RegionTrendSeries[]> {
    return fetcher(`/api/v1/dashboard/trends?limit=${limit}`);
  },

  /** Get distribution by indicator type */
  getDistribution(region?: string | null, year?: number | null): Promise<DistributionItem[]> {
    const qs = buildQuery({ region: region || undefined, year: year || undefined });
    return fetcher(`/api/v1/dashboard/distribution${qs}`);
  },

  /** Get detected anomalies across regions */
  getAnomalies(year?: number | null): Promise<Anomaly[]> {
    const qs = buildQuery({ year: year || undefined });
    return fetcher(`/api/v1/dashboard/anomalies${qs}`);
  },

  /** Get all regions list */
  getAllRegions(): Promise<TopRegion[]> {
    return fetcher("/api/v1/dashboard/top-regions?limit=30");
  },
};
