import axios from 'axios';

const API_KEY = import.meta.env.VITE_BLS_API_KEY || '';
const BASE_URL = '/api/bls/timeseries';

/**
 * Fetch time series data from BLS API v2
 * @param {string[]} seriesIds - Array of BLS series IDs
 * @param {number} startyear - Start year
 * @param {number} endyear - End year
 */
export const fetchBlsData = async (seriesId, limit = 100) => {
  const endYear = new Date().getFullYear();
  const startYear = endYear - Math.ceil(limit / 12);

  try {
    const payload = {
      seriesid: [seriesId],
      startyear: String(startYear),
      endyear: String(endYear),
      calculations: false,
      annualaverage: false,
    };
    if (API_KEY) payload.registrationkey = API_KEY;

    const response = await axios.post(BASE_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const series = response.data?.Results?.series?.[0];
    if (!series || !series.data) throw new Error(`No data returned for ${seriesId}`);

    // BLS returns newest-first; reverse to chronological
    const chartData = series.data
      .slice()
      .reverse()
      .filter(d => d.value !== '-')
      .map(d => {
        // period is M01-M12 for monthly, Q01-Q04 for quarterly, A01 for annual
        const period = d.period;
        let date;
        if (period.startsWith('M')) {
          const month = period.slice(1).padStart(2, '0');
          date = `${d.year}-${month}-01`;
        } else if (period.startsWith('Q')) {
          const quarterMonth = { Q01: '01', Q02: '04', Q03: '07', Q04: '10' };
          date = `${d.year}-${quarterMonth[period] || '01'}-01`;
        } else {
          date = `${d.year}-01-01`;
        }
        return { date, value: parseFloat(d.value) };
      });

    return chartData;
  } catch (error) {
    console.error(`Error fetching BLS data for ${seriesId}:`, error);
    throw error;
  }
};

export const BLS_INDICATORS = {
  // Labor Market
  BLS_CPI_ALL: {
    id: 'BLS_CPI_ALL',
    seriesId: 'CUUR0000SA0',
    source: 'bls',
    title: 'CPI — All Urban Consumers',
    description: 'Consumer price index for all urban consumers (BLS)',
    unit: 'Index 1982-84=100',
    color: '#dc2626',
    category: 'prices',
    segments: [
      { id: 'CUUR0000SA0', name: 'All Items', color: '#dc2626', description: 'Headline CPI for all urban consumers covering the full basket of goods.' },
      { id: 'CUUR0000SA0L1E', name: 'Core (ex Food & Energy)', color: '#8b5cf6', description: 'Urban CPI stripped of volatile food and energy components.' },
      { id: 'CUUR0000SAF', name: 'Food', color: '#10b981', description: 'Price index for all food items in the urban consumer basket.' },
      { id: 'CUUR0000SA0E', name: 'Energy', color: '#f59e0b', description: 'Price index for energy commodities and services for urban consumers.' },
    ],
  },
  BLS_PPI: {
    id: 'BLS_PPI',
    seriesId: 'WPUFD49207',
    source: 'bls',
    title: 'Producer Price Index',
    description: 'Wholesale prices received by domestic producers',
    unit: 'Index 1982=100',
    color: '#b45309',
    category: 'prices',
    segments: [
      { id: 'WPUFD49207', name: 'Final Demand', color: '#b45309', description: 'PPI for goods and services sold for final use, not for further processing.' },
      { id: 'WPUFD4', name: 'Goods', color: '#3b82f6', description: 'Producer prices for finished goods at the point of first sale.' },
      { id: 'WPUFD5', name: 'Services', color: '#10b981', description: 'Producer prices for services sold to final-demand purchasers.' },
    ],
  },
  BLS_EMPLOYMENT: {
    id: 'BLS_EMPLOYMENT',
    seriesId: 'CES0000000001',
    source: 'bls',
    title: 'Nonfarm Payrolls',
    description: 'Total nonfarm employees (thousands)',
    unit: 'Thousands of Persons',
    color: '#1d4ed8',
    category: 'labor',
    segments: [
      { id: 'CES0000000001', name: 'Total Nonfarm', color: '#1d4ed8', description: 'Total paid employees on nonfarm payrolls, the broadest jobs measure.' },
      { id: 'CES0500000001', name: 'Private', color: '#10b981', description: 'Nonfarm payroll employees working in the private sector.' },
      { id: 'CES9000000001', name: 'Government', color: '#f59e0b', description: 'Federal, state, and local government payroll employees.' },
    ],
  },
  BLS_UNEMPLOYMENT: {
    id: 'BLS_UNEMPLOYMENT',
    seriesId: 'LNS14000000',
    source: 'bls',
    title: 'Unemployment Rate (BLS)',
    description: 'Seasonally adjusted unemployment rate',
    unit: 'Percent',
    color: '#ef4444',
    category: 'labor',
    segments: [
      { id: 'LNS14000000', name: 'Overall (U-3)', color: '#ef4444', description: 'Official unemployment rate counting jobless workers actively seeking employment.' },
      { id: 'LNS13327709', name: 'U-6 (Broad)', color: '#f97316', description: 'Broad underemployment rate including marginally attached and part-time workers.' },
      { id: 'LNS14000003', name: 'Women', color: '#ec4899', description: 'Unemployment rate for women aged 16 and older.' },
      { id: 'LNS14000006', name: 'Men', color: '#3b82f6', description: 'Unemployment rate for men aged 16 and older.' },
    ],
  },
  BLS_EARNINGS: {
    id: 'BLS_EARNINGS',
    seriesId: 'CES0500000003',
    source: 'bls',
    title: 'Average Hourly Earnings (BLS)',
    description: 'Average hourly earnings of private employees',
    unit: 'Dollars per Hour',
    color: '#059669',
    category: 'labor',
    segments: [
      { id: 'CES0500000003', name: 'All Private', color: '#059669', description: 'Average hourly earnings across all private-sector industries.' },
      { id: 'CES0600000003', name: 'Goods-Producing', color: '#3b82f6', description: 'Average hourly earnings in manufacturing, mining, and construction.' },
      { id: 'CES0700000003', name: 'Service-Providing', color: '#8b5cf6', description: 'Average hourly earnings across all private service-providing industries.' },
    ],
  },
  BLS_JOB_OPENINGS: {
    id: 'BLS_JOB_OPENINGS',
    seriesId: 'JTS000000000000000JOL',
    source: 'bls',
    title: 'Job Openings (JOLTS)',
    description: 'Total job openings across all industries',
    unit: 'Thousands',
    color: '#7c3aed',
    category: 'labor',
    segments: [
      { id: 'JTS000000000000000JOL', name: 'Job Openings', color: '#7c3aed', description: 'Unfilled positions employers are actively recruiting to fill.' },
      { id: 'JTS000000000000000HIL', name: 'Hires', color: '#10b981', description: 'Total new additions to payrolls during the reference month.' },
      { id: 'JTS000000000000000QUL', name: 'Quits', color: '#f59e0b', description: 'Workers who voluntarily left their jobs, a proxy for worker confidence.' },
      { id: 'JTS000000000000000TSL', name: 'Total Separations', color: '#ef4444', description: 'All job separations including quits, layoffs, and discharges.' },
    ],
  },
};
