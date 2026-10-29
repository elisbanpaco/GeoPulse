import { ArrowDownRight, ArrowUpRight, Minus, Info } from "lucide-react";
import { changeSentence, number, resultLabel } from "@/lib/presentation";
import type { DashboardSummary, Indicator } from "@/lib/types";
export default function ResultSummary({
  data,
  indicator,
  place,
  year,
}: {
  data: DashboardSummary;
  indicator: Indicator;
  place: string;
  year: number;
}) {
  const difference =
    data.value !== null && data.prev_value !== null
      ? data.value - data.prev_value
      : null;
  const Icon =
    difference === null || difference === 0
      ? Minus
      : difference > 0
        ? ArrowUpRight
        : ArrowDownRight;
  return (
    <section
      className="gx-result"
      aria-label="Resultado de la consulta"
      aria-live="polite"
    >
      <div className="gx-result-main">
        <p className="gx-eyebrow">
          {place} · {year}
        </p>
        {data.value === null ? (
          <>
            <h2 className="gx-no-data">No hay datos para esta selección</h2>
            <p className="gx-muted">Puedes consultar otro año o tema.</p>
          </>
        ) : (
          <>
            <p className="gx-result-number">
              {number(data.value)}
              {indicator.unit === "%" && <span>%</span>}
            </p>
            <h2 className="gx-result-unit">
              {indicator.unit === "%"
                ? "Porcentaje publicado"
                : resultLabel(indicator, data.value)}
            </h2>
          </>
        )}
      </div>
      <div className="gx-result-change">
        <span className="gx-change-icon">
          <Icon size={25} aria-hidden="true" />
        </span>
        <div>
          <p className="gx-muted gx-small">Frente a {year - 1}</p>
          <p className="gx-change-sentence">
            {changeSentence(data.value, data.prev_value, year, indicator.unit)}
          </p>
          {indicator.unit !== "%" && data.yoy_variation_percent !== null && (
            <p className="gx-muted gx-small">
              {data.yoy_variation_percent > 0 ? "+" : ""}
              {number(data.yoy_variation_percent)}% de variación
            </p>
          )}
        </div>
      </div>
      <p className="gx-result-note">
        <Info size={15} aria-hidden="true" />
        Datos preliminares. Esta cifra no es una medida del riesgo personal.
      </p>
    </section>
  );
}
