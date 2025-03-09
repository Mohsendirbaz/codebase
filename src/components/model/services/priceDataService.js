import { csvParser } from '../utils/csvParser';

/**
 * Load price data from Economic_Summary CSV files
 * @param {string} version - Model version
 * @param {string|null} extension - Optional version extension
 * @returns {Promise<Object>} Price data object
 */
export const loadPriceData = async (version, extension = null) => {
  try {
    // Construct file path based on version and extension
    const basePath = extension 
      ? `Original/Batch(${version}.${extension})/Results(${version})/Economic_Summary(${version}).csv`
      : `Original/Batch(${version})/Results(${version})/Economic_Summary(${version}).csv`;

    // Load and parse CSV data
    const csvData = await csvParser.loadFile(basePath);
    const priceData = extractPriceData(csvData);

    // Calculate additional metrics
    const stability = calculatePriceStability(priceData.trends);
    const distribution = generatePriceDistribution(priceData.trends);

    return {
      ...priceData,
      stability,
      distribution
    };
  } catch (error) {
    console.error('Error loading price data:', error);
    throw error;
  }
};

/**
 * Extract relevant price data from CSV content
 * @param {Array} csvData - Parsed CSV data
 * @returns {Object} Extracted price metrics
 */
const extractPriceData = (csvData) => {
  // Find price-related rows
  const prices = csvData
    .filter(row => row.Category === 'Price' || row.Category === 'Revenue')
    .map(row => parseFloat(row.Value));

  // Calculate basic metrics
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Generate time series for trends
  const trends = csvData
    .filter(row => row.Category === 'Price')
    .map((row, index) => ({
      time: index,
      value: parseFloat(row.Value)
    }));

  return {
    averagePrice,
    minPrice,
    maxPrice,
    trends
  };
};

/**
 * Calculate price stability metric
 * @param {Array} trends - Price trend data
 * @returns {number} Stability score (0-1)
 */
const calculatePriceStability = (trends) => {
  if (trends.length < 2) return 1;

  // Calculate variance
  const values = trends.map(t => t.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  
  // Convert to stability score (inverse of normalized variance)
  const maxVariance = Math.pow(mean, 2); // Theoretical maximum variance
  const stability = 1 - (variance / maxVariance);
  
  return Math.max(0, Math.min(1, stability));
};

/**
 * Generate price distribution data
 * @param {Array} trends - Price trend data
 * @returns {Array} Distribution data points
 */
const generatePriceDistribution = (trends) => {
  const values = trends.map(t => t.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const bucketCount = 20;
  const bucketSize = range / bucketCount;

  // Initialize buckets
  const buckets = Array(bucketCount).fill(0);

  // Fill buckets
  values.forEach(value => {
    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.floor((value - min) / bucketSize)
    );
    buckets[bucketIndex]++;
  });

  // Convert to distribution points
  return buckets.map((count, index) => ({
    value: min + (index + 0.5) * bucketSize,
    frequency: count / values.length
  }));
};
