import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INPUT_PATH = BASE_DIR / "data" / "processed" / "dataset_consolidado_X_y.parquet"
OUTPUT_DIR = BASE_DIR / "data" / "processed" / "dataset_limpio_X_y.parquet"

def process_outliers():
    print("=== Pipeline Step 1.4: Automated Outlier Treatment (Data Cleansing) ===")
    
    if not INPUT_PATH.exists():
        print(f"Error: Dataset no encontrado en {INPUT_PATH}")
        return
        
    df = pd.read_parquet(INPUT_PATH)
    total_inicial = len(df)
    print(f"-> Cargando dataset consolidado. Dimensiones iniciales: {df.shape}")
    
    # Implementing robust IQR-based filtering per indicator
    def filter_iqr(group):
        Q1 = group['VALORES'].quantile(0.25)
        Q3 = group['VALORES'].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        return group[(group['VALORES'] >= lower_bound) & (group['VALORES'] <= upper_bound)]

    print("-> Aplicando algoritmo de filtrado espacial y estadístico (IQR Múltiple)...")
    df_limpio = df.groupby('INDICADOR', group_keys=False).apply(filter_iqr).reset_index(drop=True)
    
    filas_eliminadas = total_inicial - len(df_limpio)
    porcentaje = (filas_eliminadas / total_inicial) * 100
    
    print("\n[Resultados del Filtrado]")
    print(f"Registros originales:  {total_inicial}")
    print(f"Registros retenidos:   {len(df_limpio)}")
    print(f"Outliers removidos:    {filas_eliminadas} ({porcentaje:.2f}% de pérdida de información)")
    
    OUTPUT_DIR.parent.mkdir(parents=True, exist_ok=True)
    df_limpio.to_parquet(OUTPUT_DIR, index=False)
    
    print(f"\n-> Dataset óptimo (limpio) exportado exitosamente a: {OUTPUT_DIR.relative_to(BASE_DIR)}")

if __name__ == "__main__":
    process_outliers()
