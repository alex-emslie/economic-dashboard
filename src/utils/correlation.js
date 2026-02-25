/**
 * Correlation analysis utilities for economic indicators
 */

/**
 * Calculate Pearson correlation coefficient between two data series
 * @param {Array} data1 - First data series
 * @param {Array} data2 - Second data series
 * @returns {number} - Correlation coefficient (-1 to 1)
 */
export const calculateCorrelation = (data1, data2) => {
  if (!data1 || !data2 || data1.length === 0 || data2.length === 0) {
    return 0;
  }

  // Match data points by date
  const matchedPairs = [];
  const dateMap2 = new Map(data2.map(d => [d.date, d.value]));

  data1.forEach(d1 => {
    if (dateMap2.has(d1.date)) {
      matchedPairs.push({
        x: d1.value,
        y: dateMap2.get(d1.date),
      });
    }
  });

  if (matchedPairs.length < 2) return 0;

  const n = matchedPairs.length;
  const sumX = matchedPairs.reduce((sum, p) => sum + p.x, 0);
  const sumY = matchedPairs.reduce((sum, p) => sum + p.y, 0);
  const sumXY = matchedPairs.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = matchedPairs.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = matchedPairs.reduce((sum, p) => sum + p.y * p.y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;

  return numerator / denominator;
};

/**
 * Calculate correlations between an indicator and all other indicators
 * @param {Object} targetIndicator - The indicator to analyze
 * @param {Object} allIndicatorsData - Map of indicator ID to data array
 * @param {Object} ECONOMIC_INDICATORS - Indicator metadata
 * @returns {Array} - Array of correlation results sorted by strength
 */
export const analyzeCorrelations = (targetIndicator, allIndicatorsData, ECONOMIC_INDICATORS) => {
  const targetData = allIndicatorsData[targetIndicator.seriesId];
  if (!targetData || targetData.length === 0) return [];

  const correlations = [];

  Object.values(ECONOMIC_INDICATORS).forEach(indicator => {
    if (indicator.id === targetIndicator.id) return; // Skip self

    const otherData = allIndicatorsData[indicator.seriesId];
    if (!otherData || otherData.length === 0) return;

    const correlation = calculateCorrelation(targetData, otherData);
    const strength = Math.abs(correlation);

    // Only include meaningful correlations
    if (strength > 0.3) {
      correlations.push({
        indicator: indicator,
        correlation: correlation,
        strength: strength,
        relationship: correlation > 0 ? 'positive' : 'negative',
      });
    }
  });

  // Sort by strength (strongest first)
  return correlations.sort((a, b) => b.strength - a.strength);
};

/**
 * Generate human-readable correlation insights
 * @param {string} targetName - Name of the target indicator
 * @param {Object} correlation - Correlation result object
 * @returns {string} - Human-readable insight
 */
export const generateCorrelationInsight = (targetName, correlation) => {
  const { indicator, correlation: coef, relationship } = correlation;
  const strength = Math.abs(coef);

  let strengthText = 'weak';
  if (strength > 0.7) strengthText = 'strong';
  else if (strength > 0.5) strengthText = 'moderate';

  const direction = relationship === 'positive' ? 'increases' : 'decreases';
  const percentage = (strength * 100).toFixed(0);

  return {
    title: indicator.title,
    insight: `${strengthText.charAt(0).toUpperCase() + strengthText.slice(1)} ${relationship} correlation (${percentage}% strength)`,
    description: `When ${targetName} rises, ${indicator.title} typically ${direction}`,
    coefficient: coef.toFixed(3),
    strength: strengthText,
  };
};

/**
 * Calculate lagged correlation (correlation with time offset)
 * @param {Array} data1 - First data series
 * @param {Array} data2 - Second data series
 * @param {number} lag - Number of periods to lag (can be negative)
 * @returns {number} - Correlation coefficient
 */
export const calculateLaggedCorrelation = (data1, data2, lag = 0) => {
  if (!data1 || !data2 || data1.length === 0 || data2.length === 0) {
    return 0;
  }

  // Shift one series by lag periods
  let shiftedData1 = data1;
  let shiftedData2 = data2;

  if (lag > 0) {
    shiftedData1 = data1.slice(lag);
    shiftedData2 = data2.slice(0, -lag);
  } else if (lag < 0) {
    shiftedData1 = data1.slice(0, lag);
    shiftedData2 = data2.slice(-lag);
  }

  return calculateCorrelation(shiftedData1, shiftedData2);
};

/**
 * Find optimal lag between two indicators
 * @param {Array} data1 - First data series
 * @param {Array} data2 - Second data series
 * @param {number} maxLag - Maximum lag to test
 * @returns {Object} - {lag, correlation}
 */
export const findOptimalLag = (data1, data2, maxLag = 12) => {
  let bestLag = 0;
  let bestCorrelation = calculateCorrelation(data1, data2);

  for (let lag = -maxLag; lag <= maxLag; lag++) {
    if (lag === 0) continue;

    const correlation = calculateLaggedCorrelation(data1, data2, lag);
    if (Math.abs(correlation) > Math.abs(bestCorrelation)) {
      bestLag = lag;
      bestCorrelation = correlation;
    }
  }

  return { lag: bestLag, correlation: bestCorrelation };
};

/**
 * Calculate rolling correlation
 * @param {Array} data1 - First data series
 * @param {Array} data2 - Second data series
 * @param {number} window - Rolling window size
 * @returns {Array} - Array of {date, correlation} objects
 */
export const calculateRollingCorrelation = (data1, data2, window = 12) => {
  if (!data1 || !data2 || data1.length < window || data2.length < window) {
    return [];
  }

  const rollingCorrelations = [];

  for (let i = window; i <= data1.length; i++) {
    const windowData1 = data1.slice(i - window, i);
    const windowData2 = data2.slice(i - window, i);
    const correlation = calculateCorrelation(windowData1, windowData2);

    rollingCorrelations.push({
      date: data1[i - 1].date,
      correlation: correlation,
    });
  }

  return rollingCorrelations;
};
