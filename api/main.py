import os
import json
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any

app = FastAPI(title="GeoPulse API", description="API Analítica de Inteligencia Geoespacial")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET1_PATH = os.path.join(BASE_DIR, "data/DATASET_Ind_ Plan_Acc_Seg_Ciud_2009 a Abr. 2026.csv")
GEOJSON_PATH = os.path.join(BASE_DIR, "data/peru_departamento_.json")

# In-memory database
class DataStore:
    df: pd.DataFrame = None
    is_loaded: bool = False
    
db = DataStore()

def normalizar_ubigeo(codigo):
    if pd.isna(codigo) or str(codigo).lower() == 'nan':
        return None
    try:
        codigo = str(int(float(codigo)))
    except ValueError:
        codigo = str(codigo)
    
    if len(codigo) % 2 != 0:
        codigo = "0" + codigo
    return codigo.ljust(6, '0')

@app.on_event("startup")
def startup_event():
    print("Iniciando motor de preprocesamiento de datos...")
    
    # 1. Cargar diccionario de departamentos desde el GeoJSON (Single Source of Truth)
    dept_mapping = {}
    if os.path.exists(GEOJSON_PATH):
        with open(GEOJSON_PATH, 'r', encoding='utf-8') as f:
            geo_data = json.load(f)
            for feature in geo_data.get('features', []):
                props = feature.get('properties', {})
                cod = str(props.get('COD_DPTO', '')).zfill(2)
                nom = props.get('NOM_DPTO', 'Desconocido').title() # Title case para UI
                if cod:
                    dept_mapping[cod] = nom
    else:
        print(f"Advertencia: No se encontró GeoJSON en {GEOJSON_PATH}")

    # 2. Cargar y Transformar Dataset
    if os.path.exists(DATASET1_PATH):
        df = pd.read_csv(DATASET1_PATH, low_memory=False)
        
        # Filtro Crítico: Quedarnos solo con el ámbito 1 (Regional) 
        # Esto evita sumar múltiples veces los datos (Nacional, Regional, Provincial, Distrital)
        df = df[df['AMBITO'] == 1].copy()
        
        # Transformaciones
        df['UBIGEO_STR'] = df['UBIGEO_DASH'].astype(str)
        df['COD_DPTO'] = df['UBIGEO_STR'].apply(normalizar_ubigeo).str[:2]
        df['NOM_DPTO'] = df['COD_DPTO'].map(dept_mapping).fillna("Desconocido")
        df['VALORES'] = pd.to_numeric(df['VALORES'], errors='coerce').fillna(0)
        df['ANIO'] = pd.to_numeric(df['ANIO'], errors='coerce').fillna(0).astype(int)
        
        # Optimización: Filtrar datos inválidos y conservar solo columnas necesarias
        db.df = df[['COD_DPTO', 'NOM_DPTO', 'ANIO', 'VALORES', 'INDICADOR']].dropna(subset=['COD_DPTO'])
        db.is_loaded = True
        print(f"Preprocesamiento exitoso: {len(db.df)} registros listos en memoria.")
    else:
        print(f"Error: No se encontró el dataset en {DATASET1_PATH}")


def filter_data(region: Optional[str] = None, year: Optional[int] = None) -> pd.DataFrame:
    df = db.df
    if region:
        df = df[df['COD_DPTO'] == region]
    if year:
        df = df[df['ANIO'] == year]
    return df

@app.get("/api/v1/dashboard/summary")
def get_summary(region: Optional[str] = None, year: Optional[int] = None):
    if not db.is_loaded:
        return {"error": "Data not loaded"}
    
    current_df = filter_data(region, year)
    total_delitos = float(current_df['VALORES'].sum())
    
    variation = 0.0
    if year:
        prev_df = filter_data(region, year - 1)
        prev_total = float(prev_df['VALORES'].sum())
        if prev_total > 0:
            variation = ((total_delitos - prev_total) / prev_total) * 100
            
    return {
        "total_delitos": total_delitos,
        "yoy_variation_percent": round(variation, 2),
        "total_registros": len(db.df)
    }

@app.get("/api/v1/dashboard/map-data")
def get_map_data(year: Optional[int] = None):
    if not db.is_loaded:
        return {"error": "Data not loaded"}
    
    df = filter_data(region=None, year=year)
    grouped = df.groupby(['COD_DPTO', 'NOM_DPTO'])['VALORES'].sum().reset_index()
    
    return grouped.rename(columns={'VALORES': 'total_delitos'}).to_dict(orient='records')

@app.get("/api/v1/dashboard/trend")
def get_trend(region: Optional[str] = None):
    """Devuelve la evolución anual de delitos"""
    if not db.is_loaded:
        return {"error": "Data not loaded"}
    
    df = filter_data(region=region, year=None)
    # Excluir años anómalos o incompletos si es necesario, o agrupar por todos
    grouped = df.groupby('ANIO')['VALORES'].sum().reset_index()
    grouped = grouped[grouped['ANIO'] > 0].sort_values('ANIO')
    
    # Formato para Recharts: [{name: "2010", value: 100}, ...]
    result = [{"name": str(row['ANIO']), "value": float(row['VALORES'])} for _, row in grouped.iterrows()]
    return result

@app.get("/api/v1/dashboard/top-regions")
def get_top_regions(year: Optional[int] = None, limit: int = 5):
    """Retorna las regiones con mayor criminalidad"""
    df = filter_data(None, year)
    grouped = df.groupby(['COD_DPTO', 'NOM_DPTO'])['VALORES'].sum().reset_index()
    top = grouped.sort_values(by='VALORES', ascending=False).head(limit)
    return top.rename(columns={'VALORES': 'total_delitos'}).to_dict(orient='records')

@app.get("/api/v1/dashboard/trends")
def get_trends(limit: int = 5):
    """Retorna la tendencia histórica anual para las top N regiones"""
    # Excluir nivel nacional (00)
    df_regional = db.df[db.df['COD_DPTO'] != '00']
    
    # Encontrar las top N regiones históricamente
    top_cods = df_regional.groupby('COD_DPTO')['VALORES'].sum().nlargest(limit).index
    
    # Filtrar y agrupar por año
    filtered = df_regional[df_regional['COD_DPTO'].isin(top_cods)]
    trend = filtered.groupby(['COD_DPTO', 'NOM_DPTO', 'ANIO'])['VALORES'].sum().reset_index()
    
    # Ordenar por año para asegurar que la línea de tiempo es correcta
    trend = trend.sort_values(by=['COD_DPTO', 'ANIO'])
    
    # Formatear respuesta
    result = {}
    for _, row in trend.iterrows():
        cod = row['COD_DPTO']
        if cod not in result:
            result[cod] = {"COD_DPTO": cod, "NOM_DPTO": row['NOM_DPTO'], "data": []}
        result[cod]["data"].append({"year": int(row['ANIO']), "value": float(row['VALORES'])})
        
    # Devolver como lista ordenada por volumen total
    return sorted(list(result.values()), key=lambda x: sum(d['value'] for d in x['data']), reverse=True)

@app.get("/api/v1/dashboard/distribution")
def get_distribution(region: Optional[str] = None, year: Optional[int] = None):
    """Distribución de delitos por Indicador (Pie Chart)"""
    df = filter_data(region, year)
    grouped = df.groupby('INDICADOR')['VALORES'].sum().reset_index()
    total = grouped['VALORES'].sum()
    
    # Mapeo ficticio/genérico para dar contexto si el indicador es solo numérico
    mapping = {
        70: "Delitos Patrimoniales",
        4: "Violencia Familiar",
        5: "Accidentes de Tránsito",
        3: "Homicidios",
        6: "Faltas",
        1: "Crimen Organizado",
        2: "Microcomercialización"
    }
    
    result = []
    for _, row in grouped.iterrows():
        ind = row['INDICADOR']
        val = float(row['VALORES'])
        name = mapping.get(ind, f"Indicador {ind}")
        pct = (val / total * 100) if total > 0 else 0
        if val > 0:
            result.append({"name": name, "value": val, "percentage": round(pct, 1)})
            
    # Ordenar y tomar los top 5 para el pie chart
    result = sorted(result, key=lambda x: x['value'], reverse=True)[:5]
    return result

@app.get("/api/v1/dashboard/details")
def get_details(region: Optional[str] = None, limit: int = 10):
    """Retorna filas de datos detallados para la tabla"""
    df = filter_data(region, None)
    # Seleccionar las filas con mayores valores
    top = df.sort_values(by='VALORES', ascending=False).head(limit)
    return top[['ANIO', 'NOM_DPTO', 'INDICADOR', 'VALORES']].to_dict(orient='records')


@app.get("/api/v1/dashboard/anomalies")
def get_anomalies(year: Optional[int] = None, threshold: float = 15.0):
    """Detecta anomalías en los datos de criminalidad comparando año contra año por región."""
    if not db.is_loaded:
        return {"error": "Data not loaded"}
    
    df = db.df[db.df['COD_DPTO'] != '00'].copy()
    
    # Agrupar por región y año
    grouped = df.groupby(['COD_DPTO', 'NOM_DPTO', 'ANIO'])['VALORES'].sum().reset_index()
    grouped = grouped.sort_values(by=['COD_DPTO', 'ANIO'])
    
    anomalies = []
    
    for (cod, nom), region_data in grouped.groupby(['COD_DPTO', 'NOM_DPTO']):
        region_data = region_data.sort_values('ANIO')
        values = region_data[['ANIO', 'VALORES']].values.tolist()
        
        for i in range(1, len(values)):
            prev_year, prev_val = int(values[i-1][0]), float(values[i-1][1])
            curr_year, curr_val = int(values[i][0]), float(values[i][1])
            
            if year and curr_year != year:
                continue
            
            if prev_val > 0:
                change = ((curr_val - prev_val) / prev_val) * 100
                
                if abs(change) > threshold:
                    anomaly_type = "spike" if change > 0 else "drop"
                    
                    if abs(change) > 30:
                        severity = "critical"
                    elif abs(change) > 20:
                        severity = "high"
                    else:
                        severity = "medium"
                    
                    direction = "incremento" if change > 0 else "reducción"
                    description = f"{direction.capitalize()} de {abs(change):.1f}% en {nom} entre {prev_year} y {curr_year}"
                    
                    anomalies.append({
                        "region": nom,
                        "code": cod,
                        "type": anomaly_type,
                        "severity": severity,
                        "value": curr_val,
                        "change_percent": round(change, 2),
                        "year": curr_year,
                        "description": description
                    })
    
    # Ordenar por severidad y magnitud del cambio
    severity_order = {"critical": 0, "high": 1, "medium": 2}
    anomalies.sort(key=lambda x: (severity_order.get(x["severity"], 3), -abs(x["change_percent"])))
    
    return anomalies[:20]  # Limitar a las 20 anomalías más importantes

