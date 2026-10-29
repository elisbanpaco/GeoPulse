import type { PredictionItem } from "@/lib/types";
import { formatValue } from "@/lib/filters";
export default function InsightPanel({ data }: { data: PredictionItem[] }) {
  return (
    <>
      <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        Clasificación experimental de observaciones históricas con XGBoost. No
        es un pronóstico de años futuros. El modelo pendiente de validación
        temporal puede tener métricas optimistas. Su puntuación no es una
        certeza ni una probabilidad calibrada de riesgo. El artefacto actual no
        permite distinguir las dos Limas; se omiten para evitar atribuciones
        incorrectas. El filtro de año no modifica este artefacto: cada fila
        indica su año de observación.
      </p>
      {data.length === 0 ? (
        <p className="gp-message">
          Sin clasificaciones disponibles para este indicador y territorio.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="gp-table">
            <caption className="sr-only">
              Clasificación de tendencias históricas
            </caption>
            <thead>
              <tr>
                <th>Territorio</th>
                <th>Año observado</th>
                <th>Clase</th>
                <th>Puntuación del modelo</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={`${row.COD_DPTO}-${row.INDICADOR}-${i}`}>
                  <td>{row.NOM_DPTO}</td>
                  <td>{row.ANIO}</td>
                  <td>{row.PRED_TENDENCIA}</td>
                  <td>{formatValue(row.PRED_PROB)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
