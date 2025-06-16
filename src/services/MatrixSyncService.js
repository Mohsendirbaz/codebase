/**
 * @file MatrixSyncService.js
 * @description Matrix Form Value Sync Service
 * @module services/MatrixSyncService
 */

/**
 * Matrix Form Value Sync Service
 * Handles synchronization of matrix form values with external systems
 */
class MatrixSyncService {
  /**
   * Constructor
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3060';
    this.endpoints = {
      sync: config.endpoints?.sync || '/api/sync-matrix',
      load: config.endpoints?.load || '/api/load-matrix',
      updateLabels: config.endpoints?.updateLabels || '/api/update-form-labels',
      submitValues: config.endpoints?.submitValues || '/api/submit-values'
    };
  }

  /**
   * Synchronize matrix state with backend
   * @param {Object} state - Complete matrix state
   * @returns {Promise<Object>} Synchronization result
   */
  async synchronize(state) {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoints.sync}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(state)
      });

      if (!response.ok) {
        throw new Error(`Failed to synchronize state: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error synchronizing matrix state:', error);
      throw error;
    }
  }

  /**
   * Load matrix state from backend
   * @returns {Promise<Object>} Loaded state
   */
  async load() {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoints.load}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to load state: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading matrix state:', error);
      throw error;
    }
  }

  /**
   * Update form labels
   * @param {Object} updatedLabels - Map of parameter IDs to updated labels
   * @returns {Promise<Object>} Update result
   */
  async updateLabels(updatedLabels) {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoints.updateLabels}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ labels: updatedLabels })
      });

      if (!response.ok) {
        throw new Error(`Failed to update labels: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating form labels:', error);
      throw error;
    }
  }

  /**
   * Submit form values to backend
   * @param {Object} values - Form values to submit
   * @param {string} version - Version ID (numeric part)
   * @returns {Promise<Object>} Submission result
   */
  async submitValues(values, version) {
    try {
      // Extract numeric version
      const numericVersion = version.replace(/\D/g, '');

      const response = await fetch(`${this.baseUrl}${this.endpoints.submitValues}/${numericVersion}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error(`Failed to submit values: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting values:', error);
      throw error;
    }
  }
}

export default MatrixSyncService;