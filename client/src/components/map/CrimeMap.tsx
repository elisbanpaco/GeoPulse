"use client";
import dynamic from "next/dynamic";
import type { MapDataPoint } from "@/lib/types";
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <p className="gp-message" role="status">
      Cargando mapa…
    </p>
  ),
});
export interface CrimeMapProps {
  data: MapDataPoint[];
  unit: string;
  selectedRegionCode: string | null;
  onRegionSelect: (code: string) => void;
}
export default function CrimeMap(props: CrimeMapProps) {
  return <LeafletMap {...props} />;
}
