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
import {
  Paper,
  Typography,
  CircularProgress,
  Box,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
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
        <Paper sx={{ p: 1.5, bgcolor: 'background.paper' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {formatDate(data.date)}
          </Typography>
          <Typography variant="body2" color={indicator.color}>
            Value: {data.value.toLocaleString()} {indicator.unit}
          </Typography>
          {data.momChange !== null && (
            <Typography
              variant="body2"
              color={data.momChange >= 0 ? 'success.main' : 'error.main'}
              sx={{ fontWeight: 'bold' }}
            >
              MoM: {data.momChange >= 0 ? '+' : ''}{data.momChange}%
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '500px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Get a free API key at: https://fred.stlouisfed.org/docs/api/api_key.html
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{
      height: '100%',
      width: '100%',
      mx: 0,
      display: 'flex',
      flexDirection: 'column',
      p: 3,
      boxSizing: 'border-box',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: indicator.color, flexShrink: 0 }}>
            {indicator.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {indicator.description}
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(e, newRange) => {
            if (newRange !== null) {
              setTimeRange(newRange);
            }
          }}
          size="small"
          sx={{ flexShrink: 0 }}
        >
          <ToggleButton value="3M">3M</ToggleButton>
          <ToggleButton value="6M">6M</ToggleButton>
          <ToggleButton value="1Y">1Y</ToggleButton>
          <ToggleButton value="2Y">2Y</ToggleButton>
          <ToggleButton value="5Y">5Y</ToggleButton>
          <ToggleButton value="ALL">All</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
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
      </Box>

      <Box sx={{ mt: 2, flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Data source: Federal Reserve Economic Data (FRED) • Last {data.length} observations
        </Typography>
        {indicator.id === 'GDP' && (
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', fontStyle: 'italic', mt: 0.5 }}>
            Note: GDP is published quarterly (every 3 months)
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default EconomicChart;
