from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import Optional
import os

app = FastAPI(title="GeoPulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define path to dataset
DATASET1_PATH = "../data/dataset1/DATASET_Ind_ Plan_Acc_Seg_Ciud_2009 a Abr. 2026.csv"

# Global dataframe
df = None

def normalizar_ubigeo(codigo):
    if pd.isna(codigo) or str(codigo).lower() == 'nan':
        return codigo
    try:
        codigo = str(int(float(codigo)))
    except ValueError:
        codigo = str(codigo)
    
    length = len(codigo)
    if length <= 2:
        return codigo.zfill(2)
    elif length in [5, 6]:
        return codigo.zfill(6)
    return codigo

@app.on_event("startup")
def load_data():
    global df
    if os.path.exists(DATASET1_PATH):
        print("Loading dataset into memory...")
        df = pd.read_csv(DATASET1_PATH, low_memory=False)
        df['UBIGEO_STR'] = df['UBIGEO_DASH'].astype(str)
        df['UBIGEO_LIMPIO'] = df['UBIGEO_STR'].apply(normalizar_ubigeo)
        df['COD_DPTO'] = df['UBIGEO_LIMPIO'].str[:2]
        
        # Ensure 'VALORES' is numeric
        df['VALORES'] = pd.to_numeric(df['VALORES'], errors='coerce').fillna(0)
        print("Dataset loaded successfully.")
    else:
        print(f"Dataset not found at {DATASET1_PATH}")
        df = pd.DataFrame()

@app.get("/api/v1/dashboard/summary")
def get_summary(
    region: Optional[str] = None, # COD_DPTO
    year: Optional[int] = None,
    crime_type: Optional[str] = None # INDICADOR
):
    if df is None or df.empty:
        return {"error": "Data not loaded"}
    
    filtered_df = df.copy()
    if region:
        filtered_df = filtered_df[filtered_df['COD_DPTO'] == region]
    if year:
        filtered_df = filtered_df[filtered_df['ANIO'] == year]
    if crime_type:
        filtered_df = filtered_df[filtered_df['INDICADOR'].astype(str) == crime_type]
        
    total_delitos = filtered_df['VALORES'].sum()
    
    # Calculate YoY variation
    variation = 0
    if year:
        prev_year_df = df.copy()
        if region:
            prev_year_df = prev_year_df[prev_year_df['COD_DPTO'] == region]
        if crime_type:
            prev_year_df = prev_year_df[prev_year_df['INDICADOR'].astype(str) == crime_type]
            
        prev_year_df = prev_year_df[prev_year_df['ANIO'] == (year - 1)]
        prev_total = prev_year_df['VALORES'].sum()
        if prev_total > 0:
            variation = ((total_delitos - prev_total) / prev_total) * 100
            
    return {
        "total_delitos": float(total_delitos),
        "yoy_variation_percent": float(variation)
    }

@app.get("/api/v1/dashboard/map-data")
def get_map_data(
    year: Optional[int] = None,
    crime_type: Optional[str] = None
):
    if df is None or df.empty:
        return {"error": "Data not loaded"}
    
    filtered_df = df.copy()
    if year:
        filtered_df = filtered_df[filtered_df['ANIO'] == year]
    if crime_type:
        filtered_df = filtered_df[filtered_df['INDICADOR'].astype(str) == crime_type]
        
    # Group by COD_DPTO
    grouped = filtered_df.groupby('COD_DPTO')['VALORES'].sum().reset_index()
    
    result = []
    for _, row in grouped.iterrows():
        result.append({
            "COD_DPTO": row['COD_DPTO'],
            "total_delitos": float(row['VALORES'])
        })
        
    return result
