const BASE_URL = 'https://api.worldbank.org/v2';

/**
 * Fetch World Bank indicator data for one or more countries.
 * Returns { date, value } array in chronological order.
 * seriesId format: "COUNTRY:INDICATOR" e.g. "US:NY.GDP.MKTP.CD"
 */
export async function fetchWorldBankData(seriesId, limit = 100) {
  const [countryCode, indicator] = seriesId.split(':');
  const perPage = Math.min(limit, 500);
  const url = `${BASE_URL}/country/${countryCode}/indicator/${indicator}?format=json&per_page=${perPage}&mrv=${perPage}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`World Bank API error: ${response.status}`);

  const json = await response.json();
  // Response is [metadata, data_array]
  const rows = json[1];
  if (!rows) return [];

  return rows
    .filter(r => r.value !== null)
    .map(r => ({
      date: r.date,
      value: parseFloat(r.value),
    }))
    .reverse(); // chronological order
}

export const WORLD_BANK_INDICATORS = {
  WB_GDP_US: {
    id: 'WB_GDP_US',
    source: 'worldbank',
    category: 'international',
    seriesId: 'US:NY.GDP.MKTP.CD',
    title: 'GDP — International',
    description: 'Gross domestic product (current USD) for major economies',
    unit: 'Current USD',
    color: '#3b82f6',
    segments: [
      { id: 'US:NY.GDP.MKTP.CD',  name: 'United States', color: '#3b82f6' },
      { id: 'CN:NY.GDP.MKTP.CD',  name: 'China',         color: '#ef4444' },
      { id: 'DE:NY.GDP.MKTP.CD',  name: 'Germany',       color: '#f59e0b' },
      { id: 'JP:NY.GDP.MKTP.CD',  name: 'Japan',         color: '#8b5cf6' },
      { id: 'GB:NY.GDP.MKTP.CD',  name: 'United Kingdom',color: '#10b981' },
    ],
  },

  WB_GDP_GROWTH: {
    id: 'WB_GDP_GROWTH',
    source: 'worldbank',
    category: 'international',
    seriesId: 'US:NY.GDP.MKTP.KD.ZG',
    title: 'GDP Growth Rate',
    description: 'Annual GDP growth rate (%) for major economies',
    unit: 'Percent',
    color: '#10b981',
    segments: [
      { id: 'US:NY.GDP.MKTP.KD.ZG',  name: 'United States', color: '#3b82f6' },
      { id: 'CN:NY.GDP.MKTP.KD.ZG',  name: 'China',         color: '#ef4444' },
      { id: 'DE:NY.GDP.MKTP.KD.ZG',  name: 'Germany',       color: '#f59e0b' },
      { id: 'JP:NY.GDP.MKTP.KD.ZG',  name: 'Japan',         color: '#8b5cf6' },
      { id: 'GB:NY.GDP.MKTP.KD.ZG',  name: 'United Kingdom',color: '#10b981' },
    ],
  },

  WB_INFLATION: {
    id: 'WB_INFLATION',
    source: 'worldbank',
    category: 'international',
    seriesId: 'US:FP.CPI.TOTL.ZG',
    title: 'Inflation — International',
    description: 'Consumer price inflation (annual %) for major economies',
    unit: 'Percent',
    color: '#f59e0b',
    segments: [
      { id: 'US:FP.CPI.TOTL.ZG',  name: 'United States', color: '#3b82f6' },
      { id: 'CN:FP.CPI.TOTL.ZG',  name: 'China',         color: '#ef4444' },
      { id: 'DE:FP.CPI.TOTL.ZG',  name: 'Germany',       color: '#f59e0b' },
      { id: 'JP:FP.CPI.TOTL.ZG',  name: 'Japan',         color: '#8b5cf6' },
      { id: 'GB:FP.CPI.TOTL.ZG',  name: 'United Kingdom',color: '#10b981' },
    ],
  },

  WB_UNEMPLOYMENT: {
    id: 'WB_UNEMPLOYMENT',
    source: 'worldbank',
    category: 'international',
    seriesId: 'US:SL.UEM.TOTL.ZS',
    title: 'Unemployment — International',
    description: 'Unemployment rate (% of total labor force) for major economies',
    unit: 'Percent',
    color: '#ef4444',
    segments: [
      { id: 'US:SL.UEM.TOTL.ZS',  name: 'United States', color: '#3b82f6' },
      { id: 'CN:SL.UEM.TOTL.ZS',  name: 'China',         color: '#ef4444' },
      { id: 'DE:SL.UEM.TOTL.ZS',  name: 'Germany',       color: '#f59e0b' },
      { id: 'JP:SL.UEM.TOTL.ZS',  name: 'Japan',         color: '#8b5cf6' },
      { id: 'GB:SL.UEM.TOTL.ZS',  name: 'United Kingdom',color: '#10b981' },
    ],
  },

  WB_TRADE: {
    id: 'WB_TRADE',
    source: 'worldbank',
    category: 'international',
    seriesId: 'US:NE.TRD.GNFS.ZS',
    title: 'Trade (% of GDP)',
    description: 'Trade as a percentage of GDP for major economies',
    unit: 'Percent of GDP',
    color: '#8b5cf6',
    segments: [
      { id: 'US:NE.TRD.GNFS.ZS',  name: 'United States', color: '#3b82f6' },
      { id: 'CN:NE.TRD.GNFS.ZS',  name: 'China',         color: '#ef4444' },
      { id: 'DE:NE.TRD.GNFS.ZS',  name: 'Germany',       color: '#f59e0b' },
      { id: 'JP:NE.TRD.GNFS.ZS',  name: 'Japan',         color: '#8b5cf6' },
      { id: 'GB:NE.TRD.GNFS.ZS',  name: 'United Kingdom',color: '#10b981' },
    ],
  },
};
