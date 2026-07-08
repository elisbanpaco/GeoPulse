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
        "axes.labelcolor": "#333333",
        "font.family": "sans-serif",
    }
)

BASE_DIR = Path(__file__).resolve().parent
INPUT_PATH = BASE_DIR / "data" / "processed" / "dataset_consolidado_X_y.parquet"
PLOTS_DIR = BASE_DIR / "eda_plots"

os.makedirs(PLOTS_DIR, exist_ok=True)

def analyze_multivariate_spatial():
    print("=== Pipeline Step 1.2: Multivariate & Spatial Analysis ===")
    
    if not INPUT_PATH.exists():
        print(f"Error: Dataset no encontrado en {INPUT_PATH}")
        return
        
    df = pd.read_parquet(INPUT_PATH)
    
    # 1. Outlier Detection by Category
    print("-> 1. Evaluando dispersión espacial y atípicos por indicador (Boxplots)...")
    
    # Clonamos para no alterar el DataFrame original y convertimos INDICADOR a categórica/string
    df_plot = df.copy()
    df_plot['INDICADOR'] = df_plot['INDICADOR'].astype(str)
    
    # Ordenar los indicadores numéricamente como strings (ej. 1, 2, ... 80)
    try:
        df_plot['INDICADOR_NUM'] = pd.to_numeric(df_plot['INDICADOR'], errors='coerce')
        df_plot = df_plot.sort_values(by='INDICADOR_NUM').drop(columns=['INDICADOR_NUM'])
    except Exception:
        df_plot = df_plot.sort_values(by='INDICADOR')
        
    plt.figure(figsize=(12, 10)) # Rediseñado para evitar espacios vacíos gigantes
    ax = sns.boxplot(x='VALORES', y='INDICADOR', data=df_plot, hue='INDICADOR', legend=False,
                palette="flare", linewidth=1.2, fliersize=2.5, width=0.6)
    ax.set_xscale("symlog") # Escala simétrica logarítmica para manejar outliers sin deformar cajas
    plt.title("Distribución y Detección de Valores Atípicos por Indicador (Categorías Reales)", pad=15, fontweight='bold', fontsize=14)
    plt.xlabel("Métricas Registradas (Valores - Escala Logarítmica)", fontweight='bold')
    plt.ylabel("Indicador de Seguridad (Código)", fontweight='bold')
    plt.yticks(fontsize=9)
    plt.grid(axis='x', linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "02_boxplots_indicadores.png", bbox_inches='tight', dpi=300)
    plt.close()

    # 2. Multivariate Correlation (Spearman)
    print("-> 2. Generando matriz de correlación multivariante (Spearman)...")
    try:
        df_pivot = df.pivot_table(index=['UBIGEO_DASH', 'ANIO'], columns='INDICADOR', values='VALORES', aggfunc='mean')
        corr_matrix = df_pivot.corr(method='spearman')
        
        plt.figure(figsize=(24, 20)) # Tamaño de figura mucho más grande para abarcar todo
        sns.heatmap(corr_matrix, annot=False, cmap='vlag', vmin=-1, vmax=1,
                    linewidths=0.1, linecolor='white', square=True,
                    cbar_kws={"shrink": .8, "label": "Correlación de Spearman"})
        plt.title("Matriz de Correlación Multivariante (Spearman)", pad=20, fontweight='bold', fontsize=20)
        plt.xticks(rotation=90, ha='right', fontsize=8) # Rotación para acomodar nombres
        plt.yticks(rotation=0, fontsize=8)
        plt.tight_layout()
        plt.savefig(PLOTS_DIR / "05_heatmap_correlacion.png", bbox_inches='tight', dpi=300)
        plt.close()
    except Exception as e:
        print(f"   [Advertencia]: No se pudo generar la matriz de correlación ({e})")

    # 3. Spatial Variance Testing (Kruskal-Wallis)
    print("-> 3. Analizando varianza espacial (Kruskal-Wallis Test)...")
    regiones = [group["VALORES"].dropna().values for name, group in df.groupby("AMBITO") if len(group) > 0]
    
    if len(regiones) > 1:
        stat_kw, p_kw = stats.kruskal(*regiones)
        print("\n[Resultados - Kruskal-Wallis]")
        print(f"Estadístico = {stat_kw:.2f}, p-value = {p_kw:.5e}")
        if p_kw < 0.05:
            print("-> Conclusión: Existe una diferencia estadísticamente significativa entre los ámbitos/regiones.")
        else:
            print("-> Conclusión: Las distribuciones entre regiones no difieren significativamente.")

if __name__ == "__main__":
    analyze_multivariate_spatial()
