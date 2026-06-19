import pandas as pd
import numpy as np
import os
import xgboost as xgb
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# Rutas
BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_PATH = Path(__file__).resolve().parent / "data" / "features" / "dataset_features_xgb.parquet"
MODEL_PATH = Path(__file__).resolve().parent / "models" / "xgboost_baseline.json"
EVAL_DIR = Path(__file__).resolve().parent / "eval"

os.makedirs(EVAL_DIR, exist_ok=True)

def run_evaluation():
    print("=== Paso 5: Evaluación Profunda e Interpretabilidad ===")
    
    # 1. Cargar Datos y Recrear Test Set
    df = pd.read_parquet(INPUT_PATH)
    valid_labels = ['Tendencia creciente', 'Tendencia decreciente', 'Tendencia irregular']
    df = df[df['TENDENCIA'].isin(valid_labels)].copy()
    
    le = LabelEncoder()
    y = le.fit_transform(df['TENDENCIA'])
    
    features = [
        'AMBITO', 'INDICADOR', 'ANIO', 'VALORES', 
        'POBLACION_PROYECTADA', 'CLASIF', 
        'VALOR_lag_1', 'VALOR_lag_2', 'Crecimiento_Anual_Pct'
    ]
    X = df[features].fillna(0)
    
    # Mismo random_state para garantizar el mismo Test Set
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # 2. Cargar Modelo
    print("-> Cargando el modelo entrenado...")
    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)
    
    # 3. Predicciones
    y_pred = model.predict(X_test)
    
    # 4. Feature Importance (Importancia de Variables)
    print("\n[IMPORTANCIA DE LAS VARIABLES (FEATURE IMPORTANCE)]")
    importances = model.feature_importances_
    feat_imp = pd.DataFrame({'Feature': features, 'Importance': importances})
    feat_imp = feat_imp.sort_values(by='Importance', ascending=False)
    
    for idx, row in feat_imp.iterrows():
        print(f"{row['Feature']:25s} : {row['Importance']:.4f}")
        
    # Guardar gráfico de Importancia
    plt.figure(figsize=(10, 6))
    sns.barplot(x='Importance', y='Feature', data=feat_imp, palette='viridis')
    plt.title("Importancia de Variables (XGBoost)")
    plt.tight_layout()
    plt.savefig(EVAL_DIR / "feature_importance.png")
    plt.close()
    
    # 5. Matriz de Confusión
    print("\n[MATRIZ DE CONFUSIÓN]")
    cm = confusion_matrix(y_test, y_pred)
    
    # Imprimir en texto
    print(f"                Pred_Creciente   Pred_Decreciente  Pred_Irregular")
    print(f"Real_Creciente  {cm[0,0]:14d} {cm[0,1]:18d} {cm[0,2]:15d}")
    print(f"Real_Decrecien  {cm[1,0]:14d} {cm[1,1]:18d} {cm[1,2]:15d}")
    print(f"Real_Irregular  {cm[2,0]:14d} {cm[2,1]:18d} {cm[2,2]:15d}")
    
    # Guardar gráfico de Matriz de Confusión
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=le.classes_, yticklabels=le.classes_)
    plt.title("Matriz de Confusión")
    plt.ylabel('Real')
    plt.xlabel('Predicción')
    plt.tight_layout()
    plt.savefig(EVAL_DIR / "confusion_matrix.png")
    plt.close()
    
    print(f"\n-> Gráficos guardados en el directorio: {EVAL_DIR.relative_to(BASE_DIR)}")

if __name__ == "__main__":
    run_evaluation()
