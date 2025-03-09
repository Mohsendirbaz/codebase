import { LinearRetryStrategy } from './retryStrategy';

/**
 * @typedef {Object} ApiConfig
 * @property {number} [retryAttempts] - Number of retry attempts
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {function(Error): void} [errorCallback] - Error callback function
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {T} data - Response data
 * @property {number} status - HTTP status code
 * @property {Headers} headers - Response headers
 */

/**
 * Custom API error class
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} [status] - HTTP status code
   * @param {*} [response] - Error response data
   */
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

/**
 * Enhanced API service with retry and WebSocket support
 */
export class EnhancedApiService {
  static instance;
  
  constructor() {
    /** @private */
    this.retryStrategy = new LinearRetryStrategy();
    /** @private */
    this.websocketConnection = null;
    /** @private */
    this.baseUrl = 'http://localhost:5000';
    /** @private */
    this.wsUrl = 'ws://localhost:5000/realtime';

    this.initializeWebSocket();
  }

  /**
   * Get singleton instance
   * @returns {EnhancedApiService}
   */
  static getInstance() {
    if (!EnhancedApiService.instance) {
      EnhancedApiService.instance = new EnhancedApiService();
    }
    return EnhancedApiService.instance;
  }

  /**
   * Initialize WebSocket connection
   * @private
   */
  initializeWebSocket() {
    try {
      this.websocketConnection = new WebSocket(this.wsUrl);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error('WebSocket initialization failed:', error);
    }
  }

  /**
   * Setup WebSocket event handlers
   * @private
   */
  setupWebSocketHandlers() {
    if (!this.websocketConnection) return;

    this.websocketConnection.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.websocketConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    this.websocketConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.reconnectWebSocket();
    };

    this.websocketConnection.onclose = () => {
      console.log('WebSocket connection closed');
      this.reconnectWebSocket();
    };
  }

  /**
   * Attempt to reconnect WebSocket
   * @private
   */
  reconnectWebSocket() {
    setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.initializeWebSocket();
    }, 5000);
  }

  /**
   * Handle incoming WebSocket messages
   * @private
   * @param {*} data - Message data
   */
  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'analysis_progress':
        this.emit('analysisProgress', data.progress);
        break;
      case 'calculation_complete':
        this.emit('calculationComplete', data.results);
        break;
      case 'error':
        this.emit('error', new ApiError(data.message));
        break;
    }
  }

  /**
   * Emit custom event
   * @private
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    window.dispatchEvent(customEvent);
  }

  /**
   * Make API request with retry support
   * @template T
   * @param {string} endpoint - API endpoint
   * @param {RequestInit} [options] - Fetch options
   * @param {ApiConfig} [config] - API configuration
   * @returns {Promise<ApiResponse<T>>}
   */
  async request(endpoint, options = {}, config = {}) {
    const { retryAttempts = 3, timeout = 30000, errorCallback } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await this.retryStrategy.execute(
        async () => {
          const fetchResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });

          if (!fetchResponse.ok) {
            throw new ApiError(
              `API request failed: ${fetchResponse.statusText}`,
              fetchResponse.status,
              await fetchResponse.json()
            );
          }

          const data = await fetchResponse.json();
          return {
            data,
            status: fetchResponse.status,
            headers: fetchResponse.headers,
          };
        },
        retryAttempts
      );

      return response;
    } catch (error) {
      if (errorCallback) {
        errorCallback(error);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Run sensitivity analysis
   * @param {Array} parameters - Analysis parameters
   * @returns {Promise<ApiResponse<*>>}
   */
  async runSensitivityAnalysis(parameters) {
    return this.request('/sensitivity/analyze', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
    });
  }

  /**
   * Run Monte Carlo simulation
   * @param {Array} parameters - Simulation parameters
   * @param {number} iterations - Number of iterations
   * @returns {Promise<ApiResponse<*>>}
   */
  async runMonteCarloSimulation(parameters, iterations) {
    return this.request('/sensitivity/monte-carlo', {
      method: 'POST',
      body: JSON.stringify({ parameters, iterations }),
    });
  }

  /**
   * Get derivatives data
   * @param {string} parameter - Parameter name
   * @param {string} version - Version identifier
   * @param {string} [extension] - Optional extension
   * @returns {Promise<ApiResponse<*>>}
   */
  async getDerivatives(parameter, version, extension) {
    const queryParams = new URLSearchParams({
      version,
      ...(extension && { extension }),
    });
    return this.request(`/sensitivity/derivatives/${parameter}?${queryParams}`);
  }

  /**
   * Get price data
   * @param {string} version - Version identifier
   * @param {string} [extension] - Optional extension
   * @returns {Promise<ApiResponse<*>>}
   */
  async getPriceData(version, extension) {
    const queryParams = new URLSearchParams({
      version,
      ...(extension && { extension }),
    });
    return this.request(`/price/data?${queryParams}`);
  }

  /**
   * Compare prices
   * @param {string} baseVersion - Base version for comparison
   * @param {Array} variants - Price variants to compare
   * @returns {Promise<ApiResponse<*>>}
   */
  async comparePrices(baseVersion, variants) {
    return this.request('/price/comparison', {
      method: 'POST',
      body: JSON.stringify({
        baseVersion,
        variants,
      }),
    });
  }

  /**
   * Calculate price impact
   * @param {number} basePrice - Base price
   * @param {Array} parameters - Impact parameters
   * @returns {Promise<ApiResponse<*>>}
   */
  async calculatePriceImpact(basePrice, parameters) {
    return this.request('/price/impact', {
      method: 'POST',
      body: JSON.stringify({
        basePrice,
        parameters,
      }),
    });
  }

  /**
   * Calculate efficacy
   * @param {*} sensitivityData - Sensitivity analysis data
   * @param {*} priceData - Price data
   * @returns {Promise<ApiResponse<*>>}
   */
  async calculateEfficacy(sensitivityData, priceData) {
    return this.request('/sensitivity/efficacy', {
      method: 'POST',
      body: JSON.stringify({
        sensitivityData,
        priceData,
      }),
    });
  }
}

/**
 * Fetch price data for a specific version
 * @param {string} version - Version identifier
 * @param {string} [extension] - Optional extension
 * @returns {Promise<Object>} Price data
 */
export const fetchPriceData = async (version, extension) => {
  const service = EnhancedApiService.getInstance();
  const response = await service.getPriceData(version, extension);
  return response.data;
};

/**
 * Fetch sensitivity data for a model configuration
 * @param {Object} modelConfig - Model configuration
 * @returns {Promise<Object>} Sensitivity data
 */
export const fetchSensitivityData = async (modelConfig) => {
  const service = EnhancedApiService.getInstance();
  const response = await service.runSensitivityAnalysis([
    {
      version: modelConfig.version,
      extension: modelConfig.extension,
      filters: modelConfig.filters
    }
  ]);
  return response.data;
};

export const apiService = EnhancedApiService.getInstance();
