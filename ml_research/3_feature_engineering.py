import pandas as pd
from pathlib import Path
import os

# Configuración de Rutas
BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_PATH = Path(__file__).resolve().parent / "data" / "processed" / "dataset_limpio_X_y.parquet"
OUTPUT_DIR = Path(__file__).resolve().parent / "data" / "features"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def run_feature_engineering():
    print("=== Paso 3: Feature Engineering (Ingeniería de Características) ===")
    
    print("-> Cargando dataset consolidado...")
    df = pd.read_parquet(INPUT_PATH)
    
    # 1. Ordenar los datos temporalmente para cada ubigeo e indicador
    # Esto es CRÍTICO antes de calcular variables rezagadas (lags)
    print("-> Ordenando datos por UBIGEO, INDICADOR y AÑO...")
    df = df.sort_values(by=['UBIGEO_DASH', 'INDICADOR', 'ANIO'])
    
    # 2. Creación de Lag Features (Variables Rezagadas)
    # XGBoost y Random Forest no entienden la secuencia temporal por defecto (como las LSTM).
    # Debemos "enseñarles" el pasado explícitamente en la misma fila.
    print("-> Creando variables rezagadas (Lags: t-1, t-2)...")
    
    # Agrupamos por Ubigeo e Indicador para no mezclar datos de distintos lugares/métricas
    grouped = df.groupby(['UBIGEO_DASH', 'INDICADOR'])
    
    # Valor del año anterior (t-1)
    df['VALOR_lag_1'] = grouped['VALORES'].shift(1)
    
    # Valor de hace dos años (t-2)
    df['VALOR_lag_2'] = grouped['VALORES'].shift(2)
    
    # 3. Creación de Variables Derivadas (Deltas/Crecimiento)
    print("-> Calculando variaciones porcentuales (Deltas)...")
    
    # Cuánto varió respecto al año anterior
    df['Crecimiento_Anual_Pct'] = (df['VALORES'] - df['VALOR_lag_1']) / (df['VALOR_lag_1'] + 1e-9)
    
    # 4. Limpieza post-Ingeniería
    # Los primeros años de cada serie no tendrán t-1 o t-2, tendrán NaN. 
    # Para entrenar modelos, a menudo eliminamos estas filas o las imputamos.
    nulos_generados = df['VALOR_lag_1'].isnull().sum()
    print(f"-> Nota: Se generaron {nulos_generados} valores nulos por el lag (primeros años de las series).")
    
    # Llenaremos con 0 o imputaremos luego, por ahora dejamos el dataset con los NaN explícitos
    # o llenamos hacia atrás (bfill) por grupo para no perder demasiada data en un dataset tan corto
    df['VALOR_lag_1'] = df.groupby(['UBIGEO_DASH', 'INDICADOR'])['VALOR_lag_1'].bfill()
    df['VALOR_lag_2'] = df.groupby(['UBIGEO_DASH', 'INDICADOR'])['VALOR_lag_2'].bfill()
    df['Crecimiento_Anual_Pct'] = df['Crecimiento_Anual_Pct'].fillna(0)
    
    # 5. Guardar dataset con features
    output_path = OUTPUT_DIR / "dataset_features_xgb.parquet"
    print(f"-> Guardando dataset final para XGBoost en: {output_path.relative_to(BASE_DIR)} ...")
    
    df.to_parquet(output_path, index=False)
    print("¡Feature Engineering completado con éxito!\n")
    
    print("--- Muestra de las Nuevas Features (Ultimas Columnas) ---")
    print(df[['ANIO', 'VALORES', 'VALOR_lag_1', 'VALOR_lag_2', 'Crecimiento_Anual_Pct', 'TENDENCIA']].head(4))

if __name__ == "__main__":
    run_feature_engineering()
