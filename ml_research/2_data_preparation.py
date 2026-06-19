import pandas as pd
from pathlib import Path
import os

# Configuración de Rutas
BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_DIR = BASE_DIR / "data"
OUTPUT_DIR = Path(__file__).resolve().parent / "data" / "processed"

# Asegurar que el directorio de salida existe (No creamos basura, solo una carpeta clean para data procesada)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Rutas de Archivos
DATASET_1_CSV = INPUT_DIR / "dataset1" / "DATASET_Ind_ Plan_Acc_Seg_Ciud_2009 a Abr. 2026.csv"
DATASET_2_CSV = INPUT_DIR / "dataset2" / "DATASET_Ten_ Plan_Acc_Seg_Ciud_Abr. 2026.csv"

def run_preparation():
    print("=== Paso 2: Preparación y Fusión de Datasets ===")
    
    # 1. Cargar Datos
    print("-> Cargando Dataset 1 (Serie Histórica)...")
    df_hist = pd.read_csv(DATASET_1_CSV, low_memory=False)
    
    print("-> Cargando Dataset 2 (Tendencia/Target)...")
    df_tend = pd.read_csv(DATASET_2_CSV, low_memory=False)
    
    # 2. Estandarizar Nombres de Columnas para el Cruce
    # Dataset 2 usa 'INDICADORES_DASH' en lugar de 'INDICADOR'
    df_tend = df_tend.rename(columns={'INDICADORES_DASH': 'INDICADOR'})
    
    # 3. Cruzar (Merge)
    # Como Científico de Datos, cruzamos la historia (X) con el target resumen (y)
    print("-> Realizando Merge (Left Join) basado en AMBITO, UBIGEO_DASH e INDICADOR...")
    
    df_merged = pd.merge(
        df_hist, 
        df_tend[['AMBITO', 'UBIGEO_DASH', 'INDICADOR', 'TENDENCIA']], 
        on=['AMBITO', 'UBIGEO_DASH', 'INDICADOR'],
        how='left'
    )
    
    # 4. Verificación de Calidad
    nulos_post_merge = df_merged['TENDENCIA'].isnull().sum()
    print(f"-> Verificación: {nulos_post_merge} registros históricos quedaron sin etiqueta de tendencia.")
    
    if nulos_post_merge > 0:
        # Llenaremos con 'No Aplica' o similar, o simplemente lo dejamos para que el modelo lo ignore si es NaN
        df_merged['TENDENCIA'] = df_merged['TENDENCIA'].fillna('Sin Etiqueta')
    
    print(f"-> Dimensiones del dataset final enriquecido: {df_merged.shape}")
    
    # 5. Guardar dataset procesado
    # Usamos formato Parquet porque comprime al 20% del tamaño del CSV y guarda los tipos de datos nativos
    output_path = OUTPUT_DIR / "dataset_consolidado_X_y.parquet"
    print(f"-> Guardando dataset maestro en: {output_path.relative_to(BASE_DIR)} ...")
    
    df_merged.to_parquet(output_path, index=False)
    print("¡Preparación completada exitosamente! Listo para Modelado Predictivo (XGBoost).\n")
    
    print("--- Muestra de Columnas del Dataset Consolidado ---")
    print(df_merged.head(1).T)

if __name__ == "__main__":
    run_preparation()
