/**
 * @file MatrixValidator.js
 * @description Matrix Validation Module
 * @module services/MatrixValidator
 */

/**
 * Matrix Validation Module
 * Provides validation functions for matrix-based form values
 */
class MatrixValidator {
  /**
   * Constructor
   * @param {Object} validationRules - Validation rules configuration
   */
  constructor(validationRules = {}) {
    this.rules = validationRules;
    this.errors = {};
  }

  /**
   * Set validation rules
   * @param {Object} rules - Validation rules configuration
   */
  setRules(rules) {
    this.rules = rules;
  }

  /**
   * Validate parameter value
   * @param {string} paramId - Parameter ID
   * @param {any} value - Parameter value
   * @returns {boolean} True if valid
   */
  validateParameter(paramId, value) {
    // Skip if no rules for this parameter
    if (!this.rules[paramId]) return true;

    const rules = this.rules[paramId];
    let isValid = true;
    const errors = [];

    // Required rule
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push('This field is required');
      isValid = false;
    }

    // Type rule
    if (rules.type) {
      switch (rules.type) {
        case 'number':
          if (typeof value !== 'number' && !(typeof value === 'string' && !isNaN(parseFloat(value)))) {
            errors.push('Must be a number');
            isValid = false;
          }
          break;
        case 'integer':
          if (typeof value !== 'number' || Math.floor(value) !== value) {
            errors.push('Must be an integer');
            isValid = false;
          }
          break;
        case 'string':
          if (typeof value !== 'string') {
            errors.push('Must be a string');
            isValid = false;
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push('Must be a boolean');
            isValid = false;
          }
          break;
        default:
          break;
      }
    }

    // Min/max rules for numbers
    if ((rules.type === 'number' || rules.type === 'integer') && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`Must be at least ${rules.min}`);
        isValid = false;
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push(`Must be at most ${rules.max}`);
        isValid = false;
      }
    }

    // Min/max length rules for strings
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(`Must be at least ${rules.minLength} characters`);
        isValid = false;
      }

      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(`Must be at most ${rules.maxLength} characters`);
        isValid = false;
      }
    }

    // Pattern rule for strings
    if (rules.type === 'string' && rules.pattern && typeof value === 'string') {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        errors.push(rules.patternMessage || 'Invalid format');
        isValid = false;
      }
    }

    // Custom validation function
    if (rules.validate && typeof rules.validate === 'function') {
      const customResult = rules.validate(value);
      if (customResult !== true) {
        errors.push(customResult || 'Invalid value');
        isValid = false;
      }
    }

    // Store errors
    this.errors[paramId] = errors;

    return isValid;
  }

  /**
   * Validate multiple parameters
   * @param {Object} formMatrix - Form matrix object
   * @param {string} version - Version ID
   * @param {string} zone - Zone ID
   * @returns {boolean} True if all parameters are valid
   */
  validateMatrix(formMatrix, version, zone) {
    let isValid = true;
    this.errors = {};

    // Validate each parameter
    Object.keys(formMatrix).forEach(paramId => {
      const param = formMatrix[paramId];
      const value = param.matrix[version]?.[zone];

      if (!this.validateParameter(paramId, value)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Get validation errors
   * @param {string} paramId - Optional parameter ID to get errors for
   * @returns {Object|Array} Validation errors
   */
  getErrors(paramId) {
    if (paramId) {
      return this.errors[paramId] || [];
    }

    return this.errors;
  }

  /**
   * Check if parameter has errors
   * @param {string} paramId - Parameter ID
   * @returns {boolean} True if parameter has errors
   */
  hasErrors(paramId) {
    return Array.isArray(this.errors[paramId]) && this.errors[paramId].length > 0;
  }
}

export default MatrixValidator;