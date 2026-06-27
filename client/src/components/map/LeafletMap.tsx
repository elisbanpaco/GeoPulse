"use client";
// ============================================
// GeoPulse — LeafletMap (Choropleth)
// Client-only component for rendering the
// interactive crime heatmap of Peru.
// ============================================

import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { api } from "@/lib/api";
import { MAP_CONFIG } from "@/lib/constants";
import { formatFullNumber, getHeatmapColor } from "@/lib/utils";
import type { Region, MapDataPoint } from "@/lib/types";

// --- Props ---

interface LeafletMapProps {
  onRegionSelect: (region: Region | null) => void;
  selectedYear?: number | null;
  selectedRegionCode?: string | null;
}

// --- Component ---

export default function LeafletMap({
  onRegionSelect,
  selectedYear,
  selectedRegionCode,
}: LeafletMapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);
  const [crimeData, setCrimeData] = useState<
    Record<string, { total: number; name: string }>
  >({});
  const [maxCrime, setMaxCrime] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  // Uses Promise.all to fetch GeoJSON geometry and crime data in parallel.
  // We deliberately avoid useApi here because we need to coordinate two
  // independent requests and merge the results before rendering.

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch("/peru_simplified.json").then((res) => res.json()),
      api.getMapData(selectedYear),
    ])
      .then(([geo, apiData]: [unknown, MapDataPoint[]]) => {
        if (cancelled) return;

        setGeoData(geo);

        if (Array.isArray(apiData)) {
          let maxVal = 0;
          const dict: Record<string, { total: number; name: string }> = {};

          apiData.forEach((item) => {
            const val = Number(item.total_delitos) || 0;
            // Exclude COD_DPTO '00' (national aggregate) to avoid skewing the
            // color scale — we only want per-region values.
            if (item.COD_DPTO !== "00") {
              dict[item.COD_DPTO] = {
                total: val,
                name: item.NOM_DPTO || "Desconocido",
              };
              if (val > maxVal) maxVal = val;
            }
          });

          setCrimeData(dict);
          setMaxCrime(maxVal);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error inicializando mapa:", err);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  // --- Loading state ---

  if (loading || !geoData || Object.keys(crimeData).length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid #e2e8f0",
            borderTopColor: "#0f766e",
            borderRadius: "50%",
            animation: "gp-spin 0.8s linear infinite",
          }}
        />
        <p
          style={{
            color: "#64748b",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          Sincronizando datos geoespaciales...
        </p>
        {/* Inline keyframes for the spinner */}
        <style>{`
          @keyframes gp-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // --- Map Render ---

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.zoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        maxBounds={[MAP_CONFIG.bounds.northWest, MAP_CONFIG.bounds.southEast]}
        maxBoundsViscosity={1.0}
        style={{
          height: "100%",
          width: "100%",
          background: "#ffffff",
          zIndex: 0,
        }}
        zoomControl={true}
        attributionControl={false}
      >
        <GeoJSON
          key={`${selectedYear}-${selectedRegionCode}`}
          data={geoData}
          style={(feature) => {
            const cod = feature?.properties?.COD_DPTO;
            const entry = crimeData[cod];
            const value = entry?.total || 0;

            const isSelected =
              selectedRegionCode && cod === selectedRegionCode;

            return {
              fillColor: getHeatmapColor(value, maxCrime),
              fillOpacity: 0.9,
              color: isSelected ? "#d97706" : "#ffffff",
              weight: isSelected ? 3 : 1.5,
            };
          }}
          onEachFeature={(feature, layer) => {
            const cod = feature.properties?.COD_DPTO;
            const regionName =
              crimeData[cod]?.name ||
              feature.properties?.NOM_DPTO ||
              "Desconocido";
            const totalValue = crimeData[cod]?.total || 0;

            // --- Tooltip ---
            const tooltipContent = `
              <div style="font-family:Inter,sans-serif">
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;font-weight:700;margin-bottom:4px">${regionName}</div>
                <div style="font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-0.02em">${formatFullNumber(totalValue)}</div>
                <div style="font-size:10px;color:#94a3b8;margin-top:2px">incidentes registrados</div>
              </div>
            `;

            layer.bindTooltip(tooltipContent, {
              sticky: true,
              className: "gp-map-tooltip",
              direction: "top",
              offset: [0, -10],
            });

            // --- Interactions ---
            layer.on({
              mouseover: (e) => {
                const l = e.target;
                l.setStyle({
                  weight: 2.5,
                  color: "#0f766e",
                  fillOpacity: 1,
                });
                l.bringToFront();
              },
              mouseout: (e) => {
                const l = e.target;
                const isSelected =
                  selectedRegionCode && cod === selectedRegionCode;
                l.setStyle({
                  weight: isSelected ? 3 : 1.5,
                  color: isSelected ? "#d97706" : "#ffffff",
                  fillOpacity: 0.9,
                });
              },
              click: () => {
                onRegionSelect({
                  code: cod,
                  name: regionName,
                  total: totalValue,
                });
              },
            });
          }}
        />
      </MapContainer>

      {/* --- Legend Overlay --- */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(8px)",
          borderRadius: "8px",
          padding: "10px 14px",
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
          border: "1px solid #e2e8f0",
          minWidth: "140px",
        }}
      >
        {/* Legend title */}
        <div
          style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "#64748b",
            marginBottom: "8px",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Intensidad
        </div>

        {/* Color scale bar */}
        <div
          style={{
            display: "flex",
            borderRadius: "3px",
            overflow: "hidden",
            height: "10px",
            marginBottom: "6px",
          }}
        >
          <div style={{ flex: 1, background: "#ccfbf1" }} />
          <div style={{ flex: 1, background: "#5eead4" }} />
          <div style={{ flex: 1, background: "#14b8a6" }} />
          <div style={{ flex: 1, background: "#0f766e" }} />
          <div style={{ flex: 1, background: "#134e4a" }} />
        </div>

        {/* Labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "8px",
            fontWeight: 600,
            color: "#94a3b8",
            letterSpacing: "0.02em",
          }}
        >
          <span>Bajo</span>
          <span>Medio</span>
          <span>Alto</span>
          <span>Crítico</span>
        </div>
      </div>
    </div>
  );
}
