import { useState, useEffect } from 'react';

/**
 * @typedef {Object} LoadingStates
 * @property {boolean} html - HTML content loading state
 * @property {boolean} csv - CSV content loading state
 * @property {boolean} plots - Plots content loading state
 */

/**
 * @typedef {Object} ContentLoadingState
 * @property {boolean} csv - CSV content loading state
 * @property {boolean} html - HTML content loading state
 * @property {boolean} plots - Plots content loading state
 * @property {Object.<string, boolean>} iframes - Iframe loading states
 * @property {Object.<string, boolean>} images - Image loading states
 * @property {Object.<string, boolean>} content - General content loading states
 */

/**
 * Custom hook for managing content loading states
 * @param {Object} options - Hook options
 * @param {string} activeTab - The currently active tab
 * @returns {Object} Loading states and handlers
 */
const useContentLoading = ({ activeTab }) => {
    // Basic loading states
    const [loadingStates, setLoadingStates] = useState({
        html: false,
        csv: false,
        plots: false,
    });

    // Detailed content states
    const [contentLoaded, setContentLoaded] = useState({});
    const [iframesLoaded, setIframesLoaded] = useState({});
    const [imagesLoaded, setImagesLoaded] = useState({});

    // Combined content loading state
    const [contentLoadingState, setContentLoadingState] = useState({
        csv: false,
        html: false,
        plots: false,
        iframes: {},
        images: {},
        content: {},
    });

    // Effect for tab transitions
    useEffect(() => {
        setContentLoadingState((prev) => ({
            ...prev,
            csv: activeTab === 'Case1',
            html: activeTab === 'Case2',
            plots: activeTab === 'Case3',
            iframes: {},
            images: {},
            content: {},
        }));
    }, [activeTab]);

    // Effect for content loading
    useEffect(() => {
        if (contentLoadingState.csv || contentLoadingState.html || contentLoadingState.plots) {
            const timer = setTimeout(() => {
                setContentLoadingState((prev) => ({
                    ...prev,
                    content: { ...prev.content, [activeTab]: true },
                }));
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [contentLoadingState.csv, contentLoadingState.html, contentLoadingState.plots, activeTab]);

    /**
     * Handle iframe load event
     * @param {number} index - The index of the loaded iframe
     */
    const handleIframeLoad = (index) => {
        setIframesLoaded((prev) => ({ ...prev, [index]: true }));
    };

    /**
     * Handle image load event
     * @param {number} index - The index of the loaded image
     */
    const handleImageLoad = (index) => {
        setImagesLoaded((prev) => ({ ...prev, [index]: true }));
    };

    /**
     * Reset loading states
     */
    const resetLoadingStates = () => {
        setLoadingStates({
            html: false,
            csv: false,
            plots: false,
        });
        setContentLoaded({});
        setIframesLoaded({});
        setImagesLoaded({});
        setContentLoadingState({
            csv: false,
            html: false,
            plots: false,
            iframes: {},
            images: {},
            content: {},
        });
    };

    return {
        loadingStates,
        setLoadingStates,
        contentLoaded,
        setContentLoaded,
        iframesLoaded,
        setIframesLoaded,
        imagesLoaded,
        setImagesLoaded,
        contentLoadingState,
        setContentLoadingState,
        handleIframeLoad,
        handleImageLoad,
        resetLoadingStates,
    };
};

export default useContentLoading;
