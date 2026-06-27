// ============================================
// GeoPulse — Central Type Definitions
// ============================================

// --- API Response Types ---

export interface Region {
  code: string;
  name: string;
  total: number;
}

export interface DashboardSummary {
  total_delitos: number;
  yoy_variation_percent: number;
  total_registros: number;
  prev_total?: number;
}

export interface TrendPoint {
  name: string;
  value: number;
}

export interface MapDataPoint {
  COD_DPTO: string;
  NOM_DPTO: string;
  total_delitos: number;
}

export interface TopRegion {
  COD_DPTO: string;
  NOM_DPTO: string;
  total_delitos: number;
}

export interface DistributionItem {
  name: string;
  value: number;
  percentage: number;
}

export interface RegionTrendSeries {
  COD_DPTO: string;
  NOM_DPTO: string;
  data: { year: number; value: number }[];
}

export interface Anomaly {
  region: string;
  code: string;
  type: "spike" | "drop" | "trend_change";
  severity: "critical" | "high" | "medium";
  value: number;
  change_percent: number;
  year: number;
  description: string;
}

export interface RegionalComparison {
  region_a: { code: string; name: string; total: number; trend: TrendPoint[] };
  region_b: { code: string; name: string; total: number; trend: TrendPoint[] };
}

// --- Dashboard State ---

export interface DashboardFilters {
  region: Region | null;
  year: number | null;
  indicator: number | null;
  compareRegion: Region | null;
}

export type ViewMode = "general" | "comparative" | "intelligence" | "reports";

export type ThemeMode = "light" | "dark";

// --- Component Props ---

export interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  variation?: number | null;
  variationLabel?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  severity?: "default" | "success" | "warning" | "danger";
  loading?: boolean;
  sparklineData?: number[];
  onClick?: () => void;
}

export interface IntelligenceCardProps {
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "info";
  value?: string;
  region?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// --- Utility Types ---

export type ApiStatus = "idle" | "loading" | "success" | "error";

export interface ApiState<T> {
  data: T | null;
  status: ApiStatus;
  error: string | null;
}
