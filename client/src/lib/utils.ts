// ============================================
// GeoPulse — Utility Functions
// ============================================

/**
 * Formats a large number for display.
 * 1500000 → "1.5M"  |  45000 → "45K"  |  800 → "800"
 */
export function formatNumber(value: number, decimals = 1): string {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`;
  return Math.round(value).toLocaleString("es-PE");
}

/**
 * Formats a number with full locale separators.
 * 65464 → "65,464"
 */
export function formatFullNumber(value: number): string {
  return Math.round(value).toLocaleString("es-PE");
}

/**
 * Formats a percentage with sign.
 * 8.7 → "+8.7%"  |  -3.2 → "-3.2%"
 */
export function formatVariation(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Returns the appropriate CSS class/color for a variation value.
 */
export function getVariationColor(value: number): {
  text: string;
  bg: string;
  border: string;
  trend: "up" | "down" | "stable";
} {
  if (value > 5) {
    return {
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      trend: "up",
    };
  }
  if (value > 0) {
    return {
      text: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      trend: "up",
    };
  }
  if (value < -5) {
    return {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      trend: "down",
    };
  }
  if (value < 0) {
    return {
      text: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-200",
      trend: "down",
    };
  }
  return {
    text: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    trend: "stable",
  };
}

/**
 * Returns a heatmap color for a value within a range.
 * Uses a teal-based gradient for institutional look.
 */
export function getHeatmapColor(value: number, max: number): string {
  if (!value || !max) return "#f0fdfa";

  const ratio = Math.min(value / max, 1);
  const intensity = Math.pow(ratio, 0.45); // non-linear for better visual distribution

  if (intensity > 0.9) return "#134e4a";
  if (intensity > 0.75) return "#115e59";
  if (intensity > 0.6) return "#0f766e";
  if (intensity > 0.45) return "#0d9488";
  if (intensity > 0.3) return "#14b8a6";
  if (intensity > 0.2) return "#2dd4bf";
  if (intensity > 0.1) return "#5eead4";
  if (intensity > 0.05) return "#99f6e4";
  return "#ccfbf1";
}

/**
 * Returns a severity level based on a variation percentage.
 */
export function getSeverityFromVariation(
  variation: number
): "critical" | "high" | "medium" | "info" {
  const abs = Math.abs(variation);
  if (abs > 20) return "critical";
  if (abs > 10) return "high";
  if (abs > 5) return "medium";
  return "info";
}

/**
 * Generates a human-readable time ago string from a Date.
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

/**
 * Calculates simple anomaly detection: returns items where YoY change exceeds threshold.
 */
export function detectAnomalies(
  data: { year: number; value: number }[],
  threshold = 15
): { year: number; value: number; change: number; type: "spike" | "drop" }[] {
  const anomalies: {
    year: number;
    value: number;
    change: number;
    type: "spike" | "drop";
  }[] = [];

  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].value;
    const curr = data[i].value;
    if (prev > 0) {
      const change = ((curr - prev) / prev) * 100;
      if (Math.abs(change) > threshold) {
        anomalies.push({
          year: data[i].year,
          value: curr,
          change,
          type: change > 0 ? "spike" : "drop",
        });
      }
    }
  }

  return anomalies;
}

/**
 * Classnames helper — combines class strings, filtering falsy values.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
