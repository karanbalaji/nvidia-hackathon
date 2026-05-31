# -*- coding: utf-8 -*-
import pandas as pd
import os
import argparse
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from catboost import CatBoostRegressor
import matplotlib.pyplot as plt
from sklearn.metrics import r2_score
import seaborn as sns
import requests
import folium


def load_311_data(data_dir):
    """Loads and combines all SR*.csv files from a directory."""
    all_files = os.listdir(data_dir)
    csv_files = [f for f in all_files if f.startswith('SR') and f.endswith('.csv')]
    
    if not csv_files:
        raise FileNotFoundError(f"No SR*.csv files found in {data_dir}")

    dataframes = []
    print("Loading the following CSV files:")
    for filename in csv_files:
        filepath = os.path.join(data_dir, filename)
        try:
            df = pd.read_csv(filepath, encoding='latin-1', on_bad_lines='skip')
            dataframes.append(df)
            print(f" - {filename} loaded.")
        except Exception as e:
            print(f"Error loading {filename}: {e}")
    
    return pd.concat(dataframes, ignore_index=True)


def prepare_category_data(df, category_keyword):
    """Filters data by category and aggregates counts by date."""
    df_copy = df.copy()
    df_copy['Creation Date'] = pd.to_datetime(df_copy['Creation Date'], errors='coerce')

    # Filter for the specific category (e.g., 'Tree', 'Animal', 'Pothole')
    filtered_df = df_copy[df_copy['Service Request Type'].str.contains(category_keyword, case=False, na=False)].copy()

    # Aggregate by date
    daily_counts = filtered_df.groupby(filtered_df['Creation Date'].dt.date).size().reset_index(name='Request_Count')
    daily_counts.columns = ['Date', 'Request_Count']
    daily_counts['Date'] = pd.to_datetime(daily_counts['Date'])

    # Feature Engineering
    daily_counts['Month'] = daily_counts['Date'].dt.month
    daily_counts['Day'] = daily_counts['Date'].dt.day
    daily_counts['DayOfWeek'] = daily_counts['Date'].dt.dayofweek

    return daily_counts


def prepare_snow_model(df, weather_path):
    # 1. Load weather
    w_df = pd.read_csv(weather_path, low_memory=False)
    w_df['date'] = pd.to_datetime(w_df['date'])

    # Identify correct snow columns
    snow_cols = [c for c in w_df.columns if 'snow' in c.lower()]
    print(f"Found snow-related columns: {snow_cols}")

    depth_col = next((c for c in snow_cols if 'ground' in c.lower() or 'depth' in c.lower()), None)
    precip_col = next((c for c in snow_cols if 'fall' in c.lower() or 'precip' in c.lower()), 'precipitation')

    # 2. Prepare Snow requests
    snow_requests = prepare_category_data(df, 'Snow')

    # 3. Merge
    weather_cols = list(set(['date', 'precipitation', depth_col, precip_col]))
    weather_cols = [c for c in weather_cols if c in w_df.columns]
    merged = pd.merge(snow_requests, w_df[weather_cols], left_on='Date', right_on='date', how='inner')

    # Normalize names for model
    if depth_col: merged = merged.rename(columns={depth_col: 'snow_depth'})
    else: merged['snow_depth'] = 0
    if precip_col and precip_col != 'precipitation': merged = merged.rename(columns={precip_col: 'snow_precipitation'})
    else: merged['snow_precipitation'] = merged.get('precipitation', 0)

    merged[['snow_depth', 'snow_precipitation']] = merged[['snow_depth', 'snow_precipitation']].fillna(0)
    return merged

def predict_snow_event(model, start_month, start_day_of_week, snow_depth_cm, duration_days):
    total_predicted = 0
    print(f'Predicting for a {duration_days}-day event with {snow_depth_cm}cm snow depth:')
    for day in range(duration_days):
        current_day_of_week = (start_day_of_week + day) % 7
        input_data = pd.DataFrame([[
            start_month,
            current_day_of_week,
            snow_depth_cm,
            snow_depth_cm / 5
        ]], columns=['Month', 'DayOfWeek', 'snow_depth', 'snow_precipitation'])
        daily_pred = model.predict(input_data)[0]
        total_predicted += max(0, daily_pred)
        print(f' - Day {day+1} (DoW {current_day_of_week}): {round(daily_pred)} requests')
    return round(total_predicted)

def train_pothole_model_v2(df, weather_path):
    w_df = pd.read_csv(weather_path, low_memory=False)
    w_df['date'] = pd.to_datetime(w_df['date'])

    # Sort weather to calculate lags
    w_df = w_df.sort_values('date')
    # Create lagged features (rain from 1, 2, and 3 days ago)
    w_df['precip_lag1'] = w_df['precipitation'].shift(1)
    w_df['precip_lag2'] = w_df['precipitation'].shift(2)
    w_df['precip_lag3'] = w_df['precipitation'].shift(3)

    pothole_data = prepare_category_data(df, 'Pot hole')
    weather_cols = ['date', 'precipitation', 'precip_lag1', 'precip_lag2', 'precip_lag3']
    merged = pd.merge(pothole_data, w_df[weather_cols], left_on='Date', right_on='date', how='inner')
    merged = merged.fillna(0)

    features = ['Month', 'DayOfWeek', 'precipitation', 'precip_lag1', 'precip_lag2', 'precip_lag3']
    X = merged[features]
    y = merged['Request_Count']

    model = CatBoostRegressor(iterations=300, verbose=0)
    model.fit(X, y)

    # --- Model Comparison ---
    # Train a standard Linear Regression model for comparison
    lr_model = LinearRegression()
    lr_model.fit(X, y)

    # Compare models using R-squared score on the training data
    catboost_r2 = r2_score(y, model.predict(X))
    lr_r2 = r2_score(y, lr_model.predict(X))

    print(f"Pothole Model R-squared (training data):")
    print(f" - CatBoost: {catboost_r2:.4f}")
    print(f" - Linear Regression: {lr_r2:.4f}")

    return model

def main(data_dir, output_dir):
    """Main function to run the training and analysis script."""
    
    # --- 1. Setup and Data Loading ---
    os.makedirs(output_dir, exist_ok=True)
    plots_dir = os.path.join(output_dir, 'plots')
    os.makedirs(plots_dir, exist_ok=True)

    combined_df = load_311_data(data_dir)
    train_df, _ = train_test_split(combined_df, test_size=0.2, random_state=42)
    print(f"Loaded and split data. Using {len(train_df)} rows for training.")

    weather_path = os.path.join(data_dir, 'weatherstats_toronto_daily.csv')
    if not os.path.exists(weather_path):
        raise FileNotFoundError(f"Weather data not found at {weather_path}")

    # --- 2. Train Pothole Model ---
    print("\n--- Training Pothole Model (with rain lag) ---")
    model_pothole_lagged = train_pothole_model_v2(train_df, weather_path)
    pothole_model_path = os.path.join(output_dir, 'pothole_model.cbm')
    model_pothole_lagged.save_model(pothole_model_path)
    print(f"Pothole model saved to: {pothole_model_path}")

    # --- 3. Train Snow Model ---
    print("\n--- Training Snow Clearing Model ---")
    snow_merged_data = prepare_snow_model(train_df, weather_path)
    features_snow = ['Month', 'DayOfWeek', 'snow_depth', 'snow_precipitation']
    X_snow = snow_merged_data[features_snow]
    y_snow = snow_merged_data['Request_Count']
    model_snow = CatBoostRegressor(iterations=300, verbose=0)
    model_snow.fit(X_snow, y_snow)
    snow_model_path = os.path.join(output_dir, 'snow_model.cbm')
    model_snow.save_model(snow_model_path)
    print(f"Snow model saved to: {snow_model_path}")

    # --- Model Comparison for Snow ---
    lr_model_snow = LinearRegression()
    lr_model_snow.fit(X_snow, y_snow)

    catboost_pred_snow = model_snow.predict(X_snow)
    lr_pred_snow = lr_model_snow.predict(X_snow)

    catboost_r2_snow = r2_score(y_snow, catboost_pred_snow)
    lr_r2_snow = r2_score(y_snow, lr_pred_snow)
    print(f"Snow Model R-squared (training data):")
    print(f" - CatBoost: {catboost_r2_snow:.4f}")
    print(f" - Linear Regression: {lr_r2_snow:.4f}")

    # --- 4. Run Predictions and Analysis ---
    print('\n--- ROAD POTHOLES (Rain Impact Scenarios) ---')
    for rain_cm in range(10, 60, 10):
        daily_mm = (rain_cm * 10) / 3
        test_input = pd.DataFrame([[5, 2, daily_mm, daily_mm, daily_mm, daily_mm]],
                                  columns=['Month', 'DayOfWeek', 'precipitation', 'precip_lag1', 'precip_lag2', 'precip_lag3'])
        pred = model_pothole_lagged.predict(test_input)[0]
        print(f' - Total Rain {rain_cm}cm (over 3 days): {round(pred)} requests')

    print('\n--- SNOW CLEARING (Snow Impact Scenarios) ---')
    for snow_cm in range(10, 60, 10):
        pred = predict_snow_event(model_snow, start_month=1, start_day_of_week=0, snow_depth_cm=snow_cm, duration_days=1)
        print(f' - Snow Depth {snow_cm}cm: {pred} requests')


    print("\nScript finished successfully.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train 311 service request prediction models.")
    parser.add_argument('--data-dir', type=str, required=True, help="Directory containing SR*.csv and weather data.")
    parser.add_argument('--output-dir', type=str, required=True, help="Directory to save trained models and plots.")
    args = parser.parse_args()
    main(args.data_dir, args.output_dir)
