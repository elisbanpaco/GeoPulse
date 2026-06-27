"use client";

import dynamic from 'next/dynamic';

// Next.js (App Router) requiere que Leaflet se cargue dinámicamente solo en el cliente,
// ya que Leaflet intenta acceder al objeto 'window' el cual no existe en el servidor (SSR).
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-[#0a0a0a] rounded-lg">
      <p className="text-gray-400 font-mono animate-pulse">Iniciando sistemas geoespaciales...</p>
    </div>
  )
});

interface MapChartProps {
  onRegionSelect: (region: { code: string; name: string; total: number } | null) => void;
  selectedYear?: number | null;
}

export default function MapChart({ onRegionSelect, selectedYear }: MapChartProps) {
  return (
    <div className="w-100 h-150 relative">
      {/* Añadimos estilos globales para el tooltip de Leaflet aquí temporalmente */}
      <style>{`
        .custom-tooltip {
          background-color: #111827 !important;
          color: #f3f4f6 !important;
          border: 1px solid #374151 !important;
          border-radius: 6px !important;
          font-family: inherit !important;
          padding: 8px 12px !important;
          font-weight: 600 !important;
        }
        .leaflet-tooltip-left::before, .leaflet-tooltip-right::before, .leaflet-tooltip-top::before, .leaflet-tooltip-bottom::before {
          border-color: transparent !important; /* Ocultar la flechita del tooltip para un look mas limpio */
        }
      `}</style>
      <LeafletMap onRegionSelect={onRegionSelect} selectedYear={selectedYear} />
    </div>
  );
}
