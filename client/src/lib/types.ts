export interface Indicator {
  code: number;
  name: string;
  display_name: string;
  category: string;
  result_label: string;
  unit: string;
  measure: string;
  value_column: "VALORES";
  status: "preliminar";
  sources: string[];
  scopes: number[];
  years: number[];
  coverage_note: string;
  source_file: string;
}
export interface Region {
  code: string;
  name: string;
}
export interface DashboardSummary {
  indicator: Indicator;
  year: number;
  region: string | null;
  value: number | null;
  prev_value: number | null;
  yoy_variation_percent: number | null;
  total_registros: number;
  unit: string;
  missing_reason: string | null;
}
export interface TrendPoint {
  name: string;
  year: number;
  value: number | null;
}
export interface MapDataPoint {
  COD_DPTO: string;
  NOM_DPTO: string;
  year: number;
  value: number | null;
  unit: string;
  source: string;
}
export interface TopRegion extends MapDataPoint {
  value: number;
}
export interface RegionTrendSeries {
  COD_DPTO: string;
  NOM_DPTO: string;
  data: { year: number; value: number | null }[];
}
export interface Anomaly {
  region: string;
  code: string;
  type: "spike" | "drop";
  year: number;
  value: number;
  change_percent: number;
  description: string;
}
export interface PredictionItem {
  COD_DPTO: string;
  NOM_DPTO: string;
  AMBITO: number;
  INDICADOR: number;
  NOM_INDICADOR: string;
  ANIO: number;
  VALORES: number | null;
  VALOR_lag_1: number | null;
  VALOR_lag_2: number | null;
  Crecimiento_Anual_Pct: number | null;
  PRED_TENDENCIA: string;
  PRED_PROB: number | null;
}
export type ViewMode =
  "general" | "comparative" | "intelligence" | "reports" | "prediction";
export interface DashboardFilters {
  national: boolean;
  indicator: number;
  year: number | null;
  region: string | null;
  compareRegion: string | null;
  view: ViewMode;
}
export type ApiStatus = "idle" | "loading" | "success" | "error";
export type ThemeMode = "light" | "dark";
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
export interface DistributionItem {
  name: string;
  value: number;
  percentage: number;
}
