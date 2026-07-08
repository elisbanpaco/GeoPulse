import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import os
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller

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

def analyze_temporal_dynamics():
    print("=== Pipeline Step 1.3: Temporal Dynamics & Trend Analysis ===")
    
    if not INPUT_PATH.exists():
        print(f"Error: Dataset no encontrado en {INPUT_PATH}")
        return
        
    df = pd.read_parquet(INPUT_PATH)
    
    # 1. Temporal Trends Visualization
    print("-> 1. Generando visualización de tendencias temporales...")
    plt.figure(figsize=(14, 6))
    ax_line = sns.lineplot(data=df, x='ANIO', y='VALORES', estimator='mean', errorbar=None,
                           linewidth=2.5, color="#10b981", marker="o", markersize=8)
    promedios = df.groupby('ANIO')['VALORES'].mean().reset_index()
    plt.fill_between(promedios['ANIO'], promedios['VALORES'], color="#10b981", alpha=0.1)
    
    plt.title("Evolución Histórica de la Criminalidad (Promedio)", pad=15, fontweight='bold', fontsize=16)
    plt.xlabel("Año", fontweight='bold')
    plt.ylabel("Promedio de Incidencias", fontweight='bold')
    plt.xticks(df['ANIO'].unique().astype(int))
    plt.grid(axis='y', linestyle='--', alpha=0.5)
    plt.savefig(PLOTS_DIR / "04_tendencia_temporal.png", bbox_inches='tight', dpi=300)
    plt.close()

    # 2. Stationarity Analysis (ADF)
    print("\n-> 2. Evaluación de Estacionariedad (Augmented Dickey-Fuller)...")
    serie_temporal = df.groupby('ANIO')['VALORES'].mean().dropna()
    if len(serie_temporal) > 3:
        resultado_adf = adfuller(serie_temporal)
        p_adf = resultado_adf[1]
        print("\n[Resultados - ADF Test]")
        print(f"Estadístico ADF: {resultado_adf[0]:.4f}")
        print(f"p-value: {p_adf:.5f}")
        if p_adf < 0.05:
            print("-> Conclusión: La serie es ESTACIONARIA (No hay tendencia dependiente del tiempo fuerte).")
        else:
            print("-> Conclusión: La serie NO ES ESTACIONARIA (Presencia de tendencia o raíz unitaria).")

    # 3. Temporal Trend Impact (OLS)
    print("\n-> 3. Análisis de impacto del factor temporal (Regresión OLS)...")
    df_reg = df.dropna(subset=['ANIO', 'VALORES']).copy()
    if not df_reg.empty:
        X = sm.add_constant(df_reg['ANIO']) 
        y = df_reg['VALORES']
        modelo_ols = sm.OLS(y, X).fit()
        p_year = modelo_ols.pvalues['ANIO']
        coef_year = modelo_ols.params['ANIO']
        
        print("\n[Resultados - OLS Regression]")
        print(f"Coeficiente (Año): {coef_year:.4f}")
        print(f"p-value (Año): {p_year:.5e}")
        if p_year < 0.05:
            print("-> Conclusión: El tiempo tiene un efecto lineal estadísticamente significativo sobre los valores.")
        else:
            print("-> Conclusión: El tiempo no muestra un efecto lineal significativo.")

if __name__ == "__main__":
    analyze_temporal_dynamics()
