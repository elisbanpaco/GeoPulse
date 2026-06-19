import pandas as pd
from pathlib import Path

# Configurar rutas
BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_DIR = BASE_DIR / "data"

DATASET_1_CSV = INPUT_DIR / "dataset1" / "DATASET_Ind_ Plan_Acc_Seg_Ciud_2009 a Abr. 2026.csv"
DATASET_2_CSV = INPUT_DIR / "dataset2" / "DATASET_Ten_ Plan_Acc_Seg_Ciud_Abr. 2026.csv"

def run_ingestion():
    print("=== Paso 1: Ingesta de Datos ===")
    
    # Cargar Dataset 1
    print(f"-> Leyendo Dataset 1: {DATASET_1_CSV.name}")
    df1 = pd.read_csv(DATASET_1_CSV, low_memory=False)
    print(f"Dataset 1 cargado. Filas: {df1.shape[0]}, Columnas: {df1.shape[1]}")
    
    # Cargar Dataset 2
    print(f"-> Leyendo Dataset 2: {DATASET_2_CSV.name}")
    df2 = pd.read_csv(DATASET_2_CSV, low_memory=False)
    print(f"Dataset 2 cargado. Filas: {df2.shape[0]}, Columnas: {df2.shape[1]}")
    
    # Mostrar una muestra de los datos
    print("\n--- Muestra Dataset 1 ---")
    print(df1.head(3))
    
    print("\n--- Muestra Dataset 2 ---")
    print(df2.head(3))

if __name__ == "__main__":
    run_ingestion()
