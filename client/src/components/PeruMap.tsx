"use client";

import React, { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";

const GEO_URL = "/peru_departamento_.json";

interface MapDatum {
  COD_DPTO: string;
  total_delitos: number;
}

interface PeruMapProps {
  mapData: MapDatum[];
  selectedRegion: string | null;
  onSelectRegion: (code: string) => void;
}

export default function PeruMap({
  mapData,
  selectedRegion,
  onSelectRegion,
}: PeruMapProps) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const dataMap = useMemo(() => {
    const m = new Map<string, number>();
    mapData.forEach((d) => m.set(d.COD_DPTO, d.total_delitos));
    return m;
  }, [mapData]);

  const maxVal = useMemo(
    () => (mapData.length ? Math.max(...mapData.map((d) => d.total_delitos), 1) : 1),
    [mapData]
  );

  const colorScale = useMemo(
    () =>
      scaleSequential()
        .domain([0, maxVal])
        .interpolator(interpolateBlues),
    [maxVal]
  );

  /* Custom dark-toned choropleth: map base → midnight blue scale */
  const getColor = (val: number): string => {
    if (!val) return "#0f1e33";
    const ratio = val / maxVal;
    // Interpolate from deep navy (#0f1e33) → electric blue (#1d4ed8) → crimson (#ef4444) for top
    if (ratio < 0.4) {
      // navy → steel blue
      const r = Math.round(15  + (29  - 15)  * (ratio / 0.4));
      const g = Math.round(30  + (78  - 30)  * (ratio / 0.4));
      const b = Math.round(51  + (216 - 51)  * (ratio / 0.4));
      return `rgb(${r},${g},${b})`;
    } else if (ratio < 0.75) {
      const t = (ratio - 0.4) / 0.35;
      const r = Math.round(29  + (234 - 29)  * t);
      const g = Math.round(78  + (88  - 78)  * t);
      const b = Math.round(216 + (12  - 216) * t);
      return `rgb(${r},${g},${b})`;
    } else {
      const t = (ratio - 0.75) / 0.25;
      const r = Math.round(234 + (239 - 234) * t);
      const g = Math.round(88  + (68  - 88)  * t);
      const b = Math.round(12  + (68  - 12)  * t);
      return `rgb(${r},${g},${b})`;
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 2000, center: [-75, -9] }}
        className="w-full flex-1"
        style={{ background: "transparent" }}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={8} center={[-75, -9]}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const code = String(geo.properties.COD_DPTO ?? "");
                const name = geo.properties.NOM_DPTO || "Desconocido";
                const val   = dataMap.get(code) ?? 0;
                const isSelected = selectedRegion === code;
                const isOther    = selectedRegion && !isSelected;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => onSelectRegion(code)}
                    onMouseEnter={(e) => {
                      setTooltip({
                        text: `${name} — ${val.toLocaleString("es-PE")} delitos`,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    onMouseMove={(e) => {
                      setTooltip({
                        text: `${name} — ${val.toLocaleString("es-PE")} delitos`,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    fill={isSelected ? "#f59e0b" : getColor(val)}
                    stroke="#07090f"
                    strokeWidth={0.6}
                    style={{
                      default: {
                        outline: "none",
                        opacity: isOther ? 0.3 : 1,
                        transition: "all 0.25s ease",
                      },
                      hover: {
                        fill: "#f59e0b",
                        outline: "none",
                        cursor: "pointer",
                        opacity: 1,
                        filter: "brightness(1.15)",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <div
          className="fixed pointer-events-none z-50 bg-[#0d1117] border border-[#1e2a3a] text-[#e2eaf6] text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            transform: "translate(0, 0)",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
