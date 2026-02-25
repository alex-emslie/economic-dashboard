import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Spinner,
  Link,
  VStack,
  HStack,
  Badge,
} from '@chakra-ui/react';
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
  Area,
} from 'recharts';
import { fetchFredData, ECONOMIC_INDICATORS } from '../services/fredApi';
import { linearRegression, detectTrend } from '../utils/forecasting';
import { analyzeCorrelations, generateCorrelationInsight } from '../utils/correlation';

const EconomicChart = ({ indicator }) => {
  const [allData, setAllData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1Y');
  const [visibleSegments, setVisibleSegments] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showForecast, setShowForecast] = useState(true);
  const [forecast, setForecast] = useState([]);
  const [trend, setTrend] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [allIndicatorsData, setAllIndicatorsData] = useState({});
  const dropdownRef = useRef(null);

  // Initialize visible segments when indicator changes
  useEffect(() => {
    setVisibleSegments(indicator.segments.map(s => s.id));
  }, [indicator]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch data for all segments
        const segmentPromises = indicator.segments.map(segment =>
          fetchFredData(segment.id, 500)
        );

        const segmentDataArrays = await Promise.all(segmentPromises);

        // Merge all segment data by date
        const dataByDate = {};

        segmentDataArrays.forEach((segmentData, index) => {
          const segment = indicator.segments[index];
          segmentData.forEach(point => {
            if (!dataByDate[point.date]) {
              dataByDate[point.date] = { date: point.date };
            }
            dataByDate[point.date][segment.id] = point.value;
          });
        });

        // Convert to array and sort by date
        const mergedData = Object.values(dataByDate).sort((a, b) =>
          new Date(a.date) - new Date(b.date)
        );

        // Calculate month-over-month for the primary series
        const dataWithMoM = mergedData.map((point, index) => {
          if (index === 0) {
            return { ...point, momChange: null };
          }
          const previous = mergedData[index - 1][indicator.seriesId];
          const current = point[indicator.seriesId];
          if (previous && current) {
            const percentChange = ((current - previous) / previous) * 100;
            return {
              ...point,
              momChange: parseFloat(percentChange.toFixed(2)),
            };
          }
          return { ...point, momChange: null };
        });

        setAllData(dataWithMoM);

        // Generate forecast for primary series
        const primaryData = dataWithMoM.map(d => ({
          date: d.date,
          value: d[indicator.seriesId]
        })).filter(d => d.value !== undefined && d.value !== null);

        const forecastData = linearRegression(primaryData, 6);
        setForecast(forecastData);

        // Detect trend
        const trendInfo = detectTrend(primaryData);
        setTrend(trendInfo);

        // Fetch data for all other indicators for correlation analysis
        const otherIndicatorsData = {};
        const otherIndicatorPromises = Object.values(ECONOMIC_INDICATORS)
          .filter(ind => ind.id !== indicator.id)
          .map(async (ind) => {
            try {
              const data = await fetchFredData(ind.seriesId, 500);
              otherIndicatorsData[ind.seriesId] = data;
            } catch (error) {
              console.error(`Failed to fetch data for ${ind.id}:`, error);
            }
          });

        await Promise.all(otherIndicatorPromises);

        // Store all data for correlation analysis
        const indicatorDataMap = {
          [indicator.seriesId]: primaryData,
          ...otherIndicatorsData
        };
        setAllIndicatorsData(indicatorDataMap);

        // Calculate correlations with other indicators
        const correlationResults = analyzeCorrelations(
          indicator,
          indicatorDataMap,
          ECONOMIC_INDICATORS
        );
        setCorrelations(correlationResults.slice(0, 5)); // Top 5 correlations

      } catch (err) {
        console.error('Error loading data:', err);
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
        <Box bg="white" p={3} borderRadius="lg" boxShadow="lg" border="1px" borderColor="gray.200" maxW="xs">
          <Text fontWeight="semibold" fontSize="sm" color="gray.900" mb={1.5}>
            {formatDate(data.date)}
          </Text>
          {indicator.segments.map((segment) => {
            const value = data[segment.id];
            if (value !== undefined && value !== null) {
              return (
                <Text key={segment.id} fontSize="xs" color="gray.600" mb={0.5}>
                  <Box as="span" fontWeight="semibold" color={segment.color}>
                    {segment.name}:
                  </Box>{' '}
                  {value.toLocaleString()} {indicator.unit}
                </Text>
              );
            }
            return null;
          })}
          {data.momChange !== null && (
            <Text fontSize="xs" mt={1.5} pt={1.5} borderTop="1px" borderColor="gray.200">
              <Box as="span" color="gray.600">MoM:</Box>{' '}
              <Box as="span" fontWeight="semibold" color={data.momChange >= 0 ? 'green.500' : 'red.500'}>
                {data.momChange >= 0 ? '+' : ''}{data.momChange}%
              </Box>
            </Text>
          )}
        </Box>
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

  // Toggle segment visibility
  const toggleSegment = (segmentId) => {
    setVisibleSegments(prev => {
      if (prev.includes(segmentId)) {
        return prev.filter(id => id !== segmentId);
      } else {
        return [...prev, segmentId];
      }
    });
  };

  // Toggle all segments
  const toggleAllSegments = () => {
    if (visibleSegments.length === indicator.segments.length) {
      // Deselect all
      setVisibleSegments([]);
    } else {
      // Select all
      setVisibleSegments(indicator.segments.map(s => s.id));
    }
  };

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

  // Combine historical data with forecast
  const chartData = showForecast && forecast.length > 0
    ? [
        ...data,
        ...forecast.map(f => ({
          ...f,
          [indicator.seriesId]: f.value,
          momChange: null,
        }))
      ]
    : data;

  if (loading) {
    return (
      <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" shadow="sm">
        <Flex align="center" justify="center" minH="500px">
          <VStack spacing={3}>
            <Spinner size="lg" color="green.500" thickness="2px" />
            <Text fontSize="sm" color="gray.500">Loading data...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" shadow="sm" p={6}>
        <Box bg="red.50" border="1px" borderColor="red.200" borderRadius="lg" p={4} mb={4}>
          <Text fontSize="sm" fontWeight="medium" color="red.800">{error}</Text>
        </Box>
        <Text fontSize="sm" color="gray.600">
          Get a free API key at:{' '}
          <Link href="https://fred.stlouisfed.org/docs/api/api_key.html" color="green.500" isExternal textDecoration="underline">
            FRED API
          </Link>
        </Text>
      </Box>
    );
  }

  return (
    <Box bg="white" borderRadius="lg" border="1px" borderColor="gray.200" shadow="sm">
      {/* Header */}
      <Box borderBottom="1px" borderColor="gray.200" px={6} py={5}>
        <Flex justify="space-between" align="start" gap={4}>
          <Box>
            <Text as="h2" fontSize="xl" fontWeight="bold" color="gray.900" mb={1}>
              {indicator.title}
            </Text>
            <Text fontSize="sm" color="gray.500">{indicator.description}</Text>
          </Box>

          <Flex gap={3} align="start">
            {/* Segment Selector Dropdown */}
            <Box position="relative" ref={dropdownRef}>
              <Button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                px={4}
                py={2.5}
                fontSize="sm"
                fontWeight="medium"
                bg="gray.50"
                color="gray.900"
                border="1px"
                borderColor="gray.200"
                _hover={{ bg: 'gray.100' }}
                whiteSpace="nowrap"
              >
                Segments ({visibleSegments.length}/{indicator.segments.length})
              </Button>

              {dropdownOpen && (
                <Box
                  position="absolute"
                  right={0}
                  mt={2}
                  w="256px"
                  bg="white"
                  borderRadius="lg"
                  boxShadow="lg"
                  border="1px"
                  borderColor="gray.200"
                  zIndex={10}
                  p={2}
                >
                  <Button
                    onClick={toggleAllSegments}
                    w="full"
                    px={4}
                    py={2}
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.700"
                    bg="transparent"
                    justifyContent="flex-start"
                    _hover={{ bg: 'gray.50' }}
                  >
                    {visibleSegments.length === indicator.segments.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Box borderTop="1px" borderColor="gray.200" my={2} />
                  {indicator.segments.map((segment) => (
                    <Box
                      key={segment.id}
                      as="label"
                      display="flex"
                      alignItems="center"
                      gap={3}
                      px={4}
                      py={2}
                      _hover={{ bg: 'gray.50' }}
                      borderRadius="md"
                      cursor="pointer"
                    >
                      <Box
                        as="input"
                        type="checkbox"
                        checked={visibleSegments.includes(segment.id)}
                        onChange={() => toggleSegment(segment.id)}
                        w={4}
                        h={4}
                      />
                      <Flex alignItems="center" gap={2} flex={1}>
                        <Box w={3} h={3} borderRadius="full" bg={segment.color} />
                        <Text fontSize="sm" color="gray.700">{segment.name}</Text>
                      </Flex>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Time Range Selector */}
            <Flex gap={1} bg="gray.50" borderRadius="lg" p={1} border="1px" borderColor="gray.200">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  px={4}
                  py={2.5}
                  fontSize="sm"
                  fontWeight="medium"
                  bg={timeRange === range.value ? 'white' : 'transparent'}
                  color={timeRange === range.value ? 'gray.900' : 'gray.600'}
                  border={timeRange === range.value ? '1px' : '0'}
                  borderColor={timeRange === range.value ? 'gray.200' : 'transparent'}
                  boxShadow={timeRange === range.value ? 'sm' : 'none'}
                  _hover={{
                    bg: timeRange === range.value ? 'white' : 'gray.100',
                    color: 'gray.900',
                  }}
                  borderRadius="md"
                >
                  {range.label}
                </Button>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Box>

      {/* Chart */}
      <Box p={6}>
        {/* Trend and Forecast Toggle */}
        <Flex justify="space-between" align="center" mb={4}>
          <HStack spacing={2}>
            {trend && (
              <Badge
                colorScheme={trend.direction === 'up' ? 'green' : trend.direction === 'down' ? 'red' : 'gray'}
                fontSize="sm"
                px={3}
                py={1}
              >
                Trend: {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.direction.toUpperCase()}
              </Badge>
            )}
          </HStack>
          <Button
            size="sm"
            onClick={() => setShowForecast(!showForecast)}
            colorScheme={showForecast ? 'green' : 'gray'}
            variant={showForecast ? 'solid' : 'outline'}
          >
            {showForecast ? 'Hide' : 'Show'} Forecast
          </Button>
        </Flex>

        <Box w="full" h="500px">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
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
              {indicator.segments
                .filter(segment => visibleSegments.includes(segment.id))
                .map((segment) => (
                  <Line
                    key={segment.id}
                    yAxisId="left"
                    type="monotone"
                    dataKey={segment.id}
                    stroke={segment.color}
                    strokeWidth={segment.id === indicator.seriesId ? 2.5 : 2}
                    dot={false}
                    name={segment.name}
                    animationDuration={1000}
                    opacity={segment.id === indicator.seriesId ? 1 : 0.8}
                    connectNulls={false}
                  />
                ))}
              {showForecast && forecast.length > 0 && (
                <>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey={indicator.seriesId}
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ fill: '#8b5cf6', r: 3 }}
                    name="Forecast"
                    animationDuration={1000}
                    opacity={0.7}
                    data={forecast.map(f => ({ ...f, [indicator.seriesId]: f.value }))}
                    connectNulls={true}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey={indicator.seriesId}
                    stroke="none"
                    fill="#8b5cf6"
                    fillOpacity={0.1}
                    data={forecast.map(f => ({ ...f, [indicator.seriesId]: f.value }))}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Correlation Insights */}
      {correlations.length > 0 && (
        <Box borderTop="1px" borderColor="gray.200" px={6} py={4}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.900" mb={3}>
            Correlation Insights
          </Text>
          <VStack spacing={2} align="stretch">
            {correlations.slice(0, 3).map((corr, index) => {
              const insight = generateCorrelationInsight(indicator.title, corr);
              return (
                <Box
                  key={index}
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  border="1px"
                  borderColor="gray.200"
                >
                  <Flex justify="space-between" align="start" mb={1}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.900">
                      {insight.title}
                    </Text>
                    <Badge
                      colorScheme={
                        corr.relationship === 'positive' ? 'green' : 'red'
                      }
                      fontSize="xs"
                    >
                      {corr.correlation > 0 ? '+' : ''}{(corr.correlation * 100).toFixed(0)}%
                    </Badge>
                  </Flex>
                  <Text fontSize="xs" color="gray.600">
                    {insight.description}
                  </Text>
                </Box>
              );
            })}
          </VStack>
        </Box>
      )}

      {/* Footer */}
      <Box borderTop="1px" borderColor="gray.200" px={6} py={4} bg="gray.50">
        <Text fontSize="xs" color="gray.500">
          Data source: Federal Reserve Economic Data (FRED) • {data.length} observations
        </Text>
        {indicator.id === 'GDP' && (
          <Text fontSize="xs" color="orange.500" mt={1.5}>
            Note: GDP is published quarterly (every 3 months)
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default EconomicChart;
