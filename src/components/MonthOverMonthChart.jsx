import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Paper, Typography, CircularProgress, Box, Alert } from '@mui/material';
import { fetchFredData, ECONOMIC_INDICATORS } from '../services/fredApi';

const MonthOverMonthChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch data for all indicators
        const indicators = Object.values(ECONOMIC_INDICATORS);
        const allDataPromises = indicators.map(indicator =>
          fetchFredData(indicator.seriesId, 2) // Only need last 2 observations for MoM
        );

        const allData = await Promise.all(allDataPromises);

        // Calculate month-over-month changes
        const momChanges = indicators.map((indicator, index) => {
          const indicatorData = allData[index];

          if (indicatorData.length < 2) {
            return {
              name: indicator.title,
              change: 0,
              color: indicator.color,
            };
          }

          const latest = indicatorData[indicatorData.length - 1].value;
          const previous = indicatorData[indicatorData.length - 2].value;
          const percentChange = ((latest - previous) / previous) * 100;

          return {
            name: indicator.title,
            change: parseFloat(percentChange.toFixed(2)),
            color: indicator.color,
          };
        });

        setData(momChanges);
      } catch (err) {
        console.error('Error fetching month-over-month data:', err);
        setError('Failed to load month-over-month data. Please check your API key.');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <Paper sx={{ p: 1.5, bgcolor: 'background.paper' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {payload[0].payload.name}
          </Typography>
          <Typography
            variant="body2"
            color={value >= 0 ? 'success.main' : 'error.main'}
            sx={{ fontWeight: 'bold' }}
          >
            {value >= 0 ? '+' : ''}{value}%
          </Typography>
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
          minHeight: '300px',
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
      </Box>
    );
  }

  return (
    <Paper sx={{
      width: '100%',
      p: 3,
      boxSizing: 'border-box',
    }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Month-over-Month Changes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Percentage change from previous period for all indicators
      </Typography>

      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: 'Change (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#666" strokeWidth={2} />
            <Bar dataKey="change" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.change >= 0 ? '#4caf50' : '#f44336'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Data source: Federal Reserve Economic Data (FRED) • Comparing latest two periods
      </Typography>
    </Paper>
  );
};

export default MonthOverMonthChart;
