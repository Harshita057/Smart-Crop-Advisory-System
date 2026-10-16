from pathlib import Path
from datetime import datetime, timezone
import os
import joblib
import pandas as pd
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "crop_model.joblib"
DATA_PATH = ROOT / "data" / "crop_training.csv"

app = FastAPI(title="Smart Crop Advisory API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
feature_names = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
mongo_collection = None

try:
    from pymongo import MongoClient
    mongo_uri = os.getenv("MONGODB_URI")
    if mongo_uri:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=1500)
        client.admin.command("ping")
        mongo_collection = client["smart_crop_advisory"]["recommendations"]
except Exception:
    mongo_collection = None

CROP_INFO = {
    "rice": {"season": "Kharif", "water": "High", "soil": "Clayey or loamy soils; maintain suitable water management.", "note": "Avoid waterlogging beyond the crop's requirements and follow local recommendations."},
    "maize": {"season": "Kharif/Rabi (region-dependent)", "water": "Moderate", "soil": "Well-drained loamy soil.", "note": "Use locally recommended varieties and sowing windows."},
    "chickpea": {"season": "Rabi", "water": "Low to moderate", "soil": "Well-drained loamy soil.", "note": "Excess moisture can harm the crop; follow local sowing guidance."},
    "kidneybeans": {"season": "Region-dependent", "water": "Moderate", "soil": "Well-drained soil.", "note": "Check locally suitable varieties and season."},
    "pigeonpeas": {"season": "Kharif", "water": "Moderate", "soil": "Well-drained soil.", "note": "Avoid prolonged waterlogging."},
    "mothbeans": {"season": "Kharif", "water": "Low", "soil": "Sandy, well-drained soils.", "note": "Often suited to dry regions; confirm local suitability."},
    "mungbean": {"season": "Region-dependent", "water": "Low to moderate", "soil": "Well-drained loamy soil.", "note": "Use locally recommended seed and pest-management practices."},
    "blackgram": {"season": "Kharif/Rabi (region-dependent)", "water": "Low to moderate", "soil": "Well-drained loamy soil.", "note": "Avoid standing water."},
    "lentil": {"season": "Rabi", "water": "Low to moderate", "soil": "Well-drained loamy soil.", "note": "Avoid excessive irrigation."},
    "pomegranate": {"season": "Perennial", "water": "Moderate", "soil": "Well-drained soil.", "note": "Requires orchard planning and local horticultural advice."},
    "banana": {"season": "Perennial", "water": "High", "soil": "Deep, fertile, well-drained soil.", "note": "Needs reliable water and suitable local climate."},
    "mango": {"season": "Perennial", "water": "Moderate", "soil": "Deep, well-drained soil.", "note": "Suitability depends on local climate and orchard conditions."},
    "grapes": {"season": "Perennial", "water": "Moderate", "soil": "Well-drained soil.", "note": "Needs careful canopy, disease, and irrigation management."},
    "watermelon": {"season": "Region-dependent", "water": "Moderate", "soil": "Sandy loam with good drainage.", "note": "Avoid waterlogging and follow local planting windows."},
    "muskmelon": {"season": "Region-dependent", "water": "Moderate", "soil": "Sandy loam with good drainage.", "note": "Avoid excess water near maturity."},
    "apple": {"season": "Perennial", "water": "Moderate", "soil": "Well-drained soil in suitable cool climates.", "note": "Climate suitability is critical; verify locally."},
    "orange": {"season": "Perennial", "water": "Moderate", "soil": "Well-drained loamy soil.", "note": "Check local horticulture guidance and rootstock suitability."},
    "papaya": {"season": "Perennial", "water": "Moderate", "soil": "Well-drained soil.", "note": "Sensitive to waterlogging and frost."},
    "coconut": {"season": "Perennial", "water": "Moderate to high", "soil": "Suitable coastal/tropical conditions and drainage.", "note": "Climate and water availability strongly affect suitability."},
    "cotton": {"season": "Kharif", "water": "Moderate", "soil": "Well-drained black or loamy soil, depending on region.", "note": "Use locally approved varieties and integrated pest management."},
    "jute": {"season": "Kharif", "water": "High", "soil": "Alluvial soils in warm, humid conditions.", "note": "Requires suitable rainfall and local growing conditions."},
    "coffee": {"season": "Perennial", "water": "Moderate to high", "soil": "Suitable shaded tropical highland conditions.", "note": "Verify elevation, shade, and regional suitability."},
}

class FarmInput(BaseModel):
    N: float = Field(ge=0, le=200)
    P: float = Field(ge=0, le=200)
    K: float = Field(ge=0, le=250)
    temperature: float = Field(ge=-10, le=60)
    humidity: float = Field(ge=0, le=100)
    ph: float = Field(ge=0, le=14)
    rainfall: float = Field(ge=0, le=5000)
    soil_moisture: float = Field(ge=0, le=100, description="Soil moisture percentage from a meter or estimated field reading")
    location: Optional[str] = Field(default=None, max_length=120)

@app.on_event("startup")
def load_model():
    global model
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
    else:
        # Train from included demo data on first run, if the training script wasn't run.
        from sklearn.ensemble import RandomForestClassifier
        df = pd.read_csv(DATA_PATH)
        model = RandomForestClassifier(n_estimators=160, random_state=42, class_weight="balanced")
        model.fit(df[feature_names], df["label"])

@app.get("/")
def root():
    return {"message": "Smart Crop Advisory API is running", "docs": "/docs"}

@app.get("/api/health")
def health():
    return {"status": "ok", "model_loaded": model is not None, "mongodb_enabled": mongo_collection is not None}

@app.get("/api/crops")
def crops():
    return [{"name": k.title(), **v} for k, v in CROP_INFO.items()]

@app.post("/api/recommend")
def recommend(payload: FarmInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Crop model is not ready.")
    row = pd.DataFrame([[getattr(payload, name) for name in feature_names]], columns=feature_names)
    prediction = model.predict(row)[0]
    ranked = []
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(row)[0]
        ranked = sorted(
            [{"crop": str(c), "score": round(float(p) * 100, 1)} for c, p in zip(model.classes_, probs)],
            key=lambda x: x["score"], reverse=True
        )[:3]
    else:
        ranked = [{"crop": str(prediction), "score": None}]
    crop_key = str(prediction).lower()
    info = CROP_INFO.get(crop_key, {"season": "Check locally", "water": "Check locally", "soil": "Check local requirements", "note": "Verify with a local agricultural expert."})
    fertilizer = []
    if payload.N < 40: fertilizer.append("Nitrogen value is relatively low in this input; confirm with a soil test before applying fertilizer.")
    if payload.P < 25: fertilizer.append("Phosphorus value is relatively low in this input; confirm local soil-test recommendations.")
    if payload.K < 25: fertilizer.append("Potassium value is relatively low in this input; confirm local soil-test recommendations.")
    if not fertilizer: fertilizer.append("No simple low-N/P/K flag was triggered. This is not proof that fertilizer is unnecessary; use a soil test.")
    result = {
        "recommended_crop": str(prediction).title(),
        "top_recommendations": [{"crop": x["crop"].title(), "score": x["score"]} for x in ranked],
        "crop_information": {"season": info["season"], "water": info["water"], "soil": info["soil"], "guidance": info["note"]},
        "fertilizer_guidance": fertilizer,
        "soil_moisture_guidance": (
            "Soil moisture is low. Check the crop's water requirement and local irrigation advice before watering."
            if payload.soil_moisture < 30 else
            "Soil moisture is high. Check drainage and avoid unnecessary irrigation."
            if payload.soil_moisture > 75 else
            "Soil moisture is in the middle of the entered range. Check crop-specific needs and field conditions before deciding irrigation."
        ),
        "model_notice": "The included model uses an illustrative demonstration dataset and does not use soil moisture as a trained model feature. Soil moisture is used for separate irrigation guidance. Predictions are educational only, not validated agricultural recommendations.",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    if mongo_collection is not None:
        try:
            doc = {**payload.model_dump(), **result}
            mongo_collection.insert_one(doc)
        except Exception:
            pass
    return result

@app.get("/api/weather")
async def weather(location: str):
    location = location.strip()
    if not location:
        raise HTTPException(status_code=400, detail="Enter a town or city.")
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            geo = await client.get("https://geocoding-api.open-meteo.com/v1/search", params={"name": location, "count": 1, "language": "en", "format": "json"})
            geo.raise_for_status()
            places = geo.json().get("results", [])
            if not places:
                raise HTTPException(status_code=404, detail="Location not found. Try a nearby town or city.")
            place = places[0]
            resp = await client.get("https://api.open-meteo.com/v1/forecast", params={
                "latitude": place["latitude"], "longitude": place["longitude"],
                "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
                "forecast_days": 3, "timezone": "auto"
            })
            resp.raise_for_status()
            data = resp.json()
        daily = data.get("daily", {})
        rain_chance = (daily.get("precipitation_probability_max") or [None])[0]
        rain_mm = (daily.get("precipitation_sum") or [None])[0]
        if rain_chance is not None and rain_chance >= 60:
            advisory = f"Rain is likely today (forecast chance {rain_chance}%). Check field moisture before irrigation and avoid watering if rainfall is sufficient."
        elif rain_mm is not None and rain_mm >= 10:
            advisory = f"Forecast rainfall is about {rain_mm} mm today. Check drainage and soil moisture; adjust irrigation to actual field conditions."
        else:
            advisory = "No high rainfall signal was detected in this forecast. Check soil moisture and crop stage before irrigation; this forecast alone does not determine water needs."
        return {"location": f'{place.get("name", location)}, {place.get("admin1", "")}, {place.get("country", "")}'.strip(", "),
                "current": data.get("current", {}), "daily": daily,
                "advisory": advisory}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Weather service is temporarily unavailable. Please try again later.") from exc

@app.get("/api/history")
def history():
    if mongo_collection is None:
        return {"enabled": False, "items": [], "message": "Set MONGODB_URI to enable saved recommendation history."}
    try:
        docs = list(mongo_collection.find({}, {"_id": 0}).sort("created_at", -1).limit(20))
        return {"enabled": True, "items": docs}
    except Exception:
        return {"enabled": False, "items": [], "message": "Could not read history from MongoDB."}
