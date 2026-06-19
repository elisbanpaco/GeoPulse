import pandas as pd
import numpy as np
import os
import xgboost as xgb
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

# Configuración de Rutas
BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_PATH = Path(__file__).resolve().parent / "data" / "features" / "dataset_features_xgb.parquet"
MODEL_DIR = Path(__file__).resolve().parent / "models"

os.makedirs(MODEL_DIR, exist_ok=True)

def run_model_training():
    print("=== Paso 4: Modelado Predictivo (XGBoost) ===")
    
    print("-> Cargando dataset con features...")
    df = pd.read_parquet(INPUT_PATH)
    
    print(f"Dimensión inicial: {df.shape}")
    
    # 1. Filtro de Etiquetas Válidas
    # No podemos entrenar sobre la categoría 'Sin Etiqueta' o 'No aplica' si queremos 
    # clasificar tendencias reales.
    valid_labels = ['Tendencia creciente', 'Tendencia decreciente', 'Tendencia irregular']
    df = df[df['TENDENCIA'].isin(valid_labels)].copy()
    
    print(f"Dimensión post-filtro de etiquetas válidas: {df.shape}")
    
    # 2. Codificación del Target (y)
    le = LabelEncoder()
    y = le.fit_transform(df['TENDENCIA'])
    # Mostrar qué clase es qué número
    print("-> Clases del Target:", dict(zip(le.classes_, range(len(le.classes_)))))
    
    # 3. Selección de Features (X)
    # Seleccionamos las variables numéricas que alimentarán al modelo
    features = [
        'AMBITO', 'INDICADOR', 'ANIO', 'VALORES', 
        'POBLACION_PROYECTADA', 'CLASIF', 
        'VALOR_lag_1', 'VALOR_lag_2', 'Crecimiento_Anual_Pct'
    ]
    
    # Llenamos nulos restantes (si los hay) de forma muy básica para el baseline
    X = df[features].fillna(0)
    
    # 4. División Train / Test (80% Entrenamiento, 20% Prueba)
    print("-> Dividiendo dataset (Train 80% / Test 20%)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # 5. Entrenamiento del Modelo XGBoost
    print("-> Entrenando XGBoost Classifier (Baseline)...")
    model = xgb.XGBClassifier(
        objective='multi:softmax', 
        num_class=3,
        n_estimators=100, 
        max_depth=6, 
        learning_rate=0.1,
        random_state=42,
        eval_metric='mlogloss',
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # 6. Evaluación
    print("-> Evaluando predicciones...")
    y_pred = model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[RESULTADOS DEL MODELO BASELINE]")
    print(f"Accuracy General: {acc:.4f} ({acc*100:.2f}%)")
    
    print("\nReporte de Clasificación (F1-Score, Precisión, Recall):")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    
    # 7. Guardar el Modelo
    model_path = MODEL_DIR / "xgboost_baseline.json"
    model.save_model(model_path)
    print(f"-> Modelo guardado en: {model_path.relative_to(BASE_DIR)}")

if __name__ == "__main__":
    run_model_training()
