/**
 * Mathematical processing utility for scaling operations
 * Handles all calculations related to scaling, logarithmic transformations, and expressions
 */

const mathProcessor = {
  /**
   * Calculate scaled values based on a base value and sequence of operations
   * @param {number} baseValue - The starting value
   * @param {Array} operations - Array of operations to apply sequentially
   * @param {Object} config - Configuration options including precision
   * @returns {Object} Object containing calculated values and intermediate results
   */
  calculateScaledValues: (baseValue, operations, config) => {
    const { precision = 2 } = config;
    let currentValue = baseValue;
    const steps = [];

    // Apply each operation sequentially
    operations.forEach(operation => {
      const opValue = operation.value;
      let result;

      switch (operation.type) {
        case 'multiply':
          result = currentValue * opValue;
          steps.push(`${currentValue} × ${opValue} = ${result.toFixed(precision)}`);
          break;
        case 'divide':
          result = currentValue / opValue;
          steps.push(`${currentValue} ÷ ${opValue} = ${result.toFixed(precision)}`);
          break;
        case 'add':
          result = currentValue + opValue;
          steps.push(`${currentValue} + ${opValue} = ${result.toFixed(precision)}`);
          break;
        case 'subtract':
          result = currentValue - opValue;
          steps.push(`${currentValue} - ${opValue} = ${result.toFixed(precision)}`);
          break;
        case 'power':
          result = Math.pow(currentValue, opValue);
          steps.push(`${currentValue}^${opValue} = ${result.toFixed(precision)}`);
          break;
        case 'root':
          result = Math.pow(currentValue, 1 / opValue);
          steps.push(`${currentValue}^(1/${opValue}) = ${result.toFixed(precision)}`);
          break;
        case 'log':
          result = Math.log(currentValue) / Math.log(opValue || 10);
          steps.push(`log${opValue || 10}(${currentValue}) = ${result.toFixed(precision)}`);
          break;
        default:
          result = currentValue;
          steps.push(`No operation applied. Value remains ${result.toFixed(precision)}`);
      }

      currentValue = result;
    });

    return {
      finalValue: Number(currentValue.toFixed(precision)),
      steps,
      intermediateValues: steps.map(step => {
        return parseFloat(step.split('=')[1].trim());
      })
    };
  },

  /**
   * Calculate logarithmic representation of a value
   * @param {number} value - The value to convert to logarithmic scale
   * @param {number} precision - Number of decimal places
   * @param {number} base - Logarithm base (default: 10)
   * @returns {number} Logarithmic value
   */
  calculateLogarithmic: (value, precision = 2, base = 10) => {
    // Handle zero and negative values
    if (value <= 0) return null;
    
    const result = Math.log(value) / Math.log(base);
    return Number(result.toFixed(precision));
  },

  /**
   * Calculate linear representation (identity function with precision)
   * @param {number} value - The value to format
   * @param {number} precision - Number of decimal places
   * @returns {number} Formatted value
   */
  calculateLinear: (value, precision = 2) => {
    return Number(value.toFixed(precision));
  },

  /**
   * Calculate a new value based on drag position
   * @param {number} originalValue - The starting value
   * @param {number} yPosition - Y-coordinate of drag end position
   * @param {Object} config - Configuration options
   * @returns {number} New calculated value
   */
  calculateValueFromPosition: (originalValue, yPosition, config) => {
    // Convert position to a scale factor (increase/decrease)
    // Lower Y positions (higher on screen) increase the value
    // Higher Y positions (lower on screen) decrease the value
    const centerY = 100; // Assume 100 is the center point
    const distance = centerY - yPosition;
    
    // Scale the distance to get a reasonable factor (0.5% change per pixel)
    const scaleFactor = 1 + (distance * 0.005);
    
    // Apply the scale factor to the original value
    let newValue = originalValue * scaleFactor;
    
    // Round to desired precision
    newValue = Number(newValue.toFixed(config.precision));
    
    return newValue;
  },

  /**
   * Evaluate a mathematical expression and apply it to items or operations
   * @param {string} expression - The expression to evaluate
   * @param {Array} items - Current items that may be referenced in the expression
   * @returns {Object} Object containing updated items and/or operations
   */
  evaluateExpression: (expression, items) => {
    // Simple expression parser for demonstration
    // In a real implementation, you might use a proper expression parser
    
    // Check for basic scaling operations like "scale all by 2"
    const scaleAllRegex = /scale\s+all\s+by\s+(\d+(?:\.\d+)?)/i;
    const scaleMatch = expression.match(scaleAllRegex);
    
    if (scaleMatch) {
      const scaleFactor = parseFloat(scaleMatch[1]);
      
      // Create updated copies of all items with scaled base values
      const updatedItems = items.map(item => {
        // Don't update frozen items
        if (item.frozen) return item;
        
        return {
          ...item,
          baseValue: Number((item.baseValue * scaleFactor).toFixed(2))
        };
      });
      
      return { updatedItems };
    }
    
    // Check for item-specific operations like "item 1 *= 2"
    const itemSpecificRegex = /item\s+(\d+|"[^"]+"|'[^']+')\s*([*\/+-]=)\s*(\d+(?:\.\d+)?)/i;
    const itemMatch = expression.match(itemSpecificRegex);
    
    if (itemMatch) {
      let itemIdentifier = itemMatch[1];
      const operator = itemMatch[2];
      const value = parseFloat(itemMatch[3]);
      
      // Check if identifier is a string (name) or number (index)
      let targetItem;
      if (itemIdentifier.startsWith('"') || itemIdentifier.startsWith("'")) {
        // It's a name in quotes
        itemIdentifier = itemIdentifier.substring(1, itemIdentifier.length - 1);
        targetItem = items.find(item => item.name === itemIdentifier);
      } else {
        // It's an index
        const index = parseInt(itemIdentifier) - 1; // 1-based to 0-based
        targetItem = items[index];
      }
      
      if (!targetItem || targetItem.frozen) {
        return { updatedItems: items }; // No change or frozen item
      }
      
      // Apply the operation
      let newValue;
      switch (operator) {
        case '*=':
          newValue = targetItem.baseValue * value;
          break;
        case '/=':
          newValue = targetItem.baseValue / value;
          break;
        case '+=':
          newValue = targetItem.baseValue + value;
          break;
        case '-=':
          newValue = targetItem.baseValue - value;
          break;
        default:
          newValue = targetItem.baseValue;
      }
      
      // Update the specific item
      const updatedItems = items.map(item => {
        if (item.id === targetItem.id) {
          return {
            ...item,
            baseValue: Number(newValue.toFixed(2))
          };
        }
        return item;
      });
      
      return { updatedItems };
    }
    
    // Return null if no valid expression was found
    return null;
  }
};

export default mathProcessor;
