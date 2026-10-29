import type { Indicator } from "@/lib/types";
/** Methodology replaces the invalid distribution between heterogeneous indicators. */
export default function DistributionChart({
  indicator,
}: {
  indicator: Indicator;
}) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-slate-500">Nombre oficial</dt>
        <dd className="font-medium">{indicator.name}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Medida mostrada</dt>
        <dd>
          {indicator.measure} · {indicator.unit} · columna{" "}
          {indicator.value_column}
        </dd>
      </div>
      <div>
        <dt className="text-slate-500">Fuente del indicador</dt>
        <dd>{indicator.sources.join(", ")}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Cobertura temporal disponible</dt>
        <dd>
          {Math.min(...indicator.years)}–{Math.max(...indicator.years)} ·{" "}
          {indicator.years.length} años
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-slate-500">Cómo interpretar los datos</dt>
        <dd>
          El nombre oficial puede describir una tasa. Esta vista conserva
          VALORES, el valor preliminar del archivo: los indicadores de denuncias
          y homicidios muestran recuentos, no tasas por población. No se suman
          indicadores ni años. El dato nacional se consulta por separado; no se
          calcula sumando regiones.
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-slate-500">Limitaciones de cobertura</dt>
        <dd>
          {indicator.coverage_note} Los cambios interanuales describen valores
          publicados y no prueban cambios reales en riesgo. Lima Metropolitana y
          Lima Provincias se mantienen separadas; el mapa departamental no
          permite colorearlas individualmente.
        </dd>
      </div>
    </dl>
  );
}
