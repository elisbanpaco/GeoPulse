"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Paleta de colores para tema claro (estilo PowerBI)
function getColor(value: number, max: number) {
  if (!value || !max) return "#e2e8f0"; // slate-200
  
  const intensity = Math.pow(Math.min(value / max, 1), 0.5);
  
  if (intensity > 0.8) return "#0f766e"; // teal-700
  if (intensity > 0.6) return "#0d9488"; // teal-600
  if (intensity > 0.4) return "#14b8a6"; // teal-500
  if (intensity > 0.2) return "#5eead4"; // teal-300
  if (intensity > 0.05) return "#99f6e4"; // teal-200
  return "#ccfbf1"; // teal-100
}

interface LeafletMapProps {
  onRegionSelect: (region: { code: string; name: string; total: number } | null) => void;
  selectedYear?: number | null;
}

export default function LeafletMap({ onRegionSelect, selectedYear }: LeafletMapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [crimeData, setCrimeData] = useState<Record<string, number>>({});
  const [maxCrime, setMaxCrime] = useState(0);

  useEffect(() => {
    const qs = selectedYear ? `?year=${selectedYear}` : "";
    // Cargar geometrías y datos en paralelo
    Promise.all([
      fetch('/peru_simplified.json').then(res => res.json()),
      fetch(`http://localhost:8000/api/v1/dashboard/map-data${qs}`).then(res => res.json())
    ]).then(([geo, apiData]) => {
      setGeoData(geo);

      if (Array.isArray(apiData)) {
        let maxVal = 0;
        const dict: Record<string, number> = {};
        
        apiData.forEach((item: any) => {
          const val = Number(item.total_delitos) || 0;
          // Ignoramos el código "00" (Nacional/Desconocido) para no sesgar la escala de colores regional
          if (item.COD_DPTO !== "00") {
            dict[item.COD_DPTO] = val;
            if (val > maxVal) maxVal = val;
          }
        });
        
        setCrimeData(dict);
        setMaxCrime(maxVal);
      }
    }).catch(err => console.error("Error inicializando mapa:", err));
  }, [selectedYear]);

  // TRUCO REACT-LEAFLET: No renderizar hasta tener TANTO la geometría como los datos,
  // de lo contrario GeoJSON no se actualiza (es inmutable por defecto en leaflet)
  if (!geoData || Object.keys(crimeData).length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#ffffff]">
        <p className="text-gray-400 font-mono animate-pulse">Sincronizando con satélites...</p>
      </div>
    );
  }

  return (
    <MapContainer 
      center={[-9.5, -75]} 
      zoom={5.4} 
      minZoom={5}
      maxZoom={8}
      maxBounds={[
        [2.0, -84.0], // Noroeste
        [-20.0, -66.0] // Sureste
      ]}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%", background: "#ffffff", zIndex: 0 }} 
    >
      <GeoJSON 
        data={geoData} 
        style={(feature) => {
          const cod = feature?.properties?.COD_DPTO;
          const totalDelitos = crimeData[cod] || 0;
          
          return {
            color: "#ffffff", // Borde blanco
            weight: 1,
            fillColor: getColor(totalDelitos, maxCrime),
            fillOpacity: 1
          };
        }}
        onEachFeature={(feature, layer) => {
          const cod = feature.properties?.COD_DPTO;
          const regionName = feature.properties?.NOM_DPTO || "Desconocido";
          const totalDelitos = crimeData[cod] || 0;

          // Tooltip táctico
          const tooltipContent = `
            <div class="text-xs bg-white text-slate-800 p-1">
              <div class="text-slate-500 uppercase tracking-wider mb-1 font-bold">${regionName}</div>
              <div class="text-xl font-extrabold text-teal-700">${Math.round(totalDelitos).toLocaleString()} <span class="text-[10px] text-slate-400 font-normal">incidentes</span></div>
            </div>
          `;

          layer.bindTooltip(tooltipContent, {
            sticky: true,
            className: "custom-tooltip"
          });

          // Solo highlight visual (sin mover)
          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({ weight: 3, color: "#0f766e" }); // Borde teal oscuro al hover
              l.bringToFront();
            },
            mouseout: (e) => {
              const l = e.target;
              l.setStyle({ weight: 1, color: "#ffffff" });
            },
            click: () => {
              // Alternar selección
              onRegionSelect({ code: cod, name: regionName, total: totalDelitos });
            }
          });
        }}
      />
    </MapContainer>
  );
}
