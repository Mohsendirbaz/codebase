/**
 * @typedef {Object} SummaryItem
 * @property {string} id
 * @property {string} label
 * @property {number} originalValue
 * @property {Object.<string, number>} scaledValues
 * @property {boolean} isFrozen
 * @property {number} sequentialResult
 */

/**
 * @typedef {Object} TabConfig
 * @property {string} id
 * @property {string} label
 * @property {boolean} [isParenthesis]
 */

/** @typedef {'multiply'|'divide'|'add'|'subtract'|'pass'|'openParen'|'closeParen'|'expression'|'power'|'log'|'exponential'} ScalingOperation */

/**
 * @typedef {Object} SequentialOperation
 * @property {ScalingOperation} type
 * @property {number|string} value
 */

/**
 * Get display symbol for mathematical operations
 * @param {ScalingOperation} operation 
 * @returns {string}
 */
export const getDisplaySymbol = (operation) => {
  const symbols = {
    multiply: '×',
    divide: '÷',
    add: '+',
    subtract: '-',
    pass: '→',
    openParen: '(',
    closeParen: ')',
    expression: '=',
    power: '^',
    log: 'ln',
    exponential: 'eˣ'
  };
  return symbols[operation] || '×';
};

export class MathProcessor {
  /**
   * Evaluate a mathematical expression with given values
   * @param {string} expression - Mathematical expression
   * @param {Object.<string, number>} values - Values to use in evaluation
   * @returns {{result: number, error: boolean, message: string, suggestion?: string}} Evaluation result
   */
  evaluateExpression(expression, values) {
    try {
      // Replace variable names with their values
      let processedExpression = expression;
      Object.entries(values).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        processedExpression = processedExpression.replace(regex, value.toString());
      });

      // Enhanced security check
      if (!/^[\d\s+\-*/().^e\s]+$/.test(processedExpression)) {
        throw new Error('Invalid expression');
      }

      // Check for potential division by zero
      if (/\/\s*0/.test(processedExpression)) {
        return {
          result: 0,
          error: true,
          message: 'Division by zero detected',
          suggestion: 'Check your denominators'
        };
      }

      // Check for negative logarithms
      if (/log\s*\(\s*-/.test(processedExpression)) {
        return {
          result: 0,
          error: true,
          message: 'Logarithm of negative number',
          suggestion: 'Logarithm input must be positive'
        };
      }

      // Evaluate the expression with Math functions available
      const mathContext = {
        Math,
        log: Math.log,
        exp: Math.exp,
        pow: Math.pow
      };
      
      const result = Function(...Object.keys(mathContext), `"use strict"; return (${processedExpression})`)
        (...Object.values(mathContext));
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid result');
      }

      return {
        result,
        error: false,
        message: ''
      };
    } catch (error) {
      return {
        result: 0,
        error: true,
        message: error.message,
        suggestion: 'Check your expression syntax'
      };
    }
  }

  /**
   * Apply a sequence of operations to a value
   * @param {number} baseValue - Starting value
   * @param {SequentialOperation[]} operations - Operations to apply
   * @param {Object.<string, number>} context - Additional values for expressions
   * @returns {{result: number, error: boolean, message: string, suggestion?: string}} Operation result
   */
  applySequentialOperations(baseValue, operations, context = {}) {
    let result = baseValue;
    let error = false;
    let message = '';
    let suggestion = '';

    try {
      operations.forEach((op) => {
        switch (op.type) {
          case 'multiply':
            result *= Number(op.value);
            break;
          case 'divide':
            if (Number(op.value) === 0) {
              throw new Error('Division by zero');
            }
            result /= Number(op.value);
            break;
          case 'add':
            result += Number(op.value);
            break;
          case 'subtract':
            result -= Number(op.value);
            break;
          case 'power':
            result = Math.pow(result, Number(op.value));
            if (!isFinite(result)) {
              throw new Error('Power operation resulted in non-finite number');
            }
            break;
          case 'log':
            if (result <= 0) {
              throw new Error('Logarithm of non-positive number');
            }
            result = Math.log(result) * Number(op.value);
            break;
          case 'exponential':
            result = Math.exp(Math.log(result) * Number(op.value));
            if (!isFinite(result)) {
              throw new Error('Exponential operation overflow');
            }
            break;
          case 'expression':
            const evalResult = this.evaluateExpression(op.value.toString(), {
              ...context,
              current: result
            });
            if (evalResult.error) {
              throw new Error(evalResult.message);
            }
            result = evalResult.result;
            break;
          case 'pass':
            // No operation needed
            break;
          default:
            // Ignore parentheses operations
            break;
        }

        // Check for NaN or Infinity after each operation
        if (!isFinite(result)) {
          throw new Error('Operation resulted in non-finite number');
        }
      });

      return { result, error: false, message: '', suggestion: '' };
    } catch (err) {
      return {
        result: baseValue,
        error: true,
        message: err.message,
        suggestion: this.getSuggestionForError(err.message)
      };
    }
  }

  /**
   * Calculate scaling factor based on reference values
   * @param {number} baseValue - Original value
   * @param {number} targetValue - Target value
   * @param {ScalingOperation} operation - Type of scaling
   * @returns {{factor: number, error: boolean, message: string, suggestion?: string}} Scaling factor
   */
  calculateScalingFactor(baseValue, targetValue, operation) {
    try {
      switch (operation) {
        case 'multiply':
          if (baseValue === 0) {
            throw new Error('Base value cannot be zero');
          }
          return {
            factor: targetValue / baseValue,
            error: false,
            message: ''
          };
        case 'add':
          return {
            factor: targetValue - baseValue,
            error: false,
            message: ''
          };
        case 'divide':
          if (targetValue === 0) {
            throw new Error('Target value cannot be zero');
          }
          return {
            factor: baseValue / targetValue,
            error: false,
            message: ''
          };
        case 'subtract':
          return {
            factor: baseValue - targetValue,
            error: false,
            message: ''
          };
        case 'power':
          if (baseValue <= 0) {
            throw new Error('Base value must be positive for power operation');
          }
          return {
            factor: Math.log(targetValue) / Math.log(baseValue),
            error: false,
            message: ''
          };
        case 'log':
          if (baseValue <= 0 || targetValue <= 0) {
            throw new Error('Values must be positive for logarithmic scaling');
          }
          return {
            factor: Math.log(targetValue) / Math.log(baseValue),
            error: false,
            message: ''
          };
        case 'exponential':
          if (baseValue <= 0) {
            throw new Error('Base value must be positive for exponential scaling');
          }
          return {
            factor: Math.log(targetValue) / Math.log(Math.E) / Math.log(baseValue),
            error: false,
            message: ''
          };
        default:
          throw new Error('Unsupported operation');
      }
    } catch (err) {
      return {
        factor: 1,
        error: true,
        message: err.message,
        suggestion: this.getSuggestionForError(err.message)
      };
    }
  }

  /**
   * Get helpful suggestion for common errors
   * @param {string} error - Error message
   * @returns {string} Suggestion for fixing the error
   */
  getSuggestionForError(error) {
    const suggestions = {
      'Division by zero': 'Try using a non-zero value for division',
      'Base value cannot be zero': 'Use a non-zero base value for multiplication',
      'Target value cannot be zero': 'Choose a non-zero target value for division',
      'Values must be positive for logarithmic scaling': 'Use positive values for logarithmic operations',
      'Base value must be positive for power operation': 'Ensure base value is positive for power scaling',
      'Base value must be positive for exponential scaling': 'Use positive base value for exponential scaling',
      'Operation resulted in non-finite number': 'Try using smaller values to avoid overflow',
      'Power operation resulted in non-finite number': 'Use smaller exponents to avoid overflow',
      'Exponential operation overflow': 'Reduce the scaling factor to avoid overflow',
      'Logarithm of non-positive number': 'Ensure values are positive for logarithmic operations',
      'Invalid expression': 'Check the mathematical expression syntax',
      'Unsupported operation': 'Use one of the supported scaling operations'
    };

    return suggestions[error] || 'Check your inputs and try again';
  }
}

export default MathProcessor;
