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
    // This point will have momChange calculated from the previous point
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
          <p className="font-bold text-sm text-gray-900 mb-1">
            {formatDate(data.date)}
          </p>
          <p className="text-sm mb-1" style={{ color: indicator.color }}>
            Value: {data.value.toLocaleString()} {indicator.unit}
          </p>
          {data.momChange !== null && (
            <p
              className={`text-sm font-bold ${
                data.momChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              MoM: {data.momChange >= 0 ? '+' : ''}{data.momChange}%
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
        <p className="text-sm text-gray-600">
          Get a free API key at: https://fred.stlouisfed.org/docs/api/api_key.html
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-6 bg-white">
      {/* Header with Title and Time Range Selector */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-3xl font-bold mb-1" style={{ color: indicator.color }}>
            {indicator.title}
          </h2>
          <p className="text-sm text-gray-600">{indicator.description}</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === range.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ value: indicator.unit, angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: 'MoM Change (%)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="right"
              dataKey="momChange"
              name="MoM Change %"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.momChange === null ? 'transparent' : (entry.momChange >= 0 ? '#4caf50' : '#f44336')}
                  fillOpacity={entry.momChange === null ? 0 : 0.6}
                />
              ))}
            </Bar>
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="value"
              stroke={indicator.color}
              strokeWidth={2}
              dot={false}
              name={indicator.title}
              animationDuration={1000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="mt-4 flex-shrink-0">
        <p className="text-xs text-gray-500">
          Data source: Federal Reserve Economic Data (FRED) • Last {data.length} observations
        </p>
        {indicator.id === 'GDP' && (
          <p className="text-xs text-amber-600 italic mt-1">
            Note: GDP is published quarterly (every 3 months)
          </p>
        )}
      </div>
    </div>
  );
};

export default EconomicChart;
