import type { Anomaly } from "@/lib/types";
import { formatValue } from "@/lib/filters";
export default function AlertPanel({
  data,
  unit,
}: {
  data: Anomaly[];
  unit: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Cambios absolutos superiores al 15% respecto al año anterior. Es una
        regla descriptiva; no representa una alerta de peligrosidad.
      </p>
      {data.length === 0 && (
        <p className="gp-message">
          No hay variaciones que superen el umbral, o faltan observaciones
          consecutivas comparables.
        </p>
      )}
      {data.map((row) => (
        <article
          key={row.code}
          className="rounded-lg border border-slate-200 p-4"
        >
          <div className="flex justify-between gap-3">
            <h3 className="font-semibold">{row.region}</h3>
            <strong className="text-teal-700">
              {row.change_percent > 0 ? "+" : ""}
              {formatValue(row.change_percent)}%
            </strong>
          </div>
          <p className="text-sm text-slate-500">
            {formatValue(row.value, unit)} · {row.year}
          </p>
          <p className="mt-2 text-sm">{row.description}</p>
        </article>
      ))}
    </div>
  );
}
