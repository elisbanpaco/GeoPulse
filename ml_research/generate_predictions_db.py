import pandas as pd
import xgboost as xgb
from pathlib import Path
from sklearn.preprocessing import LabelEncoder
import numpy as np
import json

# Paths
FEATURES_PATH = Path("data/features/dataset_features_xgb.parquet")
MODEL_PATH = Path("models/xgboost_optimized.json")
OUTPUT_CSV = Path("../api/data/predictions.csv")

print("Cargando features...")
df = pd.read_parquet(FEATURES_PATH)

# Valid labels
valid_labels = ['Tendencia creciente', 'Tendencia decreciente', 'Tendencia irregular']
df = df[df['TENDENCIA'].isin(valid_labels)].copy()

# Encoders
le = LabelEncoder()
y = le.fit_transform(df['TENDENCIA'])

features = [
    'AMBITO', 'INDICADOR', 'ANIO', 'VALORES',
    'POBLACION_PROYECTADA', 'CLASIF',
    'VALOR_lag_1', 'VALOR_lag_2', 'Crecimiento_Anual_Pct'
]

X = df[features].fillna(0)

print("Cargando modelo...")
model = xgb.XGBClassifier()
model.load_model(MODEL_PATH)

print("Generando predicciones...")
y_pred = model.predict(X)
y_prob = model.predict_proba(X)

df['PRED_TENDENCIA'] = le.inverse_transform(y_pred)
df['PRED_PROB'] = np.max(y_prob, axis=1)

# Queremos la predicción más reciente (del año más alto para cada combinación de departamento e indicador)
# En el dataset, COD_DPTO se puede obtener de UBIGEO_DASH
def extract_dpto(ubigeo):
    try:
        # Convertir a float y luego int
        u_str = str(int(float(ubigeo)))
    except:
        u_str = str(ubigeo)
    if len(u_str) % 2 != 0:
        u_str = "0" + u_str
    # Rellenar a 6 caracteres si es ubigeo
    u_str = u_str.ljust(6, '0')
    return u_str[:2]

df['COD_DPTO'] = df['UBIGEO_DASH'].apply(extract_dpto)

# Filtrar para obtener el último año disponible por departamento e indicador
idx_latest = df.groupby(['COD_DPTO', 'INDICADOR'])['ANIO'].idxmax()
df_latest = df.loc[idx_latest].copy()

# Guardar un subconjunto limpio para la API
output_df = df_latest[[
    'COD_DPTO', 'AMBITO', 'INDICADOR', 'ANIO', 'VALORES',
    'VALOR_lag_1', 'VALOR_lag_2', 'Crecimiento_Anual_Pct',
    'PRED_TENDENCIA', 'PRED_PROB'
]]

# Asegurar directorio de salida
OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
output_df.to_csv(OUTPUT_CSV, index=False)
print(f"Predicciones exportadas a {OUTPUT_CSV} ({len(output_df)} registros)")
