export interface RetryStrategy {
  execute<T>(operation: () => Promise<T>, maxAttempts: number): Promise<T>;
}

export class LinearRetryStrategy implements RetryStrategy {
  private readonly baseDelay: number = 1000; // 1 second base delay

  async execute<T>(operation: () => Promise<T>, maxAttempts: number): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
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

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class ExponentialRetryStrategy implements RetryStrategy {
  private readonly baseDelay: number = 1000; // 1 second base delay
  private readonly maxDelay: number = 30000; // 30 seconds maximum delay

  async execute<T>(operation: () => Promise<T>, maxAttempts: number): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
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

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class CustomRetryStrategy implements RetryStrategy {
  constructor(
    private readonly delayFn: (attempt: number) => number,
    private readonly shouldRetry: (error: Error) => boolean = () => true
  ) {}

  async execute<T>(operation: () => Promise<T>, maxAttempts: number): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
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

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example usage of CustomRetryStrategy:
/*
const customStrategy = new CustomRetryStrategy(
  // Custom delay function (fibonacci backoff)
  (attempt) => {
    const fibonacci = (n: number): number => {
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
