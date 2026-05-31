import os
import argparse
import re
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

    # Directly use 'snow_on_ground' for depth and 'snow' for precipitation.
    depth_col = 'snow_on_ground'
    precip_col = 'snow'

    if depth_col not in w_df.columns:
        print(f"Warning: '{depth_col}' column not found in weather data. Using 0 for snow_depth.")
        w_df[depth_col] = 0
    if precip_col not in w_df.columns:
        print(f"Warning: '{precip_col}' column not found in weather data. Using 0 for snow_precipitation.")
        w_df[precip_col] = 0

    snow_requests = prepare_category_data(df, 'Snow')

    weather_cols = ['date', depth_col, precip_col]
    merged = pd.merge(snow_requests, w_df[weather_cols], left_on='Date', right_on='date', how='inner')

    merged = merged.rename(columns={
        depth_col: 'snow_depth',
        precip_col: 'snow_precipitation'
    })

    # Ensure all required columns are present before returning
    final_cols = ['Date', 'Request_Count', 'Month', 'Day', 'DayOfWeek', 'snow_depth', 'snow_precipitation']
    for col in final_cols:
        if col not in merged.columns:
            merged[col] = 0

    return merged[final_cols].fillna(0)


def plot_potholes_by_geo(df, output_dir):
    """Filters pothole data and plots request counts by ward and postal FSA."""
    df_copy = df.copy()

    # Filter for pothole requests
    pothole_df = df_copy[df_copy['Service Request Type'].str.contains('Pot hole', case=False, na=False)].copy()

    # Extract ward number from 'Ward' column
    _WARD_NUM_RE = re.compile(r"\((\d+)\)")
    def _extract_ward_num(ward_str):
        if not isinstance(ward_str, str):
            return None
        m = _WARD_NUM_RE.search(ward_str)
        return int(m.group(1)) if m else None

    pothole_df['ward_num'] = pothole_df['Ward'].apply(_extract_ward_num)

    # Use postal code FSA (First 3 Chars of Postal Code)
    pothole_df = pothole_df.rename(columns={'First 3 Chars of Postal Code': 'postal_fsa'})

    # Filter out rows with invalid ward or postal code
    pothole_df.dropna(subset=['ward_num', 'postal_fsa'], inplace=True)
    pothole_df['ward_num'] = pothole_df['ward_num'].astype(int)

    # Aggregate counts by ward and postal FSA
    geo_counts = pothole_df.groupby(['ward_num', 'postal_fsa']).size().reset_index(name='Request_Count')

    # Sort by count descending
    geo_counts_sorted = geo_counts.sort_values('Request_Count', ascending=False)

    top_n = 20
    plot_data = geo_counts_sorted.head(top_n).copy()

    plot_data['location'] = 'Ward ' + plot_data['ward_num'].astype(str) + ' / ' + plot_data['postal_fsa']

    plt.figure(figsize=(12, 10))
    sns.barplot(x='Request_Count', y='location', data=plot_data)
    plt.title(f'Top {top_n} Pothole Request Locations (Ward / Postal FSA)')
    plt.xlabel('Total Pothole Request Count')
    plt.ylabel('Location (Ward / Postal FSA)')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'pothole_by_ward_and_zip.png'))
    plt.close()
    print("Generated 'pothole_by_ward_and_zip.png' plot.")


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

    # Plot pothole counts by ward and postal code
    print("\n--- Plotting Pothole Data by Ward and Postal Code ---")
    plot_potholes_by_geo(combined_df, plots_dir)

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
