"""
Weather Watcher — Flask Backend
================================
Real-time weather anomaly detection with historical comparison,
geocoding-based city search, trend indicators, and confidence scoring.
"""

import os
import pandas as pd
from flask import Flask, render_template, request, jsonify
import requests
from datetime import datetime

# ─── Flask App Initialization ───────────────────────────────────────────────────
app = Flask(__name__)

# ─── Configuration ──────────────────────────────────────────────────────────────
# API Key is sourced from the environment for security on deployment
# Local fallback is provided but should be replaced by .env or system variables
API_KEY = os.environ.get("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
GEOCODE_URL = "http://api.openweathermap.org/geo/1.0/direct"
CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "weather.csv")

# Anomaly detection thresholds
TEMP_THRESHOLD = 5       # ±5°C
RAINFALL_THRESHOLD = 20  # ±20 mm

# Map anomaly logic
MAP_DAILY_NORMAL_TEMP = 20  # Placeholder average temp
MAP_DEVIATION_THRESHOLD = 10  # Flag if diff > 10
MAJOR_CITIES = ["Delhi", "Mumbai", "London", "New York", "Tokyo", "Sydney", "Paris", "Berlin", "Dubai", "Singapore"]


# ─── Data Processing ────────────────────────────────────────────────────────────

def load_and_process_data():
    """Load CSV data and add Month column."""
    try:
        df = pd.read_csv(CSV_PATH)
        df['Date'] = pd.to_datetime(df['Date'], format='mixed', dayfirst=False)
        df['Month'] = df['Date'].dt.month
        return df
    except FileNotFoundError:
        print(f"Error: CSV file not found at {CSV_PATH}")
        return None
    except Exception as e:
        print(f"Error processing data: {e}")
        return None


def get_monthly_averages(df, city=None):
    """Calculate monthly average Temperature and Rainfall."""
    filtered_df = df.copy()

    if 'Location' in df.columns and city:
        city_lower = city.lower().strip()
        filtered_df = df[df['Location'].str.lower().str.strip() == city_lower]
        if filtered_df.empty:
            return None

    monthly_avg = filtered_df.groupby('Month').agg(
        avg_temp=('Temperature', 'mean'),
        avg_rainfall=('Rainfall', 'mean')
    ).reset_index()

    return monthly_avg


def get_dataset_anomalies(df, city=None):
    """Count total anomalies in the historical dataset."""
    monthly_avg = get_monthly_averages(df, city)
    if monthly_avg is None:
        return {"total": 0, "temperature": 0, "rainfall": 0}

    filtered_df = df.copy()
    if 'Location' in df.columns and city:
        city_lower = city.lower().strip()
        filtered_df = df[df['Location'].str.lower().str.strip() == city_lower]

    temp_anomalies = 0
    rain_anomalies = 0

    for _, row in filtered_df.iterrows():
        month = row['Date'].month
        avg_row = monthly_avg[monthly_avg['Month'] == month]
        if not avg_row.empty:
            if abs(row['Temperature'] - avg_row['avg_temp'].values[0]) > TEMP_THRESHOLD:
                temp_anomalies += 1
            if abs(row['Rainfall'] - avg_row['avg_rainfall'].values[0]) > RAINFALL_THRESHOLD:
                rain_anomalies += 1

    return {
        "total": int(temp_anomalies + rain_anomalies),
        "temperature": int(temp_anomalies),
        "rainfall": int(rain_anomalies)
    }


def get_historical_chart_data(df, city=None):
    """Prepare historical data for all charts."""
    filtered_df = df.copy()
    if 'Location' in df.columns and city:
        city_lower = city.lower().strip()
        filtered_df = df[df['Location'].str.lower().str.strip() == city_lower]

    if filtered_df.empty:
        return None

    monthly_avg = get_monthly_averages(df, city)
    if monthly_avg is None:
        return None

    month_names = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    labels = []
    avg_temps = []
    avg_rainfalls = []

    for _, row in monthly_avg.iterrows():
        month_idx = int(row['Month']) - 1
        labels.append(month_names[month_idx])
        avg_temps.append(round(float(row['avg_temp']), 1))
        avg_rainfalls.append(round(float(row['avg_rainfall']), 1))

    # Get min/max temps per month for area chart
    temp_min = []
    temp_max = []
    for _, row in monthly_avg.iterrows():
        month = int(row['Month'])
        month_data = filtered_df[filtered_df['Month'] == month]
        if not month_data.empty:
            temp_min.append(round(float(month_data['Temperature'].min()), 1))
            temp_max.append(round(float(month_data['Temperature'].max()), 1))
        else:
            temp_min.append(round(float(row['avg_temp']), 1))
            temp_max.append(round(float(row['avg_temp']), 1))

    return {
        "labels": labels,
        "avg_temps": avg_temps,
        "avg_rainfalls": avg_rainfalls,
        "temp_min": temp_min,
        "temp_max": temp_max
    }


# ─── API Integration ────────────────────────────────────────────────────────────

def fetch_api_data(city=None, lat=None, lon=None):
    """Fetch real-time weather data from OpenWeather API by city or coordinates."""
    try:
        params = {
            "appid": API_KEY,
            "units": "metric"
        }
        
        if lat is not None and lon is not None:
            params["lat"] = lat
            params["lon"] = lon
        elif city:
            params["q"] = city
        else:
            return {"error": "No city name or coordinates provided."}

        response = requests.get(BASE_URL, params=params, timeout=10)

        if response.status_code == 401:
            return {"error": "Invalid API key. Please check your OpenWeather API key."}
        elif response.status_code == 404:
            return {"error": f"Weather data not found for the requested location."}
        elif response.status_code != 200:
            return {"error": f"API error (status {response.status_code}). Please try again later."}

        data = response.json()

        current_temp = data.get("main", {}).get("temp", None)
        weather_desc = data.get("weather", [{}])[0].get("description", "N/A")
        weather_icon = data.get("weather", [{}])[0].get("icon", "01d")

        rain_data = data.get("rain", {})
        current_rainfall = rain_data.get("1h", rain_data.get("3h", 0))

        humidity = data.get("main", {}).get("humidity", "N/A")
        wind_speed = data.get("wind", {}).get("speed", "N/A")
        feels_like = data.get("main", {}).get("feels_like", "N/A")
        pressure = data.get("main", {}).get("pressure", "N/A")
        visibility = data.get("visibility", "N/A")
        clouds = data.get("clouds", {}).get("all", 0)

        if current_temp is None:
            return {"error": "Missing temperature data from API response."}

        return {
            "current_temp": round(float(current_temp), 1),
            "current_rainfall": round(float(current_rainfall), 1),
            "weather_desc": weather_desc,
            "weather_icon": weather_icon,
            "humidity": int(humidity) if isinstance(humidity, (int, float)) else humidity,
            "wind_speed": round(float(wind_speed), 2) if isinstance(wind_speed, (int, float)) else wind_speed,
            "feels_like": round(float(feels_like), 1) if isinstance(feels_like, (int, float)) else feels_like,
            "pressure": int(pressure) if isinstance(pressure, (int, float)) else pressure,
            "visibility": round(float(visibility) / 1000, 1) if isinstance(visibility, (int, float)) else visibility,
            "clouds": int(clouds),
            "lat": data.get("coord", {}).get("lat", 0),
            "lon": data.get("coord", {}).get("lon", 0),
            "city": data.get("name", city.title() if city else "Unknown Location")
        }

    except requests.exceptions.Timeout:
        return {"error": "Request timed out. Please check your internet connection."}
    except requests.exceptions.ConnectionError:
        return {"error": "Connection error. Please check your internet connection."}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}


# ─── Anomaly Detection ──────────────────────────────────────────────────────────

def detect_anomaly(current_temp, avg_temp, current_rainfall, avg_rainfall):
    """Compare real-time weather with monthly averages to detect anomalies."""
    temp_diff = float(round(current_temp - avg_temp, 1))
    rain_diff = float(round(current_rainfall - avg_rainfall, 1))

    temp_anomaly = bool(abs(temp_diff) > TEMP_THRESHOLD)
    rain_anomaly = bool(abs(rain_diff) > RAINFALL_THRESHOLD)

    # Determine trend
    temp_trend = "rising" if temp_diff > 0 else ("falling" if temp_diff < 0 else "stable")
    rain_trend = "rising" if rain_diff > 0 else ("falling" if rain_diff < 0 else "stable")

    # Anomaly confidence
    temp_confidence = "none"
    rain_confidence = "none"
    if temp_anomaly:
        abs_td = abs(temp_diff)
        if abs_td > TEMP_THRESHOLD * 3:
            temp_confidence = "high"
        elif abs_td > TEMP_THRESHOLD * 1.5:
            temp_confidence = "medium"
        else:
            temp_confidence = "low"
    if rain_anomaly:
        abs_rd = abs(rain_diff)
        if abs_rd > RAINFALL_THRESHOLD * 3:
            rain_confidence = "high"
        elif abs_rd > RAINFALL_THRESHOLD * 1.5:
            rain_confidence = "medium"
        else:
            rain_confidence = "low"

    # Overall confidence
    if temp_confidence == "high" or rain_confidence == "high":
        overall_confidence = "high"
    elif temp_confidence == "medium" or rain_confidence == "medium":
        overall_confidence = "medium"
    elif temp_confidence == "low" or rain_confidence == "low":
        overall_confidence = "low"
    else:
        overall_confidence = "none"

    anomalies = []
    if temp_anomaly:
        direction = "higher" if temp_diff > 0 else "lower"
        anomalies.append(f"Temperature is {abs(temp_diff)}°C {direction} than average")
    if rain_anomaly:
        direction = "higher" if rain_diff > 0 else "lower"
        anomalies.append(f"Rainfall is {abs(rain_diff)}mm {direction} than average")

    if temp_anomaly and rain_anomaly:
        status = "Both Temperature & Rainfall Anomaly"
    elif temp_anomaly:
        status = "Temperature Anomaly"
    elif rain_anomaly:
        status = "Rainfall Anomaly"
    else:
        status = "Normal"

    return {
        "temp_diff": temp_diff,
        "rain_diff": rain_diff,
        "temp_anomaly": temp_anomaly,
        "rain_anomaly": rain_anomaly,
        "temp_trend": temp_trend,
        "rain_trend": rain_trend,
        "temp_confidence": temp_confidence,
        "rain_confidence": rain_confidence,
        "overall_confidence": overall_confidence,
        "status": status,
        "details": anomalies,
        "is_anomaly": bool(temp_anomaly or rain_anomaly)
    }


# ─── Flask Routes ───────────────────────────────────────────────────────────────

@app.route("/")
def landing():
    """Serve the landing page."""
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    """Serve the dashboard."""
    return render_template("dashboard.html", api_key=API_KEY)


@app.route("/api/geocode", methods=["GET"])
def geocode():
    """Geocode city name using OpenWeather Geocoding API."""
    query = request.args.get("q", "").strip()
    if not query or len(query) < 2:
        return jsonify({"results": []})

    try:
        params = {
            "q": query,
            "limit": 5,
            "appid": API_KEY
        }
        response = requests.get(GEOCODE_URL, params=params, timeout=5)
        if response.status_code != 200:
            return jsonify({"results": []})

        data = response.json()
        results = []
        seen = set()
        for item in data:
            city = item.get("name", "")
            state = item.get("state", "")
            country = item.get("country", "")
            label = f"{city}, {state}, {country}" if state else f"{city}, {country}"
            if label not in seen:
                seen.add(label)
                results.append({
                    "city": city,
                    "state": state,
                    "country": country,
                    "label": label,
                    "lat": round(float(item.get("lat", 0)), 4),
                    "lon": round(float(item.get("lon", 0)), 4)
                })

        return jsonify({"results": results})
    except Exception:
        return jsonify({"results": []})


@app.route("/api/check-weather", methods=["POST"])
def check_weather():
    """Main API: fetch real-time data, compare with history, return analysis."""
    json_data = request.get_json()
    city_input = json_data.get("city", "").strip()
    lat = json_data.get("lat")
    lon = json_data.get("lon")

    if not city_input and (lat is None or lon is None):
        return jsonify({"error": "Please provide a city name or coordinates."}), 400

    # Step 1: Fetch real-time weather first
    api_data = fetch_api_data(city=city_input, lat=lat, lon=lon)
    if "error" in api_data:
        return jsonify(api_data), 400

    resolved_city = api_data.get("city", city_input)

    # Step 2: Load CSV
    df = load_and_process_data()
    if df is None:
        return jsonify({"error": "Failed to load historical data."}), 500

    # Step 3: Current month
    current_month = datetime.now().month

    # Step 4: Monthly averages (resolved city-specific or overall)
    monthly_avg = get_monthly_averages(df, resolved_city)
    has_city_data = monthly_avg is not None
    if not has_city_data:
        monthly_avg = get_monthly_averages(df)

    current_month_avg = monthly_avg[monthly_avg['Month'] == current_month]
    if current_month_avg.empty:
        return jsonify({"error": "No historical data available for the current month."}), 404

    avg_temp = float(round(current_month_avg['avg_temp'].values[0], 1))
    avg_rainfall = float(round(current_month_avg['avg_rainfall'].values[0], 1))

    # Step 5: Detect anomalies
    anomaly = detect_anomaly(
        api_data["current_temp"], avg_temp,
        api_data["current_rainfall"], avg_rainfall
    )

    # Step 6: Dataset anomalies (using resolved city name for consistency)
    dataset_anomalies = get_dataset_anomalies(df, resolved_city if has_city_data else None)

    # Step 7: Chart data
    chart_data = get_historical_chart_data(df, resolved_city if has_city_data else None)
    if chart_data is None:
        chart_data = get_historical_chart_data(df)

    # Step 8: Build response
    response = {
        "city": resolved_city.title(),
        "has_city_data": has_city_data,
        "current_temp": float(api_data["current_temp"]),
        "avg_temp": float(avg_temp),
        "temp_diff": float(anomaly["temp_diff"]),
        "current_rainfall": float(api_data["current_rainfall"]),
        "avg_rainfall": float(avg_rainfall),
        "rain_diff": float(anomaly["rain_diff"]),
        "weather_desc": api_data["weather_desc"],
        "weather_icon": api_data["weather_icon"],
        "humidity": api_data["humidity"],
        "wind_speed": api_data["wind_speed"],
        "feels_like": api_data["feels_like"],
        "pressure": api_data.get("pressure", "N/A"),
        "visibility": api_data.get("visibility", "N/A"),
        "clouds": api_data.get("clouds", 0),
        "anomaly_status": anomaly["status"],
        "is_anomaly": bool(anomaly["is_anomaly"]),
        "temp_anomaly": bool(anomaly["temp_anomaly"]),
        "rain_anomaly": bool(anomaly["rain_anomaly"]),
        "temp_trend": anomaly["temp_trend"],
        "rain_trend": anomaly["rain_trend"],
        "temp_confidence": anomaly["temp_confidence"],
        "rain_confidence": anomaly["rain_confidence"],
        "overall_confidence": anomaly["overall_confidence"],
        "anomaly_details": anomaly["details"],
        "dataset_anomalies": dataset_anomalies,
        "chart_data": chart_data,
        "current_month": int(current_month),
        "thresholds": {
            "temperature": int(TEMP_THRESHOLD),
            "rainfall": int(RAINFALL_THRESHOLD)
        },
        "lat": api_data.get("lat"),
        "lon": api_data.get("lon"),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    return jsonify(response)


@app.route("/api/available-cities", methods=["GET"])
def available_cities():
    """Return cities from historical dataset."""
    df = load_and_process_data()
    if df is None or 'Location' not in df.columns:
        return jsonify({"cities": []})

    cities = sorted(df['Location'].str.strip().unique().tolist())
    return jsonify({"cities": cities})


@app.route("/api/map-data", methods=["GET"])
def map_data():
    """Fetch real-time weather data for a set of major cities to populate the Leaflet map."""
    cities_data = []

    for city in MAJOR_CITIES:
        api_data = fetch_api_data(city)
        if "error" in api_data:
            continue

        current_temp = api_data["current_temp"]
        # Calculate simple deviation
        deviation = round(current_temp - MAP_DAILY_NORMAL_TEMP, 1)
        is_anomaly = abs(deviation) > MAP_DEVIATION_THRESHOLD

        cities_data.append({
            "city": city,
            "lat": api_data["lat"],
            "lon": api_data["lon"],
            "current_temp": current_temp,
            "deviation": deviation,
            "is_anomaly": is_anomaly,
            "status": "High Deviation Anomaly" if is_anomaly else "Normal"
        })

    return jsonify({"data": cities_data})


# ─── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
