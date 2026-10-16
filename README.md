# Smart Crop Advisory System for Small and Marginal Farmers

A runnable academic project aligned to the submitted synopsis. It contains a React dashboard, FastAPI backend, Scikit-learn crop classifier, weather lookup/forecast integration, nutrient guidance, soil-moisture guidance, crop information, and optional MongoDB recommendation history.

## Synopsis-to-feature mapping

| Synopsis requirement | Implementation |
|---|---|
| Crop recommendation using ML | `backend/train_model.py` trains a Random Forest classifier; `POST /api/recommend` returns ranked crop matches. |
| NPK, pH, temperature, humidity, rainfall | Entered in the dashboard and passed to the ML model. |
| Soil moisture | Entered in the dashboard and used for separate irrigation guidance. It is not a trained feature because the included training CSV does not contain soil-moisture observations. |
| Farm location | Used to retrieve local weather and forecast; not a trained ML feature in the included dataset. |
| Current and forecast weather | Open-Meteo geocoding and forecast API; no API key required. |
| Soil/fertilizer guidance | Basic NPK threshold flags, informational only and not a fertilizer dosage prescription. |
| Crop cultivation information | Crop profile information returned with each recommendation. |
| Unified farmer dashboard | React interface presents inputs, recommendations, crop profile, nutrient guidance, weather and forecast. |
| Model training/evaluation | Training script uses a stratified held-out split and writes `backend/models/evaluation_metrics.json`. |
| MongoDB | Optional persistent recommendation history through `MONGODB_URI`; health/history endpoints show whether it is enabled. |
| Testing | Use the validation checklist below; API documentation is available at `/docs`. |

## Important limitation: training data

The bundled `backend/data/crop_training.csv` is an **illustrative demo dataset** intended to make the app runnable immediately. It is not a verified agricultural dataset. The accuracy/F1 metrics describe only this illustrative file; they must not be reported as real-world crop-recommendation performance. The included model is for demonstration and academic workflow validation, not actual farm decisions.

To claim validated recommendations, replace the CSV with a verified and documented dataset, check units and provenance, perform preprocessing, retrain, evaluate on a suitable held-out set, and report the dataset and evaluation method. Common public crop-recommendation data typically contains N, P, K, temperature, humidity, pH and rainfall, but not soil moisture or location. This project therefore uses moisture for a separate irrigation guidance rule, while location is used for weather retrieval; neither is falsely represented as a trained model feature.

Fertilizer guidance is basic and informational. It does not prescribe application rates and is not a substitute for soil-lab testing or local agricultural expertise.

## Requirements

- Python 3.10+
- Node.js 18+
- Optional MongoDB instance for persistent recommendation history
- Internet connection for the live weather API

## Run locally

### 1. Backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

**Windows PowerShell**
```powershell
.venv\Scripts\Activate.ps1
```

**Windows Command Prompt**
```bat
.venv\Scripts\activate.bat
```

**macOS/Linux**
```bash
source .venv/bin/activate
```

Then run:

```bash
pip install -r requirements.txt
python train_model.py
uvicorn app.main:app --reload
```

Backend health: http://127.0.0.1:8000/api/health  
API documentation: http://127.0.0.1:8000/docs

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite (usually http://localhost:5173).

### 3. Enable MongoDB history (optional)

Set `MONGODB_URI` before starting the backend.

**Windows PowerShell**
```powershell
$env:MONGODB_URI="mongodb://localhost:27017"
uvicorn app.main:app --reload
```

**macOS/Linux**
```bash
export MONGODB_URI="mongodb://localhost:27017"
uvicorn app.main:app --reload
```

Without a configured MongoDB server, recommendation and weather features still work, but history is not persisted. Check `/api/health` for `mongodb_enabled`.

## Validation checklist

1. Start the backend and confirm `/api/health` reports `model_loaded: true`.
2. Open `/docs` and call `POST /api/recommend` with N, P, K, temperature, humidity, pH, rainfall, soil moisture (0–100), and location.
3. Confirm the response includes top crop matches, crop information, nutrient guidance, soil-moisture guidance, and a model limitation notice.
4. In the frontend, change inputs and submit a recommendation.
5. Enter a valid town/city in Weather Advisory and confirm current conditions, three-day forecast and forecast-driven advisory.
6. Try an unknown location and verify the app shows an error instead of fabricated weather.
7. If MongoDB is configured, confirm `/api/health` reports it enabled and `/api/history` returns saved recommendations.
8. Review `backend/models/evaluation_metrics.json` after training; label all metrics as illustrative until a verified dataset is substituted.

## API endpoints

- `GET /` — API status and docs link
- `GET /api/health` — model and MongoDB status
- `GET /api/crops` — crop cultivation information
- `POST /api/recommend` — crop recommendation and soil/nutrient guidance
- `GET /api/weather?location=Jaipur` — current weather, three-day forecast and advisory
- `GET /api/history` — saved recommendation history when MongoDB is enabled

## Project structure

```text
smart-crop-advisory-system/
├── backend/
│   ├── app/main.py
│   ├── data/crop_training.csv
│   ├── models/
│   ├── train_model.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/App.jsx
│   ├── src/styles.css
│   ├── package.json
│   └── .env.example
└── README.md
```
