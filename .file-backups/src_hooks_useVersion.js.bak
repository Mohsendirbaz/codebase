import { useState, useCallback, useEffect } from 'react';
import { batchService, contentService, ERROR_MESSAGES } from '../services';

/**
 * Custom hook for managing version state and related operations
 * @param {Object} options - Hook options
 * @param {string} [options.initialVersion='1'] - Initial version value
 * @returns {Object} Version state and handlers
 */
const useVersion = ({ initialVersion = '1' } = {}) => {
    const [version, setVersion] = useState(initialVersion);
    const [batchRunning, setBatchRunning] = useState(false);
    const [csvFiles, setCsvFiles] = useState([]);
    const [albumHtmls, setAlbumHtmls] = useState({});
    const [albumImages, setAlbumImages] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState(null);

    /**
     * Handle version change
     * @param {Object} event - The change event
     */
    const handleVersionChange = useCallback((event) => {
        setVersion(event.target.value);
    }, []);

    /**
     * Create a new batch
     */
    const createNewBatch = useCallback(async () => {
        setBatchRunning(true);
        setError(null);
        try {
            const result = await batchService.createNewBatch();
            console.log(result.message);
            console.log('New Batch Number:', result.NewBatchNumber);
            setVersion(result.NewBatchNumber);
            setLastSuccessfulFetch(Date.now());
        } catch (error) {
            console.error('Batch creation failed', error);
            setError(error.message || ERROR_MESSAGES.BATCH_ERROR);
            // Provide fallback behavior
            const nextVersion = String(Number(version) + 1);
            setVersion(nextVersion);
        } finally {
            setBatchRunning(false);
        }
    }, [version]);

    /**
     * Remove the current batch
     */
    const removeBatch = useCallback(async () => {
        setError(null);
        try {
            const result = await batchService.removeBatch(version);
            setVersion(result.max_version);
            setLastSuccessfulFetch(Date.now());
        } catch (error) {
            console.error('Error during batch removal:', error);
            setError(error.message || ERROR_MESSAGES.BATCH_ERROR);
            // Provide fallback behavior
            const prevVersion = String(Math.max(1, Number(version) - 1));
            setVersion(prevVersion);
        }
    }, [version]);

    /**
     * Refresh the current version
     */
    const handleRefresh = useCallback(() => {
        setVersion('0');
        setTimeout(() => {
            setVersion(version);
        }, 1);
    }, [version]);

    /**
     * Retry fetching content
     */
    const retryFetch = useCallback(() => {
        if (retryCount >= 3) {
            setError(ERROR_MESSAGES.BACKEND_UNAVAILABLE);
            return;
        }
        setRetryCount(count => count + 1);
        setError(null);
        setIsLoading(true);
    }, [retryCount]);

    // Fetch content when version changes or retry is triggered
    useEffect(() => {
        let isMounted = true;

        const fetchContent = async () => {
            // Don't fetch if we've exceeded retry limit
            if (retryCount >= 3) {
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Fetch CSV files
                const csvData = await contentService.fetchCsvFiles(version);
                if (isMounted) {
                    setCsvFiles(csvData || []);
                }

                // Fetch HTML files
                const htmlData = await contentService.fetchHtmlFiles(version);
                if (isMounted) {
                    setAlbumHtmls(htmlData || {});
                }

                // Fetch images
                const imageData = await contentService.fetchImages(version);
                if (isMounted) {
                    setAlbumImages(imageData || {});
                }

                // Reset retry count and update last successful fetch
                if (isMounted) {
                    setRetryCount(0);
                    setLastSuccessfulFetch(Date.now());
                    setError(null);
                }
            } catch (error) {
                console.error('Error fetching content:', error);
                if (isMounted) {
                    setError(error.message);
                    
                    // Provide fallback data
                    setCsvFiles([]);
                    setAlbumHtmls({});
                    setAlbumImages({});

                    // If this was our last retry, show the final error message
                    if (retryCount >= 2) {
                        setError(ERROR_MESSAGES.BACKEND_UNAVAILABLE);
                    }
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        // Only fetch if we haven't fetched recently (debounce)
        const now = Date.now();
        if (!lastSuccessfulFetch || now - lastSuccessfulFetch > 1000) {
            fetchContent();
        }

        return () => {
            isMounted = false;
        };
    }, [version, retryCount, lastSuccessfulFetch]);

    return {
        version,
        setVersion,
        batchRunning,
        csvFiles,
        albumHtmls,
        albumImages,
        error,
        isLoading,
        retryCount,
        handleVersionChange,
        createNewBatch,
        removeBatch,
        handleRefresh,
        retryFetch,
    };
};

export default useVersion;
