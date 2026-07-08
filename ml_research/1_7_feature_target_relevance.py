import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import os
from scipy import stats

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

def analyze_feature_target_relevance():
    print("=== Pipeline Step 1.7: Feature Relevance & Target Bivariate Analysis ===")
    
    if not INPUT_PATH.exists():
        print(f"Error: Dataset no encontrado en {INPUT_PATH}")
        return
        
    df = pd.read_parquet(INPUT_PATH)
    
    if 'TENDENCIA' not in df.columns:
        print("Error: La columna objetivo 'TENDENCIA' no se encuentra en el dataset.")
        return

    print("-> 1. Evaluando la separabilidad de clases según la variable de magnitud (VALORES)...")
    
    plt.figure(figsize=(12, 7))
    sns.boxplot(data=df, x='TENDENCIA', y='VALORES', hue='TENDENCIA', legend=False, palette="Set2", showfliers=False)
    plt.title("Distribución de Valores (Incidencias) Agrupados por Tendencia (Target)", pad=15, fontweight='bold')
    plt.xlabel("Tendencia (Target)", fontweight='bold')
    plt.ylabel("Magnitud de Valores", fontweight='bold')
    plt.savefig(PLOTS_DIR / "08_relevance_valores_vs_target_box.png", bbox_inches='tight', dpi=300)
    plt.close()

    print("-> 2. Calculando Poder Predictivo (Kruskal-Wallis para Feature vs Target)...")
    # Agrupar valores numéricos por cada clase del target
    grupos_tendencia = [group["VALORES"].dropna().values for name, group in df.groupby("TENDENCIA") if len(group) > 0]
    
    if len(grupos_tendencia) > 1:
        stat, p_val = stats.kruskal(*grupos_tendencia)
        print("\n[Test de Relevancia Estadística de 'VALORES' frente al Target]")
        print(f"Kruskal-Wallis Estadístico: {stat:.4f}")
        print(f"p-value: {p_val:.5e}")
        if p_val < 0.05:
            print("-> Fuerte Poder Predictivo: Las magnitudes de criminalidad separan muy bien las tendencias.")
        else:
            print("-> Bajo Poder Predictivo: La variable VALORES por sí sola no separa bien el target.")

    print("\n-> 3. Evaluando la relación categórica (Indicadores vs Target)...")
    # Tabla de contingencia cruzada
    cross_tab = pd.crosstab(df['INDICADOR'], df['TENDENCIA'], normalize='index') * 100
    
    plt.figure(figsize=(14, 8))
    cross_tab.plot(kind='bar', stacked=True, colormap='viridis', figsize=(14, 8), width=0.8)
    plt.title("Proporción de Clases Objetivo (Tendencia) por cada Tipo de Indicador", pad=15, fontweight='bold')
    plt.xlabel("Indicador de Criminalidad", fontweight='bold')
    plt.ylabel("Porcentaje de Pertenencia a la Clase (%)", fontweight='bold')
    plt.legend(title='Tendencia', bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "09_relevance_indicadores_vs_target_stacked.png", bbox_inches='tight', dpi=300)
    plt.close()

    print("\n-> Gráficos guardados en 'eda_plots/'. El EDA Predictivo está completo.")

if __name__ == "__main__":
    analyze_feature_target_relevance()
