"""
Train Logistic Regression, Random Forest and XGBoost models on the
IT Incident Priority dataset and save all artifacts.

Run from the project root:
    python backend/train.py
"""
import os
import sys
import json
import time
import numpy as np
import pandas as pd
import joblib

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (accuracy_score, precision_score,
                              recall_score, f1_score, confusion_matrix)
from xgboost import XGBClassifier

# ── paths ──────────────────────────────────────────────────────────────────────
ROOT_DIR    = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH    = os.path.join(ROOT_DIR, "dataset_clean.csv")
MODELS_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ── import local module ────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from preprocess import (load_and_clean, build_encoders, get_feature_matrix,
                        CATEGORICAL_FEATURES, NUMERICAL_FEATURES, TARGET)

# ── label map for target ───────────────────────────────────────────────────────
TARGET_CLASSES = ["High", "Low", "Medium"]   # alphabetical – sklearn default


def evaluate(model, X_test, y_test, label_encoder):
    """Return a dict of metrics for a fitted model."""
    y_pred = model.predict(X_test)
    cm = confusion_matrix(y_test, y_pred)
    classes = label_encoder.classes_.tolist()
    return {
        "accuracy":  round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "recall":    round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "f1":        round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "confusion_matrix": cm.tolist(),
        "classes": classes,
    }


def main():
    print("=" * 60)
    print("  IT Incident Priority – Model Training")
    print("=" * 60)

    # ── 1. Load & preprocess ───────────────────────────────────────────────────
    print("\n[1/5] Loading and cleaning dataset …")
    t0 = time.time()
    df = load_and_clean(CSV_PATH)
    print(f"      Rows after dedup/clean: {len(df):,}  "
          f"({time.time()-t0:.1f}s)")
    print("      Priority distribution:")
    print(df[TARGET].value_counts().to_string(index=True))

    # ── 2. Encode features ─────────────────────────────────────────────────────
    print("\n[2/5] Encoding features …")
    encoders = build_encoders(df)
    joblib.dump(encoders, os.path.join(MODELS_DIR, "encoders.pkl"))

    X, feature_names = get_feature_matrix(df)
    joblib.dump(feature_names, os.path.join(MODELS_DIR, "feature_names.pkl"))

    # Encode target
    label_enc = LabelEncoder()
    y = label_enc.fit_transform(df[TARGET])
    joblib.dump(label_enc, os.path.join(MODELS_DIR, "label_encoder.pkl"))
    print(f"      Classes: {label_enc.classes_.tolist()}")
    print(f"      Features ({len(feature_names)}): {feature_names}")

    # ── 3. Split ───────────────────────────────────────────────────────────────
    print("\n[3/5] Splitting 80/20 train/test …")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"      Train: {len(X_train):,}  Test: {len(X_test):,}")

    # ── 4. Train ───────────────────────────────────────────────────────────────
    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, random_state=42, class_weight="balanced", n_jobs=-1),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, random_state=42, class_weight="balanced",
            n_jobs=-1, max_depth=15),
        "XGBoost": XGBClassifier(
            n_estimators=200, random_state=42, use_label_encoder=False,
            eval_metric="mlogloss", n_jobs=-1, tree_method="hist",
            max_depth=8, learning_rate=0.1),
    }

    all_metrics = {}
    feature_importance = {}

    for name, model in models.items():
        print(f"\n[4/5] Training {name} …")
        t0 = time.time()
        model.fit(X_train, y_train)
        elapsed = time.time() - t0
        print(f"      Done in {elapsed:.1f}s")

        metrics = evaluate(model, X_test, y_test, label_enc)
        all_metrics[name] = metrics
        print(f"      Accuracy={metrics['accuracy']}  "
              f"F1={metrics['f1']}  "
              f"Precision={metrics['precision']}  "
              f"Recall={metrics['recall']}")

        # Save model
        safe_name = name.lower().replace(" ", "_")
        joblib.dump(model, os.path.join(MODELS_DIR, f"{safe_name}.pkl"))

        # Feature importance
        if hasattr(model, "feature_importances_"):
            fi = model.feature_importances_
            feature_importance[name] = {
                fn: round(float(v), 6)
                for fn, v in zip(feature_names, fi)
            }

    # ── 5. Save metrics & extras ───────────────────────────────────────────────
    print("\n[5/5] Saving metrics …")
    with open(os.path.join(MODELS_DIR, "metrics.json"), "w") as f:
        json.dump(all_metrics, f, indent=2)
    with open(os.path.join(MODELS_DIR, "feature_importance.json"), "w") as f:
        json.dump(feature_importance, f, indent=2)

    # Save unique values for front-end dropdowns
    from preprocess import get_unique_values
    unique_vals = get_unique_values(CSV_PATH)
    with open(os.path.join(MODELS_DIR, "unique_values.json"), "w") as f:
        json.dump(unique_vals, f, indent=2)

    print("\n✅  Training complete! All artifacts saved to backend/models/")
    print("=" * 60)


if __name__ == "__main__":
    main()
