"""Single-indicator analytics. Source observations are never summed implicitly."""
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from io import StringIO
from pathlib import Path
from typing import Annotated
import csv
import json
import logging
import os

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("GEOPULSE_DATA_DIR", str(BASE_DIR / "data")))
CATALOG = {item["code"]: item for item in json.loads((BASE_DIR / "catalog/indicators.json").read_text())}
logger = logging.getLogger(__name__)


@dataclass
class DataStore:
    df: pd.DataFrame = field(default_factory=pd.DataFrame)
    pred_df: pd.DataFrame = field(default_factory=pd.DataFrame)
    regions: dict = field(default_factory=dict)
    is_loaded: bool = False
    error: str | None = None


db = DataStore()


def territory_code(value, scope=1):
    """Preserve the source's two Lima territories; national code is separate."""
    if pd.isna(value):
        return None
    code = str(int(float(value)))
    if int(scope) == 0:
        return "00"
    return code.zfill(2) if len(code) <= 2 else code


def load_data():
    db.is_loaded = False
    db.pred_df = pd.DataFrame()
    db.error = None
    try:
        geometry_path = DATA_DIR / "peru_departamento_.json"
        if not geometry_path.exists():
            geometry_path = BASE_DIR.parent / "client/public/peru_simplified.json"
        geometry = json.loads(geometry_path.read_text())
        db.regions = {str(f["properties"]["COD_DPTO"]).zfill(2): f["properties"]["NOM_DPTO"].title() for f in geometry["features"]}
        db.regions.pop("15", None)
        db.regions.update({"1501": "Lima Metropolitana", "1599": "Lima Provincias"})
        paths = sorted(DATA_DIR.glob("DATASET_Ind*.csv"))
        if len(paths) != 1:
            raise ValueError("Se requiere exactamente un CSV DATASET_Ind*.csv")
        raw = pd.read_csv(paths[0], low_memory=False)
        required = {"INDICADOR", "AMBITO", "UBIGEO_DASH", "ANIO", "VALORES", "FUENTE"}
        if not required.issubset(raw.columns):
            raise ValueError("Faltan columnas requeridas")
        df = raw[raw.AMBITO.isin([0, 1])].copy()
        for col in ["ANIO", "INDICADOR"]:
            df[col] = pd.to_numeric(df[col], errors="raise").astype(int)
        df["VALORES"] = pd.to_numeric(df.VALORES, errors="coerce").replace([float("inf"), -float("inf")], float("nan"))
        df["COD_DPTO"] = [territory_code(u, s) for u, s in zip(df.UBIGEO_DASH, df.AMBITO)]
        if df.COD_DPTO.isna().any() or df.duplicated(["INDICADOR", "COD_DPTO", "ANIO"]).any():
            raise ValueError("Territorios ausentes u observaciones duplicadas; no se agregarán automáticamente")
        if set(df.INDICADOR) - CATALOG.keys():
            raise ValueError("Hay indicadores sin catálogo")
        if any(not all(CATALOG[code].get(key) for key in ("display_name", "category", "result_label")) for code in df.INDICADOR.unique()):
            raise ValueError("Faltan nombres breves o categorías para presentar los indicadores")
        unknown = set(df.loc[df.AMBITO == 1, "COD_DPTO"]) - db.regions.keys()
        if unknown:
            raise ValueError(f"Territorios sin geometría o nombre: {sorted(unknown)}")
        df["NOM_DPTO"] = df.COD_DPTO.map({"00": "Perú", **db.regions})
        db.df = df
        pred_path = DATA_DIR / "predictions.csv"
        if pred_path.exists():
            try:
                pred = pd.read_csv(pred_path, dtype={"COD_DPTO": str})
                # The existing artifact lost the distinction between the two Limas.
                # Do not guess which territory its collapsed code 15 represents.
                pred = pred[(pred.AMBITO == 1) & (pred.COD_DPTO != "15")].copy()
                pred["COD_DPTO"] = pred.COD_DPTO.str.zfill(2)
                db.pred_df = pred
            except (ValueError, KeyError):
                logger.exception("No se pudo cargar el artefacto experimental")
        db.is_loaded = True
    except (OSError, ValueError, KeyError):
        db.error = "No se pudieron cargar los datos. Revisa la configuración y el esquema del dataset."
        logger.exception(db.error)


@asynccontextmanager
async def lifespan(app):
    load_data()
    yield


app = FastAPI(title="GeoPulse — Indicadores de seguridad ciudadana", version="0.2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","), allow_methods=["GET"], allow_headers=["*"])


def ready():
    if not db.is_loaded:
        raise HTTPException(503, db.error or "Datos no disponibles")


def indicator_param(indicator: Annotated[int, Query()] = 30):
    ready()
    if indicator not in CATALOG:
        raise HTTPException(422, "Indicador desconocido")
    if db.df[db.df.INDICADOR == indicator].empty:
        raise HTTPException(422, "Indicador sin cobertura nacional o regional en este dataset")
    return indicator


Indicator = Annotated[int, Depends(indicator_param)]
Year = Annotated[int | None, Query(ge=1900, le=2100)]
Region = Annotated[str | None, Query(pattern=r"^(0[1-9]|1[0-4]|1[6-9]|2[0-5]|1501|1599)$")]
PREFIX = "/api/v1/dashboard"


def metadata(indicator):
    df = db.df[db.df.INDICADOR == indicator]
    return {**CATALOG[indicator], "sources": sorted(df.FUENTE.dropna().unique().tolist()), "scopes": sorted(int(s) for s in df.AMBITO.unique()), "years": sorted((int(y) for y in df.ANIO.unique()), reverse=True), "coverage_note": "Cobertura anual completa no verificada; la fecha del archivo no prueba completitud.", "source_file": "Dataset de indicadores de planes de acción de seguridad ciudadana"}


def rows(indicator, region=None, year=None, regional=False):
    df = db.df[db.df.INDICADOR == indicator]
    if regional:
        df = df[df.AMBITO == 1]
    elif region:
        df = df[df.COD_DPTO == region]
    else:
        df = df[df.AMBITO == 0]
    if year is not None:
        df = df[df.ANIO == year]
    return df


def selected_year(indicator, year):
    years = metadata(indicator)["years"]
    if year is None:
        return max(years)
    if year not in years:
        raise HTTPException(422, "Año no disponible para el indicador")
    return year


def value_at(df):
    if df.empty or pd.isna(df.iloc[0].VALORES):
        return None
    return float(df.iloc[0].VALORES)


def observation(row, indicator):
    return {"COD_DPTO": row.COD_DPTO, "NOM_DPTO": row.NOM_DPTO, "year": int(row.ANIO), "value": None if pd.isna(row.VALORES) else float(row.VALORES), "unit": CATALOG[indicator]["unit"], "source": row.FUENTE}


@app.get("/health")
def health():
    ready()
    return {"status": "ok"}


@app.get(PREFIX + "/indicators")
def indicators():
    ready()
    return [metadata(code) for code in sorted(db.df.INDICADOR.unique())]


@app.get(PREFIX + "/periods")
def periods(indicator: Indicator = 30):
    return {"indicator": indicator, "years": metadata(indicator)["years"]}


@app.get(PREFIX + "/regions")
def regions():
    ready()
    return [{"code": code, "name": name} for code, name in sorted(db.regions.items(), key=lambda pair: pair[1])]


@app.get(PREFIX + "/summary")
def summary(indicator: Indicator = 30, region: Region = None, year: Year = None):
    year = selected_year(indicator, year)
    current = rows(indicator, region, year)
    previous = rows(indicator, region, year - 1)
    value, prev = value_at(current), value_at(previous)
    change = (value - prev) / prev * 100 if value is not None and prev is not None and prev > 0 else None
    return {"indicator": metadata(indicator), "year": year, "region": region, "value": value, "prev_value": prev, "yoy_variation_percent": round(change, 2) if change is not None else None, "unit": CATALOG[indicator]["unit"], "total_registros": len(current), "missing_reason": ("Sin dato regional" if region else "Sin dato nacional") if value is None else None}


@app.get(PREFIX + "/map-data")
def map_data(indicator: Indicator = 30, year: Year = None):
    year = selected_year(indicator, year)
    return [observation(row, indicator) for row in rows(indicator, year=year, regional=True).itertuples()]


@app.get(PREFIX + "/top-regions")
def top_regions(indicator: Indicator = 30, year: Year = None, limit: Annotated[int, Query(ge=1, le=30)] = 10):
    data = map_data(indicator, year)
    return sorted([r for r in data if r["value"] is not None], key=lambda r: (-r["value"], r["COD_DPTO"]))[:limit]


@app.get(PREFIX + "/trend")
def trend(indicator: Indicator = 30, region: Region = None):
    return [{"name": str(row.ANIO), "year": int(row.ANIO), "value": None if pd.isna(row.VALORES) else float(row.VALORES)} for row in rows(indicator, region).sort_values("ANIO").itertuples()]


@app.get(PREFIX + "/trends")
def trends(indicator: Indicator = 30, region: Region = None, compare_region: Region = None, year: Year = None, limit: Annotated[int, Query(ge=1, le=30)] = 5):
    codes = list(dict.fromkeys(c for c in [region, compare_region] if c))
    if not codes:
        codes = [r["COD_DPTO"] for r in top_regions(indicator, year, limit)]
    return [{"COD_DPTO": code, "NOM_DPTO": db.regions[code], "data": [{"year": p["year"], "value": p["value"]} for p in trend(indicator, code)]} for code in codes]


@app.get(PREFIX + "/distribution", deprecated=True)
def distribution():
    raise HTTPException(410, "No es válido calcular porcentajes de distribución entre indicadores heterogéneos. Consulta /indicators.")


@app.get(PREFIX + "/details")
def details(indicator: Indicator = 30, region: Region = None, year: Year = None, limit: Annotated[int, Query(ge=1, le=10000)] = 100):
    year = selected_year(indicator, year)
    df = rows(indicator, region, year, regional=region is None)
    return [observation(row, indicator) for row in df.sort_values("COD_DPTO").head(limit).itertuples()]


@app.get(PREFIX + "/anomalies")
def anomalies(indicator: Indicator = 30, year: Year = None, region: Region = None, threshold: Annotated[float, Query(ge=0, le=1000)] = 15):
    year = selected_year(indicator, year)
    changes = []
    for row in rows(indicator, year=year, regional=True).itertuples():
        if region and row.COD_DPTO != region:
            continue
        prev = value_at(rows(indicator, row.COD_DPTO, year - 1))
        if prev is None or prev <= 0 or pd.isna(row.VALORES):
            continue
        change = (float(row.VALORES) - prev) / prev * 100
        if abs(change) > threshold:
            changes.append({"region": row.NOM_DPTO, "code": row.COD_DPTO, "year": year, "value": float(row.VALORES), "change_percent": round(change, 2), "type": "spike" if change > 0 else "drop", "description": f"Variación de {change:+.1f}% frente a {year - 1}; regla descriptiva, no alerta de riesgo."})
    return sorted(changes, key=lambda item: abs(item["change_percent"]), reverse=True)


@app.get(PREFIX + "/predictions")
def predictions(indicator: Indicator = 30, region: Region = None):
    if db.pred_df.empty:
        raise HTTPException(503, "Artefacto experimental no disponible")
    df = db.pred_df[db.pred_df.INDICADOR == indicator]
    if region:
        df = df[df.COD_DPTO == region]
    result = []
    for record in json.loads(df.to_json(orient="records")):
        record["NOM_DPTO"] = db.regions.get(record["COD_DPTO"], record["COD_DPTO"])
        record["NOM_INDICADOR"] = CATALOG[indicator]["name"]
        result.append(record)
    return result


@app.get(PREFIX + "/export")
def export(indicator: Indicator = 30, year: Year = None, region: Region = None, compare_region: Region = None):
    year = selected_year(indicator, year)
    codes = [c for c in [region, compare_region] if c]
    df = rows(indicator, year=year, regional=True)
    if codes:
        df = df[df.COD_DPTO.isin(codes)]
    output = StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(["indicador", "nombre_oficial", "medida", "unidad", "anio", "territorio", "nombre_territorio", "valor", "fuente", "estado", "columna_origen", "cobertura", "filtro_region", "filtro_comparacion"])
    meta = metadata(indicator)
    for row in df.sort_values("COD_DPTO").itertuples():
        writer.writerow([indicator, meta["name"], meta["measure"], meta["unit"], year, row.COD_DPTO, row.NOM_DPTO, "" if pd.isna(row.VALORES) else row.VALORES, row.FUENTE, "preliminar", "VALORES", meta["coverage_note"], region or "todas", compare_region or ""])
    return Response("\ufeff" + output.getvalue(), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="geopulse-{indicator}-{year}.csv"'})
