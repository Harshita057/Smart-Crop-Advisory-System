# Smart Crop Advisory System for Small and Marginal Farmers

This project contains a React dashboard, FastAPI backend, Scikit-learn crop classifier, weather lookup/forecast integration, nutrient guidance, soil-moisture guidance, crop information, and optional MongoDB recommendation history.


| Implementation |
|---|
| `backend/train_model.py` trains a Random Forest classifier; `POST /api/recommend` returns ranked crop matches. |
| NPK, pH, temperature, humidity, rainfall : entered in the dashboard and passed to the ML model. |
| Soil moisture entered in the dashboard and used for separate irrigation guidance. It is not a trained feature because the included training CSV does not contain soil-moisture observations. |
| Farm location used to retrieve local weather and forecast; not a trained ML feature in the included dataset. |
| Open-Meteo geocoding and forecast API; no API key required. |
| Basic NPK threshold flags, informational only and not a fertilizer dosage prescription. |
| Crop profile information returned with each recommendation. |
| React interface presents inputs, recommendations, crop profile, nutrient guidance, weather and forecast. |
| Training script uses a stratified held-out split and writes `backend/models/evaluation_metrics.json`. |
| Optional persistent recommendation history through `MONGODB_URI`; health/history endpoints show whether it is enabled. |
| API documentation is available at `/docs`. |

## Run 

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


## API endpoints

- `GET /` — API status and docs link
- `GET /api/health` — model and MongoDB status
- `GET /api/crops` — crop cultivation information
- `POST /api/recommend` — crop recommendation and soil/nutrient guidance
- `GET /api/weather?location=Jaipur` — current weather, three-day forecast and advisory

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

