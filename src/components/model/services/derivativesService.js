/**
 * Load and process derivatives data for sensitivity analysis
 * @param {string} version - Model version
 * @param {string|null} extension - Optional version extension
 * @param {Array} parameters - List of parameters to analyze
 * @returns {Promise<Object>} Derivatives data object
 */
export const loadDerivativesData = async (version, extension = null, parameters) => {
  try {
    // Construct base path based on version and extension
    const basePath = extension 
      ? `Original/Batch(${version}.${extension})/Results(${version})/Sensitivity/Multipoint/`
      : `Original/Batch(${version})/Results(${version})/Sensitivity/Multipoint/`;

    // Load derivatives data for each parameter
    const parameterData = await Promise.all(
      parameters.map(async param => {
        const data = await loadParameterDerivatives(basePath, param.id);
        return processParameterData(param, data);
      })
    );

    return {
      version,
      extension,
      parameters: parameterData
    };
  } catch (error) {
    console.error('Error loading derivatives data:', error);
    throw error;
  }
};

/**
 * Load derivatives data for a specific parameter
 * @param {string} basePath - Base path to derivatives files
 * @param {string} paramId - Parameter identifier
 * @returns {Promise<Object>} Raw derivatives data
 */
const loadParameterDerivatives = async (basePath, paramId) => {
  try {
    const response = await fetch(`${basePath}${paramId}_derivatives.json`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error loading derivatives for parameter ${paramId}:`, error);
    throw error;
  }
};

/**
 * Process raw parameter data into analysis metrics
 * @param {Object} param - Parameter metadata
 * @param {Object} data - Raw derivatives data
 * @returns {Object} Processed parameter data
 */
const processParameterData = (param, data) => {
  // Extract derivatives points
  const derivatives = data.points.map(point => ({
    input: point.input,
    output: point.output,
    derivative: point.derivative
  }));

  // Calculate impact metrics
  const impact = calculateImpact(derivatives);
  const confidence = calculateConfidence(derivatives);
  const elasticity = calculateElasticity(derivatives);
  const stability = calculateStability(derivatives);
  const threshold = findThreshold(derivatives);
  const distribution = generateDistribution(derivatives);
  const baseline = findBaseline(derivatives);

  return {
    id: param.id,
    name: param.name,
    derivatives,
    impact,
    confidence,
    elasticity,
    stability,
    threshold,
    distribution,
    baseline
  };
};

/**
 * Calculate overall impact of parameter changes
 * @param {Array} derivatives - Derivatives data points
 * @returns {number} Impact score (-1 to 1)
 */
const calculateImpact = (derivatives) => {
  const avgDerivative = derivatives.reduce((sum, point) => sum + point.derivative, 0) / derivatives.length;
  const maxImpact = Math.max(...derivatives.map(point => Math.abs(point.derivative)));
  return avgDerivative / maxImpact;
};

/**
 * Calculate confidence in derivatives calculations
 * @param {Array} derivatives - Derivatives data points
 * @returns {number} Confidence score (0-1)
 */
const calculateConfidence = (derivatives) => {
  // Calculate R-squared of derivatives trend
  const points = derivatives.map(d => ({ x: d.input, y: d.derivative }));
  return calculateRSquared(points);
};

/**
 * Calculate price elasticity
 * @param {Array} derivatives - Derivatives data points
 * @returns {number} Elasticity value
 */
const calculateElasticity = (derivatives) => {
  const baseline = findBaseline(derivatives);
  const avgDerivative = derivatives.reduce((sum, point) => sum + point.derivative, 0) / derivatives.length;
  return avgDerivative * (baseline.input / baseline.output);
};

/**
 * Calculate stability of parameter influence
 * @param {Array} derivatives - Derivatives data points
 * @returns {number} Stability score (0-1)
 */
const calculateStability = (derivatives) => {
  const values = derivatives.map(d => d.derivative);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const maxVariance = Math.pow(mean, 2);
  return 1 - (variance / maxVariance);
};

/**
 * Find threshold where parameter impact becomes significant
 * @param {Array} derivatives - Derivatives data points
 * @returns {number} Threshold value
 */
const findThreshold = (derivatives) => {
  const significantImpact = 0.05; // 5% change threshold
  const sorted = [...derivatives].sort((a, b) => Math.abs(b.derivative) - Math.abs(a.derivative));
  const threshold = sorted.find(point => Math.abs(point.derivative) >= significantImpact);
  return threshold ? threshold.input : derivatives[0].input;
};

/**
 * Generate distribution of derivatives values
 * @param {Array} derivatives - Derivatives data points
 * @returns {Array} Distribution data points
 */
const generateDistribution = (derivatives) => {
  const values = derivatives.map(d => d.derivative);
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

/**
 * Find baseline point (typically center point)
 * @param {Array} derivatives - Derivatives data points
 * @returns {Object} Baseline point
 */
const findBaseline = (derivatives) => {
  const sorted = [...derivatives].sort((a, b) => a.input - b.input);
  const midIndex = Math.floor(sorted.length / 2);
  return {
    input: sorted[midIndex].input,
    output: sorted[midIndex].output
  };
};

/**
 * Calculate R-squared value for trend line
 * @param {Array} points - Data points with x,y coordinates
 * @returns {number} R-squared value (0-1)
 */
const calculateRSquared = (points) => {
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predictedY = points.map(p => slope * p.x + intercept);
  const meanY = sumY / n;

  const ssRes = points.reduce((sum, p, i) => sum + Math.pow(p.y - predictedY[i], 2), 0);
  const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);

  return 1 - (ssRes / ssTot);
};
