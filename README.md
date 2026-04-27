IT Incident Priority Predictor

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-00a393.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![Machine Learning](https://img.shields.io/badge/Machine%20Learning-Scikit--Learn%20%7C%20XGBoost-orange.svg)

**IncidentIQ** is an end-to-end full-stack Machine Learning application designed to automate the prediction of IT incident priorities in Service Management Systems. 

By analyzing incident features such as *Impact*, *Urgency*, and *Category*, the system uses trained machine learning models to instantly predict whether an incident is **High**, **Medium**, or **Low** priority.

---

## Features
- **Real-time Predictions:** Instantly predicts incident priority using a clean, modern React UI.
- **Multiple ML Models:** Compares predictions across 3 different algorithms:
  - **Logistic Regression** (Baseline)
  - **Random Forest** (Ensemble)
  - **XGBoost** (Gradient Boosting)
- **Model Metrics Dashboard:** Interactive charts and Confusion Matrices to evaluate model performance.
- **RESTful API Backend:** Fast and scalable Python backend powered by FastAPI.
- **Realistic IT Data:** Trained on a pre-processed version of the UCI Incident Management dataset with realistic IT categories.

---

## Tech Stack
- **Frontend:** React.js, Vite, CSS (Modern Light Theme), Recharts, Axios
- **Backend:** Python, FastAPI, Uvicorn
- **Machine Learning:** Scikit-learn, XGBoost, Pandas, Joblib

---

## How to Run Locally

To run this project on your local machine, you need to start both the Python backend and the React frontend.

### 1. Start the Backend (FastAPI)
Open a terminal in the root directory and run:

```bash
# Run the FastAPI server
# Note for Windows users: Setting PYTHONIOENCODING avoids emoji console errors
$env:PYTHONIOENCODING="utf-8"; python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
*The backend API will be running at `http://localhost:8000`*

### 2. Start the Frontend (React)
Open a **second** terminal, navigate to the `frontend` folder, and run:

```bash
cd frontend

# Install Node modules (if running for the first time)
npm install

# Start the Vite development server
npm run dev
```
*The frontend UI will be running at `http://localhost:5174`*

---

## Project Structure

```text
ML-Project/
├── backend/
│   ├── main.py            # FastAPI application and API endpoints
│   ├── train.py           # ML Model training script
│   ├── preprocess.py      # Data cleaning and feature engineering
│   ├── data_mapper.py     # Script to generate realistic IT category names
│   ├── requirements.txt   # Python dependencies
│   └── models/            # Saved .pkl ML models and encoders
├── frontend/
│   ├── src/
│   │   ├── components/    # React UI Components
│   │   ├── App.jsx        # Main React application
│   │   ├── index.css      # Global design system
│   │   └── components.css # Component-specific styles
│   └── package.json       # Node.js dependencies
├── dataset.csv            # Original UCI Dataset
└── dataset_clean.csv      # Processed dataset with realistic IT names
```

---

## Developed By
**Group 07**  
General Sir John Kotelawala Defence University (KDU)
