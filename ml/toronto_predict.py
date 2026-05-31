# -*- coding: utf-8 -*-
import pandas as pd
import os
import argparse
import re
import numpy as np
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import matplotlib.pyplot as plt
from sklearn.metrics import r2_score, accuracy_score
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

def prepare_category_data_with_geo(df, category_keyword):
    """Filters data by category and aggregates counts by date and ward."""
    df_copy = df.copy()
    df_copy['Creation Date'] = pd.to_datetime(df_copy['Creation Date'], errors='coerce')

    # Filter for the specific category
    filtered_df = df_copy[df_copy['Service Request Type'].str.contains(category_keyword, case=False, na=False)].copy()

    # Extract ward number from 'Ward' column
    _WARD_NUM_RE = re.compile(r"\((\d+)\)")
    def _extract_ward_num(ward_str):
        if not isinstance(ward_str, str): return 0
        m = _WARD_NUM_RE.search(ward_str)
        return int(m.group(1)) if m else 0
    
    filtered_df['ward_num'] = filtered_df['Ward'].apply(_extract_ward_num)
    
    # Filter out rows with invalid ward for more focused modeling
    filtered_df = filtered_df[filtered_df['ward_num'] > 0]

    # Aggregate by date and ward
    daily_counts = filtered_df.groupby([filtered_df['Creation Date'].dt.date, 'ward_num']).size().reset_index(name='Request_Count')
    daily_counts = daily_counts.rename(columns={'Creation Date': 'Date'})
    daily_counts['Date'] = pd.to_datetime(daily_counts['Date'])

    # Feature Engineering
    daily_counts['Month'] = daily_counts['Date'].dt.month
    daily_counts['Day'] = daily_counts['Date'].dt.day
    daily_counts['DayOfWeek'] = daily_counts['Date'].dt.dayofweek
    return daily_counts

def prepare_snow_model(df, weather_path):
    """Prepares snow data with snow depth and precipitation features."""
    w_df = pd.read_csv(weather_path, low_memory=False)
    w_df['date'] = pd.to_datetime(w_df['date'])

    # Directly use 'snow_on_ground' for depth and 'snow' for precipitation.
    depth_col = 'snow_on_ground'
    precip_col = 'snow'

    if depth_col not in w_df.columns:
        print(f"Warning: '{depth_col}' column not found in weather data. Using 0 for snow_depth.")
        w_df[depth_col] = 0
    if precip_col not in w_df.columns:
        print(f"Warning: '{precip_col}' column not found in weather data. Using 0 for snow_precipitation.")
        w_df[precip_col] = 0

    snow_requests = prepare_category_data_with_geo(df, 'Snow')

    weather_cols = ['date', depth_col, precip_col]
    merged = pd.merge(snow_requests, w_df[weather_cols], left_on='Date', right_on='date', how='inner')

    # Normalize names for model
    merged = merged.rename(columns={
        depth_col: 'snow_depth',
        precip_col: 'snow_precipitation'
    })

    merged[['snow_depth', 'snow_precipitation']] = merged[['snow_depth', 'snow_precipitation']].fillna(0)
    return merged

def prepare_pothole_data(df, weather_path):
    """Prepares pothole data with lagged precipitation features."""
    w_df = pd.read_csv(weather_path, low_memory=False)
    w_df['date'] = pd.to_datetime(w_df['date'])

    # Sort weather to calculate lags
    w_df = w_df.sort_values('date')
    # Create lagged features (rain from 1, 2, and 3 days ago)
    w_df['precip_lag1'] = w_df['precipitation'].shift(1)
    w_df['precip_lag2'] = w_df['precipitation'].shift(2)
    w_df['precip_lag3'] = w_df['precipitation'].shift(3)

    # Add snow features, which can contribute to freeze-thaw cycles
    depth_col = 'snow_on_ground'
    precip_col = 'snow'
    if depth_col not in w_df.columns:
        w_df[depth_col] = 0
    if precip_col not in w_df.columns:
        w_df[precip_col] = 0

    pothole_data = prepare_category_data_with_geo(df, 'Pot hole')
    weather_cols = ['date', 'precipitation', 'precip_lag1', 'precip_lag2', 'precip_lag3', depth_col, precip_col]
    merged = pd.merge(pothole_data, w_df[weather_cols], left_on='Date', right_on='date', how='inner')

    # Rename for consistency
    merged = merged.rename(columns={
        depth_col: 'snow_depth',
        precip_col: 'snow_precipitation'
    })

    return merged.fillna(0)

def train_pothole_model_v2(df, weather_path):
    merged = prepare_pothole_data(df, weather_path)

    features = ['Month', 'Day', 'DayOfWeek', 'precipitation', 'precip_lag1', 'precip_lag2', 'precip_lag3', 'ward_num', 'snow_depth', 'snow_precipitation']
    X = merged[features]
    y = merged['Request_Count'].astype(int)

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=4,            # Limit tree depth to prevent memorization
        min_samples_leaf=15,       # Require more samples per leaf to smooth predictions
        max_features="sqrt",      # Reduce feature correlation per tree
        random_state=42,
        n_jobs=-1)
    model.fit(X, y)

    # --- Model Comparison ---
    # Train a standard Linear Regression model for R-squared comparison
    lr_model = LinearRegression()
    lr_model.fit(X, y)

    # Compare models using appropriate metrics
    rf_accuracy = accuracy_score(y, model.predict(X))
    lr_r2 = r2_score(y, lr_model.predict(X))

    print(f"Pothole Model Performance (training data):")
    print(f" - Random Forest Accuracy: {rf_accuracy:.4f}")
    print(f" - Linear Regression R-squared: {lr_r2:.4f}")
    return model, lr_model, features

def train_snow_model(df, weather_path):
    """Prepares data and trains the snow prediction model."""
    snow_merged_data = prepare_snow_model(df, weather_path)

    # Feature selection for the snow model:
    # - Month: Captures the strong seasonal nature of snow events.
    # - Day: Captures any patterns within a month.
    # - snow_depth: The amount of snow on the ground is a primary driver for clearing requests.
    # - snow_precipitation: The amount of new snowfall is also a direct cause for requests.
    # - ward_num: The city ward, as a numeric feature.
    # - postal_fsa_encoded: The postal code area, as a categorical feature.
    features_snow = ['Month', 'Day', 'DayOfWeek', 'snow_depth', 'snow_precipitation', 'ward_num']
    X_snow = snow_merged_data[features_snow]
    y_snow = snow_merged_data['Request_Count'].astype(int)
    
    model_snow_rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=4,            # Limit tree depth to prevent memorization
        min_samples_leaf=15,       # Require more samples per leaf to smooth predictions
        max_features="sqrt",      # Reduce feature correlation per tree
        random_state=42,
        n_jobs=-1)
    model_snow_rf.fit(X_snow, y_snow)

    # --- Model Comparison ---
    lr_model_snow = LinearRegression()
    lr_model_snow.fit(X_snow, y_snow)

    rf_accuracy_snow = accuracy_score(y_snow, model_snow_rf.predict(X_snow))
    lr_r2_snow = r2_score(y_snow, lr_model_snow.predict(X_snow))
    print(f"Snow Model Performance (training data):")
    print(f" - Random Forest Accuracy: {rf_accuracy_snow:.4f}")
    print(f" - Linear Regression R-squared: {lr_r2_snow:.4f}")

    return model_snow_rf, lr_model_snow, features_snow

def main(data_dir, output_dir):
    """Main function to run the training and analysis script."""
    
    # --- 1. Setup and Data Loading ---
    os.makedirs(output_dir, exist_ok=True)
    plots_dir = os.path.join(output_dir, 'plots')
    os.makedirs(plots_dir, exist_ok=True)

    combined_df = load_311_data(data_dir)
    train_df, test_df = train_test_split(combined_df, test_size=0.2, random_state=42)
    print(f"Loaded and split data. Using {len(train_df)} rows for training.")

    weather_path = os.path.join(data_dir, 'weatherstats_toronto_daily.csv')
    if not os.path.exists(weather_path):
        raise FileNotFoundError(f"Weather data not found at {weather_path}")

    # --- 2. Train Pothole Model ---
    print("\n--- Training Pothole Model (with rain lag) ---")
    model_pothole_rf, model_pothole_lr, features_pothole = train_pothole_model_v2(train_df, weather_path)

    # Evaluate on test data
    pothole_test_data = prepare_pothole_data(test_df, weather_path)
    for col in features_pothole:
        if col not in pothole_test_data.columns:
            pothole_test_data[col] = 0
    X_test_pothole = pothole_test_data[features_pothole]
    y_test_pothole = pothole_test_data['Request_Count'].astype(int)
    print(f"Pothole Model Performance (test data):")
    print(f" - Random Forest Accuracy: {accuracy_score(y_test_pothole, model_pothole_rf.predict(X_test_pothole)):.4f}")
    print(f" - Linear Regression R-squared: {r2_score(y_test_pothole, model_pothole_lr.predict(X_test_pothole)):.4f}")

    pothole_model_path = os.path.join(output_dir, 'pothole_model.joblib')
    joblib.dump(model_pothole_rf, pothole_model_path)
    print(f"Pothole model saved to: {pothole_model_path}")

    # --- 3. Train Snow Model ---
    print("\n--- Training Snow Clearing Model ---")
    model_snow_rf, lr_model_snow, features_snow = train_snow_model(train_df, weather_path)
    snow_model_path = os.path.join(output_dir, 'snow_model.joblib')
    joblib.dump(model_snow_rf, snow_model_path)
    print(f"Snow model saved to: {snow_model_path}")

    # Evaluate on test data
    snow_test_data = prepare_snow_model(test_df, weather_path)

    # Ensure all feature columns exist, even if test set is small
    for col in features_snow:
        if col not in snow_test_data.columns:
            snow_test_data[col] = 0

    X_test_snow = snow_test_data[features_snow]
    y_test_snow = snow_test_data['Request_Count'].astype(int)
    print(f"Snow Model Performance (test data):")
    print(f" - Random Forest Accuracy: {accuracy_score(y_test_snow, model_snow_rf.predict(X_test_snow)):.4f}")
    print(f" - Linear Regression R-squared: {r2_score(y_test_snow, lr_model_snow.predict(X_test_snow)):.4f}")

    print("\nScript finished successfully.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train 311 service request prediction models.")
    parser.add_argument('--data-dir', type=str, required=True, help="Directory containing SR*.csv and weather data.")
    parser.add_argument('--output-dir', type=str, required=True, help="Directory to save trained models and plots.")
    args = parser.parse_args()
    main(args.data_dir, args.output_dir)
