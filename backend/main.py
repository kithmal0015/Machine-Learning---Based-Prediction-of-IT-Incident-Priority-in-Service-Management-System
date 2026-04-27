"""
FastAPI backend for IT Incident Priority Prediction.
"""
import os
import sys
import io

# Ensure stdout never raises on non-ASCII characters (Windows cp1252 fix)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import json
import numpy as np
import joblib
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from preprocess import encode_with_saved

# ── paths ──────────────────────────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

# ── global state ───────────────────────────────────────────────────────────────
models     = {}
encoders   = None
label_enc  = None
feat_names = None


def _load_artifacts():
    global models, encoders, label_enc, feat_names
    required = [
        "logistic_regression.pkl", "random_forest.pkl",
        "xgboost.pkl", "encoders.pkl", "label_encoder.pkl",
        "feature_names.pkl",
    ]
    for f in required:
        if not os.path.exists(os.path.join(MODELS_DIR, f)):
            print(f"[WARN] {f} not found - run train.py first.")
            return

    models.update({
        "Logistic Regression": joblib.load(os.path.join(MODELS_DIR, "logistic_regression.pkl")),
        "Random Forest":       joblib.load(os.path.join(MODELS_DIR, "random_forest.pkl")),
        "XGBoost":             joblib.load(os.path.join(MODELS_DIR, "xgboost.pkl")),
    })
    encoders   = joblib.load(os.path.join(MODELS_DIR, "encoders.pkl"))
    label_enc  = joblib.load(os.path.join(MODELS_DIR, "label_encoder.pkl"))
    feat_names = joblib.load(os.path.join(MODELS_DIR, "feature_names.pkl"))
    print("[OK] All 3 models loaded successfully.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_artifacts()
    yield


# ── app ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="IT Incident Priority Predictor",
    description="Predict incident priority using Logistic Regression, Random Forest, or XGBoost",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── schemas ────────────────────────────────────────────────────────────────────
class IncidentInput(BaseModel):
    impact:             str
    urgency:            str
    category:           Optional[str] = "Unknown"
    subcategory:        Optional[str] = "Unknown"
    contact_type:       Optional[str] = "Unknown"
    incident_state:     Optional[str] = "New"
    assignment_group:   Optional[str] = "Unknown"
    reassignment_count: Optional[int] = 0
    reopen_count:       Optional[int] = 0
    sys_mod_count:      Optional[int] = 0
    selected_model:     Optional[str] = "Random Forest"


class PredictionResponse(BaseModel):
    priority:        str
    confidence:      float
    model_used:      str
    all_predictions: dict


# ── endpoints ──────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": list(models.keys())}


@app.get("/metrics")
def get_metrics():
    path = os.path.join(MODELS_DIR, "metrics.json")
    if not os.path.exists(path):
        raise HTTPException(404, "metrics.json not found - run train.py first")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@app.get("/feature-importance")
def get_feature_importance():
    path = os.path.join(MODELS_DIR, "feature_importance.json")
    if not os.path.exists(path):
        raise HTTPException(404, "feature_importance.json not found")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@app.get("/unique-values")
def get_unique_values():
    path = os.path.join(MODELS_DIR, "unique_values.json")
    if not os.path.exists(path):
        raise HTTPException(404, "unique_values.json not found - run train.py first")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@app.post("/predict", response_model=PredictionResponse)
def predict(incident: IncidentInput):
    if not models:
        raise HTTPException(503, "Models not loaded - run train.py first")

    import pandas as pd

    row = {
        "impact":             incident.impact,
        "urgency":            incident.urgency,
        "category":           incident.category,
        "subcategory":        incident.subcategory,
        "contact_type":       incident.contact_type,
        "incident_state":     incident.incident_state,
        "assignment_group":   incident.assignment_group,
        "reassignment_count": incident.reassignment_count,
        "reopen_count":       incident.reopen_count,
        "sys_mod_count":      incident.sys_mod_count,
    }
    df = pd.DataFrame([row])
    df = encode_with_saved(df, encoders)

    X = df[[c for c in feat_names]].values

    all_predictions = {}
    for model_name, model in models.items():
        proba    = model.predict_proba(X)[0]
        pred_idx = int(np.argmax(proba))
        priority   = label_enc.inverse_transform([pred_idx])[0]
        confidence = round(float(proba[pred_idx]), 4)
        all_predictions[model_name] = {
            "priority":   priority,
            "confidence": confidence,
        }

    selected = incident.selected_model
    if selected not in all_predictions:
        selected = "Random Forest"

    return PredictionResponse(
        priority=all_predictions[selected]["priority"],
        confidence=all_predictions[selected]["confidence"],
        model_used=selected,
        all_predictions=all_predictions,
    )
