import os
import argparse
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split


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

    filtered_df = df_copy[df_copy['Service Request Type'].str.contains(category_keyword, case=False, na=False)].copy()

    daily_counts = filtered_df.groupby(filtered_df['Creation Date'].dt.date).size().reset_index(name='Request_Count')
    daily_counts.columns = ['Date', 'Request_Count']
    daily_counts['Date'] = pd.to_datetime(daily_counts['Date'])

    daily_counts['Month'] = daily_counts['Date'].dt.month
    daily_counts['Day'] = daily_counts['Date'].dt.day
    daily_counts['DayOfWeek'] = daily_counts['Date'].dt.dayofweek

    return daily_counts


def prepare_pothole_data(df, weather_path):
    """Prepares pothole data with lagged precipitation features."""
    w_df = pd.read_csv(weather_path, low_memory=False)
    w_df['date'] = pd.to_datetime(w_df['date'])

    w_df = w_df.sort_values('date')
    w_df['precip_lag1'] = w_df['precipitation'].shift(1)
    w_df['precip_lag2'] = w_df['precipitation'].shift(2)
    w_df['precip_lag3'] = w_df['precipitation'].shift(3)

    pothole_data = prepare_category_data(df, 'Pot hole')
    weather_cols = ['date', 'precipitation', 'precip_lag1', 'precip_lag2', 'precip_lag3']
    merged = pd.merge(pothole_data, w_df[weather_cols], left_on='Date', right_on='date', how='inner')
    return merged.fillna(0)


def prepare_snow_data(df, weather_path):
    """Prepares snow data with snow depth and precipitation features."""
    w_df = pd.read_csv(weather_path, low_memory=False)
    w_df['date'] = pd.to_datetime(w_df['date'])

    snow_cols = [c for c in w_df.columns if 'snow' in c.lower()]
    depth_col = next((c for c in snow_cols if 'ground' in c.lower() or 'depth' in c.lower()), None)
    precip_col = next((c for c in snow_cols if 'fall' in c.lower() or 'precip' in c.lower()), 'precipitation')

    snow_requests = prepare_category_data(df, 'Snow')

    weather_cols = list(set(['date', 'precipitation', depth_col, precip_col]))
    weather_cols = [c for c in weather_cols if c in w_df.columns]
    merged = pd.merge(snow_requests, w_df[weather_cols], left_on='Date', right_on='date', how='inner')

    if depth_col:
        merged = merged.rename(columns={depth_col: 'snow_depth'})
    else:
        merged['snow_depth'] = 0

    if precip_col and precip_col != 'precipitation':
        merged = merged.rename(columns={precip_col: 'snow_precipitation'})
    else:
        merged['snow_precipitation'] = merged.get('precipitation', 0)

    return merged[['Date', 'Request_Count', 'Month', 'Day', 'DayOfWeek', 'snow_depth', 'snow_precipitation']].fillna(0)


def main(data_dir, output_dir):
    """Main function to run the data preparation script."""
    os.makedirs(output_dir, exist_ok=True)
    plots_dir = os.path.join(output_dir, 'plots')
    os.makedirs(plots_dir, exist_ok=True)

    print("--- Loading Raw Data ---")
    combined_df = load_311_data(data_dir)
    train_df, test_df = train_test_split(combined_df, test_size=0.2, random_state=42)
    print(f"Loaded {len(combined_df)} rows. Split into {len(train_df)} train and {len(test_df)} test rows.")

    weather_path = os.path.join(data_dir, 'weatherstats_toronto_daily.csv')
    if not os.path.exists(weather_path):
        raise FileNotFoundError(f"Weather data not found at {weather_path}")

    print("\n--- Preparing Pothole Data ---")
    pothole_train = prepare_pothole_data(train_df, weather_path)
    
    # Plot Pothole Request Count by Month
    pothole_monthly_counts = pothole_train.groupby('Month')['Request_Count'].sum().reset_index()
    plt.figure(figsize=(10, 6))
    sns.barplot(x='Month', y='Request_Count', data=pothole_monthly_counts)
    plt.title('Pothole Request Count by Month')
    plt.xlabel('Month')
    plt.ylabel('Total Request Count')
    plt.xticks(ticks=range(0, 12), labels=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, 'pothole_monthly_counts.png'))
    plt.close()
    print("Generated 'pothole_monthly_counts.png' plot.")

    print("\n--- Preparing Snow Data ---")
    snow_train = prepare_snow_data(train_df, weather_path)

    # Plot Snow Request Count by Month
    snow_monthly_counts = snow_train.groupby('Month')['Request_Count'].sum().reset_index()
    plt.figure(figsize=(10, 6))
    sns.barplot(x='Month', y='Request_Count', data=snow_monthly_counts, color='skyblue')
    plt.title('Snow Request Count by Month')
    plt.xlabel('Month')
    plt.ylabel('Total Request Count')
    plt.xticks(ticks=range(0, 12), labels=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, 'snow_monthly_counts.png'))
    plt.close()
    print("Generated 'snow_monthly_counts.png' plot.")

    print("\n✅ Data preparation complete.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Prepare 311 data for model training.")
    parser.add_argument('--data-dir', type=str, required=True, help="Directory containing SR*.csv and weather data.")
    parser.add_argument('--output-dir', type=str, required=True, help="Directory to save the prepared data files.")
    args = parser.parse_args()
    main(args.data_dir, args.output_dir)
