import type { DashboardFilters, Indicator, Region, ViewMode } from "./types";
const views: ViewMode[] = [
  "general",
  "comparative",
  "intelligence",
  "prediction",
  "reports",
];
export function resolveFilters(
  params: URLSearchParams,
  indicators: Indicator[],
  regions: Region[],
): DashboardFilters {
  const chosen =
    indicators.find((item) => item.code === Number(params.get("indicator"))) ??
    indicators.find((item) => item.code === 30) ??
    indicators[0];
  const year = Number(params.get("year"));
  const region = params.get("region");
  const compare = params.get("compare_region");
  const valid = (code: string | null) =>
    regions.some((item) => item.code === code);
  const primary = valid(region) ? region : null;
  return {
    national:
      !primary &&
      (params.get("scope") === "national" ||
        region === "00" ||
        (!region && params.has("view"))),
    indicator: chosen.code,
    year: chosen.years.includes(year) ? year : chosen.years[0],
    region: primary,
    compareRegion: valid(compare) && compare !== primary ? compare : null,
    view: views.includes(params.get("view") as ViewMode)
      ? (params.get("view") as ViewMode)
      : "general",
  };
}
export function filterQuery(filters: DashboardFilters) {
  const params = new URLSearchParams({
    indicator: String(filters.indicator),
    year: String(filters.year),
    view: filters.view,
  });
  if (filters.national) params.set("scope", "national");
  if (filters.region) params.set("region", filters.region);
  if (filters.compareRegion)
    params.set("compare_region", filters.compareRegion);
  return params;
}
export function formatValue(
  value: number | null | undefined,
  unit?: string,
): string {
  if (value === null || value === undefined) return "Sin dato";
  return `${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
}
