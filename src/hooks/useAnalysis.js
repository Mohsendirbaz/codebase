import { useState, useCallback } from 'react';
import { contentService, batchService } from '../services';

/**
 * Custom hook for managing analysis operations
 * @param {Object} options - Hook options
 * @param {string} version - Current version
 * @param {Array} selectedVersions - Selected versions for analysis
 * @param {Object} V - V parameters
 * @param {Object} F - F parameters
 * @param {Object} S - Sensitivity parameters
 * @returns {Object} Analysis state and handlers
 */
const useAnalysis = ({ version, selectedVersions, V, F, S }) => {
    const [analysisRunning, setAnalysisRunning] = useState(false);
    const [calculatedPrices, setCalculatedPrices] = useState({});
    const [selectedCalculationOption, setSelectedCalculationOption] = useState('freeFlowNPV');
    const [targetRow, setTargetRow] = useState('20');

    /**
     * Update price for a specific version
     * @param {string} version - The version to update price for
     * @param {number} price - The new price value
     */
    const updatePrice = useCallback((version, price) => {
        setCalculatedPrices((prevPrices) => ({
            ...prevPrices,
            [version]: price,
        }));
    }, []);

    /**
     * Handle calculation option change
     * @param {Object} event - The change event
     */
    const handleOptionChange = useCallback((event) => {
        setSelectedCalculationOption(event.target.value);
    }, []);

    /**
     * Handle target row change
     * @param {Object} event - The change event
     */
    const handleTargetRowChange = useCallback((event) => {
        setTargetRow(event.target.value);
    }, []);

    /**
     * Run the main analysis
     */
    const handleRun = useCallback(async () => {
        setAnalysisRunning(true);
        setCalculatedPrices({}); // Reset prices at start

        try {
            if (selectedCalculationOption === 'calculateForPrice') {
                // Handle price streaming
                selectedVersions.forEach((version) => {
                    const eventSource = batchService.streamPrice(
                        version,
                        updatePrice,
                        (version) => console.log(`Completed streaming for version ${version}`),
                        (version, error) => console.error(`Error in stream for version ${version}:`, error)
                    );
                });
            } else {
                await batchService.runAnalysis({
                    selectedVersions,
                    selectedV: V,
                    selectedF: F,
                    selectedCalculationOption,
                    targetRow,
                    SenParameters: S,
                });
            }
        } catch (error) {
            console.error('Error during analysis:', error);
        } finally {
            setAnalysisRunning(false);
        }
    }, [selectedVersions, V, F, selectedCalculationOption, targetRow, S]);

    /**
     * Generate PNG plots
     * @param {Object} params - Parameters for plot generation
     */
    const handleRunPNG = useCallback(async ({ selectedProperties, remarks, customizedFeatures }) => {
        setAnalysisRunning(true);
        try {
            // Always use current version if no versions selected
            const versions = selectedVersions.length > 0 ? selectedVersions : [version];
            
            // Ensure current version is included
            if (!versions.includes(version)) {
                versions.push(version);
            }

            await contentService.generatePngPlots({
                selectedVersions: versions,
                selectedProperties,
                remarks,
                customizedFeatures,
            });

            // Wait a bit for plots to be generated
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Trigger a refresh of the plots
            const plotsTab = document.querySelector('button.tab-button:nth-child(4)');
            if (plotsTab) {
                plotsTab.click();
            }
        } catch (error) {
            console.error('Error during PNG generation:', error);
        } finally {
            setAnalysisRunning(false);
        }
    }, [version, selectedVersions]);

    /**
     * Run sub-analysis
     * @param {Object} params - Parameters for sub-analysis
     */
    const handleRunSub = useCallback(async ({ selectedProperties, remarks, customizedFeatures }) => {
        setAnalysisRunning(true);
        try {
            await contentService.runSub({
                selectedVersions,
                selectedProperties,
                remarks,
                customizedFeatures,
                selectedV: V,
            });
        } catch (error) {
            console.error('Error during analysis:', error);
        } finally {
            setAnalysisRunning(false);
        }
    }, [selectedVersions, V]);

    return {
        analysisRunning,
        calculatedPrices,
        selectedCalculationOption,
        targetRow,
        updatePrice,
        handleOptionChange,
        handleTargetRowChange,
        handleRun,
        handleRunPNG,
        handleRunSub,
    };
};

export default useAnalysis;
