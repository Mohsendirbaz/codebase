/**
 * Integration Service
 * Centralizes integration between Model components and Refined_Integration_Plan components
 */

import * as apiService from './apiService';

/**
 * Adapt Refined_Integration_Plan's pricing data to our format
 * @param {Object} refinedPriceData - Price data from Refined_Integration_Plan
 * @returns {Object} - Adapted price data for ModelZone
 */
export const adaptPriceData = (refinedPriceData) => {
  if (!refinedPriceData) return null;
  
  return {
    averageSellingPrice: refinedPriceData.averagePrice || 0,
    isEstimate: refinedPriceData.isEstimated || false,
    minimumPrice: refinedPriceData.minPrice || 0,
    maximumPrice: refinedPriceData.maxPrice || 0
  };
};

/**
 * Adapt Refined_Integration_Plan's derivatives data to our format
 * @param {Object} refinedDerivatives - Derivatives data from Refined_Integration_Plan
 * @returns {Object} - Adapted derivatives data for ModelZone
 */
export const adaptDerivativesData = (refinedDerivatives) => {
  if (!refinedDerivatives || !refinedDerivatives.parameters) return null;
  
  return {
    parameters: refinedDerivatives.parameters.map(p => p.name),
    derivatives: refinedDerivatives.parameters.map(p => ({
      parameter: p.name,
      data: p.values.map(v => ({
        impact: v.impact,
        value: v.value
      }))
    }))
  };
};

/**
 * Fetch combined price data (from both implementations)
 * @param {Object} modelConfig - Model configuration
 * @returns {Promise<Object>} - Combined price data
 */
export const fetchCombinedPriceData = async (modelConfig) => {
  try {
    // Get data from our implementation
    const modelData = await apiService.fetchPriceData(
      modelConfig.version, 
      modelConfig.extension
    );
    
    // Try to get data from Refined_Integration_Plan
    let refinedData = null;
    try {
      // Import dynamically to avoid circular dependencies
      const refinedService = await import('./priceDataService');
      refinedData = await refinedService.getPriceData({
        version: modelConfig.version,
        extension: modelConfig.extension
      });
    } catch (err) {
      console.log('Refined price data not available:', err);
    }
    
    // Combine the data
    if (refinedData) {
      const adaptedRefinedData = adaptPriceData(refinedData);
      return {
        ...modelData,
        ...adaptedRefinedData,
        // Flag to show we have enriched data
        hasEnrichedData: true
      };
    }
    
    return modelData;
  } catch (error) {
    console.error('Error fetching combined price data:', error);
    return { averageSellingPrice: 0, isEstimate: true };
  }
};

/**
 * Fetch combined sensitivity data (from both implementations)
 * @param {Object} modelConfig - Model configuration
 * @returns {Promise<Object>} - Combined sensitivity data
 */
export const fetchCombinedSensitivityData = async (modelConfig) => {
  try {
    // Get data from our implementation
    const modelData = await apiService.fetchSensitivityData(modelConfig);
    
    // Try to get data from Refined_Integration_Plan
    let refinedData = null;
    try {
      // Import dynamically to avoid circular dependencies
      const refinedService = await import('./derivativesService');
      refinedData = await refinedService.getDerivativesData({
        version: modelConfig.version,
        extension: modelConfig.extension,
        parameters: Object.keys(modelConfig.filters).filter(f => modelConfig.filters[f])
      });
    } catch (err) {
      console.log('Refined derivatives data not available:', err);
    }
    
    // Combine the data
    if (refinedData) {
      const adaptedRefinedData = adaptDerivativesData(refinedData);
      
      // Merge the derivatives arrays
      const combinedDerivatives = [...modelData.derivatives];
      
      // Add any parameters that don't already exist
      if (adaptedRefinedData && adaptedRefinedData.derivatives) {
        for (const refinedDeriv of adaptedRefinedData.derivatives) {
          const existingIndex = combinedDerivatives.findIndex(
            d => d.parameter === refinedDeriv.parameter
          );
          
          if (existingIndex === -1) {
            combinedDerivatives.push(refinedDeriv);
          } else {
            // Enrich existing derivatives with additional data points
            const existing = combinedDerivatives[existingIndex];
            if (refinedDeriv.data && refinedDeriv.data.length > existing.data.length) {
              combinedDerivatives[existingIndex] = refinedDeriv;
            }
          }
        }
      }
      
      return {
        parameters: combinedDerivatives.map(d => d.parameter),
        derivatives: combinedDerivatives,
        // Flag to show we have enriched data
        hasEnrichedData: true
      };
    }
    
    return modelData;
  } catch (error) {
    console.error('Error fetching combined sensitivity data:', error);
    return { parameters: [], derivatives: [] };
  }
};

/**
 * Calculate efficacy metrics from sensitivity data and price data
 * This is a refactored version that can handle data from both implementations
 * 
 * @param {Object} sensitivityData - Sensitivity data with derivatives
 * @param {Object} priceData - Price data with averageSellingPrice
 * @returns {Object} - Efficacy metrics
 */
export const calculateEfficacyMetrics = (sensitivityData, priceData) => {
  // If using Refined_Integration_Plan data, try their calculation first
  if (sensitivityData?.hasEnrichedData && priceData?.hasEnrichedData) {
    try {
      // Import dynamically
      return import('./derivativesService')
        .then(refinedService => {
          return refinedService.calculatePriceImpact(sensitivityData, priceData);
        })
        .catch(err => {
          console.log('Falling back to local efficacy calculation:', err);
          // Fall back to our calculation if error
          return calculateLocalEfficacyMetrics(sensitivityData, priceData);
        });
    } catch (err) {
      console.log('Falling back to local efficacy calculation:', err);
      return calculateLocalEfficacyMetrics(sensitivityData, priceData);
    }
  }
  
  // Use our local calculation if no enriched data
  return calculateLocalEfficacyMetrics(sensitivityData, priceData);
};

/**
 * Local implementation of efficacy metric calculation
 * @param {Object} sensitivityData - Sensitivity data with derivatives
 * @param {Object} priceData - Price data with averageSellingPrice
 * @returns {Object} - Efficacy metrics
 */
const calculateLocalEfficacyMetrics = (sensitivityData, priceData) => {
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
