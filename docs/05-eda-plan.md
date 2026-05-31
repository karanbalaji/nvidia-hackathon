# Exploratory Data Analysis (EDA) Plan: 311 Service Requests

This document outlines a plan for conducting Exploratory Data Analysis on the 311 Service Requests data from `SR2026.csv`.

## 1. Objective

The primary goal of this EDA is to deeply understand the characteristics and patterns within the 311 service request data. Key objectives include:
- Assess data quality, identify missing values, and understand data types.
- Uncover patterns and trends related to time, location, and request types.
- Analyze the distribution of different service requests across the city.
- Formulate hypotheses that can inform the predictive modeling phase of the project (e.g., which factors correlate with certain service requests).
- Identify potential data cleaning and feature engineering steps required for the main data pipeline.

## 2. Data Overview

The dataset (`SR2026.csv`) contains the following columns:

- **Creation Date:** Timestamp of when the service request was created.
- **Status:** The final or current status of the request (e.g., `Completed`, `Closed`).
- **First 3 Chars of Postal Code:** The forward sortation area (FSA) of the request location.
- **Intersection Street 1:** The first street of the reported intersection, if applicable.
- **Intersection Street 2:** The second street of the reported intersection, if applicable.
- **Ward:** The city ward where the request originated.
- **Service Request Type:** The specific type of service being requested.
- **Division:** The city division responsible for handling the request.
- **Section:** The specific city section within the division.

## 3. Proposed Analysis Steps

The analysis will be conducted in phases, starting from simple univariate analysis and moving to more complex multivariate and geospatial analysis.

### Step 1: Data Cleaning and Initial Inspection
- Load the dataset using `pandas`.
- Check data types (`.info()`) and convert `Creation Date` to a datetime object.
- Summarize missing values for each column (`.isnull().sum()`).
- Get summary statistics for numerical columns (`.describe()`) and value counts for categorical columns.

### Step 2: Univariate Analysis (Analyzing individual variables)
- **Service Request Type:** What are the most and least common request types? (Bar chart)
- **Status:** What is the distribution of request statuses?
- **Ward:** How many requests come from each ward? (Bar chart)
- **Division/Section:** Which city divisions handle the most requests?
- **Temporal Analysis:**
    - Extract year, month, day of week, and hour from `Creation Date`.
    - Plot the number of requests over time (per month, per day) to identify trends or seasonality.
    - Plot the distribution of requests by the day of the week and hour of the day.

### Step 3: Bivariate & Multivariate Analysis (Analyzing relationships)
- **Request Type by Ward:** What are the most common request types in the top 5 busiest wards? (Grouped bar chart or heatmap).
- **Status by Request Type:** Do certain request types have a higher likelihood of being `Closed` vs. `Completed`?
- **Time to Resolution:** While not a direct column, can we infer it? (This would require an end date, which is not present. We can analyze the distribution of statuses for older vs. newer requests).
- **Geographic Analysis:**
    - Plot the number of requests per postal code prefix.
    - If lat/lon data can be inferred or joined, create a scatter plot of requests on a map of Toronto to visually identify hotspots.

## 4. Key Questions to Answer

This EDA will aim to answer the following questions:
1.  What are the top 10 most frequent service request types?
2.  Which wards generate the most 311 requests? Are there specific types of requests that dominate in those wards?
3.  Are there clear seasonal patterns? For example, do pothole or flooding requests increase in certain months?
4.  What is the distribution of requests throughout a typical day and week?
5.  Which city divisions and sections are most active?
6.  How much data is missing, particularly for location-based columns like postal code and intersections?

## 5. Recommended Tools
- **Python:** The primary language for the analysis.
- **Pandas:** For data loading, cleaning, and manipulation.
- **Matplotlib & Seaborn:** For static data visualizations (bar charts, histograms, heatmaps).
- **Plotly:** For interactive visualizations.
- **Jupyter Notebook:** As the environment for conducting and documenting the analysis steps.
