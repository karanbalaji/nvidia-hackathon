# Using the Machine Learning Models

This document provides instructions on how to train the machine learning models and run the prediction API server.

## 1. Training the Models (`ml/toronto_predict.py`)

The `ml/toronto_predict.py` script is responsible for training the `pothole` and `snow` prediction models using historical 311 and weather data. It also benchmarks a `RandomForestClassifier` (RF) against a `LinearRegression` (MLR) model to evaluate its effectiveness.

### How to Run

1.  **Ensure your data is ready**: Place your `SR*.csv` files and the `weatherstats_toronto_daily.csv` file into a single directory (e.g., `./data`).

2.  **Run the script from the command line**:

    ```bash
    python ml/toronto_predict.py --data-dir ./data --output-dir ./models
    ```

    *   `--data-dir`: The directory containing your input CSV files.
    *   `--output-dir`: The directory where the trained models (`.joblib` files) and any generated plots will be saved.

### Expected Output

When you run the script, you will see output in your terminal, including:

*   **Model Performance**: The script prints performance metrics for both the Random Forest Classifier (Accuracy) and a baseline Linear Regression model (R-squared) on both training and test data.
    ```text
    --- Training Pothole Model (with rain lag) ---
    Pothole Model Performance (training data):
     - Random Forest Accuracy: 0.5819
     - Linear Regression R-squared: 0.0752
    Pothole Model Performance (test data):
     - Random Forest Accuracy: 0.7944
     - Linear Regression R-squared: -1.3112

    --- Training Snow Clearing Model ---
    Snow Model Performance (training data):
     - Random Forest Accuracy: 0.4020
     - Linear Regression R-squared: 0.2297
    Snow Model Performance (test data):
     - Random Forest Accuracy: 0.5753
     - Linear Regression R-squared: -1.9431
    ```
*   **Saved model files**: The script will save the trained models to the specified output directory.
    *   `./models/pothole_model.joblib`
    *   `./models/snow_model.joblib`

## 2. Running the Prediction API (`ml/prediction_api.py`)

The `ml/prediction_api.py` script starts a Flask web server that loads the trained models and exposes them through a simple REST API. This allows other services, like the Mastra agent, to get predictions by making HTTP requests.

### How to Run

1.  **Start the server**: After training the models, run the API script and point it to the directory where the models were saved.

    ```bash
    
    python ml/prediction_api.py --models-dir ./models --port 5001```

    *   `--models-dir`: The directory containing the `.joblib` model files.
    *   `--port`: The network port on which the server will listen for requests.

### API Endpoints

The server provides two endpoints for predictions:

#### A. Pothole Prediction

*   **Endpoint**: `POST /predict/potholes`
*   **Description**: Predicts the number of pothole requests based on current and past precipitation.
*   **Example Call**:
    ```bash
    curl -X POST http://localhost:5001/predict/potholes \
         -H "Content-Type: application/json" \
         -d '{"Month": 5, "Day": 15, "DayOfWeek": 2, "ward_num": 12, "precipitation": 10.0, "precip_lag1": 33.0, "precip_lag2": 33.0, "precip_lag3": 0, "snow_depth": 0, "snow_precipitation": 0}'
    ```

#### B. Snow Clearing Prediction

*   **Endpoint**: `POST /predict/snow`
*   **Description**: Predicts the number of snow clearing requests for a single day based on weather conditions.
*   **Example Call**:
    ```bash
    curl -X POST http://localhost:5001/predict/snow \
         -H "Content-Type: application/json" \
         -d '{"Month": 1, "Day": 15, "DayOfWeek": 2, "ward_num": 4, "snow_depth": 50, "snow_precipitation": 10}'
    ```