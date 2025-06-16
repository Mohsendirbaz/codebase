/**
 * @file MatrixInheritanceManager.js
 * @description Matrix Inheritance Manager
 * @module managers/MatrixInheritanceManager
 */

/**
 * Matrix Inheritance Manager
 * Handles inheritance relationships between versions
 */
class MatrixInheritanceManager {
  /**
   * Constructor
   * @param {Object} versions - Versions state object
   * @param {Object} formMatrix - Form matrix object
   */
  constructor(versions, formMatrix) {
    this.versions = versions;
    this.formMatrix = formMatrix;
    this.inheritanceGraph = this.buildInheritanceGraph();
  }

  /**
   * Build inheritance graph from matrix state
   * @returns {Object} Inheritance graph
   */
  buildInheritanceGraph() {
    const graph = {};

    // Initialize graph nodes
    this.versions.list.forEach(version => {
      graph[version] = {
        sources: [],
        targets: []
      };
    });

    // For each parameter, analyze inheritance relationships
    Object.values(this.formMatrix).forEach(param => {
      if (!param.inheritance) return;

      // For each version that inherits from another
      Object.entries(param.inheritance).forEach(([version, inheritance]) => {
        if (inheritance.source && inheritance.percentage < 100) {
          // Add source -> target relationship
          if (!graph[version].sources.includes(inheritance.source)) {
            graph[version].sources.push({
              version: inheritance.source,
              percentage: inheritance.percentage
            });
          }

          // Add target relationship to source
          if (!graph[inheritance.source].targets.includes(version)) {
            graph[inheritance.source].targets.push({
              version,
              percentage: inheritance.percentage
            });
          }
        }
      });
    });

    return graph;
  }

  /**
   * Get inheritance sources for a version
   * @param {string} version - Version ID
   * @returns {Array} Source versions with inheritance percentages
   */
  getInheritanceSources(version) {
    if (!this.inheritanceGraph[version]) return [];
    return this.inheritanceGraph[version].sources;
  }

  /**
   * Get inheritance targets for a version
   * @param {string} version - Version ID
   * @returns {Array} Target versions with inheritance percentages
   */
  getInheritanceTargets(version) {
    if (!this.inheritanceGraph[version]) return [];
    return this.inheritanceGraph[version].targets;
  }

  /**
   * Configure inheritance relationship
   * @param {string} paramId - Parameter ID
   * @param {string} version - Target version ID
   * @param {string} sourceVersion - Source version ID
   * @param {number} percentage - Inheritance percentage (0-100)
   * @returns {Object} Updated form matrix
   */
  configureInheritance(paramId, version, sourceVersion, percentage) {
    // Skip if parameter doesn't exist
    if (!this.formMatrix[paramId]) return this.formMatrix;

    // Create a copy of form matrix
    const newFormMatrix = { ...this.formMatrix };
    const param = { ...newFormMatrix[paramId] };

    // Update inheritance configuration
    if (!param.inheritance) {
      param.inheritance = {};
    }

    param.inheritance[version] = {
      source: sourceVersion,
      percentage: Math.min(100, Math.max(0, percentage))
    };

    // Update parameter in form matrix
    newFormMatrix[paramId] = param;

    // Update inheritance graph
    this.formMatrix = newFormMatrix;
    this.inheritanceGraph = this.buildInheritanceGraph();

    return newFormMatrix;
  }
}

export default MatrixInheritanceManager;