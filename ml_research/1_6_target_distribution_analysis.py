import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import os

# --- CONFIGURACIÓN VISUAL PREMIUM ---
sns.set_theme(
    style="white", 
    rc={
        "axes.spines.right": False, 
        "axes.spines.top": False,
        "axes.edgecolor": "#d3d3d3",
    }
)

BASE_DIR = Path(__file__).resolve().parent
INPUT_PATH = BASE_DIR / "data" / "processed" / "dataset_consolidado_X_y.parquet"
PLOTS_DIR = BASE_DIR / "eda_plots"

os.makedirs(PLOTS_DIR, exist_ok=True)

def analyze_target_distribution():
    print("=== Pipeline Step 1.6: Target Variable Distribution & Class Imbalance ===")
    
    if not INPUT_PATH.exists():
        print(f"Error: Dataset no encontrado en {INPUT_PATH}")
        return
        
    df = pd.read_parquet(INPUT_PATH)
    
    if 'TENDENCIA' not in df.columns:
        print("Error: La columna objetivo 'TENDENCIA' no se encuentra en el dataset.")
        return

    print("-> 1. Calculando proporciones de las clases (Imbalance ratio)...")
    conteo_clases = df['TENDENCIA'].value_counts()
    porcentaje_clases = df['TENDENCIA'].value_counts(normalize=True) * 100
    
    print("\n[Distribución de Clases - TENDENCIA]")
    for clase, conteo in conteo_clases.items():
        print(f"- {clase}: {conteo} registros ({porcentaje_clases[clase]:.2f}%)")
        
    # Visualización de la distribución del Target
    plt.figure(figsize=(10, 6))
    ax = sns.countplot(data=df, x='TENDENCIA', order=conteo_clases.index, hue='TENDENCIA', legend=False, palette="viridis")
    
    # Anotar porcentajes en las barras
    total = len(df['TENDENCIA'].dropna())
    for p in ax.patches:
        height = p.get_height()
        ax.text(p.get_x() + p.get_width()/2., height + (height * 0.02),
                f'{height/total:.1%}', ha="center", fontweight='bold')
                
    plt.title("Distribución de Clases de la Variable Objetivo (TENDENCIA)", pad=15, fontweight='bold')
    plt.xlabel("Clasificación de Tendencia", fontweight='bold')
    plt.ylabel("Cantidad de Registros", fontweight='bold')
    plt.savefig(PLOTS_DIR / "07_target_class_distribution.png", bbox_inches='tight', dpi=300)
    plt.close()

    print("\n-> Gráfico guardado en 'eda_plots/07_target_class_distribution.png'")
    
    # Advertencia experta de Modelado
    clase_mayoritaria = porcentaje_clases.iloc[0]
    if clase_mayoritaria > 70.0:
        print(f"\n[⚠️ ALERTA DE DESBALANCEO DE CLASES]")
        print(f"La clase '{porcentaje_clases.index[0]}' representa el {clase_mayoritaria:.2f}% de los datos.")
        print("Para la fase de entrenamiento, deberás aplicar técnicas como SMOTE, ADASYN,")
        print("undersampling, o configurar el parámetro 'scale_pos_weight' si usas XGBoost/LightGBM.")
    else:
        print("\n[OK] El dataset presenta un balance aceptable para entrenar modelos predictivos.")

if __name__ == "__main__":
    analyze_target_distribution()
