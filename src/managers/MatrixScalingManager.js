/**
 * @file MatrixScalingManager.js
 * @description Matrix Enhanced Scaling Manager
 * @module managers/MatrixScalingManager
 */

/**
 * Matrix Enhanced Scaling Manager
 * Provides advanced scaling capabilities with matrix integration
 */
class MatrixScalingManager {
  /**
   * Constructor
   * @param {Object} formMatrix - Form matrix object
   * @param {Object} versions - Versions state object
   * @param {Object} zones - Zones state object
   */
  constructor(formMatrix, versions, zones) {
    this.formMatrix = formMatrix;
    this.versions = versions;
    this.zones = zones;
    this.scalingGroups = [];
    this.operations = [
      { id: 'multiply', label: 'Multiply', symbol: '×' },
      { id: 'add', label: 'Add', symbol: '+' },
      { id: 'subtract', label: 'Subtract', symbol: '−' },
      { id: 'divide', label: 'Divide', symbol: '÷' },
      { id: 'power', label: 'Power', symbol: '^' },
      { id: 'log', label: 'Logarithmic', symbol: 'ln' },
      { id: 'exponential', label: 'Exponential', symbol: 'eˣ' }
    ];
  }

  /**
   * Set scaling groups
   * @param {Array} scalingGroups - Scaling groups
   */
  setScalingGroups(scalingGroups) {
    this.scalingGroups = scalingGroups;
  }

  /**
   * Get scaling base costs for a category
   * @param {string} category - Parameter category (e.g., 'Amount4')
   * @returns {Array} Base costs for scaling
   */
  getScalingBaseCosts(category) {
    const activeVersion = this.versions?.active || 'v1';
    const activeZone = this.zones?.active || 'z1';

    // Filter parameters by category
    const baseCosts = Object.entries(this.formMatrix)
      .filter(([paramId]) => paramId.includes(category))
      .map(([paramId, param]) => {
        // Get current value from matrix
        const paramValue = param.matrix?.[activeVersion]?.[activeZone] || 0;

        return {
          id: paramId,
          label: param.label || `Unnamed ${category}`,
          value: parseFloat(paramValue) || 0,
          baseValue: parseFloat(paramValue) || 0,
          vKey: param.dynamicAppendix?.itemState?.vKey || null,
          rKey: param.dynamicAppendix?.itemState?.rKey || null
        };
      });

    return baseCosts;
  }

  /**
   * Add a new scaling group
   * @param {string} category - Parameter category (e.g., 'Amount4')
   * @returns {Object} Created scaling group
   */
  addScalingGroup(category) {
    // Get base costs for this category
    const baseCosts = this.getScalingBaseCosts(category);

    // Look for gaps in the existing group sequence based on naming conventions
    const existingNumbers = this.scalingGroups
      .filter(group => group._scalingType === category)
      .map(group => {
        const match = group.name.match(/Scaling Group (\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(Boolean)
      .sort((a, b) => a - b);

    // Find the first available gap in the sequence
    let newGroupNumber = 1;
    for (let i = 0; i < existingNumbers.length; i++) {
      if (existingNumbers[i] !== i + 1) {
        newGroupNumber = i + 1;
        break;
      }
      newGroupNumber = i + 2; // If no gap found, use the next number
    }

    // Create new scaling group
    const newGroup = {
      id: `group-${Date.now()}`,
      name: `Scaling Group ${newGroupNumber}`,
      isProtected: false,
      _scalingType: category,
      items: baseCosts.map(cost => ({
        ...cost,
        originalBaseValue: cost.baseValue,
        scalingFactor: 1,
        operation: 'multiply',
        enabled: true,
        notes: '',
        scaledValue: cost.baseValue
      }))
    };

    // Add to scaling groups
    this.scalingGroups.push(newGroup);

    return newGroup;
  }

  /**
   * Remove a scaling group
   * @param {string} groupId - Group ID
   * @returns {boolean} Success indicator
   */
  removeScalingGroup(groupId) {
    // Find group index
    const groupIndex = this.scalingGroups.findIndex(group => group.id === groupId);
    if (groupIndex === -1) return false;

    // Check if group is protected
    if (this.scalingGroups[groupIndex].isProtected) return false;

    // Remove group
    this.scalingGroups.splice(groupIndex, 1);

    return true;
  }

  /**
   * Update scaling group
   * @param {Object} updatedGroup - Updated scaling group
   * @returns {boolean} Success indicator
   */
  updateScalingGroup(updatedGroup) {
    // Find group index
    const groupIndex = this.scalingGroups.findIndex(group => group.id === updatedGroup.id);
    if (groupIndex === -1) return false;

    // Update group
    this.scalingGroups[groupIndex] = updatedGroup;

    return true;
  }

  /**
   * Calculate scaled value based on operation
   * @param {number} baseValue - Base value
   * @param {string} operation - Operation type
   * @param {number} factor - Scaling factor
   * @returns {number} Scaled value
   */
  calculateScaledValue(baseValue, operation, factor) {
    try {
      if (baseValue === 0 && operation === 'divide') {
        return 0; // Avoid division by zero
      }

      if (baseValue < 0 && operation === 'log') {
        return baseValue; // Avoid logarithm of negative number
      }

      switch (operation) {
        case 'multiply':
          return baseValue * factor;
        case 'add':
          return baseValue + factor;
        case 'subtract':
          return baseValue - factor;
        case 'divide':
          return factor !== 0 ? baseValue / factor : baseValue;
        case 'power':
          return Math.pow(baseValue, factor);
        case 'log':
          return baseValue > 0 ? Math.log(baseValue) * factor : baseValue;
        case 'exponential':
          return baseValue > 0 ? Math.exp(Math.log(baseValue) * factor) : baseValue;
        default:
          return baseValue;
      }
    } catch (error) {
      console.error('Error calculating scaled value:', error);
      return baseValue;
    }
  }

  /**
   * Propagate changes through the scaling chain
   * @param {number} startGroupIndex - Index of the group where changes started
   * @returns {Array} Updated scaling groups
   */
  propagateChanges(startGroupIndex) {
    // Skip if invalid index
    if (startGroupIndex < 0 || startGroupIndex >= this.scalingGroups.length - 1) {
      return this.scalingGroups;
    }

    // Clone scaling groups to avoid mutations
    const updatedGroups = JSON.parse(JSON.stringify(this.scalingGroups));

    // For each subsequent group, update base values from the previous group's results
    for (let i = startGroupIndex + 1; i < updatedGroups.length; i++) {
      const previousGroup = updatedGroups[i - 1];

      // Skip if groups have different types
      if (previousGroup._scalingType !== updatedGroups[i]._scalingType) continue;

      // Create a map of previous results
      const previousResults = {};
      previousGroup.items.forEach(item => {
        previousResults[item.id] = {
          scaledValue: item.enabled ? item.scaledValue : item.baseValue,
          enabled: item.enabled
        };
      });

      // Update each item in the current group
      updatedGroups[i].items = updatedGroups[i].items.map(item => {
        const prevResult = previousResults[item.id];
        if (!prevResult) return item;

        // Calculate new scaled value based on updated base value
        const newBaseValue = prevResult.scaledValue;
        const newScaledValue = this.calculateScaledValue(
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

    // Update local state
    this.scalingGroups = updatedGroups;

    return updatedGroups;
  }

  /**
   * Calculate results from all scaling groups
   * @returns {Object} Results for each category
   */
  calculateResults() {
    const results = {};

    // Group scaling groups by category
    const groupsByCategory = {};
    this.scalingGroups.forEach(group => {
      const category = group._scalingType;
      if (!groupsByCategory[category]) {
        groupsByCategory[category] = [];
      }
      groupsByCategory[category].push(group);
    });

    // For each category, calculate final results
    Object.entries(groupsByCategory).forEach(([category, groups]) => {
      const categoryResults = {};

      // For each parameter ID, find the last scaled value
      groups.forEach(group => {
        group.items.forEach(item => {
          // Update parameter in results
          categoryResults[item.id] = {
            id: item.id,
            label: item.label,
            originalBaseValue: item.originalBaseValue,
            baseValue: item.baseValue,
            scaledValue: item.enabled ? item.scaledValue : item.baseValue,
            isActive: item.enabled
          };
        });
      });

      results[category] = categoryResults;
    });

    return results;
  }
}

export default MatrixScalingManager;