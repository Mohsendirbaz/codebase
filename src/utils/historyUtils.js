/**
 * Add an entry to the history stack
 * 
 * @param {Array} history - Current history stack
 * @param {number} historyIndex - Current index in the history stack
 * @param {Array} newGroups - New scaling groups to add to history
 * @param {Array} historyEntries - Detailed history entries
 * @param {Set} protectedTabs - Set of protected tab IDs
 * @param {Array} tabConfigs - Tab configurations
 * @param {string} action - Action description
 * @param {string} description - Detailed description
 * @param {Object} payload - Additional data related to the action
 * @returns {Object} - Updated history state
 */
export const addToHistory = (
    history,
    historyIndex,
    newGroups,
    historyEntries,
    protectedTabs,
    tabConfigs,
    action,
    description,
    payload = {}
) => {
    // Create a history entry with detailed metadata
    const historyEntry = {
        id: `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        action: action,
        description: description,
        payload: payload,
        snapshots: {
            scalingGroups: JSON.parse(JSON.stringify(newGroups)),
            protectedTabs: Array.from(protectedTabs),
            tabConfigs: JSON.parse(JSON.stringify(tabConfigs))
        }
    };

    // Update the regular history state for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGroups);

    // Add to detailed history entries
    const newHistoryEntries = historyEntries.slice(0, historyIndex + 1);
    newHistoryEntries.push(historyEntry);

    return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
        historyEntries: newHistoryEntries
    };
};

/**
 * Undo the last action
 * 
 * @param {Array} history - Current history stack
 * @param {number} historyIndex - Current index in the history stack
 * @returns {Object} - Updated history state
 */
export const undo = (history, historyIndex) => {
    if (historyIndex > 0) {
        return {
            historyIndex: historyIndex - 1,
            scalingGroups: history[historyIndex - 1]
        };
    }
    return { historyIndex, scalingGroups: history[historyIndex] };
};

/**
 * Redo the last undone action
 * 
 * @param {Array} history - Current history stack
 * @param {number} historyIndex - Current index in the history stack
 * @returns {Object} - Updated history state
 */
export const redo = (history, historyIndex) => {
    if (historyIndex < history.length - 1) {
        return {
            historyIndex: historyIndex + 1,
            scalingGroups: history[historyIndex + 1]
        };
    }
    return { historyIndex, scalingGroups: history[historyIndex] };
};

/**
 * Initialize history with initial scaling groups
 * 
 * @param {Array} initialGroups - Initial scaling groups
 * @returns {Object} - Initial history state
 */
export const initializeHistory = (initialGroups) => {
    const initialHistory = [initialGroups];
    
    // Create initial history entry
    const initialHistoryEntry = {
        id: `history_${Date.now()}_initial`,
        timestamp: Date.now(),
        action: 'initialize',
        description: 'Initial scaling configuration',
        snapshots: {
            scalingGroups: JSON.parse(JSON.stringify(initialGroups)),
            protectedTabs: []
        }
    };

    return {
        history: initialHistory,
        historyIndex: 0,
        historyEntries: [initialHistoryEntry]
    };
};