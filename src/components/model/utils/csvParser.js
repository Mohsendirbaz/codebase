/**
 * CSV Parser utility for handling Economic_Summary and other CSV files
 */
export const csvParser = {
  /**
   * Load and parse a CSV file
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<Array>} Parsed CSV data as array of objects
   */
  loadFile: async (filePath) => {
    try {
      const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      return csvParser.parse(text);
    } catch (error) {
      console.error('Error loading CSV file:', error);
      throw error;
    }
  },

  /**
   * Parse CSV text content into array of objects
   * @param {string} content - CSV text content
   * @returns {Array} Array of objects with column headers as keys
   */
  parse: (content) => {
    // Split into lines and remove empty lines
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Parse header row
    const headers = csvParser.parseRow(lines[0]);

    // Parse data rows
    return lines.slice(1).map(line => {
      const values = csvParser.parseRow(line);
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index] || '';
        return obj;
      }, {});
    });
  },

  /**
   * Parse a single CSV row, handling quoted values
   * @param {string} row - CSV row text
   * @returns {Array} Array of values from row
   */
  parseRow: (row) => {
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        // Toggle quote state
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    // Add final value
    values.push(currentValue.trim());

    // Clean up values
    return values.map(value => {
      // Remove quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      // Convert numbers
      if (!isNaN(value) && value.trim() !== '') {
        return parseFloat(value);
      }
      return value;
    });
  },

  /**
   * Format data as CSV string
   * @param {Array} data - Array of objects to convert to CSV
   * @returns {string} CSV formatted string
   */
  format: (data) => {
    if (!data || data.length === 0) return '';

    // Get all unique headers
    const headers = Array.from(
      new Set(
        data.reduce((keys, row) => {
          return keys.concat(Object.keys(row));
        }, [])
      )
    );

    // Format header row
    const headerRow = headers.map(header => csvParser.formatValue(header)).join(',');

    // Format data rows
    const dataRows = data.map(row => {
      return headers.map(header => csvParser.formatValue(row[header])).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
  },

  /**
   * Format a single value for CSV output
   * @param {any} value - Value to format
   * @returns {string} CSV formatted value
   */
  formatValue: (value) => {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Quote values containing commas or quotes
    if (stringValue.includes(',') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }
};
