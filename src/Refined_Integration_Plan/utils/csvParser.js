/**
 * CSV Parser Utility
 * Specialized for extracting price data from Economic_Summary CSV files
 */

/**
 * Parse CSV text data into structured format
 * @param {string} csvText - Raw CSV text
 * @returns {Array<Object>} Parsed CSV as array of objects
 */
export const parseCSV = (csvText) => {
  // Split by lines
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }
  
  // Get headers (first line)
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Parse data rows
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = {};
    const values = lines[i].split(',');
    
    // Skip rows with incorrect number of fields
    if (values.length !== headers.length) {
      console.warn(`Row ${i} has incorrect number of fields. Expected ${headers.length}, got ${values.length}`);
      continue;
    }
    
    // Map values to headers
    headers.forEach((header, j) => {
      row[header] = values[j].trim();
    });
    
    data.push(row);
  }
  
  return data;
};

/**
 * Extract Average Selling Price from Economic_Summary CSV
 * As specified, this is in the 3rd row of the CSV
 * 
 * @param {Array<Object>} csvData - Parsed CSV data
 * @returns {number|null} The Average Selling Price or null if not found
 */
export const extractAverageSellingPrice = (csvData) => {
  if (!csvData || csvData.length < 2) {
    return null;
  }
  
  // The 3rd row (index 2) should contain the Average Selling Price
  const priceRow = csvData[2];
  
  // Check if the price value is in the "$1" column as specified
  if (priceRow && priceRow["$1"]) {
    return parseFloat(priceRow["$1"]);
  }
  
  // Fallback: If column name isn't "$1", try getting the second column value
  const secondColumnKey = Object.keys(priceRow)[1];
  if (secondColumnKey && priceRow[secondColumnKey]) {
    return parseFloat(priceRow[secondColumnKey]);
  }
  
  return null;
};

/**
 * Read a CSV file and extract the Average Selling Price directly
 * @param {string} csvText - Raw CSV text data
 * @returns {number|null} The extracted Average Selling Price or null if not found
 */
export const extractPriceFromCSV = (csvText) => {
  const parsedData = parseCSV(csvText);
  return extractAverageSellingPrice(parsedData);
};
