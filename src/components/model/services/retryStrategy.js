/**
 * @typedef {Object} RetryStrategy
 * @property {function(function(): Promise<*>, number): Promise<*>} execute - Execute an operation with retry logic
 */

/**
 * Linear retry strategy with constant backoff between attempts
 */
export class LinearRetryStrategy {
  constructor() {
    /** @private */
    this.baseDelay = 1000; // 1 second base delay
  }

  /**
   * Execute an operation with linear retry backoff
   * @template T
   * @param {function(): Promise<T>} operation - Operation to execute
   * @param {number} maxAttempts - Maximum number of retry attempts
   * @returns {Promise<T>} Result of the operation
   * @throws {Error} If operation fails after all attempts
   */
  async execute(operation, maxAttempts) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't wait on the last attempt
        if (attempt < maxAttempts) {
          // Linear backoff: wait longer for each retry
          const delay = this.baseDelay * attempt;
          await this.wait(delay);
          
          console.log(`Retry attempt ${attempt} of ${maxAttempts} after ${delay}ms`);
        }
      }
    }

    throw new Error(
      `Operation failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Wait for specified milliseconds
   * @private
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Exponential retry strategy with increasing backoff between attempts
 */
export class ExponentialRetryStrategy {
  constructor() {
    /** @private */
    this.baseDelay = 1000; // 1 second base delay
    /** @private */
    this.maxDelay = 30000; // 30 seconds maximum delay
  }

  /**
   * Execute an operation with exponential retry backoff
   * @template T
   * @param {function(): Promise<T>} operation - Operation to execute
   * @param {number} maxAttempts - Maximum number of retry attempts
   * @returns {Promise<T>} Result of the operation
   * @throws {Error} If operation fails after all attempts
   */
  async execute(operation, maxAttempts) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't wait on the last attempt
        if (attempt < maxAttempts) {
          // Exponential backoff with jitter
          const exponentialDelay = Math.min(
            this.maxDelay,
            this.baseDelay * Math.pow(2, attempt - 1)
          );
          
          // Add random jitter (±20% of delay)
          const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
          const delay = Math.floor(exponentialDelay + jitter);
          
          await this.wait(delay);
          
          console.log(`Retry attempt ${attempt} of ${maxAttempts} after ${delay}ms`);
        }
      }
    }

    throw new Error(
      `Operation failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Wait for specified milliseconds
   * @private
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom retry strategy with configurable delay and retry conditions
 */
export class CustomRetryStrategy {
  /**
   * @param {function(number): number} delayFn - Function to calculate delay based on attempt number
   * @param {function(Error): boolean} [shouldRetry] - Function to determine if an error should trigger retry
   */
  constructor(delayFn, shouldRetry = () => true) {
    this.delayFn = delayFn;
    this.shouldRetry = shouldRetry;
  }

  /**
   * Execute an operation with custom retry logic
   * @template T
   * @param {function(): Promise<T>} operation - Operation to execute
   * @param {number} maxAttempts - Maximum number of retry attempts
   * @returns {Promise<T>} Result of the operation
   * @throws {Error} If operation fails after all attempts or shouldn't be retried
   */
  async execute(operation, maxAttempts) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (!this.shouldRetry(lastError)) {
          throw lastError;
        }
        
        // Don't wait on the last attempt
        if (attempt < maxAttempts) {
          const delay = this.delayFn(attempt);
          await this.wait(delay);
          
          console.log(`Retry attempt ${attempt} of ${maxAttempts} after ${delay}ms`);
        }
      }
    }

    throw new Error(
      `Operation failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Wait for specified milliseconds
   * @private
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example usage of CustomRetryStrategy:
/*
const customStrategy = new CustomRetryStrategy(
  // Custom delay function (fibonacci backoff)
  (attempt) => {
    const fibonacci = (n) => {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    };
    return fibonacci(attempt) * 1000;
  },
  // Custom retry condition
  (error) => {
    return error instanceof NetworkError || error.message.includes('timeout');
  }
);
*/
