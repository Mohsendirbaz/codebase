/**
 * @file scalingUtils.js
 * @description Utility functions for scaling operations in the ExtendedScaling component
 * @module components/truly_extended_scaling/utils/scalingUtils
 */

import * as math from 'mathjs';

/**
 * Calculates the scaled value based on the operation and factor
 * 
 * @param {number} baseValue - The base value to scale
 * @param {string} operation - The operation to apply (multiply, power, divide, log, exponential, add, subtract)
 * @param {number} factor - The scaling factor to apply
 * @returns {number} The scaled value
 * @throws {Error} If the operation is invalid or would result in an error (e.g., division by zero)
 */
export const calculateScaledValue = (baseValue, operation, factor) => {
  try {
    if (baseValue === 0 && operation === 'divide') {
      throw new Error('Division by zero');
    }
    if (baseValue < 0 && operation === 'log') {
      throw new Error('Logarithm of negative number');
    }

    let result;
    switch (operation) {
      case 'multiply':
        result = math.multiply(baseValue, factor);
        break;
      case 'power':
        result = math.pow(baseValue, factor);
        break;
      case 'divide':
        result = math.divide(baseValue, factor);
        break;
      case 'log':
        result = math.multiply(math.log(baseValue), factor);
        break;
      case 'exponential':
        result = math.exp(math.multiply(math.log(baseValue), factor));
        break;
      case 'add':
        result = math.add(baseValue, factor);
        break;
      case 'subtract':
        result = math.subtract(baseValue, factor);
        break;
      default:
        result = baseValue;
    }

    if (!isFinite(result)) {
      throw new Error('Result is not a finite number');
    }

    return result;
  } catch (error) {
    console.error(`Error calculating scaled value: ${error.message}`);
    return baseValue; // Return original value on error
  }
};

/**
 * Propagates changes through a sequence of scaling groups
 * 
 * @param {Array} groups - The array of scaling groups
 * @param {number} startIndex - The index of the group where changes started
 * @returns {Array} The updated array of scaling groups
 */
export const propagateChanges = (groups, startIndex) => {
  // Skip if invalid index
  if (startIndex < 0 || startIndex >= groups.length - 1) {
    return groups;
  }

  // Clone groups to avoid mutations
  const updatedGroups = JSON.parse(JSON.stringify(groups));

  // For each subsequent group, update base values from the previous group's results
  for (let i = startIndex + 1; i < updatedGroups.length; i++) {
    const previousGroup = updatedGroups[i - 1];
    const currentGroup = updatedGroups[i];

    // Skip if groups have different types
    if (previousGroup._scalingType !== currentGroup._scalingType) continue;

    // Create a map of previous results
    const previousResults = {};
    previousGroup.items.forEach(item => {
      previousResults[item.id] = {
        scaledValue: item.enabled ? item.scaledValue : item.baseValue,
        enabled: item.enabled
      };
    });

    // Update each item in the current group
    currentGroup.items = currentGroup.items.map(item => {
      const prevResult = previousResults[item.id];
      if (!prevResult) return item;

      // Calculate new scaled value based on updated base value
      const newBaseValue = prevResult.scaledValue;
      const newScaledValue = calculateScaledValue(
        newBaseValue,
        item.operation,
        item.scalingFactor
      );

      return {
        ...item,
        originalBaseValue: item.originalBaseValue || item.baseValue, // Preserve original
        baseValue: newBaseValue,
        scaledValue: item.enabled ? newScaledValue : newBaseValue
      };
    });
  }

  return updatedGroups;
};