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
  // ── Economic Output ──────────────────────────────────────────────────────────
  GDP: {
    id: 'GDP',
    source: 'fred',
    category: 'output',
    seriesId: 'GDP',
    title: 'Gross Domestic Product',
    description: 'Total value of goods and services produced',
    unit: 'Billions of Dollars',
    color: '#1976d2',
    segments: [
      { id: 'GDP', name: 'Total GDP', color: '#2563eb', description: 'The total market value of all goods and services produced in the U.S.' },
      { id: 'PCEC', name: 'Personal Consumption', color: '#10b981', description: 'Spending by households on goods and services, the largest component of GDP.' },
      { id: 'GPDI', name: 'Private Investment', color: '#8b5cf6', description: 'Business fixed investment and residential investment by the private sector.' },
      { id: 'GCE', name: 'Government Spending', color: '#f59e0b', description: 'Federal, state, and local government consumption and gross investment.' },
    ]
  },
  INDUSTRIAL_PRODUCTION: {
    id: 'INDUSTRIAL_PRODUCTION',
    source: 'fred',
    category: 'output',
    seriesId: 'INDPRO',
    title: 'Industrial Production',
    description: 'Output of factories, mines, and utilities',
    unit: 'Index 2017=100',
    color: '#5e35b1',
    segments: [
      { id: 'INDPRO', name: 'Total Production', color: '#6366f1', description: 'Aggregate output index for all U.S. manufacturing, mining, and utility sectors.' },
      { id: 'IPG2211A2N', name: 'Manufacturing', color: '#3b82f6', description: 'Output of electric power generation, transmission, and distribution utilities.' },
      { id: 'IPG211111CN', name: 'Mining', color: '#f59e0b', description: 'Crude oil and natural gas extraction output in the U.S.' },
      { id: 'IPG2211A2N', name: 'Utilities', color: '#10b981', description: 'Output of electric power generation, transmission, and distribution utilities.' },
    ]
  },
  RETAIL_SALES: {
    id: 'RETAIL_SALES',
    source: 'fred',
    category: 'output',
    seriesId: 'RSXFS',
    title: 'Retail Sales',
    description: 'Total retail and food services sales',
    unit: 'Millions of Dollars',
    color: '#00897b',
    segments: [
      { id: 'RSXFS', name: 'Total Retail Sales', color: '#10b981', description: 'Total monthly sales at retail stores and food service establishments.' },
      { id: 'RRSFS', name: 'Retail (ex Auto)', color: '#3b82f6', description: 'Retail sales excluding volatile motor vehicle and parts dealers.' },
      { id: 'ECOMSA', name: 'E-Commerce Sales', color: '#8b5cf6', description: 'Quarterly retail sales conducted over the internet.' },
    ]
  },
  PRODUCTIVITY: {
    id: 'PRODUCTIVITY',
    source: 'fred',
    category: 'output',
    seriesId: 'PRS85006092',
    title: 'Labor Productivity',
    description: 'Output per hour of all workers',
    unit: 'Index 2012=100',
    color: '#ad1457',
    segments: [
      { id: 'PRS85006092', name: 'Nonfarm Productivity', color: '#ec4899', description: 'Real output per hour worked across all nonfarm business sectors.' },
      { id: 'OPHNFB', name: 'Output per Hour', color: '#3b82f6', description: 'Index of real nonfarm business output divided by total hours worked.' },
    ]
  },
  CAPACITY_UTILIZATION: {
    id: 'CAPACITY_UTILIZATION',
    source: 'fred',
    category: 'output',
    seriesId: 'TCU',
    title: 'Capacity Utilization',
    description: 'Percentage of available resources being used',
    unit: 'Percent of Capacity',
    color: '#4527a0',
    segments: [
      { id: 'TCU', name: 'Total Capacity', color: '#6366f1', description: 'Share of industrial capacity in use across manufacturing, mining, and utilities.' },
      { id: 'MCUMFN', name: 'Manufacturing', color: '#3b82f6', description: 'Fraction of manufacturing capacity currently being utilized.' },
    ]
  },

  // ── Labor Market ─────────────────────────────────────────────────────────────
  UNEMPLOYMENT: {
    id: 'UNEMPLOYMENT',
    source: 'fred',
    category: 'labor',
    seriesId: 'UNRATE',
    title: 'Unemployment Rate',
    description: 'Percentage of labor force unemployed',
    unit: 'Percent',
    color: '#d32f2f',
    segments: [
      { id: 'UNRATE', name: 'Overall Rate', color: '#ef4444', description: 'Share of the labor force that is jobless and actively seeking work.' },
      { id: 'LNS14027659', name: 'Less Than HS', color: '#f97316', description: 'Unemployment rate for workers without a high school diploma.' },
      { id: 'LNS14027660', name: 'HS Graduates', color: '#eab308', description: 'Unemployment rate for workers whose highest degree is a high school diploma.' },
      { id: 'LNS14027689', name: 'Some College', color: '#06b6d4', description: 'Unemployment rate for workers with some college but no bachelor\'s degree.' },
      { id: 'LNS14027662', name: 'Bachelor\'s+', color: '#8b5cf6', description: 'Unemployment rate for workers with a bachelor\'s degree or higher.' },
    ]
  },
  LABOR_FORCE: {
    id: 'LABOR_FORCE',
    source: 'fred',
    category: 'labor',
    seriesId: 'CLF16OV',
    title: 'Labor Force Participation',
    description: 'Percentage of population in labor force',
    unit: 'Percent',
    color: '#c2185b',
    segments: [
      { id: 'CIVPART', name: 'Participation Rate', color: '#ec4899', description: 'Share of the civilian noninstitutional population that is working or job-seeking.' },
      { id: 'EMRATIO', name: 'Employment-Pop Ratio', color: '#3b82f6', description: 'Proportion of the civilian population that is currently employed.' },
      { id: 'LNS12300060', name: 'Prime-Age (25-54)', color: '#10b981', description: 'Labor force participation rate for workers aged 25 to 54.' },
    ]
  },
  WAGES: {
    id: 'WAGES',
    source: 'fred',
    category: 'labor',
    seriesId: 'CES0500000003',
    title: 'Average Hourly Earnings',
    description: 'Average hourly earnings of all employees',
    unit: 'Dollars per Hour',
    color: '#558b2f',
    segments: [
      { id: 'CES0500000003', name: 'All Employees', color: '#10b981', description: 'Mean hourly wage across all private-sector employees.' },
      { id: 'CES0600000003', name: 'Goods-Producing', color: '#3b82f6', description: 'Mean hourly wage for workers in manufacturing and construction.' },
      { id: 'CES0800000003', name: 'Private Service', color: '#8b5cf6', description: 'Mean hourly wage for workers in private service-providing industries.' },
    ]
  },
  JOBLESS_CLAIMS: {
    id: 'JOBLESS_CLAIMS',
    source: 'fred',
    category: 'labor',
    seriesId: 'ICSA',
    title: 'Initial Jobless Claims',
    description: 'Weekly unemployment insurance claims',
    unit: 'Thousands',
    color: '#e65100',
    segments: [
      { id: 'ICSA', name: 'Initial Claims', color: '#f59e0b', description: 'New unemployment insurance filings in a given week, a leading labor indicator.' },
      { id: 'CCSA', name: 'Continued Claims', color: '#ef4444', description: 'Workers who have already filed and are continuing to receive unemployment benefits.' },
    ]
  },

  // ── Prices & Inflation ───────────────────────────────────────────────────────
  INFLATION: {
    id: 'INFLATION',
    source: 'fred',
    category: 'prices',
    seriesId: 'CPIAUCSL',
    title: 'Consumer Price Index',
    description: 'Measure of average change in prices over time',
    unit: 'Index 1982-1984=100',
    color: '#f57c00',
    segments: [
      { id: 'CPIAUCSL', name: 'All Items', color: '#dc2626', description: 'Headline CPI measuring price changes for all urban consumer goods and services.' },
      { id: 'CPILFESL', name: 'Core (ex Food & Energy)', color: '#8b5cf6', description: 'CPI excluding volatile food and energy prices, used to gauge underlying inflation.' },
      { id: 'CPIUFDSL', name: 'Food', color: '#10b981', description: 'Price changes for all food items purchased for at-home and away-from-home consumption.' },
      { id: 'CPIENGSL', name: 'Energy', color: '#f59e0b', description: 'Price changes for energy commodities and services including gasoline and electricity.' },
      { id: 'CPIHOSSL', name: 'Housing', color: '#3b82f6', description: 'Price changes for shelter costs, the largest single component of the CPI basket.' },
    ]
  },

  // ── Financial Markets ─────────────────────────────────────────────────────────
  FED_RATE: {
    id: 'FED_RATE',
    source: 'fred',
    category: 'financial',
    seriesId: 'FEDFUNDS',
    title: 'Federal Funds Rate',
    description: 'Interest rate for overnight lending between banks',
    unit: 'Percent',
    color: '#388e3c',
    segments: [
      { id: 'FEDFUNDS', name: 'Fed Funds Rate', color: '#10b981', description: 'Overnight rate banks charge each other for reserve lending, set by the Fed.' },
      { id: 'DGS2', name: '2-Year Treasury', color: '#3b82f6', description: 'Yield on U.S. Treasury notes maturing in two years, sensitive to Fed policy.' },
      { id: 'DGS10', name: '10-Year Treasury', color: '#8b5cf6', description: 'Yield on 10-year U.S. Treasury notes, a key benchmark for long-term rates.' },
      { id: 'MORTGAGE30US', name: '30-Year Mortgage', color: '#f59e0b', description: 'Average interest rate on a 30-year fixed-rate residential mortgage.' },
    ]
  },
  SP500: {
    id: 'SP500',
    source: 'fred',
    category: 'financial',
    seriesId: 'SP500',
    title: 'S&P 500',
    description: 'Stock market index of 500 largest U.S. companies',
    unit: 'Index',
    color: '#7b1fa2',
    segments: [
      { id: 'SP500', name: 'S&P 500', color: '#8b5cf6', description: 'Market-cap-weighted index of 500 large U.S. publicly traded companies.' },
      { id: 'DJIA', name: 'Dow Jones', color: '#3b82f6', description: 'Price-weighted index tracking 30 prominent large-cap U.S. companies.' },
      { id: 'NASDAQCOM', name: 'NASDAQ', color: '#10b981', description: 'Composite index of all stocks listed on the NASDAQ exchange, tech-heavy.' },
      { id: 'VIXCLS', name: 'VIX (Volatility)', color: '#ef4444', description: 'Market\'s expectation of 30-day S&P 500 volatility, known as the "fear gauge."' },
    ]
  },
  MONEY_SUPPLY: {
    id: 'MONEY_SUPPLY',
    source: 'fred',
    category: 'financial',
    seriesId: 'M2SL',
    title: 'Money Supply (M2)',
    description: 'Total money supply including cash and deposits',
    unit: 'Billions of Dollars',
    color: '#2e7d32',
    segments: [
      { id: 'M2SL', name: 'M2 Money Supply', color: '#10b981', description: 'Broad money supply including cash, checking, savings, and money market accounts.' },
      { id: 'M1SL', name: 'M1 Money Supply', color: '#3b82f6', description: 'Narrow money supply consisting of cash, demand deposits, and other liquid assets.' },
    ]
  },

  // ── Consumer & Income ─────────────────────────────────────────────────────────
  CONSUMER_SENTIMENT: {
    id: 'CONSUMER_SENTIMENT',
    source: 'fred',
    category: 'consumer',
    seriesId: 'UMCSENT',
    title: 'Consumer Sentiment',
    description: 'University of Michigan consumer confidence',
    unit: 'Index 1966:Q1=100',
    color: '#ff6f00',
    segments: [
      { id: 'UMCSENT', name: 'Overall Sentiment', color: '#f59e0b', description: 'University of Michigan index of consumer attitudes toward personal finances and economy.' },
      { id: 'CSCICP03USM665S', name: 'OECD Confidence', color: '#3b82f6', description: 'OECD composite leading indicator of U.S. consumer confidence.' },
    ]
  },
  PERSONAL_INCOME: {
    id: 'PERSONAL_INCOME',
    source: 'fred',
    category: 'consumer',
    seriesId: 'PI',
    title: 'Personal Income',
    description: 'Income received by persons from all sources',
    unit: 'Billions of Dollars',
    color: '#00695c',
    segments: [
      { id: 'PI', name: 'Personal Income', color: '#10b981', description: 'Total income received by individuals from wages, investments, and transfers.' },
      { id: 'DSPI', name: 'Disposable Income', color: '#3b82f6', description: 'Personal income remaining after taxes, available for spending or saving.' },
      { id: 'PSAVERT', name: 'Personal Savings Rate', color: '#8b5cf6', description: 'Disposable income saved rather than spent, expressed as a percentage.' },
    ]
  },
  HOUSING: {
    id: 'HOUSING',
    source: 'fred',
    category: 'consumer',
    seriesId: 'HOUST',
    title: 'Housing Starts',
    description: 'New residential construction projects',
    unit: 'Thousands of Units',
    color: '#0288d1',
    segments: [
      { id: 'HOUST', name: 'Total Housing Starts', color: '#3b82f6', description: 'Number of new privately owned residential construction projects begun each month.' },
      { id: 'PERMIT', name: 'Building Permits', color: '#10b981', description: 'Permits issued for new residential construction, a leading indicator of housing activity.' },
      { id: 'MSPUS', name: 'Median Sales Price', color: '#f59e0b', description: 'Median sale price of existing and new single-family homes sold in the U.S.' },
      { id: 'CSUSHPISA', name: 'Case-Shiller Index', color: '#8b5cf6', description: 'National home price index tracking repeat-sales of single-family homes.' },
    ]
  },

  // ── Government & Trade ────────────────────────────────────────────────────────
  TRADE_BALANCE: {
    id: 'TRADE_BALANCE',
    source: 'fred',
    category: 'government',
    seriesId: 'BOPGSTB',
    title: 'Trade Balance',
    description: 'Net exports of goods and services',
    unit: 'Billions of Dollars',
    color: '#6a1b9a',
    segments: [
      { id: 'BOPGSTB', name: 'Goods & Services', color: '#8b5cf6', description: 'Total U.S. exports minus imports of both goods and services.' },
      { id: 'BOPGTB', name: 'Goods Only', color: '#ef4444', description: 'U.S. trade balance for physical merchandise, excluding services.' },
    ]
  },
  DEBT: {
    id: 'DEBT',
    source: 'fred',
    category: 'government',
    seriesId: 'GFDEBTN',
    title: 'Federal Debt',
    description: 'Total public debt outstanding',
    unit: 'Millions of Dollars',
    color: '#c62828',
    segments: [
      { id: 'GFDEBTN', name: 'Total Federal Debt', color: '#ef4444', description: 'Total outstanding debt obligations of the U.S. federal government.' },
      { id: 'GFDEGDQ188S', name: 'Debt-to-GDP Ratio', color: '#f59e0b', description: 'Federal debt as a percentage of gross domestic product.' },
    ]
  },
};
