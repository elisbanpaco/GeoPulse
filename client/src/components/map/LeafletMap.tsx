"use client";
import { useEffect, useState, useCallback, type ComponentProps } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
type MapGeometry = ComponentProps<typeof GeoJSON>["data"];
import "leaflet/dist/leaflet.css";
import type { CrimeMapProps } from "./CrimeMap";
import { formatValue } from "@/lib/filters";
import { geoJSON } from "leaflet";

function FitMap({ geometry }: { geometry: MapGeometry }) {
  const map = useMap();
  const fit = useCallback(() => {
    map.invalidateSize();
    map.fitBounds(geoJSON(geometry).getBounds(), {
      padding: [18, 18],
      animate: false,
    });
  }, [map, geometry]);
  useEffect(() => {
    fit();
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [fit, map]);
  return (
    <button
      className="gx-map-reset"
      onClick={(event) => {
        event.stopPropagation();
        fit();
      }}
    >
      Ver Perú completo
    </button>
  );
}

export default function LeafletMap({
  data,
  unit,
  selectedRegionCode,
  onRegionSelect,
}: CrimeMapProps) {
  const [geometry, setGeometry] = useState<MapGeometry | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/peru_simplified.json", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Geometría no disponible");
        return res.json() as Promise<MapGeometry>;
      })
      .then((geo) => {
        if (!controller.signal.aborted) {
          setGeometry(geo);
          setError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [attempt]);
  if (error)
    return (
      <div className="gp-message" role="alert">
        No se pudo cargar la geometría.{" "}
        <button
          className="gp-action"
          onClick={() => {
            setError(false);
            setAttempt((n) => n + 1);
          }}
        >
          Reintentar
        </button>
      </div>
    );
  if (!geometry)
    return (
      <p className="gp-message" role="status">
        Cargando geometría…
      </p>
    );
  const entries = Object.fromEntries(data.map((row) => [row.COD_DPTO, row]));
  const values = data
    .filter((row) => row.COD_DPTO !== "1501" && row.COD_DPTO !== "1599")
    .flatMap((row) => (row.value === null ? [] : [row.value]));
  const max = Math.max(0, ...values);
  const min = values.length ? Math.min(...values) : 0;
  const fill = (value: number | null | undefined) =>
    value == null
      ? "#cbd5e1"
      : ["#ccfbf1", "#5eead4", "#14b8a6", "#0f766e", "#134e4a"][
          max === min
            ? 0
            : Math.min(4, Math.floor(((value - min) / (max - min)) * 4))
        ];
  return (
    <>
      <div
        className="gx-map-canvas"
        role="region"
        aria-label={`Mapa de valores regionales en ${unit}. Usa también el selector de región para navegar con teclado.`}
      >
        <MapContainer
          center={[-9.5, -75]}
          zoom={5}
          minZoom={2}
          zoomSnap={0.1}
          maxZoom={8}
          style={{ height: "100%", width: "100%" }}
          attributionControl={false}
        >
          <FitMap geometry={geometry} />
          <GeoJSON
            key={`${JSON.stringify(data)}-${selectedRegionCode}`}
            data={geometry}
            style={(feature) => {
              const code = String(feature?.properties?.COD_DPTO);
              return {
                fillColor: fill(entries[code]?.value),
                fillOpacity: 0.9,
                color: code === selectedRegionCode ? "#2563eb" : "#ffffff",
                weight: code === selectedRegionCode ? 3 : 1,
              };
            }}
            onEachFeature={(feature, layer) => {
              const code = String(feature.properties?.COD_DPTO);
              const row = entries[code];
              const tip = document.createElement("div");
              tip.textContent = `${feature.properties?.NOM_DPTO}: ${code === "15" ? "Lima Metropolitana y Lima Provincias: consulta el selector" : formatValue(row?.value, unit)}`;
              layer.bindTooltip(tip, { sticky: true });
              if (code !== "15") layer.on("click", () => onRegionSelect(code));
            }}
          />
        </MapContainer>
      </div>
      <div className="border-t border-slate-200 p-3 text-xs text-slate-600">
        <div className="mb-2 flex items-center gap-3">
          <span>{formatValue(min)}</span>
          <span className="h-2 flex-1 rounded bg-gradient-to-r from-teal-100 via-teal-400 to-teal-900" />
          <span>{formatValue(max, unit)}</span>
        </div>
        <p>
          Escala del año seleccionado · Gris: sin dato o geometría no
          comparable. Lima Metropolitana y Lima Provincias están disponibles por
          separado en el selector.
        </p>
      </div>
    </>
  );
}
