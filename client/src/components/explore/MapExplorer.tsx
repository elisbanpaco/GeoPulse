"use client";
import { useState } from "react";
import { ChevronDown, Map } from "lucide-react";
import CrimeMap from "@/components/map/CrimeMap";
import { endpoint } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import type { MapDataPoint } from "@/lib/types";
export default function MapExplorer({
  indicator,
  year,
  region,
  unit,
  onSelect,
  defaultOpen = false,
}: {
  indicator: number;
  year: number;
  region: string | null;
  unit: string;
  onSelect: (code: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const map = useApi<MapDataPoint[]>(
    open ? endpoint("map-data", { indicator, year }) : null,
  );
  return (
    <details
      className="gx-disclosure"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span>
          <Map size={21} aria-hidden="true" />
          <span>
            Explorar otras regiones
            <span className="gx-disclosure-hint">
              Un mapa para seguir tu consulta
            </span>
          </span>
        </span>
        <ChevronDown size={19} aria-hidden="true" />
      </summary>
      {open && (
        <div className="gx-map-body">
          <p className="gx-muted gx-map-instruction">
            Toca una región para consultarla. También puedes usar el selector de
            región.
          </p>
          {map.error ? (
            <div className="gx-empty" role="alert">
              <p>No pudimos cargar los datos del mapa.</p>
              <button className="gx-button" onClick={map.refetch}>
                Reintentar
              </button>
            </div>
          ) : map.data ? (
            <>
              <CrimeMap
                data={map.data}
                unit={unit}
                selectedRegionCode={region}
                onRegionSelect={onSelect}
              />
              {!map.data.some((row) => row.value !== null) && (
                <p className="gx-empty">
                  No hay datos regionales para este tema y año.
                </p>
              )}
            </>
          ) : (
            <p className="gx-empty" role="status">
              Cargando mapa…
            </p>
          )}
        </div>
      )}
    </details>
  );
}
