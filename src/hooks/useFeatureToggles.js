import { useState, useCallback } from 'react';

/**
 * @typedef {Object} FeatureState
 * @property {string} remarks - Remarks toggle state ('on' or 'off')
 * @property {string} customizedFeatures - Customized features toggle state ('on' or 'off')
 * @property {Object} F - F parameters toggle state
 * @property {Object} V - V parameters toggle state
 */

/**
 * Custom hook for managing feature toggles
 * @param {Object} options - Hook options
 * @param {Object} [options.initialF={ F1: 'on', F2: 'on', F3: 'on', F4: 'on', F5: 'on' }] - Initial F parameters
 * @param {Object} [options.initialV] - Initial V parameters
 * @returns {Object} Feature toggle state and handlers
 */
const useFeatureToggles = ({ 
    initialF = { F1: 'on', F2: 'on', F3: 'on', F4: 'on', F5: 'on' },
    initialV = {
        V1: 'on',
        V2: 'off',
        V3: 'off',
        V4: 'off',
        V5: 'off',
        V6: 'off',
        V7: 'off',
        V8: 'off',
        V9: 'off',
        V10: 'off',
    }
} = {}) => {
    // Feature toggle states
    const [remarks, setRemarks] = useState('off');
    const [customizedFeatures, setCustomizedFeatures] = useState('off');
    const [F, setF] = useState(initialF);
    const [V, setV] = useState(initialV);

    /**
     * Toggle remarks feature
     */
    const toggleRemarks = useCallback(() => {
        setRemarks((prevState) => (prevState === 'off' ? 'on' : 'off'));
    }, []);

    /**
     * Toggle customized features
     */
    const toggleCustomizedFeatures = useCallback(() => {
        setCustomizedFeatures((prevState) => (prevState === 'off' ? 'on' : 'off'));
    }, []);

    /**
     * Toggle F parameter
     * @param {string} key - The F parameter key to toggle
     */
    const toggleF = useCallback((key) => {
        setF((prev) => ({
            ...prev,
            [key]: prev[key] === 'off' ? 'on' : 'off',
        }));
    }, []);

    /**
     * Toggle V parameter
     * @param {string} key - The V parameter key to toggle
     */
    const toggleV = useCallback((key) => {
        setV((prev) => ({
            ...prev,
            [key]: prev[key] === 'off' ? 'on' : 'off',
        }));
    }, []);

    /**
     * Reset all feature toggles to their initial state
     */
    const resetFeatures = useCallback(() => {
        setRemarks('off');
        setCustomizedFeatures('off');
        setF(initialF);
        setV(initialV);
    }, [initialF, initialV]);

    /**
     * Check if a feature is enabled
     * @param {string} feature - The feature to check
     * @returns {boolean} Whether the feature is enabled
     */
    const isFeatureEnabled = useCallback((feature) => {
        if (feature.startsWith('F')) {
            return F[feature] === 'on';
        }
        if (feature.startsWith('V')) {
            return V[feature] === 'on';
        }
        if (feature === 'remarks') {
            return remarks === 'on';
        }
        if (feature === 'customizedFeatures') {
            return customizedFeatures === 'on';
        }
        return false;
    }, [F, V, remarks, customizedFeatures]);

    return {
        remarks,
        customizedFeatures,
        F,
        V,
        toggleRemarks,
        toggleCustomizedFeatures,
        toggleF,
        toggleV,
        resetFeatures,
        isFeatureEnabled,
    };
};

export default useFeatureToggles;
