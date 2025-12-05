import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { fetchFredData } from '../services/fredApi';

const EconomicChart = ({ indicator }) => {
  const [allData, setAllData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1Y');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const chartData = await fetchFredData(indicator.seriesId, 500);

        // Calculate month-over-month percentage changes
        const dataWithMoM = chartData.map((point, index) => {
          if (index === 0) {
            return { ...point, momChange: null };
          }
          const previous = chartData[index - 1].value;
          const current = point.value;
          const percentChange = ((current - previous) / previous) * 100;
          return {
            ...point,
            momChange: parseFloat(percentChange.toFixed(2)),
          };
        });

        setAllData(dataWithMoM);
      } catch (err) {
        setError('Failed to load economic data. Please check your API key.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [indicator]);

  // Filter data based on selected time range
  useEffect(() => {
    if (allData.length === 0) return;

    if (timeRange === 'ALL') {
      setData(allData);
      return;
    }

    // Get the most recent date in the dataset as reference point
    const latestDate = new Date(allData[allData.length - 1].date);
    let cutoffDate;

    switch (timeRange) {
      case '3M':
        cutoffDate = new Date(latestDate);
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case '6M':
        cutoffDate = new Date(latestDate);
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate = new Date(latestDate);
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
      case '2Y':
        cutoffDate = new Date(latestDate);
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
        break;
      case '5Y':
        cutoffDate = new Date(latestDate);
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
        break;
      default:
        setData(allData);
        return;
    }

    // Find the index where we should start filtering
    const startIndex = allData.findIndex(point => new Date(point.date) >= cutoffDate);

    // Include one point before the cutoff to ensure MoM calculation for first visible point
    const filtered = startIndex > 0 ? allData.slice(startIndex - 1) : allData.slice(startIndex);

    setData(filtered);
  }, [allData, timeRange]);

  // Format the date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-sm text-gray-900 mb-1.5">
            {formatDate(data.date)}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            Value: <span className="font-semibold text-gray-900">{data.value.toLocaleString()}</span> {indicator.unit}
          </p>
          {data.momChange !== null && (
            <p className="text-sm">
              MoM: <span className={`font-semibold ${data.momChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {data.momChange >= 0 ? '+' : ''}{data.momChange}%
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const timeRanges = [
    { value: '3M', label: '3M' },
    { value: '6M', label: '6M' },
    { value: '1Y', label: '1Y' },
    { value: '2Y', label: '2Y' },
    { value: '5Y', label: '5Y' },
    { value: 'ALL', label: 'All' },
  ];

  // Calculate symmetric domain for MoM axis (centered at 0)
  const getMoMDomain = () => {
    const momValues = data
      .map(d => d.momChange)
      .filter(v => v !== null && !isNaN(v));

    if (momValues.length === 0) return [-1, 1];

    const maxAbsValue = Math.max(...momValues.map(Math.abs));
    const padding = maxAbsValue * 0.1; // 10% padding
    const limit = Math.ceil(maxAbsValue + padding);

    return [-limit, limit];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-emerald-500"></div>
            <p className="text-sm text-gray-500">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-medium text-sm">{error}</p>
        </div>
        <p className="text-sm text-gray-600">
          Get a free API key at: <a href="https://fred.stlouisfed.org/docs/api/api_key.html" className="text-emerald-600 hover:text-emerald-700 underline" target="_blank" rel="noopener noreferrer">FRED API</a>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {indicator.title}
            </h2>
            <p className="text-sm text-gray-500">{indicator.description}</p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-10 py-5 text-base font-medium rounded-md transition-colors ${
                  timeRange === range.value
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="w-full" style={{ height: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 60, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#d1d5db"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                label={{ value: indicator.unit, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
                stroke="#d1d5db"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={getMoMDomain()}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                label={{ value: 'MoM Change (%)', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#6b7280' } }}
                stroke="#d1d5db"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="line"
              />
              <Bar
                yAxisId="right"
                dataKey="momChange"
                name="MoM Change %"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.momChange === null ? 'transparent' : (entry.momChange >= 0 ? '#10b981' : '#ef4444')}
                    fillOpacity={entry.momChange === null ? 0 : 0.6}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="value"
                stroke={indicator.color}
                strokeWidth={2.5}
                dot={false}
                name={indicator.title}
                animationDuration={1000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <p className="text-xs text-gray-500">
          Data source: Federal Reserve Economic Data (FRED) • {data.length} observations
        </p>
        {indicator.id === 'GDP' && (
          <p className="text-xs text-amber-600 mt-1.5">
            Note: GDP is published quarterly (every 3 months)
          </p>
        )}
      </div>
    </div>
  );
};

export default EconomicChart;
