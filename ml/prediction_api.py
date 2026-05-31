import os
import argparse
import pandas as pd
from flask import Flask, request, jsonify
from catboost import CatBoostRegressor
from flasgger import Swagger

# --- Globals ---
app = Flask(__name__)
swagger = Swagger(app)
pothole_model = None
snow_model = None


@app.route('/predict/potholes', methods=['POST'])
def predict_potholes():
    """
    Predicts pothole requests based on weather conditions.
    Expects JSON: {"month": 5, "day_of_week": 2, "precip_today": 10, "precip_lag1": 5, "precip_lag2": 0, "precip_lag3": 15}
    ---
    tags:
      - Predictions
    summary: Predict pothole service requests
    description: Predicts the number of pothole requests based on current and past precipitation data.
    parameters:
      - name: body
        in: body
        required: true
        schema:
          id: PotholePredictionRequest
          type: object
          properties:
            Month: {type: integer, example: 5}
            DayOfWeek: {type: integer, example: 2}
            precipitation: {type: number, example: 33.0}
            precip_lag1: {type: number, example: 33.0}
            precip_lag2: {type: number, example: 33.0}
            precip_lag3: {type: number, example: 0}
    responses:
      200:
        description: A successful prediction.
        content:
          application/json:
            schema:
              type: object
              properties:
                predicted_requests:
                  type: integer
      400:
        description: Invalid or missing parameters.
    """
    if not pothole_model:
        return jsonify({"error": "Pothole model not loaded"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    try:
        features = ['Month', 'DayOfWeek', 'precipitation', 'precip_lag1', 'precip_lag2', 'precip_lag3']
        input_df = pd.DataFrame([[
            data['Month'],
            data['DayOfWeek'],
            data['precipitation'],
            data['precip_lag1'],
            data['precip_lag2'],
            data['precip_lag3']
        ]], columns=features)

        prediction = pothole_model.predict(input_df)[0]
        return jsonify({"predicted_requests": round(max(0, prediction))})

    except (KeyError, TypeError) as e:
        return jsonify({"error": f"Missing or invalid parameter: {e}"}), 400


@app.route('/predict/snow', methods=['POST'])
def predict_snow():
    """
    Predicts snow clearing requests for a weather event.
    Expects JSON: {"Month": 1, "DayOfWeek": 0, "snow_depth": 50, "snow_precipitation": 10}
    ---
    tags:
      - Predictions
    summary: Predict snow clearing service requests
    description: Predicts the total number of snow clearing requests for a multi-day weather event.
    parameters:
      - name: body
        in: body
        required: true
        schema:
          id: SnowPredictionRequest
          type: object
          properties:
            Month: {type: integer, example: 1}
            DayOfWeek: {type: integer, example: 0}
            snow_depth: {type: number, example: 50}
            snow_precipitation: {type: number, example: 10}
    responses:
      200:
        description: A successful prediction for a single day.
        content:
          application/json:
            schema:
              type: object
              properties:
                predicted_requests: {type: integer}
      400:
        description: Invalid or missing parameters.
    """
    if not snow_model:
        return jsonify({"error": "Snow model not loaded"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    try:
        features = ['Month', 'DayOfWeek', 'snow_depth', 'snow_precipitation']
        input_df = pd.DataFrame([[
            data['Month'],
            data['DayOfWeek'],
            data['snow_depth'],
            data['snow_precipitation']
        ]], columns=features)

        prediction = snow_model.predict(input_df)[0]
        return jsonify({"predicted_requests": round(max(0, prediction))})
    except (KeyError, TypeError) as e:
        return jsonify({"error": f"Missing or invalid parameter: {e}"}), 400


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Run the 311 Prediction API server.")
    parser.add_argument('--models-dir', type=str, required=True, help="Directory containing the trained model files.")
    parser.add_argument('--port', type=int, default=5001, help="Port to run the API server on.")
    args = parser.parse_args()

    pothole_model_path = os.path.join(args.models_dir, 'pothole_model.cbm')
    snow_model_path = os.path.join(args.models_dir, 'snow_model.cbm')

    pothole_model = CatBoostRegressor().load_model(pothole_model_path)
    snow_model = CatBoostRegressor().load_model(snow_model_path)
    print("✅ Models loaded successfully.")

    app.run(host='0.0.0.0', port=args.port)