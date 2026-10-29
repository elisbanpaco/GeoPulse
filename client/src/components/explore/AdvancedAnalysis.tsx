import { X } from "lucide-react";
import AlertPanel from "@/components/panels/AlertPanel";
import InsightPanel from "@/components/panels/InsightPanel";
import { endpoint } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import type { Anomaly, DashboardFilters, PredictionItem } from "@/lib/types";
export default function AdvancedAnalysis({
  filters,
  unit,
  onView,
  onClose,
}: {
  filters: DashboardFilters;
  unit: string;
  onView: (view: "intelligence" | "prediction") => void;
  onClose: () => void;
}) {
  const experimental = filters.view === "prediction";
  const path = experimental ? "predictions" : "anomalies";
  const request = useApi<Anomaly[] | PredictionItem[]>(
    endpoint(path, {
      indicator: filters.indicator,
      region: filters.region,
      ...(!experimental ? { year: filters.year } : {}),
    }),
  );
  return (
    <section
      className="gx-section gx-advanced"
      aria-labelledby="advanced-title"
    >
      <div className="gx-section-head">
        <div>
          <p className="gx-eyebrow">Para profundizar</p>
          <h2 id="advanced-title">Análisis avanzado</h2>
        </div>
        <button
          className="gx-icon-button"
          onClick={onClose}
          aria-label="Cerrar análisis avanzado"
        >
          <X size={20} />
        </button>
      </div>
      <div className="gx-tabs" role="group" aria-label="Tipo de análisis">
        <button
          className={!experimental ? "is-active" : ""}
          aria-pressed={!experimental}
          onClick={() => onView("intelligence")}
        >
          Variaciones anuales
        </button>
        <button
          className={experimental ? "is-active" : ""}
          aria-pressed={experimental}
          onClick={() => onView("prediction")}
        >
          Clasificación experimental
        </button>
      </div>
      {request.error ? (
        <div className="gx-empty" role="alert">
          <p>{request.error}</p>
          <button className="gx-button" onClick={request.refetch}>
            Reintentar
          </button>
        </div>
      ) : request.data ? (
        experimental ? (
          <InsightPanel data={request.data as PredictionItem[]} />
        ) : (
          <AlertPanel data={request.data as Anomaly[]} unit={unit} />
        )
      ) : (
        <p className="gx-empty" role="status">
          Cargando análisis…
        </p>
      )}
    </section>
  );
}
