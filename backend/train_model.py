"""Train the demo crop classifier and report held-out metrics.

The bundled CSV is explicitly illustrative. Metrics describe only this file and
must not be represented as real-world agricultural performance.
"""
from pathlib import Path
import json
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, f1_score

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "crop_training.csv"
MODEL_DIR = ROOT / "models"
MODEL_DIR.mkdir(exist_ok=True)
FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

df = pd.read_csv(DATA)
required = set(FEATURES + ["label"])
missing = required - set(df.columns)
if missing:
    raise ValueError(f"Training dataset is missing required columns: {sorted(missing)}")
if df[FEATURES].isnull().any().any() or df["label"].isnull().any():
    raise ValueError("Dataset contains missing feature or label values.")
if df["label"].nunique() < 2:
    raise ValueError("At least two crop labels are required.")

X, y = df[FEATURES], df["label"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)
model = RandomForestClassifier(n_estimators=160, random_state=42, class_weight="balanced")
model.fit(X_train, y_train)
pred = model.predict(X_test)
metrics = {
    "dataset_file": "data/crop_training.csv",
    "dataset_notice": "Illustrative demonstration dataset; not a verified agricultural dataset.",
    "rows": int(len(df)), "crop_classes": int(y.nunique()), "features": FEATURES,
    "test_fraction": 0.25, "random_state": 42,
    "held_out_accuracy": round(float(accuracy_score(y_test, pred)), 4),
    "held_out_macro_f1": round(float(f1_score(y_test, pred, average="macro", zero_division=0)), 4),
    "classification_report": classification_report(y_test, pred, output_dict=True, zero_division=0),
}
print("IMPORTANT: these metrics apply only to the included illustrative dataset.")
print(f"Rows: {metrics['rows']} | Crop classes: {metrics['crop_classes']}")
print(f"Held-out accuracy: {metrics['held_out_accuracy']}")
print(f"Held-out macro F1: {metrics['held_out_macro_f1']}")
print(classification_report(y_test, pred, zero_division=0))
(MODEL_DIR / "evaluation_metrics.json").write_text(json.dumps(metrics, indent=2))
model.fit(X, y)
joblib.dump(model, MODEL_DIR / "crop_model.joblib")
print(f"Saved model to {MODEL_DIR / 'crop_model.joblib'}")
print(f"Saved held-out metrics to {MODEL_DIR / 'evaluation_metrics.json'}")
