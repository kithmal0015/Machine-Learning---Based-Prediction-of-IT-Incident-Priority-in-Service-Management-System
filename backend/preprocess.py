"""
Data preprocessing pipeline for IT Incident Priority Prediction.
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# Priority mapping: collapse 4 classes → 3
PRIORITY_MAP = {
    "1 - Critical": "High",
    "2 - High":     "High",
    "3 - Moderate": "Medium",
    "4 - Low":      "Low",
}

# Features used for training
CATEGORICAL_FEATURES = ["impact", "urgency", "category", "subcategory",
                         "contact_type", "incident_state", "assignment_group"]
NUMERICAL_FEATURES   = ["reassignment_count", "reopen_count", "sys_mod_count"]
TARGET               = "priority"

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def load_and_clean(csv_path: str) -> pd.DataFrame:
    """Load raw CSV and perform initial cleaning."""
    df = pd.read_csv(csv_path)

    # Keep only the latest state per incident number (avoid duplicates from multi-event logs)
    # Prioritize Closed > Resolved > Active > New
    state_order = {"Closed": 0, "Resolved": 1, "Active": 2,
                   "Awaiting User Info": 3, "Awaiting Problem": 4,
                   "Awaiting Vendor": 5, "Awaiting Evidence": 6, "New": 7, "-100": 8}
    df["_state_rank"] = df["incident_state"].map(state_order).fillna(9)
    df = df.sort_values(["number", "_state_rank"]).drop_duplicates("number", keep="first")
    df = df.drop(columns=["_state_rank"])

    # Map priority to 3 classes
    df = df[df[TARGET].isin(PRIORITY_MAP.keys())].copy()
    df[TARGET] = df[TARGET].map(PRIORITY_MAP)

    # Replace '?' with NaN then fill with mode
    df.replace("?", np.nan, inplace=True)
    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown")

    for col in NUMERICAL_FEATURES:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    return df


def build_encoders(df: pd.DataFrame) -> dict:
    """Fit LabelEncoders on categorical columns. Returns dict of encoders."""
    encoders = {}
    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            encoders[col] = le
    return encoders


def encode_with_saved(df: pd.DataFrame, encoders: dict) -> pd.DataFrame:
    """Apply pre-fitted encoders to new data (for inference)."""
    df = df.copy()
    for col, le in encoders.items():
        if col in df.columns:
            # Handle unseen labels gracefully
            known = set(le.classes_)
            df[col] = df[col].astype(str).apply(
                lambda x: x if x in known else le.classes_[0]
            )
            df[col] = le.transform(df[col])
    return df


def get_feature_matrix(df: pd.DataFrame):
    """Return X (feature matrix) from a preprocessed dataframe."""
    used_cols = [c for c in CATEGORICAL_FEATURES + NUMERICAL_FEATURES if c in df.columns]
    return df[used_cols].values, used_cols


def get_unique_values(csv_path: str) -> dict:
    """Return raw unique values for front-end dropdowns (before encoding)."""
    df = pd.read_csv(csv_path, nrows=5000)
    df.replace("?", np.nan, inplace=True)
    result = {}
    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            vals = sorted(df[col].dropna().unique().tolist())
            result[col] = vals
    return result
