import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
import argparse

# Set up argument parser
parser = argparse.ArgumentParser(description='Generate EDA plots for a specific year.')
parser.add_argument('--year', type=int, required=True, help='The year to analyze (e.g., 2023)')
args = parser.parse_args()

year = args.year

# Load the dataset
try:
    df = pd.read_csv('data/SR2026.csv', encoding='latin-1', on_bad_lines='skip')
except FileNotFoundError:
    # This fallback seems to point to the same file, but keeping the structure.
    # A more robust solution might load from a different path if needed.
    df = pd.read_csv('../data/SR2026.csv', encoding='latin-1', on_bad_lines='skip')

# Create a directory to save plots
output_dir = f'eda_plots/{year}'
os.makedirs(output_dir, exist_ok=True)


# Set plot styles
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (12, 7)

# Display basic information about the dataframe
print(df.info())

# Convert 'Creation Date' to datetime objects
df['Creation Date'] = pd.to_datetime(df['Creation Date'], errors='coerce')

# Filter the DataFrame for the specified year
df = df[df['Creation Date'].dt.year == year].copy()

if df.empty:
    print(f"No data found for the year {year}. Exiting.")
    exit()

print(df.info())

# Check for missing values in each column
print(df.isnull().sum())


# Plot the top 15 most common service request types for the year
plt.figure(figsize=(10, 8))
df['Service Request Type'].value_counts().nlargest(15).sort_values().plot(kind='barh')
plt.title(f'Top 15 Most Common Service Request Types in {year}')
plt.xlabel('Number of Requests')
plt.ylabel('Service Request Type')
plt.tight_layout() # Adjust layout to make room for labels
plt.savefig(os.path.join(output_dir, '01_top_15_service_requests.png'))
plt.close() # Close the figure to free memory

# Plot the number of requests per ward
plt.figure(figsize=(12, 8))
df['Ward'].value_counts().sort_index().plot(kind='bar', color=sns.color_palette("viridis", n_colors=len(df['Ward'].unique())))
plt.title(f'Number of 311 Requests per Ward in {year}')
plt.xlabel('Ward')
plt.ylabel('Number of Requests')
plt.xticks(rotation=90)
plt.tight_layout() # Adjust layout
plt.savefig(os.path.join(output_dir, f'02_requests_per_ward_{year}.png'))
plt.close()

# Extract time-based features
df['month'] = df['Creation Date'].dt.month
df['day_of_week'] = df['Creation Date'].dt.day_name()
df['hour'] = df['Creation Date'].dt.hour

# Plot requests per month
plt.figure(figsize=(12, 6))
sns.countplot(data=df, x='month', order=range(1, 13))
plt.title(f'311 Requests per Month in {year}')
plt.xlabel('Month')
plt.ylabel('Number of Requests')
plt.savefig(os.path.join(output_dir, f'03_requests_per_month_{year}.png'))
plt.close()

# Plot requests by day of the week
plt.figure(figsize=(10, 6))
sns.countplot(data=df, x='day_of_week', order=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
plt.title(f'311 Requests by Day of the Week in {year}')
plt.xlabel('Day of the Week')
plt.ylabel('Number of Requests') # Add y-label
plt.savefig(os.path.join(output_dir, f'04_requests_by_day_of_week_{year}.png'))
plt.close()

# Find the top 5 wards and top 5 request types
top_wards = df['Ward'].value_counts().nlargest(5).index
top_requests = df['Service Request Type'].value_counts().nlargest(5).index

# Filter the dataframe
df_top = df[df['Ward'].isin(top_wards) & df['Service Request Type'].isin(top_requests)]

# Create a pivot table and plot a heatmap
pivot = df_top.pivot_table(index='Ward', columns='Service Request Type', aggfunc='size', fill_value=0)

plt.figure(figsize=(12, 8))
sns.heatmap(pivot, annot=True, fmt='d', cmap='viridis')
plt.title(f'Heatmap of Top 5 Request Types in Top 5 Wards for {year}')
plt.xlabel('Service Request Type')
plt.ylabel('Ward')
plt.savefig(os.path.join(output_dir, f'05_heatmap_top5_wards_requests_{year}.png'))
plt.close()

print("Top 10 Most Frequent Service Request Types:")
print(df['Service Request Type'].value_counts().nlargest(10))


print("Top 10 Wards by Request Volume:")
print(df['Ward'].value_counts().nlargest(10))


# Focus on weather-related requests
weather_requests = ['Public Flooding', 'Catch Basin Blocked/Flooding', 'Water Leak on Road - Minor']
df_weather = df[df['Service Request Type'].isin(weather_requests)]

plt.figure(figsize=(12, 6))
sns.countplot(data=df_weather, x='month', hue='Service Request Type', order=range(1, 13))
plt.title(f'Weather-Related 311 Requests per Month in {year}')
plt.xlabel('Month')
plt.ylabel('Number of Requests')
plt.legend(title='Request Type') # Add legend
plt.savefig(os.path.join(output_dir, f'06_weather_requests_per_month_{year}.png'))
plt.close()

plt.figure(figsize=(12, 6))
sns.countplot(data=df, x='hour')
plt.title(f'Distribution of 311 Requests by Hour of the Day in {year}')
plt.xlabel('Hour of Day (24h format)')
plt.ylabel('Number of Requests') # Add y-label
plt.savefig(os.path.join(output_dir, f'07_requests_by_hour_{year}.png'))
plt.close()


print("Top 10 Most Active City Divisions:")
print(df['Division'].value_counts().nlargest(10))


print("Missing Value Counts:")
print(df.isnull().sum())
