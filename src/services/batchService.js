/**
 * Service functions for batch operations
 */

/**
 * Create a new batch
 * @returns {Promise<{message: string, NewBatchNumber: string}>} The result of batch creation
 */
export const createNewBatch = async () => {
    try {
        const response = await fetch('http://127.0.0.1:8001/create_new_batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Batch creation failed', error);
        throw error;
    }
};

/**
 * Remove a batch
 * @param {string} version - The version/batch number to remove
 * @returns {Promise<{max_version: string}>} The maximum remaining version
 */
export const removeBatch = async (version) => {
    try {
        const response = await fetch('http://127.0.0.1:7001/Remove_batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ version }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error during batch removal:', error);
        throw error;
    }
};

/**
 * Check and create uploads
 * @returns {Promise<{message: string}>} The result of the operation
 */
export const checkAndCreateUploads = async () => {
    try {
        const response = await fetch('http://127.0.0.1:8007/check_and_create_uploads', {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Analysis failed', error);
        throw error;
    }
};

/**
 * Run analysis
 * @param {Object} params - The parameters for running analysis
 * @param {Array} params.selectedVersions - The versions to analyze
 * @param {Object} params.selectedV - The selected V parameters
 * @param {Object} params.selectedF - The selected F parameters
 * @param {string} params.selectedCalculationOption - The calculation option
 * @param {string} params.targetRow - The target row
 * @param {Object} params.SenParameters - The sensitivity parameters
 * @returns {Promise<{message: string}>} The result of the analysis
 */
export const runAnalysis = async ({
    selectedVersions,
    selectedV,
    selectedF,
    selectedCalculationOption,
    targetRow,
    SenParameters,
}) => {
    try {
        const response = await fetch('http://127.0.0.1:5007/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selectedVersions,
                selectedV,
                selectedF,
                selectedCalculationOption,
                targetRow,
                SenParameters,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error during analysis:', error);
        throw error;
    }
};

/**
 * Stream price for a version
 * @param {string} version - The version to stream price for
 * @param {function} onPrice - Callback for price updates
 * @param {function} onComplete - Callback for stream completion
 * @param {function} onError - Callback for stream errors
 * @returns {EventSource} The event source for price streaming
 */
export const streamPrice = (version, onPrice, onComplete, onError) => {
    const eventSource = new EventSource(`http://127.0.0.1:5007/stream_price/${version}`);

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`Streamed Price for version ${version}:`, data.price);
        onPrice(version, data.price);

        if (data.complete) {
            console.log(`Completed streaming for version ${version}`);
            eventSource.close();
            onComplete(version);
        }
    };

    eventSource.onerror = (error) => {
        console.error(`Error in SSE stream for version ${version}:`, error);
        eventSource.close();
        onError(version, error);
    };

    return eventSource;
};

/**
 * Submit a complete set of parameters
 * @param {string} version - The version to submit for
 * @param {Array} formItems - The form items to submit
 * @returns {Promise<string>} The result of the submission
 */
export const submitCompleteSet = async (version, formItems) => {
    try {
        const response = await fetch(`http://127.0.0.1:3052/append/${version}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filteredValues: formItems }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.text();
    } catch (error) {
        console.error('Error during parameter submission:', error);
        throw error;
    }
};
