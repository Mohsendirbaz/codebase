/**
 * API Service for Model Zone Integration
 * Centralizes all API calls for model data, sensitivity analysis and pricing
 */

// Base API URL - adjust based on your backend configuration
const API_BASE_URL = '/api';

/**
 * Fetch price data for a model version from economic summary
 * @param {string} version - Model version
 * @param {string|null} extension - Version extension (if applicable)
 * @returns {Promise<Object>} - Price data
 */
export const fetchPriceData = async (version, extension) => {
  try {
    const versionPath = extension 
      ? `Batch(${version}.${extension})`
      : `Batch(${version})`;
    
    const csvPath = `Original/${versionPath}/Results(${version})/Economic_Summary(${version}).csv`;
    const url = `${API_BASE_URL}/file?path=${encodeURIComponent(csvPath)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch Economic_Summary for ${version}${extension ? '.' + extension : ''}`);
      return { averageSellingPrice: 0, isEstimate: true };
    }
    
    const csvText = await response.text();
    return parsePriceData(csvText);
  } catch (error) {
    console.error('Error fetching price data:', error);
    return { averageSellingPrice: 0, isEstimate: true, error: error.message };
  }
};

/**
 * Parse CSV data to extract price information
 * @param {string} csvText - Raw CSV text
 * @returns {Object} - Parsed price data
 */
const parsePriceData = (csvText) => {
  const lines = csvText.split('\n');
  
  // Parse CSV to get price information
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
    isEstimate: !priceLine
  };
};

/**
 * Fetch sensitivity data for a model
 * @param {Object} model - Model object with version and filters
 * @returns {Promise<Object>} - Sensitivity data object
 */
export const fetchSensitivityData = async (model) => {
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
        const url = `${API_BASE_URL}/file?path=${encodeURIComponent(path)}`;
        const response = await fetch(url);
        
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
 * Run sensitivity analysis for specified parameters
 * @param {Array} parameters - Analysis parameters
 * @returns {Promise<Object>} - Analysis results
 */
export const runSensitivityAnalysis = async (parameters) => {
  try {
    // In a real implementation, this would call your backend API
    // For now, it returns simulated data
    const url = `${API_BASE_URL}/sensitivity/analyze`;
    
    // Simulated API call - replace with actual fetch
    //const response = await fetch(url, {
    //  method: 'POST',
    //  headers: { 'Content-Type': 'application/json' },
    //  body: JSON.stringify({ parameters })
    //});
    //return await response.json();
    
    // Simulated response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      type: 'sensitivity',
      parameters: parameters,
      results: parameters.map(p => ({
        parameter: p.type,
        values: Array.from({ length: p.steps }, (_, i) => ({
          value: p.range.min + (p.range.max - p.range.min) * (i / (p.steps - 1)),
          impact: Math.random() * 2 - 1
        }))
      }))
    };
  } catch (error) {
    console.error('Sensitivity analysis failed:', error);
    throw error;
  }
};

/**
 * Run Monte Carlo simulation for specified parameters
 * @param {Array} parameters - Simulation parameters
 * @returns {Promise<Object>} - Simulation results
 */
export const runMonteCarloSimulation = async (parameters) => {
  try {
    // In a real implementation, this would call your backend API
    // For now, it returns simulated data
    const url = `${API_BASE_URL}/sensitivity/monte-carlo`;
    
    // Simulated API call - replace with actual fetch
    //const response = await fetch(url, {
    //  method: 'POST',
    //  headers: { 'Content-Type': 'application/json' },
    //  body: JSON.stringify({ parameters })
    //});
    //return await response.json();
    
    // Simulated response
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      type: 'monteCarlo',
      parameters: parameters,
      iterations: 1000,
      results: {
        npv: Array.from({ length: 1000 }, () => ({
          value: Math.random() * 1000000,
          probability: Math.random()
        })),
        irr: Array.from({ length: 1000 }, () => ({
          value: Math.random() * 0.2,
          probability: Math.random()
        }))
      }
    };
  } catch (error) {
    console.error('Monte Carlo simulation failed:', error);
    throw error;
  }
};
