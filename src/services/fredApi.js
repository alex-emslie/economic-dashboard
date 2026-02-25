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

// Economic indicator configurations with segmented series
export const ECONOMIC_INDICATORS = {
  GDP: {
    id: 'GDP',
    seriesId: 'GDP',
    title: 'Gross Domestic Product',
    description: 'Total value of goods and services produced',
    unit: 'Billions of Dollars',
    color: '#1976d2',
    segments: [
      { id: 'GDP', name: 'Total GDP', color: '#2563eb' },       // Blue
      { id: 'PCEC', name: 'Personal Consumption', color: '#10b981' },  // Emerald
      { id: 'GPDI', name: 'Private Investment', color: '#8b5cf6' },    // Purple
      { id: 'GCE', name: 'Government Spending', color: '#f59e0b' },    // Amber
    ]
  },
  UNEMPLOYMENT: {
    id: 'UNEMPLOYMENT',
    seriesId: 'UNRATE',
    title: 'Unemployment Rate',
    description: 'Percentage of labor force unemployed',
    unit: 'Percent',
    color: '#d32f2f',
    segments: [
      { id: 'UNRATE', name: 'Overall Rate', color: '#ef4444' },         // Red
      { id: 'LNS14027659', name: 'Less Than HS', color: '#f97316' },    // Orange
      { id: 'LNS14027660', name: 'HS Graduates', color: '#eab308' },    // Yellow
      { id: 'LNS14027689', name: 'Some College', color: '#06b6d4' },    // Cyan
      { id: 'LNS14027662', name: 'Bachelor\'s+', color: '#8b5cf6' },    // Purple
    ]
  },
  INFLATION: {
    id: 'INFLATION',
    seriesId: 'CPIAUCSL',
    title: 'Consumer Price Index (Inflation)',
    description: 'Measure of average change in prices over time',
    unit: 'Index 1982-1984=100',
    color: '#f57c00',
    segments: [
      { id: 'CPIAUCSL', name: 'All Items', color: '#dc2626' },          // Red
      { id: 'CPILFESL', name: 'Core (ex Food & Energy)', color: '#8b5cf6' },  // Purple
      { id: 'CPIUFDSL', name: 'Food', color: '#10b981' },               // Emerald
      { id: 'CPIENGSL', name: 'Energy', color: '#f59e0b' },             // Amber
      { id: 'CPIHOSSL', name: 'Housing', color: '#3b82f6' },            // Blue
    ]
  },
  FED_RATE: {
    id: 'FED_RATE',
    seriesId: 'FEDFUNDS',
    title: 'Federal Funds Rate',
    description: 'Interest rate for overnight lending between banks',
    unit: 'Percent',
    color: '#388e3c',
    segments: [
      { id: 'FEDFUNDS', name: 'Fed Funds Rate', color: '#10b981' },     // Emerald
      { id: 'DGS2', name: '2-Year Treasury', color: '#3b82f6' },        // Blue
      { id: 'DGS10', name: '10-Year Treasury', color: '#8b5cf6' },      // Purple
      { id: 'MORTGAGE30US', name: '30-Year Mortgage', color: '#f59e0b' }, // Amber
    ]
  },
  SP500: {
    id: 'SP500',
    seriesId: 'SP500',
    title: 'S&P 500',
    description: 'Stock market index of 500 largest U.S. companies',
    unit: 'Index',
    color: '#7b1fa2',
    segments: [
      { id: 'SP500', name: 'S&P 500', color: '#8b5cf6' },          // Purple
      { id: 'DJIA', name: 'Dow Jones', color: '#3b82f6' },         // Blue
      { id: 'NASDAQCOM', name: 'NASDAQ', color: '#10b981' },       // Emerald
      { id: 'VIXCLS', name: 'VIX (Volatility)', color: '#ef4444' }, // Red
    ]
  },
  HOUSING: {
    id: 'HOUSING',
    seriesId: 'HOUST',
    title: 'Housing Starts',
    description: 'New residential construction projects',
    unit: 'Thousands of Units',
    color: '#0288d1',
    segments: [
      { id: 'HOUST', name: 'Total Housing Starts', color: '#3b82f6' },
      { id: 'PERMIT', name: 'Building Permits', color: '#10b981' },
      { id: 'MSPUS', name: 'Median Sales Price', color: '#f59e0b' },
      { id: 'CSUSHPISA', name: 'Case-Shiller Index', color: '#8b5cf6' },
    ]
  },
  RETAIL_SALES: {
    id: 'RETAIL_SALES',
    seriesId: 'RSXFS',
    title: 'Retail Sales',
    description: 'Total retail and food services sales',
    unit: 'Millions of Dollars',
    color: '#00897b',
    segments: [
      { id: 'RSXFS', name: 'Total Retail Sales', color: '#10b981' },
      { id: 'RRSFS', name: 'Retail (ex Auto)', color: '#3b82f6' },
      { id: 'ECOMSA', name: 'E-Commerce Sales', color: '#8b5cf6' },
    ]
  },
  INDUSTRIAL_PRODUCTION: {
    id: 'INDUSTRIAL_PRODUCTION',
    seriesId: 'INDPRO',
    title: 'Industrial Production',
    description: 'Output of factories, mines, and utilities',
    unit: 'Index 2017=100',
    color: '#5e35b1',
    segments: [
      { id: 'INDPRO', name: 'Total Production', color: '#6366f1' },
      { id: 'IPG2211A2N', name: 'Manufacturing', color: '#3b82f6' },
      { id: 'IPG211111CN', name: 'Mining', color: '#f59e0b' },
      { id: 'IPG2211A2N', name: 'Utilities', color: '#10b981' },
    ]
  },
  LABOR_FORCE: {
    id: 'LABOR_FORCE',
    seriesId: 'CLF16OV',
    title: 'Labor Force Participation',
    description: 'Percentage of population in labor force',
    unit: 'Percent',
    color: '#c2185b',
    segments: [
      { id: 'CIVPART', name: 'Participation Rate', color: '#ec4899' },
      { id: 'EMRATIO', name: 'Employment-Pop Ratio', color: '#3b82f6' },
      { id: 'LNS12300060', name: 'Prime-Age (25-54)', color: '#10b981' },
    ]
  },
  WAGES: {
    id: 'WAGES',
    seriesId: 'CES0500000003',
    title: 'Average Hourly Earnings',
    description: 'Average hourly earnings of all employees',
    unit: 'Dollars per Hour',
    color: '#558b2f',
    segments: [
      { id: 'CES0500000003', name: 'All Employees', color: '#10b981' },
      { id: 'CES0600000003', name: 'Goods-Producing', color: '#3b82f6' },
      { id: 'CES0800000003', name: 'Private Service', color: '#8b5cf6' },
    ]
  },
  CONSUMER_SENTIMENT: {
    id: 'CONSUMER_SENTIMENT',
    seriesId: 'UMCSENT',
    title: 'Consumer Sentiment',
    description: 'University of Michigan consumer confidence',
    unit: 'Index 1966:Q1=100',
    color: '#ff6f00',
    segments: [
      { id: 'UMCSENT', name: 'Overall Sentiment', color: '#f59e0b' },
      { id: 'CSCICP03USM665S', name: 'OECD Confidence', color: '#3b82f6' },
    ]
  },
  PERSONAL_INCOME: {
    id: 'PERSONAL_INCOME',
    seriesId: 'PI',
    title: 'Personal Income',
    description: 'Income received by persons from all sources',
    unit: 'Billions of Dollars',
    color: '#00695c',
    segments: [
      { id: 'PI', name: 'Personal Income', color: '#10b981' },
      { id: 'DSPI', name: 'Disposable Income', color: '#3b82f6' },
      { id: 'PSAVERT', name: 'Personal Savings Rate', color: '#8b5cf6' },
    ]
  },
  TRADE_BALANCE: {
    id: 'TRADE_BALANCE',
    seriesId: 'BOPGSTB',
    title: 'Trade Balance',
    description: 'Net exports of goods and services',
    unit: 'Billions of Dollars',
    color: '#6a1b9a',
    segments: [
      { id: 'BOPGSTB', name: 'Goods & Services', color: '#8b5cf6' },
      { id: 'BOPGTB', name: 'Goods Only', color: '#ef4444' },
    ]
  },
  DEBT: {
    id: 'DEBT',
    seriesId: 'GFDEBTN',
    title: 'Federal Debt',
    description: 'Total public debt outstanding',
    unit: 'Millions of Dollars',
    color: '#c62828',
    segments: [
      { id: 'GFDEBTN', name: 'Total Federal Debt', color: '#ef4444' },
      { id: 'GFDEGDQ188S', name: 'Debt-to-GDP Ratio', color: '#f59e0b' },
    ]
  },
  MONEY_SUPPLY: {
    id: 'MONEY_SUPPLY',
    seriesId: 'M2SL',
    title: 'Money Supply (M2)',
    description: 'Total money supply including cash and deposits',
    unit: 'Billions of Dollars',
    color: '#2e7d32',
    segments: [
      { id: 'M2SL', name: 'M2 Money Supply', color: '#10b981' },
      { id: 'M1SL', name: 'M1 Money Supply', color: '#3b82f6' },
    ]
  },
  PRODUCTIVITY: {
    id: 'PRODUCTIVITY',
    seriesId: 'PRS85006092',
    title: 'Labor Productivity',
    description: 'Output per hour of all workers',
    unit: 'Index 2012=100',
    color: '#ad1457',
    segments: [
      { id: 'PRS85006092', name: 'Nonfarm Productivity', color: '#ec4899' },
      { id: 'OPHNFB', name: 'Output per Hour', color: '#3b82f6' },
    ]
  },
  JOBLESS_CLAIMS: {
    id: 'JOBLESS_CLAIMS',
    seriesId: 'ICSA',
    title: 'Initial Jobless Claims',
    description: 'Weekly unemployment insurance claims',
    unit: 'Thousands',
    color: '#e65100',
    segments: [
      { id: 'ICSA', name: 'Initial Claims', color: '#f59e0b' },
      { id: 'CCSA', name: 'Continued Claims', color: '#ef4444' },
    ]
  },
  CAPACITY_UTILIZATION: {
    id: 'CAPACITY_UTILIZATION',
    seriesId: 'TCU',
    title: 'Capacity Utilization',
    description: 'Percentage of available resources being used',
    unit: 'Percent of Capacity',
    color: '#4527a0',
    segments: [
      { id: 'TCU', name: 'Total Capacity', color: '#6366f1' },
      { id: 'MCUMFN', name: 'Manufacturing', color: '#3b82f6' },
    ]
  },
};
