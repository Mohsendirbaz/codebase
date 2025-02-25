import { useState, useCallback, useEffect } from 'react';
import { batchService, contentService } from '../services';

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
        try {
            const result = await batchService.createNewBatch();
            console.log(result.message);
            console.log('New Batch Number:', result.NewBatchNumber);
            setVersion(result.NewBatchNumber);
        } catch (error) {
            console.error('Batch creation failed', error);
        } finally {
            setBatchRunning(false);
        }
    }, []);

    /**
     * Remove the current batch
     */
    const removeBatch = useCallback(async () => {
        try {
            const result = await batchService.removeBatch(version);
            setVersion(result.max_version);
        } catch (error) {
            console.error('Error during batch removal:', error);
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

    // Fetch content when version changes
    useEffect(() => {
        const fetchContent = async () => {
            try {
                // Fetch CSV files
                const csvData = await contentService.fetchCsvFiles(version);
                setCsvFiles(csvData);

                // Fetch HTML files
                const htmlData = await contentService.fetchHtmlFiles(version);
                setAlbumHtmls(htmlData);

                // Fetch images
                const imageData = await contentService.fetchImages(version);
                setAlbumImages(imageData);
            } catch (error) {
                console.error('Error fetching content:', error);
            }
        };

        fetchContent();
    }, [version]);

    return {
        version,
        setVersion,
        batchRunning,
        csvFiles,
        albumHtmls,
        albumImages,
        handleVersionChange,
        createNewBatch,
        removeBatch,
        handleRefresh,
    };
};

export default useVersion;
