import pandas as pd
import numpy as np
import os
import xgboost as xgb
import optuna
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

# Desactivar logs detallados de optuna para no saturar la consola
optuna.logging.set_verbosity(optuna.logging.WARNING)

# Rutas
BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_PATH = Path(__file__).resolve().parent / "data" / "features" / "dataset_features_xgb.parquet"
MODEL_DIR = Path(__file__).resolve().parent / "models"

os.makedirs(MODEL_DIR, exist_ok=True)

def objective(trial, X_train, y_train, X_val, y_val):
    # Espacio de búsqueda de hiperparámetros (Bayesian Optimization)
    param = {
        'objective': 'multi:softmax',
        'num_class': 3,
        'n_estimators': trial.suggest_int('n_estimators', 50, 300),
        'max_depth': trial.suggest_int('max_depth', 3, 12),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        'gamma': trial.suggest_float('gamma', 0, 5),
        'reg_alpha': trial.suggest_float('reg_alpha', 1e-3, 10.0, log=True),
        'reg_lambda': trial.suggest_float('reg_lambda', 1e-3, 10.0, log=True),
        'random_state': 42,
        'n_jobs': -1,
        'eval_metric': 'mlogloss'
    }
    
    # Entrenar modelo con los parámetros sugeridos
    model = xgb.XGBClassifier(**param)
    model.fit(X_train, y_train)
    
    # Predecir en validación
    preds = model.predict(X_val)
    # Optimizaremos para maximizar el Accuracy (o podríamos usar f1_macro)
    accuracy = accuracy_score(y_val, preds)
    return accuracy

def run_tuning():
    print("=== Paso 6: Optimización Bayesiana de Hiperparámetros (Optuna) ===")
    
    print("-> Cargando dataset...")
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
    
    # Dividimos en Train y Test (Mismo de siempre)
    X_train_full, X_test, y_train_full, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Para Optuna, extraemos un set de Validación del Train (80/20 interno)
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_full, y_train_full, test_size=0.2, random_state=42, stratify=y_train_full
    )
    
    print("-> Iniciando Estudio Optuna (Buscando la configuración perfecta de XGBoost)...")
    print("   (Esto evaluará 20 combinaciones y puede tardar un par de minutos)")
    
    study = optuna.create_study(direction='maximize')
    study.optimize(lambda trial: objective(trial, X_train, y_train, X_val, y_val), n_trials=20)
    
    print("\n-> ¡Optimización Completada!")
    print(f"Mejor Accuracy en Validación: {study.best_value:.4f}")
    print("Mejores Hiperparámetros Encontrados:")
    for key, value in study.best_params.items():
        print(f"  {key}: {value}")
    
    # Entrenar el modelo final con TODO el conjunto de entrenamiento usando los mejores parámetros
    print("\n-> Entrenando Modelo Final Optimizado en todo el set de entrenamiento...")
    best_params = study.best_params
    best_params['objective'] = 'multi:softmax'
    best_params['num_class'] = 3
    best_params['random_state'] = 42
    best_params['n_jobs'] = -1
    best_params['eval_metric'] = 'mlogloss'
    
    final_model = xgb.XGBClassifier(**best_params)
    final_model.fit(X_train_full, y_train_full)
    
    # Evaluar en el Test Set intocable
    print("\n[RESULTADOS DEL MODELO OPTIMIZADO EN TEST SET]")
    y_pred = final_model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy General Final: {acc:.4f} ({acc*100:.2f}%)")
    
    print("\nReporte de Clasificación:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    
    # Guardar modelo
    model_path = MODEL_DIR / "xgboost_optimized.json"
    final_model.save_model(model_path)
    print(f"-> Modelo Optimizado guardado en: {model_path.relative_to(BASE_DIR)}")

if __name__ == "__main__":
    run_tuning()
