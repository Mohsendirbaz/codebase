/**
 * Derivatives Service
 * Handles fetching and processing sensitivity derivatives data from batch extensions
 */

// Base path to Original directory where batch data is stored
const UPLOAD_DIR = '/Original';

/**
 * Constructs the path to the derivatives data in a batch directory
 * Handles both standard versions and version extensions
 * 
 * @param {string} version - The version number
 * @param {string} extension - Optional extension number for batch extensions
 * @returns {string} The path to the derivatives data directory
 */
export const getDerivativesPath = (version, extension = null) => {
  if (extension) {
    // For version extensions
    return `${UPLOAD_DIR}/Batch(${version}.${extension})/Results(${version})/Sensitivity`;
  } else {
    // For standard versions
    return `${UPLOAD_DIR}/Batch(${version})/Results(${version})/Sensitivity`;
  }
};

/**
 * Fetches sensitivity derivatives data for a parameter
 * 
 * @param {string} version - The version number
 * @param {string} extension - Optional extension number for batch extensions
 * @param {string} paramId - The parameter ID (e.g., S34)
 * @returns {Promise<Object>} Derivatives data for the parameter
 */
export const fetchParameterDerivatives = async (version, extension = null, paramId) => {
  try {
    // Construct the path to the derivatives data
    const basePath = getDerivativesPath(version, extension);
    const dataPath = `${basePath}/Multipoint/${paramId}_derivatives.json`;
    
    // Fetch the derivatives data
    const response = await fetch(`/api/file?path=${encodeURIComponent(dataPath)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch derivatives data: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      paramId,
      version,
      extension: extension || null,
      points: data.points || [],
      metadata: data.metadata || {},
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching derivatives for parameter ${paramId}:`, error);
    throw error;
  }
};

/**
 * Fetches derivatives data for multiple parameters
 * 
 * @param {string} version - The version number
 * @param {string} extension - Optional extension number for batch extensions
 * @param {Array<string>} paramIds - Array of parameter IDs
 * @returns {Promise<Array<Object>>} Array of derivatives data objects
 */
export const fetchMultipleDerivatives = async (version, extension = null, paramIds) => {
  const derivativePromises = paramIds.map(paramId => 
    fetchParameterDerivatives(version, extension, paramId)
  );
  
  try {
    return await Promise.all(derivativePromises);
  } catch (error) {
    console.error('Error fetching multiple derivatives:', error);
    throw error;
  }
};

/**
 * Fetches all available derivatives for a version
 * 
 * @param {string} version - The version number
 * @param {string} extension - Optional extension number for batch extensions
 * @returns {Promise<Object>} Object containing all derivatives data
 */
export const fetchAllDerivatives = async (version, extension = null) => {
  try {
    // First, get a list of available parameters with derivatives
    const basePath = getDerivativesPath(version, extension);
    const indexPath = `${basePath}/index.json`;
    
    // Try to fetch the index file (if it exists)
    try {
      const indexResponse = await fetch(`/api/file?path=${encodeURIComponent(indexPath)}`);
      
      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        const paramIds = indexData.parameters || [];
        return await fetchMultipleDerivatives(version, extension, paramIds);
      }
    } catch (indexError) {
      console.warn('Derivatives index not found, falling back to default parameters');
    }
    
    // Fallback to a set of common parameter IDs
    const defaultParamIds = ['S34', 'S35', 'S36', 'S37', 'S38'];
    return await fetchMultipleDerivatives(version, extension, defaultParamIds);
  } catch (error) {
    console.error(`Error fetching all derivatives for version ${version}${extension ? '.' + extension : ''}:`, error);
    throw error;
  }
};

/**
 * Calculates the price impact of a parameter based on its derivatives
 * 
 * @param {Object} derivativesData - Derivatives data for a parameter
 * @returns {Object} Parameter with added price impact metrics
 */
export const calculatePriceImpact = (derivativesData) => {
  if (!derivativesData || !derivativesData.points || derivativesData.points.length === 0) {
    return derivativesData;
  }
  
  // Copy the data to avoid mutating the input
  const enhancedData = { ...derivativesData };
  
  // Calculate impact metrics
  const impacts = enhancedData.points.map(point => Math.abs(point.priceImpact || 0));
  enhancedData.maxImpact = Math.max(...impacts);
  enhancedData.averageImpact = impacts.reduce((sum, impact) => sum + impact, 0) / impacts.length;
  
  return enhancedData;
};
