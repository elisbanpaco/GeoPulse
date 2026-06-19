import pandas as pd
import xgboost as xgb
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder

BASE_DIR = Path(__file__).resolve().parent.parent
INPUT_PATH = Path(__file__).resolve().parent / "data" / "features" / "dataset_features_xgb.parquet"
MODEL_BASE = Path(__file__).resolve().parent / "models" / "xgboost_baseline.json"
MODEL_OPT = Path(__file__).resolve().parent / "models" / "xgboost_optimized.json"

def evaluate_overfitting():
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
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # 1. Baseline
    model_base = xgb.XGBClassifier()
    model_base.load_model(MODEL_BASE)
    
    acc_train_base = accuracy_score(y_train, model_base.predict(X_train))
    acc_test_base = accuracy_score(y_test, model_base.predict(X_test))
    
    # 2. Optimized
    model_opt = xgb.XGBClassifier()
    model_opt.load_model(MODEL_OPT)
    
    acc_train_opt = accuracy_score(y_train, model_opt.predict(X_train))
    acc_test_opt = accuracy_score(y_test, model_opt.predict(X_test))
    
    print("=== Análisis de Overfitting/Underfitting ===")
    print(f"Modelo BASELINE:")
    print(f"  Accuracy Entrenamiento: {acc_train_base:.4f}")
    print(f"  Accuracy Prueba (Test): {acc_test_base:.4f}")
    print(f"  Brecha (Gap): {acc_train_base - acc_test_base:.4f}\n")
    
    print(f"Modelo OPTIMIZADO (Optuna):")
    print(f"  Accuracy Entrenamiento: {acc_train_opt:.4f}")
    print(f"  Accuracy Prueba (Test): {acc_test_opt:.4f}")
    print(f"  Brecha (Gap): {acc_train_opt - acc_test_opt:.4f}")

if __name__ == "__main__":
    evaluate_overfitting()
