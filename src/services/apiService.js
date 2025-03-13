export const apiService = {
  async fetchData(url, options = {}) {
    const MAX_RETRIES = 3;
    const TIMEOUT = 5000; // 5 seconds timeout
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format: Expected JSON');
        }

        const text = await response.text();
        if (!text) {
          return null; // Handle empty response
        }

        try {
          return JSON.parse(text);
        } catch (parseError) {
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
      } catch (error) {
        attempt++;
        
        if (error.name === 'AbortError') {
          if (attempt === MAX_RETRIES) {
            throw new Error(`Request timeout after ${TIMEOUT}ms`);
          }
          console.warn(`Request timeout, attempt ${attempt} of ${MAX_RETRIES}`);
          continue;
        }

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          if (attempt === MAX_RETRIES) {
            throw new Error('Network error: Server may be unavailable');
          }
          console.warn(`Network error, attempt ${attempt} of ${MAX_RETRIES}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }

        if (attempt === MAX_RETRIES) {
          console.error('API request failed:', error);
          throw error;
        }
        
        console.warn(`Request failed, attempt ${attempt} of ${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  },

  async postData(url, data, options = {}) {
    const MAX_RETRIES = 3;
    const TIMEOUT = 5000; // 5 seconds timeout
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: JSON.stringify(data),
          ...options,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        return await response.text();
      } catch (error) {
        attempt++;
        
        if (error.name === 'AbortError') {
          if (attempt === MAX_RETRIES) {
            throw new Error(`Request timeout after ${TIMEOUT}ms`);
          }
          console.warn(`Request timeout, attempt ${attempt} of ${MAX_RETRIES}`);
          continue;
        }

        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          if (attempt === MAX_RETRIES) {
            throw new Error('Network error: Server may be unavailable');
          }
          console.warn(`Network error, attempt ${attempt} of ${MAX_RETRIES}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }

        if (attempt === MAX_RETRIES) {
          console.error('API request failed:', error);
          throw error;
        }
        
        console.warn(`Request failed, attempt ${attempt} of ${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  },

  createEventSource(url) {
    return new EventSource(url);
  },

  handleStreamError(error, eventSource) {
    console.error('Stream error:', error);
    if (eventSource) {
      eventSource.close();
    }
  },

  endpoints: {
    run: 'http://127.0.0.1:5007/run',
    streamPrice: (version) => `http://127.0.0.1:5007/stream_price/${version}`,
    generatePngPlots: 'http://127.0.0.1:5008/generate_png_plots',
    runSub: 'http://127.0.0.1:5009/runSub',
    createNewBatch: 'http://127.0.0.1:8001/create_new_batch',
    removeBatch: 'http://127.0.0.1:7001/Remove_batch',
    checkUploads: 'http://127.0.0.1:8007/check_and_create_uploads',
    loadConfiguration: 'http://localhost:5000/load_configuration',
    submitCompleteSet: (version) => `http://127.0.0.1:3052/append/${version}`,
    csvFiles: (version) => `http://localhost:8007/api/csv-files/${version}`,
    albumHtml: (version) => `http://localhost:8009/api/album_html/${version}`,
    albumImages: (version) => `http://localhost:8008/api/album/${version}`,
    images: {
      base: 'http://localhost:5008/images',
      batch: (version) => `Batch(${version})`,
      results: (version) => `Results(${version})`,
    },
    original: {
      base: 'http://localhost:3000/Original',
      batch: (version) => `Batch(${version})`,
      results: (version) => `Results(${version})`,
    }
  }
};

export default apiService;
