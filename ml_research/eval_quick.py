import pandas as pd
import xgboost as xgb
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

INPUT_PATH = Path("data/features/dataset_features_xgb.parquet")
MODEL_PATH = Path("models/xgboost_baseline.json")

df = pd.read_parquet(INPUT_PATH)
valid_labels = ['Tendencia creciente', 'Tendencia decreciente', 'Tendencia irregular']
df = df[df['TENDENCIA'].isin(valid_labels)].copy()

le = LabelEncoder()
y = le.fit_transform(df['TENDENCIA'])

features = ['AMBITO', 'INDICADOR', 'ANIO', 'VALORES', 'POBLACION_PROYECTADA', 'CLASIF', 'VALOR_lag_1', 'VALOR_lag_2', 'Crecimiento_Anual_Pct']
X = df[features].fillna(0)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

model = xgb.XGBClassifier()
model.load_model(MODEL_PATH)
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"ACCURACY: {acc}")
print(classification_report(y_test, y_pred, target_names=le.classes_))
