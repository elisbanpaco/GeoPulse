import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import os
import missingno as msno
from scipy import stats

# --- CONFIGURACIÓN VISUAL PREMIUM ---
sns.set_theme(
    style="white", 
    rc={
        "axes.spines.right": False, 
        "axes.spines.top": False,
        "axes.edgecolor": "#d3d3d3",
        "axes.labelcolor": "#333333",
        "text.color": "#333333",
        "xtick.color": "#555555",
        "ytick.color": "#555555",
        "font.family": "sans-serif",
        "font.sans-serif": ["Inter", "Roboto", "Arial"],
        "axes.titlesize": 16,
        "axes.labelsize": 12,
    }
)

BASE_DIR = Path(__file__).resolve().parent
INPUT_PATH = BASE_DIR / "data" / "processed" / "dataset_consolidado_X_y.parquet"
PLOTS_DIR = BASE_DIR / "eda_plots"

os.makedirs(PLOTS_DIR, exist_ok=True)

def analyze_data_quality():
    print("=== Pipeline Step 1.1: Data Quality & Univariate Distribution ===")
    
    if not INPUT_PATH.exists():
        print(f"Error: Dataset no encontrado en {INPUT_PATH}")
        return
        
    df = pd.read_parquet(INPUT_PATH)
    print(f"Dataset cargado exitosamente. Dimensiones: {df.shape}")
    
    # 1. Missing Values Assessment
    print("-> 1. Generando matriz de valores faltantes (Missingno)...")
    fig_msno = plt.figure(figsize=(12, 6))
    ax_msno = fig_msno.add_subplot(111)
    msno.matrix(df, ax=ax_msno, sparkline=False, color=(0.17, 0.50, 0.72))
    ax_msno.set_title("Matriz de Valores Nulos por Atributo", pad=20, fontweight='bold', fontsize=16)
    plt.savefig(PLOTS_DIR / "01_valores_nulos_matriz.png", bbox_inches='tight', dpi=300)
    plt.close()

    # 2. Univariate Distribution
    print("-> 2. Evaluando distribución general (Histograma & KDE)...")
    plt.figure(figsize=(10, 6))
    sns.histplot(df['VALORES'].dropna(), bins=60, kde=True, 
                 color="#2563eb", edgecolor="white", linewidth=0.5, alpha=0.8)
    plt.title("Densidad y Distribución General de los Delitos", pad=15, fontweight='bold')
    plt.xlabel("Valores Numéricos", fontweight='bold')
    plt.ylabel("Frecuencia", fontweight='bold')
    plt.savefig(PLOTS_DIR / "03_distribucion_valores_kde.png", bbox_inches='tight', dpi=300)
    plt.close()

    # 3. Normality Statistical Testing (Shapiro-Wilk)
    print("-> 3. Ejecutando prueba de normalidad (Shapiro-Wilk)...")
    muestra_shapiro = df['VALORES'].dropna().sample(n=min(5000, len(df)), random_state=42)
    stat, p_value_norm = stats.shapiro(muestra_shapiro)
    
    print("\n[Resultados - Shapiro-Wilk]")
    if p_value_norm < 0.05:
        print(f"p-value = {p_value_norm:.5e} -> Rechazamos H0. La distribución difiere significativamente de la normal.")
    else:
        print(f"p-value = {p_value_norm:.5e} -> No podemos rechazar H0. Los datos asumen normalidad.")
        
    print(f"\n-> Gráficos guardados en '{PLOTS_DIR.name}/'")

if __name__ == "__main__":
    analyze_data_quality()
