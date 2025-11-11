import axios from 'axios';

// FRED API key - Get a free API key from https://fred.stlouisfed.org/docs/api/api_key.html
// Set VITE_FRED_API_KEY in your .env file
const API_KEY = import.meta.env.VITE_FRED_API_KEY || 'YOUR_FRED_API_KEY';
// Use proxy in development to avoid CORS issues
const BASE_URL = '/api/fred/series/observations';

/**
 * Fetch economic data from FRED API
 * @param {string} seriesId - The FRED series ID (e.g., 'GDP', 'UNRATE')
 * @param {number} limit - Number of observations to fetch (default: 100)
 * @returns {Promise} - Promise resolving to formatted chart data
 */
export const fetchFredData = async (seriesId, limit = 100) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        series_id: seriesId,
        api_key: API_KEY,
        file_type: 'json',
        limit: limit,
        sort_order: 'desc', // Get most recent data first
      },
    });

    // Transform the data for Recharts
    const observations = response.data.observations;

    // Filter out any missing values and reverse to chronological order
    const chartData = observations
      .filter(obs => obs.value !== '.')
      .reverse()
      .map(obs => ({
        date: obs.date,
        value: parseFloat(obs.value),
      }));

    return chartData;
  } catch (error) {
    console.error(`Error fetching data for ${seriesId}:`, error);
    throw error;
  }
};

// Economic indicator configurations
export const ECONOMIC_INDICATORS = {
  GDP: {
    id: 'GDP',
    seriesId: 'GDP',
    title: 'Gross Domestic Product',
    description: 'Total value of goods and services produced',
    unit: 'Billions of Dollars',
    color: '#1976d2',
  },
  UNEMPLOYMENT: {
    id: 'UNEMPLOYMENT',
    seriesId: 'UNRATE',
    title: 'Unemployment Rate',
    description: 'Percentage of labor force unemployed',
    unit: 'Percent',
    color: '#d32f2f',
  },
  INFLATION: {
    id: 'INFLATION',
    seriesId: 'CPIAUCSL',
    title: 'Consumer Price Index (Inflation)',
    description: 'Measure of average change in prices over time',
    unit: 'Index 1982-1984=100',
    color: '#f57c00',
  },
  FED_RATE: {
    id: 'FED_RATE',
    seriesId: 'FEDFUNDS',
    title: 'Federal Funds Rate',
    description: 'Interest rate for overnight lending between banks',
    unit: 'Percent',
    color: '#388e3c',
  },
  SP500: {
    id: 'SP500',
    seriesId: 'SP500',
    title: 'S&P 500',
    description: 'Stock market index of 500 largest U.S. companies',
    unit: 'Index',
    color: '#7b1fa2',
  },
};
