/**
 * Forecasting utilities for economic indicators
 */

/**
 * Simple linear regression for forecasting
 * @param {Array} data - Array of {date, value} objects
 * @param {number} periods - Number of periods to forecast
 * @returns {Array} - Array of forecasted {date, value, isForecast: true} objects
 */
export const linearRegression = (data, periods = 6) => {
  if (!data || data.length < 2) return [];

  // Prepare data for regression
  const points = data.map((d, i) => ({ x: i, y: d.value }));
  const n = points.length;

  // Calculate means
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate slope and intercept
  const numerator = points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0);
  const denominator = points.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0);
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Generate forecasts
  const forecasts = [];
  const lastDate = new Date(data[data.length - 1].date);

  for (let i = 1; i <= periods; i++) {
    const x = n + i - 1;
    const forecastValue = slope * x + intercept;

    // Calculate next date (add months based on data frequency)
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + i);

    forecasts.push({
      date: nextDate.toISOString().split('T')[0],
      value: forecastValue,
      isForecast: true,
    });
  }

  return forecasts;
};

/**
 * Exponential moving average for trend detection
 * @param {Array} data - Array of {date, value} objects
 * @param {number} alpha - Smoothing factor (0-1)
 * @returns {Array} - Array of smoothed values
 */
export const exponentialMovingAverage = (data, alpha = 0.3) => {
  if (!data || data.length === 0) return [];

  const ema = [data[0].value];

  for (let i = 1; i < data.length; i++) {
    const smoothed = alpha * data[i].value + (1 - alpha) * ema[i - 1];
    ema.push(smoothed);
  }

  return data.map((d, i) => ({
    ...d,
    ema: ema[i],
  }));
};

/**
 * Calculate confidence intervals for forecasts
 * @param {Array} data - Historical data
 * @param {Array} forecasts - Forecast data
 * @returns {Array} - Forecasts with confidence intervals
 */
export const calculateConfidenceInterval = (data, forecasts) => {
  if (!data || data.length < 2) return forecasts;

  // Calculate standard deviation of residuals
  const values = data.map(d => d.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Add confidence intervals (95% ~ 2 standard deviations)
  return forecasts.map((f, i) => ({
    ...f,
    upperBound: f.value + (2 * stdDev * (i + 1) / forecasts.length),
    lowerBound: f.value - (2 * stdDev * (i + 1) / forecasts.length),
  }));
};

/**
 * Detect trend direction
 * @param {Array} data - Array of {date, value} objects
 * @returns {Object} - {direction: 'up'|'down'|'stable', strength: number}
 */
export const detectTrend = (data) => {
  if (!data || data.length < 2) {
    return { direction: 'stable', strength: 0 };
  }

  const recentData = data.slice(-12); // Last 12 periods
  const points = recentData.map((d, i) => ({ x: i, y: d.value }));
  const n = points.length;

  // Calculate slope
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  const numerator = points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0);
  const denominator = points.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0);
  const slope = numerator / denominator;

  // Normalize slope as percentage of mean
  const strength = Math.abs((slope / meanY) * 100);

  let direction = 'stable';
  if (slope > 0.01) direction = 'up';
  else if (slope < -0.01) direction = 'down';

  return { direction, strength: Math.min(strength, 100) };
};
