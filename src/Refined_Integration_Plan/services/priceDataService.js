/**
 * Price Data Service
 * Handles fetching and processing price data from Economic_Summary CSV files
 */

import { extractPriceFromCSV } from '../utils/csvParser';

// Base path to Original directory where batch data is stored
const UPLOAD_DIR = '/Original';

/**
 * Constructs the path to the Economic_Summary CSV file
 * Handles both standard versions and version extensions
 * 
 * @param {string} version - The version number
 * @param {string} extension - Optional extension number for batch extensions
 * @returns {string} The path to the Economic_Summary CSV file
 */
export const getEconomicSummaryPath = (version, extension = null) => {
  if (extension) {
    // For version extensions: Batch(version.extension)/Results(version)/Economic_Summary(version).csv
    return `${UPLOAD_DIR}/Batch(${version}.${extension})/Results(${version})/Economic_Summary(${version}).csv`;
  } else {
    // For standard versions: Batch(version)/Results(version)/Economic_Summary(version).csv
    return `${UPLOAD_DIR}/Batch(${version})/Results(${version})/Economic_Summary(${version}).csv`;
  }
};

/**
 * Fetches price data from Economic_Summary CSV file
 * 
 * @param {string} version - The version number
 * @param {string} extension - Optional extension number for batch extensions
 * @returns {Promise<Object>} Price data object with version and price value
 */
export const fetchPriceData = async (version, extension = null) => {
  try {
    // Construct the path to the Economic_Summary CSV file
    const csvPath = getEconomicSummaryPath(version, extension);
    
    // Fetch the CSV file content
    const response = await fetch(`/api/file?path=${encodeURIComponent(csvPath)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Economic Summary CSV: ${response.status}`);
    }
    
    const csvText = await response.text();
    
    // Extract the price value from the CSV content
    const priceValue = extractPriceFromCSV(csvText);
    
    if (priceValue === null) {
      throw new Error('Average Selling Price not found in CSV');
    }
    
    return {
      version,
      extension: extension || null,
      value: priceValue,
      timestamp: new Date().toISOString(),
      source: 'economic_summary'
    };
  } catch (error) {
    console.error(`Error fetching price data for version ${version}${extension ? '.' + extension : ''}:`, error);
    throw error;
  }
};

/**
 * Fetches price data for multiple versions for comparison
 * 
 * @param {Array<Object>} versionConfigs - Array of version config objects with version and optional extension
 * @returns {Promise<Array<Object>>} Array of price data objects
 */
export const fetchComparisonPriceData = async (versionConfigs) => {
  const pricePromises = versionConfigs.map(config => 
    fetchPriceData(config.version, config.extension)
  );
  
  try {
    return await Promise.all(pricePromises);
  } catch (error) {
    console.error('Error fetching comparison price data:', error);
    throw error;
  }
};

/**
 * Calculates price differentials between versions
 * 
 * @param {Array<Object>} priceData - Array of price data objects
 * @returns {Array<Object>} Array of differential objects
 */
export const calculatePriceDifferentials = (priceData) => {
  if (priceData.length <= 1) return [];
  
  const differentials = [];
  
  for (let i = 1; i < priceData.length; i++) {
    const currentPrice = parseFloat(priceData[i].value);
    const previousPrice = parseFloat(priceData[i-1].value);
    
    if (!isNaN(currentPrice) && !isNaN(previousPrice) && previousPrice !== 0) {
      const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;
      
      differentials.push({
        fromVersion: priceData[i-1].version,
        fromExtension: priceData[i-1].extension,
        toVersion: priceData[i].version,
        toExtension: priceData[i].extension,
        percentChange: percentChange.toFixed(2),
        absoluteChange: (currentPrice - previousPrice).toFixed(2)
      });
    }
  }
  
  return differentials;
};
