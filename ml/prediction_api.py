import os
import argparse
import pandas as pd
from flask import Flask, request, jsonify
from flasgger import Swagger
import joblib

# --- Globals ---
app = Flask(__name__)
swagger = Swagger(app)
pothole_model = None
snow_model = None

@app.route('/predict/potholes', methods=['POST'])
def predict_potholes():
    """
    Predicts pothole requests based on weather conditions.
    Expects JSON: {"Month": 5, "Day": 15, "DayOfWeek": 2, "ward_num": 12, "precipitation": 10.0, "precip_lag1": 5.0, "precip_lag2": 0, "precip_lag3": 15.0, "snow_depth": 0, "snow_precipitation": 0}
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
            Day: {type: integer, example: 15}
            DayOfWeek: {type: integer, example: 2, description: "Day of week (0=Monday, 6=Sunday)"}
            ward_num: {type: integer, example: 12}
            precipitation: {type: number, example: 10.0}
            precip_lag1: {type: number, example: 33.0}
            precip_lag2: {type: number, example: 33.0}
            precip_lag3: {type: number, example: 0}
            snow_depth: {type: number, example: 0}
            snow_precipitation: {type: number, example: 0}
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
        features = ['Month', 'Day', 'DayOfWeek', 'precipitation', 'precip_lag1', 'precip_lag2', 'precip_lag3', 'ward_num', 'snow_depth', 'snow_precipitation']
        input_df = pd.DataFrame([[
            data['Month'],
            data['Day'],
            data['DayOfWeek'],
            data['precipitation'],
            data['precip_lag1'],
            data['precip_lag2'],
            data['precip_lag3'],
            data['ward_num'],
            data.get('snow_depth', 0),
            data.get('snow_precipitation', 0)
        ]], columns=features)

        prediction = pothole_model.predict(input_df)[0]
        return jsonify({"predicted_requests": round(max(0, prediction))})

    except (KeyError, TypeError) as e:
        return jsonify({"error": f"Missing or invalid parameter: {e}"}), 400


@app.route('/predict/snow', methods=['POST'])
def predict_snow():
    """
    Predicts snow clearing requests for a weather event.
    Expects JSON: {"Month": 1, "Day": 15, "DayOfWeek": 2, "ward_num": 4, "snow_depth": 50, "snow_precipitation": 10}
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
            Day: {type: integer, example: 15}
            DayOfWeek: {type: integer, example: 2, description: "Day of week (0=Monday, 6=Sunday)"}
            ward_num: {type: integer, example: 4}
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
        # Add a domain-knowledge guardrail: no snow requests in summer months.
        month = data.get('Month')
        if month and 5 <= month <= 10: # May to October
            return jsonify({
                "predicted_requests": 0,
                "note": "Prediction is 0 for non-winter months (May-October)."
            })

        features = ['Month', 'Day', 'DayOfWeek', 'snow_depth', 'snow_precipitation', 'ward_num']
        input_df = pd.DataFrame([[
            data['Month'],
            data['Day'],
            data['DayOfWeek'],
            data['snow_depth'],
            data['snow_precipitation'],
            data['ward_num']
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

    global pothole_model, snow_model

    pothole_model_path = os.path.join(args.models_dir, 'pothole_model.joblib')
    snow_model_path = os.path.join(args.models_dir, 'snow_model.joblib')

    pothole_model = joblib.load(pothole_model_path)
    snow_model = joblib.load(snow_model_path)

    print("✅ Models loaded successfully.")

    app.run(host='0.0.0.0', port=args.port)