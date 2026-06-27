// ============================================
// GeoPulse — Constants & Configuration
// ============================================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Color System (Design Tokens) ---

export const COLORS = {
  // Primary palette — institutional navy
  primary: {
    900: "#0c1222",
    800: "#0f1a2e",
    700: "#162240",
    600: "#1e3054",
    500: "#2a4270",
    400: "#3d5a8a",
    300: "#5e7eb0",
    200: "#8da4cc",
    100: "#c5d3e8",
    50: "#edf1f7",
  },
  // Accent — teal for positive actions and branding
  accent: {
    700: "#0f766e",
    600: "#0d9488",
    500: "#14b8a6",
    400: "#2dd4bf",
    300: "#5eead4",
    200: "#99f6e4",
    100: "#ccfbf1",
  },
  // Semantic colors
  semantic: {
    danger: "#dc2626",
    dangerLight: "#fef2f2",
    dangerBorder: "#fecaca",
    warning: "#d97706",
    warningLight: "#fffbeb",
    warningBorder: "#fde68a",
    success: "#059669",
    successLight: "#ecfdf5",
    successBorder: "#a7f3d0",
    info: "#2563eb",
    infoLight: "#eff6ff",
    infoBorder: "#bfdbfe",
  },
  // Neutral scale
  neutral: {
    950: "#020617",
    900: "#0f172a",
    800: "#1e293b",
    700: "#334155",
    600: "#475569",
    500: "#64748b",
    400: "#94a3b8",
    300: "#cbd5e1",
    200: "#e2e8f0",
    100: "#f1f5f9",
    50: "#f8fafc",
    0: "#ffffff",
  },
  // Chart palette — harmonious, distinguishable
  chart: [
    "#0f766e", // teal-700
    "#2563eb", // blue-600
    "#7c3aed", // violet-600
    "#db2777", // pink-600
    "#d97706", // amber-600
    "#059669", // emerald-600
    "#dc2626", // red-600
    "#4f46e5", // indigo-600
  ],
  // Heatmap scale for map
  heatmap: {
    0: "#f0fdfa",
    1: "#ccfbf1",
    2: "#99f6e4",
    3: "#5eead4",
    4: "#2dd4bf",
    5: "#14b8a6",
    6: "#0d9488",
    7: "#0f766e",
    8: "#115e59",
    9: "#134e4a",
  },
} as const;

// --- Indicator Mappings ---

export const INDICATOR_NAMES: Record<number, string> = {
  70: "Delitos Patrimoniales",
  4: "Violencia Familiar",
  5: "Accidentes de Tránsito",
  3: "Homicidios",
  6: "Faltas",
  1: "Crimen Organizado",
  2: "Microcomercialización de Drogas",
};

// --- Severity Levels ---

export const SEVERITY_CONFIG = {
  critical: {
    label: "Crítico",
    color: COLORS.semantic.danger,
    bg: COLORS.semantic.dangerLight,
    border: COLORS.semantic.dangerBorder,
    icon: "🔴",
  },
  high: {
    label: "Alto",
    color: COLORS.semantic.warning,
    bg: COLORS.semantic.warningLight,
    border: COLORS.semantic.warningBorder,
    icon: "🟠",
  },
  medium: {
    label: "Moderado",
    color: COLORS.semantic.info,
    bg: COLORS.semantic.infoLight,
    border: COLORS.semantic.infoBorder,
    icon: "🔵",
  },
  info: {
    label: "Informativo",
    color: COLORS.neutral[600],
    bg: COLORS.neutral[50],
    border: COLORS.neutral[200],
    icon: "ℹ️",
  },
} as const;

// --- Available years in the dataset ---
export const AVAILABLE_YEARS = [
  2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
  2014, 2013, 2012, 2011, 2010, 2009,
];

// --- Map Configuration ---
export const MAP_CONFIG = {
  center: [-9.5, -75] as [number, number],
  zoom: 5.4,
  minZoom: 5,
  maxZoom: 8,
  bounds: {
    northWest: [2.0, -84.0] as [number, number],
    southEast: [-20.0, -66.0] as [number, number],
  },
} as const;
