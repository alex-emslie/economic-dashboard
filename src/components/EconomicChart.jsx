import { useState, useEffect } from 'react';
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
  SwitchRoot,
  SwitchControl,
  SwitchThumb,
  SwitchHiddenInput,
  CardRoot,
  CardBody,
  StatRoot,
  StatLabel,
  StatValueText,
  StatHelpText,
  StatUpIndicator,
  StatDownIndicator,
  Separator,
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
import { fetchBlsData } from '../services/blsApi';
import { fetchWorldBankData } from '../services/worldBankApi';
import { linearRegression, detectTrend } from '../utils/forecasting';
import { analyzeCorrelations, generateCorrelationInsight } from '../utils/correlation';
import { Settings } from 'lucide-react';
import { t } from '../App';

const fetchIndicatorData = (indicator, seriesId, limit) => {
  if (indicator.source === 'bls') return fetchBlsData(seriesId, limit);
  if (indicator.source === 'worldbank') return fetchWorldBankData(seriesId, limit);
  return fetchFredData(seriesId, limit);
};

const EconomicChart = ({
  indicator,
  controlsOpen, onControlsToggle,
  showForecast, setShowForecast,
  showMoM,
  showTable,
  darkMode,
  timeRange, setTimeRange,
  visibleSegments, setVisibleSegments,
}) => {
  const tk = t(darkMode);
  const chartColors = {
    grid: darkMode ? '#334155' : '#e5e7eb',
    axis: darkMode ? '#475569' : '#d1d5db',
    tick: darkMode ? '#94a3b8' : '#6b7280',
  };
  const [allData, setAllData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [trend, setTrend] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [allIndicatorsData, setAllIndicatorsData] = useState({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch data for all segments
        const segmentPromises = indicator.segments.map(segment =>
          fetchIndicatorData(indicator, segment.id, 500)
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

        // Calculate MoM, YoY, and 3-month rolling average
        const dataWithStats = mergedData.map((point, index) => {
          const current = point[indicator.seriesId];

          // MoM
          const prevMonth = mergedData[index - 1]?.[indicator.seriesId];
          const momChange = (prevMonth && current)
            ? parseFloat(((current - prevMonth) / prevMonth * 100).toFixed(2))
            : null;

          // YoY — find data point ~12 entries back with matching month
          let yoyChange = null;
          if (current && index >= 12) {
            const currentMonth = new Date(point.date).getMonth();
            for (let i = index - 1; i >= Math.max(0, index - 14); i--) {
              if (new Date(mergedData[i].date).getMonth() === currentMonth) {
                const yoyBase = mergedData[i][indicator.seriesId];
                if (yoyBase) {
                  yoyChange = parseFloat(((current - yoyBase) / yoyBase * 100).toFixed(2));
                }
                break;
              }
            }
          }

          // 3-month rolling average
          const windowSize = Math.min(3, index + 1);
          const windowVals = mergedData.slice(index - windowSize + 1, index + 1)
            .map(d => d[indicator.seriesId])
            .filter(v => v != null);
          const avg3m = windowVals.length > 0
            ? parseFloat((windowVals.reduce((a, b) => a + b, 0) / windowVals.length).toFixed(2))
            : null;

          // Deviation from 3M avg
          const vsAvg = (current && avg3m)
            ? parseFloat(((current - avg3m) / avg3m * 100).toFixed(2))
            : null;

          return { ...point, momChange, yoyChange, avg3m, vsAvg };
        });

        setAllData(dataWithStats);

        // Generate forecast for primary series
        const primaryData = dataWithStats.map(d => ({
          date: d.date,
          value: d[indicator.seriesId]
        })).filter(d => d.value !== undefined && d.value !== null);

        const forecastData = linearRegression(primaryData, 6);
        setForecast(forecastData);

        // Detect trend
        const trendInfo = detectTrend(primaryData);
        setTrend(trendInfo);

        // Fetch FRED indicators for correlation analysis (FRED-only)
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

  // Custom tooltip (hover card)
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const visibleValues = indicator.segments
        .map(segment => ({ segment, value: d[segment.id] }))
        .filter(({ value }) => value !== undefined && value !== null);

      return (
        <Box bg={tk.cardBg} p={3} borderRadius="lg" boxShadow="lg" border="1px" borderColor={tk.border} maxW="280px">
          <Text fontWeight="semibold" fontSize="sm" color={tk.textPrimary} mb={0.5}>
            {formatDate(d.date)}
          </Text>
          <Text fontSize="xs" color={tk.textMuted} mb={4} lineHeight="1.4">
            {indicator.description}
          </Text>
          {visibleValues.map(({ segment, value }) => (
            <Box key={segment.id} mb={2}>
              <Flex justify="space-between" align="baseline" gap={6}>
                <Text fontSize="xs" fontWeight="semibold" color={segment.color}>
                  {segment.name}
                </Text>
                <Text fontSize="xs" color={tk.textSecondary} whiteSpace="nowrap">
                  {value.toLocaleString()} <Box as="span" color={tk.textMuted}>{indicator.unit}</Box>
                </Text>
              </Flex>
              {segment.description && (
                <Text fontSize="10px" color={tk.textMuted} lineHeight="1.3" mt={0.5}>
                  {segment.description}
                </Text>
              )}
            </Box>
          ))}
          {d.momChange !== null && (
            <Text fontSize="xs" mt={1} pt={1.5} borderTop="1px" borderColor={tk.borderSubtle}>
              <Box as="span" color={tk.textSecondary}>MoM: </Box>
              <Box as="span" fontWeight="semibold" color={d.momChange >= 0 ? 'green.500' : 'red.500'}>
                {d.momChange >= 0 ? '+' : ''}{d.momChange}%
              </Box>
            </Text>
          )}
        </Box>
      );
    }
    return null;
  };

  // Custom legend (no separate tooltip — descriptions are in the hover card)
  const CustomLegend = ({ payload }) => {
    if (!payload?.length) return null;
    return (
      <Flex gap={3} wrap="wrap" justify="center" pt={2}>
        {payload.map((entry) => (
          <Flex key={entry.value} align="center" gap={1.5}>
            <Box w={3} h="2px" bg={entry.color} borderRadius="full" flexShrink={0} />
            <Text fontSize="xs" color={tk.textSecondary}>{entry.value}</Text>
          </Flex>
        ))}
      </Flex>
    );
  };

  // Format large numbers with k/m/b suffixes
  const formatAxisValue = (value) => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}b`;
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    return value;
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
      <Box bg={tk.cardBg} borderRadius="lg" border="1px" borderColor={tk.border} shadow="sm">
        <Flex align="center" justify="center" minH="500px">
          <VStack spacing={3}>
            <Spinner size="lg" color="green.500" thickness="2px" />
            <Text fontSize="sm" color={tk.textSecondary}>Loading data...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg={tk.cardBg} borderRadius="lg" border="1px" borderColor={tk.border} shadow="sm" p={6}>
        <Box bg={darkMode ? '#450a0a' : 'red.50'} border="1px" borderColor={darkMode ? '#7f1d1d' : 'red.200'} borderRadius="lg" p={4} mb={4}>
          <Text fontSize="sm" fontWeight="medium" color={darkMode ? '#fca5a5' : 'red.800'}>{error}</Text>
        </Box>
        <Text fontSize="sm" color={tk.textSecondary}>
          Get a free API key at:{' '}
          <Link href="https://fred.stlouisfed.org/docs/api/api_key.html" color="green.500" isExternal textDecoration="underline">
            FRED API
          </Link>
        </Text>
      </Box>
    );
  }

  return (
    <Box bg={tk.cardBg} borderRadius="lg" border="1px" borderColor={tk.border} shadow="sm">
      {/* Header */}
      <Box borderBottom="1px" borderColor={tk.border} px={6} py={5}>
        <Flex justify="space-between" align="center" gap={4} wrap="wrap">
          {/* Title + meta */}
          <Box minW="0">
            <Flex align="center" gap={3} mb={1}>
              <Text as="h2" fontSize="xl" fontWeight="bold" color={tk.textPrimary}>
                {indicator.title}
              </Text>
            </Flex>
            <Text fontSize="sm" color={tk.textSecondary}>{indicator.description}</Text>
          </Box>

          {/* Settings trigger */}
          <Button
            onClick={onControlsToggle}
            variant={controlsOpen ? 'solid' : 'outline'}
            colorPalette="gray"
            size="md"
            flexShrink={0}
            px={5}
            gap={2}
          >
            <Settings size={15} />
            Settings
          </Button>
        </Flex>
      </Box>


      {/* Chart */}
      <Box px={6} py={6}>
        <Box w="full" h="500px">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: showMoM ? 60 : 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: chartColors.tick }}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke={chartColors.axis}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatAxisValue}
                tick={{ fontSize: 11, fill: chartColors.tick }}
                label={{ value: indicator.unit, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: chartColors.tick } }}
                stroke={chartColors.axis}
              />
              {showMoM && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={getMoMDomain()}
                  tick={{ fontSize: 11, fill: chartColors.tick }}
                  label={{ value: 'MoM Change (%)', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: chartColors.tick } }}
                  stroke={chartColors.axis}
                />
              )}
              <Tooltip content={CustomTooltip} />
              <Legend content={<CustomLegend />} />
              {showMoM && (
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
              )}
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
        <Box borderTop="1px" borderColor={tk.border} px={4} py={3}>
          <HStack mb={3} gap={2} align="center">
            <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color={tk.textSecondary}>
              Correlation Insights
            </Text>
            <Box flex="1" h="1px" bg={tk.borderSubtle} />
          </HStack>
          <Flex gap={3} wrap="wrap">
            {correlations.slice(0, 3).map((corr, index) => {
              const insight = generateCorrelationInsight(indicator.title, corr);
              const isPositive = corr.relationship === 'positive';
              const absStrength = Math.abs(corr.correlation);
              const strengthLabel = absStrength >= 0.8 ? 'Strong' : absStrength >= 0.5 ? 'Moderate' : 'Weak';
              return (
                <CardRoot key={index} flex="1" minW="200px" variant="outline" bg={tk.cardBg} borderColor={tk.border}>
                  <CardBody p={3}>
                    <StatRoot>
                      <StatLabel fontWeight="semibold" color={tk.textSecondary} mb={1.5}>{insight.title}</StatLabel>
                      <Flex align="center" gap={1} mb={2}>
                        {isPositive ? <StatUpIndicator /> : <StatDownIndicator />}
                        <StatValueText fontSize="lg" color={isPositive ? 'green.600' : 'red.600'}>
                          {(absStrength * 100).toFixed(0)}%
                        </StatValueText>
                        <Badge variant="subtle" colorPalette={isPositive ? 'green' : 'red'} size="sm" px={1.5} py={0.5} border="1px" borderColor={isPositive ? 'green.200' : 'red.200'}>
                          {strengthLabel}
                        </Badge>
                      </Flex>
                      <StatHelpText fontSize="xs" color={tk.textMuted} lineHeight="1.6">{insight.description}</StatHelpText>
                    </StatRoot>
                  </CardBody>
                </CardRoot>
              );
            })}
          </Flex>
        </Box>
      )}

      {/* Data Table */}
      {showTable && data.length > 0 && (
        <Box borderTop="1px" borderColor={tk.border} px={4} py={3}>
          <HStack mb={3} gap={2} align="center">
            <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color={tk.textSecondary}>
              Data Breakdown
            </Text>
            <Box flex="1" h="1px" bg={tk.borderSubtle} />
          </HStack>
          <Box overflowX="auto">
            <Box as="table" w="full" fontSize="xs" style={{ borderCollapse: 'collapse' }}>
              <Box as="thead">
                <Box as="tr" borderBottom="2px" borderColor={tk.border}>
                  {['Date', 'Value', 'MoM Δ', 'YoY Δ', '3M Avg', 'vs 3M Avg'].map(col => (
                    <Box
                      key={col}
                      as="th"
                      px={3}
                      py={2}
                      textAlign={col === 'Date' ? 'left' : 'right'}
                      fontWeight="semibold"
                      color={tk.textSecondary}
                      whiteSpace="nowrap"
                      letterSpacing="wider"
                      textTransform="uppercase"
                    >
                      {col}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {[...data].reverse().map((row, i) => {
                  const val = row[indicator.seriesId];
                  const deltaColor = (v) => v == null ? tk.textMuted : v > 0 ? 'green.500' : v < 0 ? 'red.500' : tk.textSecondary;
                  const fmtDelta = (v) => v == null ? '—' : `${v > 0 ? '+' : ''}${v}%`;
                  return (
                    <Box
                      key={row.date}
                      as="tr"
                      bg={i % 2 === 0 ? tk.cardBg : tk.cardBgAlt}
                      _hover={{ bg: tk.navActive }}
                    >
                      <Box as="td" px={3} py={1.5} color={tk.textSecondary} whiteSpace="nowrap">
                        {formatDate(row.date)}
                      </Box>
                      <Box as="td" px={3} py={1.5} textAlign="right" color={tk.textPrimary} fontWeight="medium" whiteSpace="nowrap">
                        {val != null ? formatAxisValue(val) : '—'}
                      </Box>
                      <Box as="td" px={3} py={1.5} textAlign="right" color={deltaColor(row.momChange)} whiteSpace="nowrap" fontWeight={row.momChange != null ? 'medium' : 'normal'}>
                        {fmtDelta(row.momChange)}
                      </Box>
                      <Box as="td" px={3} py={1.5} textAlign="right" color={deltaColor(row.yoyChange)} whiteSpace="nowrap" fontWeight={row.yoyChange != null ? 'medium' : 'normal'}>
                        {fmtDelta(row.yoyChange)}
                      </Box>
                      <Box as="td" px={3} py={1.5} textAlign="right" color={tk.textSecondary} whiteSpace="nowrap">
                        {row.avg3m != null ? formatAxisValue(row.avg3m) : '—'}
                      </Box>
                      <Box as="td" px={3} py={1.5} textAlign="right" color={deltaColor(row.vsAvg)} whiteSpace="nowrap" fontWeight={row.vsAvg != null ? 'medium' : 'normal'}>
                        {fmtDelta(row.vsAvg)}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box borderTop="1px" borderColor={tk.border} px={6} py={4} bg={tk.cardBgAlt} borderBottomRadius="lg">
        <Text fontSize="xs" color={tk.textSecondary}>
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

const timeRangeOptions = [
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: '2Y', label: '2Y' },
  { value: '5Y', label: '5Y' },
  { value: 'ALL', label: 'All' },
];

export const ControlsPanel = ({
  onClose,
  indicator,
  showForecast, setShowForecast,
  showMoM, setShowMoM,
  showTable, setShowTable,
  darkMode, setDarkMode,
  timeRange, setTimeRange,
  visibleSegments, toggleSegment, toggleAllSegments,
}) => {
  const tk = t(darkMode);
  return (
  <Box
    w="340px"
    bg={tk.sidebarBg}
    boxShadow="md"
    flexShrink={0}
    display="flex"
    flexDirection="column"
    position="sticky"
    top={0}
    h="100vh"
    overflowY="auto"
  >
    <Flex justify="space-between" align="center" px={5} py={5} borderBottom="1px" borderColor={tk.border}>
      <Text fontSize="sm" fontWeight="semibold" color={tk.textPrimary}>Settings</Text>
      <Button
        onClick={onClose}
        variant="ghost"
        size="sm"
        color={tk.textMuted}
        _hover={{ color: tk.textPrimary }}
        minW="auto"
        px={2}
      >
        ✕
      </Button>
    </Flex>

    <VStack align="stretch" gap={6} p={5} flex={1}>

      {/* Forecast */}
      <Box>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color={tk.textMuted} mb={3}>
          Forecast
        </Text>
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={tk.textPrimary}>Show Forecast</Text>
            <Text fontSize="xs" color={tk.textMuted}>ML-generated projection</Text>
          </Box>
          <SwitchRoot
            checked={showForecast}
            onCheckedChange={(e) => setShowForecast(e.checked)}
            colorPalette="green"
            size="md"
          >
            <SwitchHiddenInput />
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </SwitchRoot>
        </Flex>
      </Box>

      <Separator />

      {/* Appearance */}
      <Box>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color={tk.textMuted} mb={3}>
          Appearance
        </Text>
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="sm" fontWeight="medium" color={tk.textPrimary}>Dark Mode</Text>
            <Text fontSize="xs" color={tk.textMuted}>Switch to dark theme</Text>
          </Box>
          <SwitchRoot
            checked={darkMode}
            onCheckedChange={(e) => setDarkMode(e.checked)}
            colorPalette="green"
            size="md"
          >
            <SwitchHiddenInput />
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </SwitchRoot>
        </Flex>
      </Box>

      <Separator />

      {/* Chart Overlays */}
      <Box>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color={tk.textMuted} mb={3}>
          Chart Overlays
        </Text>
        <VStack align="stretch" gap={3}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" fontWeight="medium" color={tk.textPrimary}>Month-over-Month Bars</Text>
              <Text fontSize="xs" color={tk.textMuted}>Show MoM % change bars</Text>
            </Box>
            <SwitchRoot
              checked={showMoM}
              onCheckedChange={(e) => setShowMoM(e.checked)}
              colorPalette="green"
              size="md"
            >
              <SwitchHiddenInput />
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
            </SwitchRoot>
          </Flex>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" fontWeight="medium" color={tk.textPrimary}>Data Table</Text>
              <Text fontSize="xs" color={tk.textMuted}>MoM, YoY, rolling averages</Text>
            </Box>
            <SwitchRoot
              checked={showTable}
              onCheckedChange={(e) => setShowTable(e.checked)}
              colorPalette="green"
              size="md"
            >
              <SwitchHiddenInput />
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
            </SwitchRoot>
          </Flex>
        </VStack>
      </Box>

      <Separator />

      {/* Time Range */}
      <Box>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color={tk.textMuted} mb={3}>
          Time Range
        </Text>
        <Flex gap={1} bg={tk.inputBg} borderRadius="lg" p={1} border="1px" borderColor={tk.border} wrap="wrap">
          {timeRangeOptions.map((range) => (
            <Button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              flex="1"
              size="sm"
              fontWeight="medium"
              bg={timeRange === range.value ? tk.cardBg : 'transparent'}
              color={timeRange === range.value ? tk.textPrimary : tk.textSecondary}
              border={timeRange === range.value ? '1px' : '0'}
              borderColor={timeRange === range.value ? tk.border : 'transparent'}
              boxShadow={timeRange === range.value ? 'sm' : 'none'}
              _hover={{ bg: tk.navActive, color: tk.textPrimary }}
              borderRadius="md"
            >
              {range.label}
            </Button>
          ))}
        </Flex>
      </Box>

      <Separator />

      {/* Segments */}
      <Box>
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color={tk.textMuted}>
            Segments
          </Text>
          <Button
            onClick={toggleAllSegments}
            variant="ghost"
            size="xs"
            color={tk.textSecondary}
            _hover={{ color: tk.textPrimary }}
          >
            {visibleSegments.length === indicator.segments.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Flex>
        <VStack align="stretch" gap={1}>
          {indicator.segments.map((segment) => (
            <Box
              key={segment.id}
              as="label"
              display="flex"
              alignItems="center"
              gap={3}
              px={3}
              py={2}
              _hover={{ bg: tk.navHover }}
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
                <Box w={2.5} h={2.5} borderRadius="full" bg={segment.color} />
                <Text fontSize="sm" color={tk.textSecondary}>{segment.name}</Text>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>

    </VStack>
  </Box>
  );
};

export default EconomicChart;
