import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import os
import warnings

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

def analyze_spatial_autocorrelation():
    print("=== Pipeline Step 1.5: Spatial Autocorrelation & Regional Clusters ===")
    
    if not INPUT_PATH.exists():
        print(f"Error: Dataset no encontrado en {INPUT_PATH}")
        return
        
    df = pd.read_parquet(INPUT_PATH)
    
    print("-> 1. Evaluando métricas por código geográfico (UBIGEO_DASH)...")
    
    # Agrupamos por UBIGEO para obtener el promedio histórico de criminalidad por zona
    espacial_df = df.groupby(['UBIGEO_DASH', 'AMBITO'])['VALORES'].mean().reset_index()
    espacial_df = espacial_df.sort_values(by='VALORES', ascending=False)
    
    # Convertimos AMBITO a string para forzar el comportamiento discreto/categórico
    espacial_df['AMBITO'] = espacial_df['AMBITO'].astype(str)
    
    # Visualización de las 20 zonas/regiones con mayor incidencia histórica
    top_n = 20
    plt.figure(figsize=(14, 10)) # Ajuste de tamaño para evitar compresión
    ax = sns.barplot(data=espacial_df.head(top_n), x='VALORES', y='AMBITO', 
                palette="Reds_r", hue='AMBITO', legend=False, orient='h')
    # Evitar problemas si los nombres de región son largos o valores son extremos
    ax.set_xscale("symlog")
    plt.title(f"Top {top_n} Ámbitos con Mayor Densidad de Criminalidad Histórica", pad=15, fontweight='bold')
    plt.xlabel("Promedio de Incidencias (Escala Logarítmica)", fontweight='bold')
    plt.ylabel("Ámbito Geográfico (Código)", fontweight='bold')
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / "06_top_ambitos_criminalidad.png", bbox_inches='tight', dpi=300)
    plt.close()
    
    print("\n[Nota sobre Índice de Moran (Autocorrelación Espacial)]")
    print("Para calcular un Índice I de Moran matemáticamente estricto que detecte 'hotspots' (zonas calientes),")
    print("se requiere cruzar la columna UBIGEO_DASH con un archivo vectorial (Shapefile/GeoJSON) de los polígonos")
    print("del Perú para calcular la matriz de pesos espaciales (Spatial Weights Matrix).")
    print("\n-> Por ahora, hemos generado el ranking espacial de concentración en 'eda_plots/06_top_ambitos_criminalidad.png'.")
    
    # Advertencia para el Data Scientist
    try:
        import libpysal
        import esda
        print("-> Librerías de PySAL (libpysal, esda) detectadas. ¡Listo para el cálculo de Moran cuando se integren geometrías!")
    except ImportError:
        print("-> Tip: Para calcular el Índice de Moran en el futuro, instala: uv pip install geopandas libpysal esda")

if __name__ == "__main__":
    analyze_spatial_autocorrelation()
