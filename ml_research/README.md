# ML Research - GeoPulse

Este subproyecto contiene el pipeline de experimentación e investigación de Machine Learning para el proyecto **GeoPulse**. El objetivo principal es clasificar y predecir tendencias (creciente, decreciente, irregular) utilizando datos históricos y variables proyectadas.

## 📁 Estructura del Proyecto

El flujo de trabajo está dividido en 7 scripts secuenciales que componen todo el ciclo de vida del desarrollo del modelo:

- `1_data_ingestion.py`: Carga los datasets iniciales desde los directorios `data/dataset1/` y `data/dataset2/`.
- `2_data_preparation.py`: Realiza el cruce y limpieza de los datos históricos junto a las etiquetas de tendencia (target), exportando el dataset consolidado en formato Parquet a `data/processed/`.
- `3_feature_engineering.py`: Preprocesa y genera nuevas variables relevantes como retardos (lags `t-1`, `t-2`) y variaciones porcentuales anuales, guardando las nuevas características en `data/features/`.
- `4_model_training.py`: Entrena un modelo clasificador inicial (Baseline) utilizando **XGBoost** y guarda los pesos en `models/xgboost_baseline.json`.
- `5_model_evaluation.py`: Evalúa de forma profunda el modelo base, produciendo métricas e interpretabilidad (matriz de confusión e importancia de características) guardados como gráficos en `eval/`.
- `6_hyperparameter_tuning.py`: Optimiza los hiperparámetros de XGBoost de forma automática utilizando Optimización Bayesiana con **Optuna**. Exporta el modelo más preciso a `models/xgboost_optimized.json`.
- `7_evaluate_overfitting.py`: Analiza las diferencias entre el accuracy de entrenamiento y prueba para los modelos base y optimizado, asegurando que no haya sobreajuste o subajuste excesivo.

## 🚀 Instalación y Configuración

El proyecto emplea `uv` como empaquetador moderno y define sus dependencias en `pyproject.toml`. Se requiere tener **Python >= 3.13**.

1. Instalar el entorno e instalar dependencias usando `uv`:
   ```bash
   uv sync
   ```

2. Activar el entorno virtual creado:
   ```bash
   source .venv/bin/activate  # En Linux/macOS
   # O en Windows: .venv\Scripts\activate
   ```

## ⚙️ Ejecución del Pipeline

Para reproducir el entorno y ejecutar los experimentos, debes correr los scripts de forma ordenada:

```bash
python 1_data_ingestion.py
python 2_data_preparation.py
python 3_feature_engineering.py
python 4_model_training.py
python 5_model_evaluation.py
python 6_hyperparameter_tuning.py
python 7_evaluate_overfitting.py
```

## 📊 Archivos y Outputs Ignorados (.gitignore)

Al ejecutar los scripts, se generarán varios artefactos intermedios y de salida que **no se deben subir al repositorio**:
- `data/processed/` y `data/features/`: Transformaciones intermedias y datos vectorizados (formato Parquet) bastante pesados.
- `models/`: Archivos `.json` generados que guardan los árboles binarios del XGBoost.
- `eval/`: Imágenes `.png` generadas durante la evaluación de métricas y comportamientos de entrenamiento.
