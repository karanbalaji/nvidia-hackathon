# Using the Machine Learning Models

This document provides instructions on how to train the machine learning models and run the prediction API server.

## 1. Training the Models (`ml/toronto_predict.py`)

The `ml/toronto_predict.py` script is responsible for training the `pothole` and `snow` prediction models using historical 311 and weather data. It also benchmarks the `CatBoost` models against a standard `LinearRegression` model to validate their effectiveness.

### How to Run

1.  **Ensure your data is ready**: Place your `SR*.csv` files and the `weatherstats_toronto_daily.csv` file into a single directory (e.g., `./data`).

2.  **Run the script from the command line**:

    ```bash
    python ml/toronto_predict.py --data-dir ./data --output-dir ./models
    ```

    *   `--data-dir`: The directory containing your input CSV files.
    *   `--output-dir`: The directory where the trained models (`.cbm` files) and any generated plots will be saved.

### Expected Output

When you run the script, you will see output in your terminal, including:

*   **R-squared comparison**: A direct comparison of the performance between the CatBoost and Linear Regression models for both potholes and snow. A higher R² score (closer to 1.0) indicates a better fit.
    ```text
    Pothole Model R-squared (training data):
     - CatBoost: 0.8512
     - Linear Regression: 0.6234
    ```
*   **Saved model files**: The script will save the trained models to the specified output directory.
    *   `./models/pothole_model.cbm`
    *   `./models/snow_model.cbm`

## 2. Running the Prediction API (`ml/prediction_api.py`)

The `ml/prediction_api.py` script starts a Flask web server that loads the trained models and exposes them through a simple REST API. This allows other services, like the Mastra agent, to get predictions by making HTTP requests.

### How to Run

1.  **Start the server**: After training the models, run the API script and point it to the directory where the models were saved.

    ```bash
    
    python ml/prediction_api.py --models-dir ./models --port 5001```

    *   `--models-dir`: The directory containing the `.cbm` model files.
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
         -d '{"month": 5, "day_of_week": 2, "precip_today": 33, "precip_lag1": 33, "precip_lag2": 33, "precip_lag3": 0}'
    ```

#### B. Snow Clearing Prediction

*   **Endpoint**: `POST /predict/snow`
*   **Description**: Predicts the total number of snow clearing requests for a multi-day weather event.
*   **Example Call**:
    ```bash
    curl -X POST http://localhost:5001/predict/snow \
         -H "Content-Type: application/json" \
         -d '{"month": 1, "day_of_week": 0, "snow_depth_cm": 50, "duration_days": 3}'
    ```