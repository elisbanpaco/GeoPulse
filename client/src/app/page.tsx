"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  ArrowRight,
  TrendingUp,
  GitCompareArrows,
  ChevronDown,
  X,
  Globe2,
  ShieldCheck,
  Download,
} from "lucide-react";
import Header from "@/components/layout/Header";
import SearchPicker from "@/components/explore/SearchPicker";
import ResultSummary from "@/components/explore/ResultSummary";
import MapExplorer from "@/components/explore/MapExplorer";
import AdvancedAnalysis from "@/components/explore/AdvancedAnalysis";
import TrendChart from "@/components/charts/TrendChart";
import Methodology from "@/components/charts/DistributionChart";
import { useApi } from "@/hooks/useApi";
import { endpoint, exportUrl } from "@/lib/api";
import { resolveFilters, filterQuery, formatValue } from "@/lib/filters";
import { topicName } from "@/lib/presentation";
import type {
  Indicator,
  Region,
  DashboardFilters,
  DashboardSummary,
  TrendPoint,
  RegionTrendSeries,
} from "@/lib/types";

function RequestState({
  status,
  error,
  retry,
}: {
  status: string;
  error: string | null;
  retry: () => void;
}) {
  if (error)
    return (
      <div role="alert" className="gx-empty">
        <h2>No pudimos cargar esta consulta</h2>
        <p>{error}</p>
        <button className="gx-button" onClick={retry}>
          Reintentar
        </button>
      </div>
    );
  return status !== "success" ? (
    <div className="gx-loading" role="status">
      <span />
      Buscando los datos de tu consulta…
    </div>
  ) : null;
}
export default function Page() {
  return (
    <Suspense fallback={<p className="gx-empty">Cargando GeoPulse…</p>}>
      <Bootstrap />
    </Suspense>
  );
}
function Bootstrap() {
  const catalog = useApi<Indicator[]>(endpoint("indicators"));
  const regions = useApi<Region[]>(endpoint("regions"));
  if (!catalog.data?.length || !regions.data)
    return (
      <>
        <Header
          hasSelection={false}
          place=""
          busy={false}
          onShare={() => {}}
          onExport={() => {}}
          onAdvanced={() => {}}
        />
        <main className="gx-bootstrap">
          <h1>Entiende los datos de tu región.</h1>
          <RequestState
            status={catalog.status}
            error={catalog.error}
            retry={catalog.refetch}
          />
          {regions.error && (
            <RequestState
              status={regions.status}
              error={regions.error}
              retry={regions.refetch}
            />
          )}
          {catalog.status === "success" && !catalog.data?.length && (
            <p>No hay temas disponibles por el momento.</p>
          )}
        </main>
      </>
    );
  return <Dashboard indicators={catalog.data} regions={regions.data} />;
}
function Dashboard({
  indicators,
  regions,
}: {
  indicators: Indicator[];
  regions: Region[];
}) {
  const search = useSearchParams();
  const filters = resolveFilters(
    new URLSearchParams(search.toString()),
    indicators,
    regions,
  );
  const indicator = indicators.find((item) => item.code === filters.indicator)!;
  const { region, year, view, national } = filters;
  const hasPlace = Boolean(region || national);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const hadPlace = useRef(hasPlace);
  useEffect(() => {
    if (hasPlace && !hadPlace.current) resultTitle.current?.focus();
    hadPlace.current = hasPlace;
  }, [hasPlace]);
  const place = regions.find((item) => item.code === region)?.name ?? "Perú";
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const about = useRef<HTMLDetailsElement>(null);
  const regionOptions = regions.map((item) => ({
    value: item.code,
    label: item.name,
  }));
  const placeOptions = [
    ...regionOptions,
    { value: "00", label: "Ver todo el Perú", group: "También puedes" },
  ];
  const topicOptions = indicators.map((item) => ({
    value: String(item.code),
    label: topicName(item),
    group: item.category || "Otros temas",
  }));
  const change = (patch: Partial<DashboardFilters>) => {
    const next = { ...filters, ...patch };
    if (next.region === next.compareRegion) next.compareRegion = null;
    if (next.region) next.national = false;
    window.history.pushState(null, "", `?${filterQuery(next)}`);
    setMessage("");
  };
  const choosePlace = (code: string) =>
    change({
      region: code === "00" ? null : code,
      national: code === "00",
      compareRegion: null,
      view: "general",
    });
  const summary = useApi<DashboardSummary>(
    hasPlace
      ? endpoint("summary", { indicator: indicator.code, region, year })
      : null,
  );
  const trend = useApi<TrendPoint[]>(
    hasPlace ? endpoint("trend", { indicator: indicator.code, region }) : null,
  );
  const comparing = view === "comparative";
  const comparison = useApi<RegionTrendSeries[]>(
    hasPlace && comparing && region && filters.compareRegion
      ? endpoint("trends", {
          indicator: indicator.code,
          region,
          compare_region: filters.compareRegion,
          year,
        })
      : null,
  );
  const series: RegionTrendSeries[] = [
    {
      COD_DPTO: region ?? "00",
      NOM_DPTO: place,
      data:
        trend.data?.map((point) => ({
          year: point.year,
          value: point.value,
        })) ?? [],
    },
  ];
  const exportCsv = async () => {
    if (comparing && (!region || !filters.compareRegion)) {
      setMessage("Elige dos regiones antes de descargar la comparación.");
      return;
    }
    setExporting(true);
    setMessage("");
    try {
      const response = await fetch(exportUrl(filters));
      if (!response.ok)
        throw new Error(
          "No pudimos descargar los datos. Inténtalo nuevamente.",
        );
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `geopulse-${indicator.code}-${year}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        "Listo. Descargaste los datos de esta consulta con su fuente y unidad.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No pudimos descargar los datos.",
      );
    } finally {
      setExporting(false);
    }
  };
  const share = async () => {
    const url = new URL(window.location.href);
    url.search = filterQuery(filters).toString();
    try {
      await navigator.clipboard.writeText(url.toString());
      setMessage("Enlace copiado. Quien lo abra verá la misma consulta.");
    } catch {
      setMessage(`Copia este enlace: ${url}`);
    }
  };
  return (
    <div className="gx-app">
      <Header
        hasSelection={hasPlace}
        place={place}
        busy={exporting}
        onShare={share}
        onExport={exportCsv}
        onAdvanced={() => change({ view: "intelligence" })}
      />
      {!hasPlace ? (
        <main className="gx-welcome">
          <div className="gx-welcome-orbit" aria-hidden="true" />
          <div className="gx-welcome-content">
            <p className="gx-eyebrow">
              <span />
              Información pública del Perú
            </p>
            <h1>
              Entiende los datos
              <br />
              de <em>tu región.</em>
            </h1>
            <p className="gx-welcome-description">
              Consulta datos de seguridad ciudadana y descubre cómo han cambiado
              con el tiempo. Empieza por un lugar que conozcas.
            </p>
            <SearchPicker
              label="Elegir mi región"
              title="¿Qué región quieres consultar?"
              options={regionOptions}
              onSelect={choosePlace}
              placeholder="Buscar una región…"
              prominent
            />
            <button
              className="gx-text-button gx-national-link"
              onClick={() => choosePlace("00")}
            >
              <Globe2 size={17} />
              Prefiero ver todo el Perú
              <ArrowRight size={16} />
            </button>
            <p className="gx-welcome-assurance">
              <ShieldCheck size={16} />
              Cada dato con su fuente, su año y su contexto.
            </p>
          </div>
          <div className="gx-welcome-steps">
            <article>
              <span className="gx-step-icon">
                <MapPin size={22} />
              </span>
              <h2>Empieza por tu región</h2>
              <p>Elige un lugar y un tema para empezar.</p>
            </article>
            <article>
              <span className="gx-step-icon">
                <TrendingUp size={22} />
              </span>
              <h2>Mira cómo ha cambiado</h2>
              <p>
                Entiende las cifras con una explicación sencilla y su historia.
              </p>
            </article>
            <article>
              <span className="gx-step-icon">
                <GitCompareArrows size={22} />
              </span>
              <h2>Compara si lo necesitas</h2>
              <p>
                Elige otra región y consulta ambos lugares con el mismo tema.
              </p>
            </article>
          </div>
        </main>
      ) : (
        <main className="gx-main">
          <div className="gx-query-title">
            <div>
              <p className="gx-eyebrow">Tu consulta</p>
              <h1 ref={resultTitle} tabIndex={-1}>
                {topicName(indicator)} en <span>{place}</span>
              </h1>
              <p className="gx-muted">
                Datos disponibles: {year}
                {year === indicator.years[0]
                  ? " · Último año de este tema"
                  : ""}
              </p>
            </div>
            <span className="gx-country-tag">
              <MapPin size={15} />
              {national ? "Vista nacional" : "Vista regional"}
            </span>
          </div>
          <section className="gx-filters" aria-label="Personalizar consulta">
            <SearchPicker
              label="Región"
              title="¿Qué lugar quieres consultar?"
              value={region ?? "00"}
              options={placeOptions}
              onSelect={choosePlace}
              placeholder="Buscar una región…"
            />
            <SearchPicker
              label="Tema"
              title="¿Qué te gustaría consultar?"
              value={String(indicator.code)}
              options={topicOptions}
              onSelect={(code) => {
                const chosen = indicators.find(
                  (item) => item.code === Number(code),
                )!;
                change({
                  indicator: chosen.code,
                  year: chosen.years.includes(year!) ? year : chosen.years[0],
                });
              }}
              placeholder="Buscar un tema…"
            />
            <div className="gx-year-control">
              <label className="gx-control-label" htmlFor="query-year">
                Año
              </label>
              <select
                id="query-year"
                value={year ?? ""}
                onChange={(event) =>
                  change({ year: Number(event.target.value) })
                }
              >
                {indicator.years.map((value) => (
                  <option key={value} value={value}>
                    {value}
                    {value === indicator.years[0] ? " · Último disponible" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={17} aria-hidden="true" />
            </div>
          </section>
          {message && (
            <div role="status" className="gx-toast">
              <span>{message}</span>
              <button
                className="gx-icon-button"
                aria-label="Cerrar mensaje"
                onClick={() => setMessage("")}
              >
                <X size={17} />
              </button>
            </div>
          )}
          <RequestState
            status={summary.status}
            error={summary.error}
            retry={summary.refetch}
          />
          {summary.data && (
            <ResultSummary
              data={summary.data}
              indicator={indicator}
              place={place}
              year={year!}
            />
          )}
          <div className="gx-source-row">
            <p>Fuente: {indicator.sources.join(", ")}</p>
            <a
              href="#about-data"
              onClick={() => {
                if (about.current) about.current.open = true;
              }}
            >
              Sobre estos datos
              <ArrowRight size={14} />
            </a>
          </div>
          <section className="gx-section" aria-labelledby="history-title">
            <div className="gx-section-head">
              <div>
                <p className="gx-eyebrow">Una mirada en el tiempo</p>
                <h2 id="history-title">
                  {comparing ? "¿Cómo se comparan?" : "¿Cómo ha cambiado?"}
                </h2>
                <p className="gx-muted gx-small">
                  {indicator.unit === "%"
                    ? "Porcentaje por año"
                    : "Registros por año"}
                </p>
              </div>
              <div className="gx-compare-actions">
                {region ? (
                  <SearchPicker
                    compact
                    label={
                      filters.compareRegion && comparing
                        ? "Cambiar comparación"
                        : "Comparar con otra región"
                    }
                    title="¿Con qué región quieres comparar?"
                    value={filters.compareRegion}
                    options={regionOptions.filter(
                      (item) => item.value !== region,
                    )}
                    onSelect={(code) =>
                      change({ compareRegion: code, view: "comparative" })
                    }
                    placeholder="Buscar otra región…"
                  />
                ) : (
                  <SearchPicker
                    compact
                    label="Elegir una región para comparar"
                    title="Primero, elige tu región"
                    options={regionOptions}
                    onSelect={(code) =>
                      change({
                        region: code,
                        national: false,
                        view: "comparative",
                      })
                    }
                    placeholder="Buscar una región…"
                  />
                )}
                {comparing && filters.compareRegion && (
                  <button
                    className="gx-icon-button"
                    onClick={() =>
                      change({ view: "general", compareRegion: null })
                    }
                    aria-label="Quitar comparación"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            {comparing ? (
              region && filters.compareRegion ? (
                <>
                  <RequestState
                    status={comparison.status}
                    error={comparison.error}
                    retry={comparison.refetch}
                  />
                  {comparison.data && (
                    <>
                      <div className="gx-comparison-values">
                        {comparison.data.map((item, index) => (
                          <div key={item.COD_DPTO}>
                            <span
                              className={`gx-series-dot ${index === 1 ? "gx-series-secondary" : ""}`}
                            />
                            <div>
                              <h3>
                                {item.NOM_DPTO}
                                <span> · {year}</span>
                              </h3>
                              <strong>
                                {formatValue(
                                  item.data.find((point) => point.year === year)
                                    ?.value,
                                  indicator.unit,
                                )}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>
                      <TrendChart
                        series={comparison.data}
                        unit={indicator.unit}
                        year={year}
                      />
                    </>
                  )}
                </>
              ) : (
                <div className="gx-empty">
                  <GitCompareArrows size={27} />
                  <p>
                    Elige otra región con el botón de arriba para completar la
                    comparación.
                  </p>
                </div>
              )
            ) : (
              <>
                <RequestState
                  status={trend.status}
                  error={trend.error}
                  retry={trend.refetch}
                />
                {trend.data && (
                  <TrendChart
                    series={series}
                    unit={indicator.unit}
                    year={year}
                  />
                )}
              </>
            )}
            <p className="gx-chart-note">
              La línea punteada marca {year}. Los espacios sin datos se
              conservan.
            </p>
          </section>
          <MapExplorer
            key={national ? "national" : "regional"}
            indicator={indicator.code}
            year={year!}
            region={region}
            unit={indicator.unit}
            defaultOpen={national}
            onSelect={(code) =>
              change({
                region: code,
                national: false,
                compareRegion: null,
                view: "general",
              })
            }
          />
          {(view === "intelligence" || view === "prediction") && (
            <AdvancedAnalysis
              filters={filters}
              unit={indicator.unit}
              onView={(advancedView) => change({ view: advancedView })}
              onClose={() => change({ view: "general" })}
            />
          )}
          {view === "reports" && (
            <section className="gx-section">
              <div className="gx-section-head">
                <h2>Descarga esta consulta</h2>
                <button
                  className="gx-icon-button"
                  aria-label="Cerrar descarga"
                  onClick={() => change({ view: "general" })}
                >
                  <X size={20} />
                </button>
              </div>
              <p className="gx-muted">
                El archivo incluye las observaciones de {place}, el año {year},
                su fuente y su unidad.
              </p>
              <button
                className="gx-button gx-button-primary"
                disabled={exporting}
                onClick={exportCsv}
              >
                <Download size={17} />
                Descargar datos (CSV)
              </button>
            </section>
          )}
          <details ref={about} className="gx-disclosure" id="about-data">
            <summary>
              <span>
                Sobre estos datos
                <span className="gx-disclosure-hint">
                  Fuente, definición y límites de la información
                </span>
              </span>
              <ChevronDown size={19} />
            </summary>
            <div className="gx-about-content">
              <Methodology indicator={indicator} />
            </div>
          </details>
          <footer className="gx-footer">
            <span>GeoPulse · Datos para entender tu región.</span>
            <span>
              Los años disponibles no garantizan cobertura anual completa.
            </span>
          </footer>
        </main>
      )}
    </div>
  );
}
