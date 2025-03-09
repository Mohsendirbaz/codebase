/**
 * Utility functions for data processing related to sensitivity and efficacy integration
 */

/**
 * Fetch and parse price data from Economic_Summary CSV files
 * @param {string} version - Model version
 * @param {string|null} extension - Model extension (if applicable)
 * @returns {Promise<Object>} - Price data object with averageSellingPrice and other metrics
 */
export const fetchPriceData = async (version, extension) => {
  try {
    const versionPath = extension 
      ? `Batch(${version}.${extension})`
      : `Batch(${version})`;
    
    const csvPath = `Original/${versionPath}/Results(${version})/Economic_Summary(${version}).csv`;
    const response = await fetch(`/api/file?path=${encodeURIComponent(csvPath)}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch Economic_Summary for ${version}${extension ? '.' + extension : ''}`);
      return { averageSellingPrice: 0, isEstimate: true };
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n');
    
    // Parse CSV to get price information
    // Example: Find the ASP (Average Selling Price) in the CSV
    const priceLine = lines.find(line => line.includes('Average Selling Price'));
    const totalRevenueLine = lines.find(line => line.includes('Total Revenue'));
    const totalOutputLine = lines.find(line => line.includes('Total Output'));
    
    let averageSellingPrice = 0;
    
    if (priceLine) {
      const parts = priceLine.split(',');
      if (parts.length > 1) {
        averageSellingPrice = parseFloat(parts[1]);
      }
    } else if (totalRevenueLine && totalOutputLine) {
      // If ASP is not directly available, calculate from revenue and output
      const revenue = parseFloat(totalRevenueLine.split(',')[1]);
      const output = parseFloat(totalOutputLine.split(',')[1]);
      
      if (output > 0) {
        averageSellingPrice = revenue / output;
      }
    }
    
    return {
      averageSellingPrice,
      isEstimate: !priceLine,
      // Add additional price metrics as needed
    };
  } catch (error) {
    console.error('Error fetching price data:', error);
    return { averageSellingPrice: 0, isEstimate: true, error: error.message };
  }
};

/**
 * Load sensitivity data for a model including derivatives
 * @param {Object} model - Model object with version and filters
 * @returns {Promise<Object>} - Sensitivity data object
 */
export const loadSensitivityData = async (model) => {
  try {
    const versionPath = model.extension 
      ? `Batch(${model.version}.${model.extension})`
      : `Batch(${model.version})`;
    
    // Fetch multipoint derivative data
    const derivatives = [];
    for (const paramType of Object.keys(model.filters)) {
      if (!model.filters[paramType]) continue;
      
      const path = `Original/${versionPath}/Results(${model.version})/Sensitivity/Multipoint/${paramType}_derivatives.json`;
      try {
        const response = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
        
        if (response.ok) {
          const data = await response.json();
          derivatives.push({
            parameter: paramType,
            data: data
          });
        }
      } catch (err) {
        console.warn(`Failed to load derivatives for ${paramType}:`, err);
      }
    }
    
    return {
      parameters: derivatives.map(d => d.parameter),
      derivatives: derivatives
    };
  } catch (error) {
    console.error('Error loading sensitivity data:', error);
    return { parameters: [], derivatives: [] };
  }
};

/**
 * Calculate efficacy metrics based on sensitivity data and price data
 * @param {Object} sensitivityData - Sensitivity data with derivatives
 * @param {Object} priceData - Price data with averageSellingPrice
 * @returns {Object} - Efficacy metrics
 */
export const calculateEfficacyMetrics = (sensitivityData, priceData) => {
  if (!sensitivityData?.derivatives?.length || !priceData?.averageSellingPrice) {
    return { 
      score: 0, 
      sensitivity: 0, 
      elasticity: 0, 
      parameterImpacts: [] 
    };
  }
  
  // Calculate parameter price impacts
  const parameterImpacts = sensitivityData.derivatives.map(derivative => {
    if (!derivative.data || !derivative.data.length) {
      return {
        parameter: derivative.parameter,
        priceImpact: 0,
        elasticity: 0
      };
    }
    
    // Calculate price impact for this parameter
    const avgImpact = derivative.data.reduce((sum, point) => {
      return sum + Math.abs(point.impact || 0);
    }, 0) / derivative.data.length;
    
    const priceImpact = avgImpact * priceData.averageSellingPrice;
    
    return {
      parameter: derivative.parameter,
      priceImpact: priceImpact,
      elasticity: priceImpact / priceData.averageSellingPrice
    };
  });
  
  // Calculate overall metrics
  const totalImpact = parameterImpacts.reduce((sum, p) => sum + p.priceImpact, 0);
  const maxImpact = Math.max(...parameterImpacts.map(p => p.priceImpact));
  
  return {
    score: totalImpact / priceData.averageSellingPrice || 0,
    sensitivity: maxImpact / priceData.averageSellingPrice || 0,
    elasticity: parameterImpacts.length > 0 
      ? totalImpact / (priceData.averageSellingPrice * parameterImpacts.length) 
      : 0,
    parameterImpacts: parameterImpacts.sort((a, b) => b.priceImpact - a.priceImpact)
  };
};

/**
 * Calculate price change percentage between two values
 * @param {number} current - Current price value
 * @param {number} base - Base price value
 * @returns {number} - Price change percentage
 */
export const calculatePriceChange = (current, base) => {
  if (!base) return 0;
  return ((current - base) / base * 100).toFixed(1);
};

/**
 * Format price as currency string
 * @param {number} price - Price value
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};
