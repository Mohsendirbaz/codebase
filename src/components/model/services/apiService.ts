import { RetryStrategy, LinearRetryStrategy } from './retryStrategy';

export interface ApiConfig {
  retryAttempts?: number;
  timeout?: number;
  errorCallback?: (error: Error) => void;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class EnhancedApiService {
  private static instance: EnhancedApiService;
  private retryStrategy: RetryStrategy;
  private websocketConnection: WebSocket | null = null;
  private readonly baseUrl: string = 'http://localhost:5000';
  private readonly wsUrl: string = 'ws://localhost:5000/realtime';

  private constructor() {
    this.retryStrategy = new LinearRetryStrategy();
    this.initializeWebSocket();
  }

  static getInstance(): EnhancedApiService {
    if (!EnhancedApiService.instance) {
      EnhancedApiService.instance = new EnhancedApiService();
    }
    return EnhancedApiService.instance;
  }

  private initializeWebSocket() {
    try {
      this.websocketConnection = new WebSocket(this.wsUrl);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error('WebSocket initialization failed:', error);
    }
  }

  private setupWebSocketHandlers() {
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

  private reconnectWebSocket() {
    setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.initializeWebSocket();
    }, 5000);
  }

  private handleWebSocketMessage(data: any) {
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

  private emit(event: string, data: any) {
    const customEvent = new CustomEvent(event, { detail: data });
    window.dispatchEvent(customEvent);
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    config: ApiConfig = {}
  ): Promise<ApiResponse<T>> {
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
        errorCallback(error as Error);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Sensitivity Analysis API Methods
  async runSensitivityAnalysis(parameters: any[]) {
    return this.request('/sensitivity/analyze', {
      method: 'POST',
      body: JSON.stringify({ parameters }),
    });
  }

  async runMonteCarloSimulation(parameters: any[], iterations: number) {
    return this.request('/sensitivity/monte-carlo', {
      method: 'POST',
      body: JSON.stringify({ parameters, iterations }),
    });
  }

  async getDerivatives(parameter: string, version: string, extension?: string) {
    const queryParams = new URLSearchParams({
      version,
      ...(extension && { extension }),
    });
    return this.request(`/sensitivity/derivatives/${parameter}?${queryParams}`);
  }

  // Price Analysis API Methods
  async getPriceData(version: string, extension?: string) {
    const queryParams = new URLSearchParams({
      version,
      ...(extension && { extension }),
    });
    return this.request(`/price/data?${queryParams}`);
  }

  async comparePrices(baseVersion: string, variants: any[]) {
    return this.request('/price/comparison', {
      method: 'POST',
      body: JSON.stringify({
        baseVersion,
        variants,
      }),
    });
  }

  async calculatePriceImpact(basePrice: number, parameters: any[]) {
    return this.request('/price/impact', {
      method: 'POST',
      body: JSON.stringify({
        basePrice,
        parameters,
      }),
    });
  }

  // Efficacy API Methods
  async calculateEfficacy(sensitivityData: any, priceData: any) {
    return this.request('/sensitivity/efficacy', {
      method: 'POST',
      body: JSON.stringify({
        sensitivityData,
        priceData,
      }),
    });
  }
}

export const apiService = EnhancedApiService.getInstance();
