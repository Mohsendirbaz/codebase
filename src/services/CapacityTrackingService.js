/**
 * Capacity Tracking Service
 * 
 * Service to track and calculate capacity usage across the application
 * Handles tracking for parameters, scaling groups, sensitivity variations,
 * configurable versions, and plant lifetime
 */
class CapacityTrackingService {
  constructor() {
    // Default capacity limits
    this.capacityLimits = {
      parameters: 75,                // S10-S84
      maxScalingGroups: 5,           // Per parameter
      maxSensitivityVariations: 6,   // Per parameter-scaling group combination
      configurableVersions: 20,
      plantLifetime: 20              // Years
    };

    // Current usage
    this.usage = {
      parameters: 0,                 // Number of parameters in use
      scalingGroups: 0,              // Total scaling groups in use
      sensitivityVariations: 0,      // Total sensitivity variations in use
      configurableVersions: 0,       // Number of versions configured
      plantLifetime: 0               // Years configured
    };
  }

  /**
   * Set a capacity limit
   * @param {string} key - The capacity limit key
   * @param {number} value - The capacity limit value
   */
  setCapacityLimit(key, value) {
    if (key in this.capacityLimits) {
      this.capacityLimits[key] = value;
    }
  }

  /**
   * Get a capacity limit
   * @param {string} key - The capacity limit key
   * @returns {number} The capacity limit value
   */
  getCapacityLimit(key) {
    return this.capacityLimits[key];
  }

  /**
   * Update parameters usage
   * @param {number} count - Number of parameters in use
   */
  updateParametersUsage(count) {
    this.usage.parameters = count;
  }

  /**
   * Update scaling groups usage
   * @param {number} count - Total scaling groups in use
   */
  updateScalingGroupsUsage(count) {
    this.usage.scalingGroups = count;
  }

  /**
   * Update sensitivity variations usage
   * @param {number} count - Total sensitivity variations in use
   */
  updateSensitivityVariationsUsage(count) {
    this.usage.sensitivityVariations = count;
  }

  /**
   * Update configurable versions usage
   * @param {number} count - Number of versions configured
   */
  updateConfigurableVersionsUsage(count) {
    this.usage.configurableVersions = count;
  }

  /**
   * Update plant lifetime usage
   * @param {number} count - Years configured
   */
  updatePlantLifetimeUsage(count) {
    this.usage.plantLifetime = count;
  }

  /**
   * Get usage stats for all capacity types
   * @returns {Object} Usage stats
   */
  getAllUsageStats() {
    return {
      parameters: {
        used: this.usage.parameters,
        limit: this.capacityLimits.parameters,
        percentage: Math.round((this.usage.parameters / this.capacityLimits.parameters) * 100)
      },
      maxScalingGroups: {
        used: this.usage.scalingGroups,
        // Maximum possible scaling groups is parameters * maxScalingGroups
        limit: this.usage.parameters * this.capacityLimits.maxScalingGroups,
        percentage: Math.round((this.usage.scalingGroups / 
          (this.usage.parameters * this.capacityLimits.maxScalingGroups)) * 100)
      },
      maxSensitivityVariations: {
        used: this.usage.sensitivityVariations,
        // Maximum possible sensitivity variations is total scaling groups * maxSensitivityVariations
        limit: this.usage.scalingGroups * this.capacityLimits.maxSensitivityVariations,
        percentage: Math.round((this.usage.sensitivityVariations / 
          (this.usage.scalingGroups * this.capacityLimits.maxSensitivityVariations)) * 100)
      },
      configurableVersions: {
        used: this.usage.configurableVersions,
        limit: this.capacityLimits.configurableVersions,
        percentage: Math.round((this.usage.configurableVersions / this.capacityLimits.configurableVersions) * 100)
      },
      plantLifetime: {
        used: this.usage.plantLifetime,
        limit: this.capacityLimits.plantLifetime,
        percentage: Math.round((this.usage.plantLifetime / this.capacityLimits.plantLifetime) * 100)
      },
      // Total capacity usage calculation
      totalCapacity: {
        // Theoretical maximum: parameters * maxScalingGroups * maxSensitivityVariations * plantLifetime * configurableVersions
        theoretical: this.capacityLimits.parameters * 
                    this.capacityLimits.maxScalingGroups * 
                    this.capacityLimits.maxSensitivityVariations * 
                    this.capacityLimits.plantLifetime * 
                    this.capacityLimits.configurableVersions,
        // Actual usage: parameters * scalingGroups * sensitivityVariations * plantLifetime * configurableVersions
        used: this.usage.parameters * 
              this.usage.scalingGroups * 
              this.usage.sensitivityVariations * 
              this.usage.plantLifetime * 
              this.usage.configurableVersions,
        // Usage percentage
        percentage: Math.round(((this.usage.parameters * 
                              this.usage.scalingGroups * 
                              this.usage.sensitivityVariations * 
                              this.usage.plantLifetime * 
                              this.usage.configurableVersions) / 
                            (this.capacityLimits.parameters * 
                            this.capacityLimits.maxScalingGroups * 
                            this.capacityLimits.maxSensitivityVariations * 
                            this.capacityLimits.plantLifetime * 
                            this.capacityLimits.configurableVersions)) * 100)
      }
    };
  }

  /**
   * Find degree of freedom conflicts for a parameter
   * @param {string} paramId - Parameter ID
   * @param {Array} efficacyPeriods - Array of efficacy periods
   * @param {number} maxYears - Maximum number of years to check
   * @returns {Array} Array of years with conflicts
   */
  findDegreeOfFreedomConflicts(paramId, efficacyPeriods, maxYears) {
    if (!efficacyPeriods || !Array.isArray(efficacyPeriods)) return [];

    const conflicts = [];

    // Check each year
    for (let year = 1; year <= maxYears; year++) {
      // Count how many periods include this year
      const periodsForYear = efficacyPeriods.filter(period => 
        year >= period.start && year <= period.end
      );

      // If more than one period includes this year, it's a conflict
      if (periodsForYear.length > 1) {
        conflicts.push(year);
      }
    }

    return conflicts;
  }

  /**
   * Calculate the usage percentage for sensitivity variables
   * Counts how many sensitivity variables (S10-S84) are enabled
   * @param {Object} sensitivityState - The S state object from SensitivityMonitor
   * @returns {number} The usage percentage
   */
  updateSensitivityUsage(sensitivityState) {
    if (!sensitivityState) return 0;

    // Count enabled sensitivity variables
    const enabledCount = Object.values(sensitivityState)
      .filter(value => value.enabled)
      .length;

    this.updateParametersUsage(enabledCount);
    return Math.round((enabledCount / this.capacityLimits.parameters) * 100);
  }

  /**
   * Get the current usage count for a component
   * @param {string} componentKey - The component identifier
   * @returns {number} The current usage count
   */
  getUsageCount(componentKey) {
    return this.usage[componentKey] || 0;
  }
}

// Create a singleton instance
const capacityTracker = new CapacityTrackingService();

export default capacityTracker;
