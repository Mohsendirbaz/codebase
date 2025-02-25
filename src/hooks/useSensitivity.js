import { useState, useCallback } from 'react';
import { configService } from '../services';

/**
 * @typedef {Object} SensitivityParam
 * @property {string} mode - The sensitivity mode (e.g., 'symmetrical')
 * @property {Array} values - The sensitivity values
 * @property {boolean} enabled - Whether the parameter is enabled
 * @property {string} compareToKey - The key to compare against
 * @property {string} comparisonType - The type of comparison
 * @property {boolean} waterfall - Whether waterfall chart is enabled
 * @property {boolean} bar - Whether bar chart is enabled
 * @property {boolean} point - Whether point chart is enabled
 */

/**
 * @typedef {Object.<string, SensitivityParam>} SensitivityParams
 */

/**
 * Custom hook for managing sensitivity parameters
 * @returns {Object} Sensitivity state and handlers
 */
const useSensitivity = () => {
    // Initialize sensitivity parameters
    const [S, setS] = useState(() => configService.initializeSensitivityParams());

    /**
     * Enable a sensitivity parameter
     * @param {string} key - The parameter key to enable
     * @param {Object} options - Configuration options
     * @param {string} [options.mode='symmetrical'] - The sensitivity mode
     * @param {string} [options.compareToKey=''] - The key to compare against
     * @param {string} [options.comparisonType='primary'] - The type of comparison
     */
    const enableParameter = useCallback((key, {
        mode = 'symmetrical',
        compareToKey = '',
        comparisonType = 'primary'
    } = {}) => {
        setS(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                mode,
                enabled: true,
                compareToKey,
                comparisonType,
                waterfall: true,
                bar: true,
                point: true,
            }
        }));
    }, []);

    /**
     * Disable a sensitivity parameter
     * @param {string} key - The parameter key to disable
     */
    const disableParameter = useCallback((key) => {
        setS(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                enabled: false,
                waterfall: false,
                bar: false,
                point: false,
            }
        }));
    }, []);

    /**
     * Toggle a chart type for a parameter
     * @param {string} key - The parameter key
     * @param {string} chartType - The chart type to toggle ('waterfall', 'bar', or 'point')
     */
    const toggleChart = useCallback((key, chartType) => {
        setS(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [chartType]: !prev[key][chartType],
            }
        }));
    }, []);

    /**
     * Update sensitivity values for a parameter
     * @param {string} key - The parameter key
     * @param {Array} values - The new values
     */
    const updateValues = useCallback((key, values) => {
        setS(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                values,
            }
        }));
    }, []);

    /**
     * Get sensitivity key for a subtab
     * @param {string} activeSubTab - The active subtab
     * @returns {string} The sensitivity key
     */
    const getSensitivityKey = useCallback((activeSubTab) => {
        return configService.getSensitivityKey(activeSubTab);
    }, []);

    /**
     * Enable sensitivity for a subtab
     * @param {string} activeSubTab - The active subtab
     */
    const enableSensitivityForSubtab = useCallback((activeSubTab) => {
        const sKey = getSensitivityKey(activeSubTab);
        enableParameter(sKey);
    }, [getSensitivityKey, enableParameter]);

    /**
     * Reset all sensitivity parameters
     */
    const resetSensitivity = useCallback(() => {
        setS(configService.initializeSensitivityParams());
    }, []);

    return {
        S,
        setS,
        enableParameter,
        disableParameter,
        toggleChart,
        updateValues,
        getSensitivityKey,
        enableSensitivityForSubtab,
        resetSensitivity,
    };
};

export default useSensitivity;
