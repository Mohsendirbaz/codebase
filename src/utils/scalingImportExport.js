import { processImportedConfiguration } from './scalingUtils';

/**
 * Export scaling configuration to a JSON file
 * 
 * @param {Array} scalingGroups - The scaling groups to export
 * @param {Set} protectedTabs - Set of protected tab IDs
 * @param {number} selectedGroup - Index of the currently selected group
 * @param {Array} historyEntries - History entries for undo/redo
 * @param {Object} itemExpressions - Expressions for items
 * @param {string} filterKeyword - Current scaling type filter
 * @param {Array} tabConfigs - Tab configurations
 * @returns {void}
 */
export const exportConfiguration = (
    scalingGroups,
    protectedTabs,
    selectedGroup,
    historyEntries,
    itemExpressions,
    filterKeyword,
    tabConfigs
) => {
    try {
        // Enhanced format with cumulative calculation metadata
        const exportData = {
            version: "1.2.0", // Update version to indicate enhanced cumulative support
            metadata: {
                exportDate: new Date().toISOString(),
                exportedBy: "ScalingModule",
                description: "Complete scaling configuration with cumulative calculations",
                scalingType: filterKeyword || "mixed"
            },
            currentState: {
                selectedGroupIndex: selectedGroup,
                scalingGroups: scalingGroups.map((group, index) => ({
                    ...group,
                    isCumulative: index > 0, // Flag to indicate cumulative source
                    sourceGroupIndex: index > 0 ? index - 1 : null // Source of base values
                })),
                protectedTabs: Array.from(protectedTabs),
                itemExpressions: itemExpressions || {},
                tabConfigs: tabConfigs // Include tabConfigs in export
            },
            history: historyEntries
        };

        const config = JSON.stringify(exportData, null, 2);

        // Create download link
        const blob = new Blob([config], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scaling-config-${filterKeyword || 'mixed'}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    } catch (error) {
        console.error('Error exporting configuration:', error);
        return false;
    }
};

/**
 * Import scaling configuration from a file
 * 
 * @param {File} file - The file to import
 * @param {string} filterKeyword - Current scaling type filter
 * @param {Function} onSuccess - Callback function on successful import
 * @param {Function} onError - Callback function on import error
 * @returns {void}
 */
export const importConfiguration = (file, filterKeyword, onSuccess, onError) => {
    try {
        if (!file) {
            onError && onError('No file selected');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                // Check if it's the legacy format (has groups property at the root)
                const isLegacyFormat = importedData.groups && Array.isArray(importedData.groups);
                const isV11Format = importedData.version === "1.1.0";
                const isV12Format = importedData.version === "1.2.0";

                // Extract scaling groups and protected tabs based on format
                let importedGroups, importedProtectedTabs, importedTabConfigs;

                if (isLegacyFormat) {
                    // Handle legacy format
                    importedGroups = importedData.groups;
                    importedProtectedTabs = new Set(importedData.protectedTabs || []);
                    importedTabConfigs = null; // Not available in legacy format
                } else if (isV11Format || isV12Format) {
                    // Handle 1.1 or 1.2 format
                    importedGroups = importedData.currentState.scalingGroups;
                    importedProtectedTabs = new Set(importedData.currentState.protectedTabs || []);
                    importedTabConfigs = importedData.currentState.tabConfigs || null;
                } else {
                    throw new Error("Invalid configuration format");
                }

                // If importing from 1.2 format, check scaling type compatibility
                if (isV12Format && importedData.metadata.scalingType) {
                    const importedType = importedData.metadata.scalingType;
                    if (filterKeyword && importedType !== filterKeyword && importedType !== "mixed") {
                        const confirmImport = window.confirm(
                            `This configuration was created for "${importedType}" scaling, but you're currently in "${filterKeyword}" scaling. Import anyway?`
                        );
                        if (!confirmImport) {
                            onError && onError('Import cancelled by user');
                            return;
                        }
                    }
                }

                // Add scaling type to groups if from older format
                if (isLegacyFormat || isV11Format) {
                    importedGroups = importedGroups.map(group => ({
                        ...group,
                        _scalingType: filterKeyword || "mixed"
                    }));
                }

                // Process and validate groups
                const processedGroups = processImportedConfiguration(importedGroups, filterKeyword);

                // Call success callback with processed data
                onSuccess && onSuccess({
                    groups: processedGroups,
                    protectedTabs: importedProtectedTabs,
                    tabConfigs: importedTabConfigs,
                    fileName: file.name
                });
            } catch (error) {
                onError && onError(`Error processing import: ${error.message}`);
            }
        };

        reader.onerror = () => {
            onError && onError("Error reading file");
        };

        reader.readAsText(file);
    } catch (error) {
        onError && onError(error.message);
    }
};