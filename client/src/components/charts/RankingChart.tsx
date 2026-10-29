"use client";
import type { MapDataPoint } from "@/lib/types";
import { formatValue } from "@/lib/filters";
export default function RankingChart({
  data,
  unit,
  onSelect,
}: {
  data: MapDataPoint[];
  unit: string;
  onSelect: (code: string) => void;
}) {
  const sorted = data
    .filter((r): r is MapDataPoint & { value: number } => r.value !== null)
    .sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...sorted.map((r) => r.value));
  return (
    <div className="space-y-3">
      {sorted.length === 0 && (
        <p className="gp-message">Sin datos regionales para este año.</p>
      )}
      {sorted.map((r) => (
        <button
          className="block w-full rounded-md p-1 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-teal-600"
          key={r.COD_DPTO}
          onClick={() => onSelect(r.COD_DPTO)}
        >
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span>{r.NOM_DPTO}</span>
            <strong>{formatValue(r.value, unit)}</strong>
          </div>
          <div className="h-2 rounded bg-slate-100">
            <div
              className="h-2 rounded bg-teal-600"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
