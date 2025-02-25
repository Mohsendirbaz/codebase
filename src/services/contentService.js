/**
 * Service functions for fetching content (HTML, CSV, Images)
 */

/**
 * Fetch HTML files for a given version
 * @param {string} version - The version to fetch HTML files for
 * @returns {Promise<Object>} The grouped HTML files by album
 */
export const fetchHtmlFiles = async (version) => {
    try {
        const response = await fetch(`http://localhost:8009/api/album_html/${version}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Group HTML files by album
        return data.reduce((acc, html) => {
            const { album } = html;
            if (!acc[album]) {
                acc[album] = [];
            }
            acc[album].push(html);
            return acc;
        }, {});
    } catch (error) {
        console.error('Error fetching HTML files:', error);
        throw error;
    }
};

/**
 * Fetch images for a given version
 * @param {string} version - The version to fetch images for
 * @returns {Promise<Object>} The grouped images by album
 */
export const fetchImages = async (version) => {
    try {
        const response = await fetch(`http://localhost:8008/api/album/${version}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Group images by album
        return data.reduce((acc, image) => {
            const { album } = image;
            if (!acc[album]) {
                acc[album] = [];
            }
            acc[album].push(image);
            return acc;
        }, {});
    } catch (error) {
        console.error('Error fetching images:', error);
        throw error;
    }
};

/**
 * Fetch CSV files for a given version
 * @param {string} version - The version to fetch CSV files for
 * @returns {Promise<Array>} The CSV files data
 */
export const fetchCsvFiles = async (version) => {
    try {
        const response = await fetch(`http://localhost:8007/api/csv-files/${version}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching CSV files:', error);
        throw error;
    }
};

/**
 * Generate PNG plots
 * @param {Object} params - The parameters for generating plots
 * @param {Array} params.selectedVersions - The versions to generate plots for
 * @param {Array} params.selectedProperties - The properties to include
 * @param {string} params.remarks - Whether to include remarks
 * @param {string} params.customizedFeatures - Whether to include customized features
 * @returns {Promise<void>}
 */
export const generatePngPlots = async ({ selectedVersions, selectedProperties, remarks, customizedFeatures }) => {
    try {
        const response = await fetch('http://127.0.0.1:5008/generate_png_plots', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selectedVersions,
                selectedProperties: selectedProperties || [], // Ensure array even if empty
                remarks,
                customizedFeatures,
                S: {} // Empty sensitivity params for now
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Wait a bit for plots to be generated
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error('Error during PNG generation:', error);
        throw error;
    }
};

/**
 * Run sub-analysis
 * @param {Object} params - The parameters for running sub-analysis
 * @param {Array} params.selectedVersions - The versions to analyze
 * @param {Array} params.selectedProperties - The properties to include
 * @param {string} params.remarks - Whether to include remarks
 * @param {string} params.customizedFeatures - Whether to include customized features
 * @param {Object} params.selectedV - The selected V parameters
 * @returns {Promise<void>}
 */
export const runSub = async ({ selectedVersions, selectedProperties, remarks, customizedFeatures, selectedV }) => {
    try {
        const response = await fetch('http://127.0.0.1:5009/runSub', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selectedVersions,
                selectedProperties,
                remarks,
                customizedFeatures,
                selectedV,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error during analysis:', error);
        throw error;
    }
};
