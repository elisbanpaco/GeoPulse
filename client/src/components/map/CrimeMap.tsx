"use client";
// ============================================
// GeoPulse — CrimeMap (Dynamic Wrapper)
// Dynamically imports LeafletMap with SSR
// disabled to prevent Leaflet window errors
// in Next.js server-side rendering.
// ============================================

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { Region } from "@/lib/types";

// --- Dynamic Import ---
// Leaflet accesses the `window` object on load, which doesn't exist during
// SSR. We use next/dynamic with { ssr: false } to ensure it only loads on
// the client.

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div
      className="gp-skeleton"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "500px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
        borderRadius: "12px",
      }}
    >
      <MapPin
        size={32}
        strokeWidth={1.5}
        style={{ color: "#94a3b8", opacity: 0.6 }}
      />
      <p
        style={{
          color: "#94a3b8",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.02em",
          margin: 0,
        }}
      >
        Inicializando mapa geoespacial...
      </p>
    </div>
  ),
});

// --- Props ---

interface CrimeMapProps {
  onRegionSelect: (region: Region | null) => void;
  selectedYear?: number | null;
  selectedRegionCode?: string | null;
}

// --- Component ---

export default function CrimeMap({
  onRegionSelect,
  selectedYear,
  selectedRegionCode,
}: CrimeMapProps) {
  return (
    <LeafletMap
      onRegionSelect={onRegionSelect}
      selectedYear={selectedYear}
      selectedRegionCode={selectedRegionCode}
    />
  );
}
