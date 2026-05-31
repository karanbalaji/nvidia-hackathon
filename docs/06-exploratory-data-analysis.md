# Exploratory Data Analysis of 311 Service Requests

This document presents an exploratory data analysis of the `SR2026.csv` dataset, following the plan outlined in `docs/05-eda-plan.md`.

## 1. Setup

First, let's import the necessary Python libraries and load the dataset.

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the dataset
try:
    df = pd.read_csv('../data/SR2026.csv', encoding='latin-1')
except FileNotFoundError:
    df = pd.read_csv('data/SR2026.csv', encoding='latin-1')


# Set plot styles
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (12, 7)
```

## 2. Data Cleaning and Initial Inspection

We begin by inspecting the data to understand its structure, identify missing values, and correct data types.

### 2.1. Data Information

```python
# Display basic information about the dataframe
print(df.info())
```

**Expected Output:** This will show the number of entries, the columns, their data types, and the number of non-null values for each column. We expect to see that `Creation Date` is an `object` type and will need to be converted to `datetime`.

### 2.2. Convert to Datetime

```python
# Convert 'Creation Date' to datetime objects
df['Creation Date'] = pd.to_datetime(df['Creation Date'], errors='coerce')
print(df.info())
```

**Expected Output:** The `info()` output should now show `Creation Date` as a `datetime64[ns]` type.

### 2.3. Missing Values

```python
# Check for missing values in each column
print(df.isnull().sum())
```

**Expected Output:** This will print a list of columns and the count of `NaN` (Not a Number) or `NaT` (Not a Time) values for each. We expect to see a significant number of missing values in `Intersection Street 1` and `Intersection Street 2`.

## 3. Univariate Analysis

Now, let's analyze individual variables to understand their distributions.

### 3.1. Service Request Type

```python
# Plot the top 15 most common service request types
plt.figure(figsize=(10, 8))
df['Service Request Type'].value_counts().nlargest(15).sort_values().plot(kind='barh')
plt.title('Top 15 Most Common Service Request Types')
plt.xlabel('Number of Requests')
plt.ylabel('Service Request Type')
plt.tight_layout()
plt.show()
```

**Expected Output:** A horizontal bar chart showing the 15 most frequent service requests. This will help identify the most common issues reported to 311.

### 3.2. Requests per Ward

```python
# Plot the number of requests per ward
plt.figure(figsize=(12, 8))
df['Ward'].value_counts().sort_index().plot(kind='bar')
plt.title('Number of 311 Requests per Ward')
plt.xlabel('Ward')
plt.ylabel('Number of Requests')
plt.xticks(rotation=90)
plt.tight_layout()
plt.show()
```

**Expected Output:** A bar chart displaying the total number of service requests for each city ward, helping to identify which wards are most active.

### 3.3. Temporal Analysis

We can extract time-based features to analyze trends.

```python
# Extract time-based features
df['month'] = df['Creation Date'].dt.month
df['day_of_week'] = df['Creation Date'].dt.day_name()
df['hour'] = df['Creation Date'].dt.hour

# Plot requests per month
plt.figure(figsize=(12, 6))
sns.countplot(data=df, x='month', order=range(1, 13))
plt.title('311 Requests per Month')
plt.xlabel('Month')
plt.ylabel('Number of Requests')
plt.show()

# Plot requests by day of the week
plt.figure(figsize=(10, 6))
sns.countplot(data=df, x='day_of_week', order=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
plt.title('311 Requests by Day of the Week')
plt.xlabel('Day of the Week')
plt.ylabel('Number of Requests')
plt.show()
```

**Expected Output:**
1.  A bar chart showing the total number of requests for each month, which may reveal seasonal patterns.
2.  A bar chart showing request volume by day of the week, which can show if requests are more common on weekdays vs. weekends.

## 4. Bivariate Analysis

Let's explore the relationships between different variables.

### 4.1. Top 5 Request Types by Top 5 Wards

```python
# Find the top 5 wards and top 5 request types
top_wards = df['Ward'].value_counts().nlargest(5).index
top_requests = df['Service Request Type'].value_counts().nlargest(5).index

# Filter the dataframe
df_top = df[df['Ward'].isin(top_wards) & df['Service Request Type'].isin(top_requests)]

# Create a pivot table and plot a heatmap
pivot = df_top.pivot_table(index='Ward', columns='Service Request Type', aggfunc='size', fill_value=0)

plt.figure(figsize=(12, 8))
sns.heatmap(pivot, annot=True, fmt='d', cmap='viridis')
plt.title('Heatmap of Top 5 Request Types in Top 5 Wards')
plt.xlabel('Service Request Type')
plt.ylabel('Ward')
plt.show()
```

**Expected Output:** A heatmap that cross-references the most active wards with the most common service requests, showing which specific problems are prevalent in which high-activity areas.

## 5. Answering Key Questions

This section provides code to directly answer the questions from the EDA plan.

### 1. What are the top 10 most frequent service request types?
```python
print("Top 10 Most Frequent Service Request Types:")
print(df['Service Request Type'].value_counts().nlargest(10))
```

### 2. Which wards generate the most 311 requests?
```python
print("
Top 10 Wards by Request Volume:")
print(df['Ward'].value_counts().nlargest(10))
```

### 3. Are there clear seasonal patterns?
```python
# Focus on weather-related requests
weather_requests = ['Public Flooding', 'Catch Basin Blocked/Flooding', 'Water Leak on Road - Minor']
df_weather = df[df['Service Request Type'].isin(weather_requests)]

plt.figure(figsize=(12, 6))
sns.countplot(data=df_weather, x='month', hue='Service Request Type', order=range(1, 13))
plt.title('Weather-Related 311 Requests per Month')
plt.xlabel('Month')
plt.ylabel('Number of Requests')
plt.legend(title='Request Type')
plt.show()
```
**Expected Output:** A grouped bar chart showing the monthly distribution of specific weather-related requests, which should make seasonal trends for these categories very apparent.

### 4. What is the distribution of requests throughout a typical day?
```python
plt.figure(figsize=(12, 6))
sns.countplot(data=df, x='hour')
plt.title('Distribution of 311 Requests by Hour of the Day')
plt.xlabel('Hour of Day (24h format)')
plt.ylabel('Number of Requests')
plt.show()
```
**Expected Output:** A bar chart showing how many requests are typically made at each hour of the day.

### 5. Which city divisions are most active?
```python
print("
Top 10 Most Active City Divisions:")
print(df['Division'].value_counts().nlargest(10))
```

### 6. How much data is missing?
```python
print("
Missing Value Counts:")
print(df.isnull().sum())
```
