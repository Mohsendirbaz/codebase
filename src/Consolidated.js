import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faCheck, faTimes, faSave, faUndo,
    faArrowLeft, faArrowRight, faLock, faLockOpen,
    faPlus, faTrash, faQuestion, faSync
} from '@fortawesome/free-solid-svg-icons';
import * as math from 'mathjs';
import './styles/HomePage.CSS/HCSS.css';
import './styles/HomePage.CSS/Consolidated.css';
// Import label references for reset functionality.
import * as labelReferences from './utils/labelReferences';
// Import modularized components and services
import { MatrixSubmissionService } from './services';
import { MatrixApp } from './components/matrix';
import { GeneralFormConfig } from './components/forms';
import { Card, CardHeader, CardContent, Tooltip } from './components/ui';
import { CumulativeDocumentation } from './components/documentation';
import { DraggableScalingItem, ScalingSummary } from './components/scaling';

/**
 * UI Components
 * The following components are used to build the UI for the scaling system
 * 
 * Note: The following components have been moved to their own files:
 * - Card, CardHeader, CardContent: src/components/ui/Card.js
 * - Tooltip: src/components/ui/Tooltip.js
 * - CumulativeDocumentation: src/components/documentation/CumulativeDocumentation.js
 * - DraggableScalingItem: src/components/scaling/DraggableScalingItem.js
 * - ScalingSummary: src/components/scaling/ScalingSummary.js
 */

/**
 * EXTENDED SCALING COMPONENT
 * Provides a comprehensive scaling system with cumulative calculation capabilities
 */
const ExtendedScaling = ({
                             baseCosts = [],
                             onScaledValuesChange,
                             onSave,
                             initialScalingGroups = [],
                             onScalingGroupsChange,
                             filterKeyword = '',
                             V,
                             R,
                             toggleV,
                             toggleR,
                             activeGroupIndex = 0,
                             onActiveGroupChange = () => {},
                             onFinalResultsGenerated
                         }) => {
    // State for history and undo/redo
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [historyEntries, setHistoryEntries] = useState([]);

    // File handling for import
    const fileInputRef = useRef(null);

    // State for UI elements
    const [errors, setErrors] = useState({});
    const [protectedTabs, setProtectedTabs] = useState(new Set([]));
    const [tabConfigs, setTabConfigs] = useState([]);
    const [itemExpressions, setItemExpressions] = useState({});
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showDocumentation, setShowDocumentation] = useState(false);

    // Enhanced operations with descriptions
    const operations = [
        {
            id: 'multiply',
            label: 'Multiply',
            symbol: '×',
            description: 'Multiplies the base value by the scaling factor'
        },
        {
            id: 'power',
            label: 'Power',
            symbol: '^',
            description: 'Raises the base value to the power of the scaling factor'
        },
        {
            id: 'divide',
            label: 'Divide',
            symbol: '÷',
            description: 'Divides the base value by the scaling factor'
        },
        {
            id: 'log',
            label: 'Logarithmic',
            symbol: 'ln',
            description: 'Applies logarithmic scaling using the natural log'
        },
        {
            id: 'exponential',
            label: 'Exponential',
            symbol: 'eˣ',
            description: 'Applies exponential scaling'
        },
        {
            id: 'add',
            label: 'Add',
            symbol: '+',
            description: 'Adds the scaling factor to the base value'
        },
        {
            id: 'subtract',
            label: 'Subtract',
            symbol: '-',
            description: 'Subtracts the scaling factor from the base value'
        }
    ];

    // Enhanced error handling and validation
    const calculateScaledValue = useCallback((baseValue, operation, factor) => {
        try {
            if (baseValue === 0 && operation === 'divide') {
                throw new Error('Division by zero');
            }
            if (baseValue < 0 && operation === 'log') {
                throw new Error('Logarithm of negative number');
            }

            let result;
            switch (operation) {
                case 'multiply':
                    result = math.multiply(baseValue, factor);
                    break;
                case 'power':
                    result = math.pow(baseValue, factor);
                    break;
                case 'divide':
                    result = math.divide(baseValue, factor);
                    break;
                case 'log':
                    result = math.multiply(math.log(baseValue), factor);
                    break;
                case 'exponential':
                    result = math.exp(math.multiply(math.log(baseValue), factor));
                    break;
                case 'add':
                    result = math.add(baseValue, factor);
                    break;
                case 'subtract':
                    result = math.subtract(baseValue, factor);
                    break;
                default:
                    result = baseValue;
            }

            if (!isFinite(result)) {
                throw new Error('Result is not a finite number');
            }

            return result;
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                [baseValue]: error.message
            }));
            return 0;
        }
    }, []);

    // Main scaling groups state
    const [scalingGroups, setScalingGroups] = useState(() => {
        // Initialize with provided groups or create a default group
        const initialGroups = initialScalingGroups.length > 0
            ? initialScalingGroups
            : [{
                id: 'default',
                name: 'Default Scaling',
                isProtected: false,
                _scalingType: filterKeyword, // Store the scaling type
                items: baseCosts.map(cost => ({
                    ...cost,
                    originalBaseValue: parseFloat(cost.value) || cost.baseValue || 0,
                    baseValue: parseFloat(cost.value) || cost.baseValue || 0,
                    scalingFactor: 1,
                    operation: 'multiply',
                    enabled: true,
                    notes: '',
                    scaledValue: parseFloat(cost.value) || cost.baseValue || 0
                }))
            }];

        setHistory([initialGroups]);
        setHistoryIndex(0);

        // Create initial history entry
        setHistoryEntries([{
            id: `history_${Date.now()}_initial`,
            timestamp: Date.now(),
            action: 'initialize',
            description: 'Initial scaling configuration',
            snapshots: {
                scalingGroups: JSON.parse(JSON.stringify(initialGroups)),
                protectedTabs: []
            }
        }]);

        return initialGroups;
    });

    const [selectedGroup, setSelectedGroup] = useState(activeGroupIndex || 0);

    // Add a synchronization function for tab configurations
    const syncTabConfigs = useCallback(() => {
        const newTabConfigs = scalingGroups.map(group => ({
            id: group.id,
            label: group.name,
            isProtected: protectedTabs.has(group.id),
            _scalingType: group._scalingType || filterKeyword
        }));
        setTabConfigs(newTabConfigs);
    }, [scalingGroups, protectedTabs, filterKeyword]);

    // Call this whenever scalingGroups change
    useEffect(() => {
        syncTabConfigs();
    }, [scalingGroups, syncTabConfigs]);

    // Enhanced history tracking with tabConfigs
    const addToHistory = useCallback((newGroups, action, description, payload = {}) => {
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
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        // Add to detailed history entries
        const newHistoryEntries = historyEntries.slice(0, historyIndex + 1);
        newHistoryEntries.push(historyEntry);
        setHistoryEntries(newHistoryEntries);
    }, [history, historyIndex, protectedTabs, tabConfigs, historyEntries]);

    // Toggle protection for a scaling group
    const toggleProtection = useCallback((groupId) => {
        const isCurrentlyProtected = protectedTabs.has(groupId);

        setProtectedTabs(prev => {
            const newProtected = new Set(prev);
            if (newProtected.has(groupId)) {
                newProtected.delete(groupId);
            } else {
                newProtected.add(groupId);
            }
            return newProtected;
        });

        const action = isCurrentlyProtected ? 'unprotect_group' : 'protect_group';
        const description = isCurrentlyProtected
            ? `Removed protection from group "${scalingGroups.find(g => g.id === groupId)?.name || groupId}"`
            : `Protected group "${scalingGroups.find(g => g.id === groupId)?.name || groupId}"`;

        // We need to clone the current scaling groups to avoid reference issues
        const newGroups = JSON.parse(JSON.stringify(scalingGroups));

        // Update tab configs when protection status changes
        const newTabConfigs = tabConfigs.map(tab =>
            tab.id === groupId
                ? { ...tab, isProtected: !isCurrentlyProtected }
                : tab
        );
        setTabConfigs(newTabConfigs);

        // Add to history
        addToHistory(
            newGroups,
            action,
            description,
            {
                groupId,
                previousState: isCurrentlyProtected,
                newState: !isCurrentlyProtected,
                tabConfigs: newTabConfigs
            }
        );
    }, [protectedTabs, scalingGroups, addToHistory, tabConfigs]);

    // Undo/Redo functionality
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setScalingGroups(history[historyIndex - 1]);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setScalingGroups(history[historyIndex + 1]);
        }
    }, [history, historyIndex]);

    // Function to propagate changes to all subsequent groups
    const propagateChanges = useCallback((groups, startIndex) => {
        const updatedGroups = [...groups];

        // Skip processing if we're at the last group or beyond
        if (startIndex >= updatedGroups.length - 1) {
            return updatedGroups;
        }

        // For each subsequent group, update base values from the previous group's results
        for (let i = startIndex + 1; i < updatedGroups.length; i++) {
            const previousGroup = updatedGroups[i - 1];
            const currentGroup = {...updatedGroups[i]};

            // Create a map of previous results
            const previousResults = previousGroup.items.reduce((acc, item) => {
                acc[item.id] = {
                    scaledValue: item.enabled ? item.scaledValue : item.baseValue,
                    enabled: item.enabled
                };
                return acc;
            }, {});

            // Update each item in the current group
            currentGroup.items = currentGroup.items.map(item => {
                const prevResult = previousResults[item.id];
                if (!prevResult) return item;

                // Calculate new scaled value based on updated base value
                const newBaseValue = prevResult.scaledValue;
                const newScaledValue = calculateScaledValue(
                    newBaseValue,
                    item.operation,
                    item.scalingFactor
                );

                return {
                    ...item,
                    originalBaseValue: item.originalBaseValue || item.baseValue, // Preserve original
                    baseValue: newBaseValue,
                    scaledValue: item.enabled ? newScaledValue : newBaseValue
                };
            });

            updatedGroups[i] = currentGroup;
        }

        return updatedGroups;
    }, [calculateScaledValue]);

    // Helper function to determine the correct insertion index
    const determineInsertionIndex = useCallback((groupNumber, groups) => {
        // Look for the position where this group should be inserted based on numbering
        for (let i = 0; i < groups.length; i++) {
            const match = groups[i].name.match(/Scaling Group (\d+)/);
            if (match) {
                const currentNumber = parseInt(match[1], 10);
                if (currentNumber > groupNumber) {
                    return i; // Insert before this group
                }
            }
        }
        return groups.length; // Append at the end if no suitable position found
    }, []);

    // Process imported configuration for cumulative calculations
    const processImportedConfiguration = useCallback((groups) => {
        if (!Array.isArray(groups) || groups.length === 0) {
            throw new Error("Invalid or empty groups array");
        }

        // First, validate all groups and ensure they have the required structure
        const validatedGroups = groups.map((group, index) => {
            // Ensure group has all required properties
            const processedGroup = {
                id: group.id || `group-${Date.now()}-${index}`,
                name: group.name || `Scaling Group ${index + 1}`,
                isProtected: !!group.isProtected,
                _scalingType: group._scalingType || filterKeyword || "mixed", // Ensure scaling type is preserved
                items: Array.isArray(group.items) ? [...group.items] : []
            };

            // Process all items in the group to ensure they have required properties
            processedGroup.items = processedGroup.items.map(item => {
                const processedItem = {
                    id: item.id || `item-${Date.now()}-${Math.random()}`,
                    label: item.label || item.id || 'Unknown Item',
                    originalBaseValue: item.originalBaseValue || item.baseValue || 0,
                    baseValue: item.baseValue || 0,
                    scalingFactor: item.scalingFactor !== undefined ? item.scalingFactor : 1,
                    operation: item.operation || 'multiply',
                    enabled: item.enabled !== undefined ? !!item.enabled : true,
                    notes: item.notes || '',
                    vKey: item.vKey || null,
                    rKey: item.rKey || null,
                    scaledValue: item.scaledValue !== undefined ? item.scaledValue :
                        calculateScaledValue(
                            item.baseValue || 0,
                            item.operation || 'multiply',
                            item.scalingFactor !== undefined ? item.scalingFactor : 1
                        )
                };

                return processedItem;
            });

            return processedGroup;
        });

        // Now process cumulative relationships to ensure mathematical integrity
        if (validatedGroups.length > 1) {
            // For the first group, ensure base values are original values
            validatedGroups[0].items = validatedGroups[0].items.map(item => ({
                ...item,
                baseValue: item.originalBaseValue || item.baseValue,
                scaledValue: calculateScaledValue(
                    item.originalBaseValue || item.baseValue,
                    item.operation,
                    item.scalingFactor
                )
            }));

            // Then process all subsequent groups
            for (let i = 1; i < validatedGroups.length; i++) {
                // Get results from the previous group to use as base values
                const previousGroup = validatedGroups[i - 1];
                const previousResults = previousGroup.items.reduce((acc, item) => {
                    acc[item.id] = {
                        scaledValue: item.enabled ? item.scaledValue : item.baseValue,
                        enabled: item.enabled
                    };
                    return acc;
                }, {});

                // Update base values and recalculate scaled values
                validatedGroups[i].items = validatedGroups[i].items.map(item => {
                    const prevResult = previousResults[item.id];

                    // If no previous result exists, keep original values
                    if (!prevResult) return item;

                    // Update base value to previous group's result
                    const newBaseValue = prevResult.scaledValue;

                    // Calculate new scaled value
                    const newScaledValue = item.enabled
                        ? calculateScaledValue(newBaseValue, item.operation, item.scalingFactor)
                        : newBaseValue;

                    return {
                        ...item,
                        baseValue: newBaseValue,
                        scaledValue: newScaledValue
                    };
                });
            }
        }

        return validatedGroups;
    }, [calculateScaledValue, filterKeyword]);

    // Enhanced export with history and tabConfigs
    const exportConfiguration = useCallback(() => {
        setIsExporting(true);
        try {
            // Ensure tab configs are synced before export
            syncTabConfigs();

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
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                export: error.message
            }));
        } finally {
            setIsExporting(false);
        }
    }, [
        scalingGroups,
        protectedTabs,
        selectedGroup,
        historyEntries,
        itemExpressions,
        filterKeyword,
        tabConfigs,
        syncTabConfigs
    ]);

    // Enhanced import with backward compatibility and tabConfigs support
    const importConfiguration = useCallback((event) => {
        setIsImporting(true);
        try {
            const file = event.target.files[0];
            if (!file) {
                setIsImporting(false);
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
                                setIsImporting(false);
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
                    const processedGroups = processImportedConfiguration(importedGroups);

                    // Update state
                    setScalingGroups(processedGroups);
                    setProtectedTabs(importedProtectedTabs);
                    setSelectedGroup(0);

                    // Handle tab configurations
                    if (importedTabConfigs && Array.isArray(importedTabConfigs)) {
                        // Ensure tabConfigs match current groups
                        const syncedTabConfigs = processedGroups.map(group => {
                            const matchingTabConfig = importedTabConfigs.find(tab => tab.id === group.id);

                            return {
                                id: group.id,
                                label: group.name,
                                isProtected: importedProtectedTabs.has(group.id),
                                _scalingType: group._scalingType || filterKeyword,
                                ...(matchingTabConfig || {})
                            };
                        });

                        setTabConfigs(syncedTabConfigs);
                    } else {
                        // Generate new tabConfigs
                        syncTabConfigs();
                    }

                    // Create new history
                    const newHistory = [processedGroups];
                    setHistory(newHistory);
                    setHistoryIndex(0);

                    // Create initial history entry
                    const initialHistoryEntry = {
                        id: `history_${Date.now()}_import`,
                        timestamp: Date.now(),
                        action: 'import_configuration',
                        description: `Imported ${processedGroups.length} scaling groups from ${file.name}`,
                        snapshots: {
                            scalingGroups: JSON.parse(JSON.stringify(processedGroups)),
                            protectedTabs: Array.from(importedProtectedTabs),
                            tabConfigs: JSON.parse(JSON.stringify(tabConfigs || []))
                        }
                    };
                    setHistoryEntries([initialHistoryEntry]);

                    // Update parent component
                    if (onScalingGroupsChange) {
                        onScalingGroupsChange(processedGroups);
                    }

                    // Update active group if callback provided
                    if (onActiveGroupChange) {
                        onActiveGroupChange(0, filterKeyword);
                    }
                } catch (error) {
                    setErrors(prev => ({
                        ...prev,
                        import: `Error processing import: ${error.message}`
                    }));
                } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                }
            };

            reader.onerror = () => {
                setErrors(prev => ({
                    ...prev,
                    import: "Error reading file"
                }));
                setIsImporting(false);
            };

            reader.readAsText(file);
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                import: error.message
            }));
            setIsImporting(false);
        }
    }, [
        onScalingGroupsChange,
        filterKeyword,
        processImportedConfiguration,
        syncTabConfigs,
        tabConfigs,
        onActiveGroupChange
    ]);

    // Enhanced group management with slot filling and tab config maintenance
    const addScalingGroup = useCallback(() => {
        // Look for gaps in the existing group sequence based on naming conventions
        const existingNumbers = scalingGroups
            .map(group => {
                const match = group.name.match(/Scaling Group (\d+)/);
                return match ? parseInt(match[1], 10) : null;
            })
            .filter(Boolean)
            .sort((a, b) => a - b);

        // Find the first available gap in the sequence
        let newGroupNumber = 1;
        for (let i = 0; i < existingNumbers.length; i++) {
            if (existingNumbers[i] !== i + 1) {
                newGroupNumber = i + 1;
                break;
            }
            newGroupNumber = i + 2; // If no gap found, use the next number
        }

        // Get the correct insertion index based on the numbering
        const insertionIndex = determineInsertionIndex(newGroupNumber, scalingGroups);

        // Get the appropriate previous results to use as base values
        const previousIndex = insertionIndex > 0 ? insertionIndex - 1 : null;
        const previousResults = previousIndex !== null
            ? scalingGroups[previousIndex].items.reduce((acc, item) => {
                acc[item.id] = {
                    scaledValue: item.enabled ? item.scaledValue : item.baseValue,
                    enabled: item.enabled
                };
                return acc;
            }, {})
            : null;

        const newGroup = {
            id: `group-${Date.now()}`,
            name: `Scaling Group ${newGroupNumber}`,
            isProtected: false,
            _scalingType: filterKeyword, // Store the scaling type
            items: baseCosts.map(cost => {
                // If we have previous results, use them as base values
                const baseValue = previousResults
                    ? (previousResults[cost.id]?.scaledValue ?? cost.baseValue)
                    : cost.baseValue || 0;

                return {
                    ...cost,
                    originalBaseValue: cost.baseValue || 0, // Preserve original
                    baseValue: baseValue, // Dynamic base for cumulative calc
                    scalingFactor: 1,
                    operation: 'multiply',
                    enabled: true,
                    notes: '',
                    scaledValue: baseValue
                };
            })
        };

        // Insert the new group at the appropriate position
        const newGroups = [...scalingGroups];
        newGroups.splice(insertionIndex, 0, newGroup);

        // Recalculate all groups that come after to maintain cumulative calculations
        const updatedGroups = propagateChanges(newGroups, insertionIndex);

        setScalingGroups(updatedGroups);

        // Update selected group and notify parent if callback provided
        setSelectedGroup(insertionIndex);
        if (onActiveGroupChange) {
            onActiveGroupChange(insertionIndex, filterKeyword);
        }

        // Update tab configs
        const newTabConfigs = updatedGroups.map(group => ({
            id: group.id,
            label: group.name,
            isProtected: protectedTabs.has(group.id),
            _scalingType: group._scalingType || filterKeyword
        }));
        setTabConfigs(newTabConfigs);

        addToHistory(
            updatedGroups,
            'add_group',
            `Added ${newGroup.name} at position ${insertionIndex + 1}`,
            {
                groupId: newGroup.id,
                groupIndex: insertionIndex,
                previousResults,
                tabConfigs: newTabConfigs
            }
        );

        if (onScalingGroupsChange) {
            onScalingGroupsChange(updatedGroups);
        }
    }, [
        scalingGroups,
        baseCosts,
        addToHistory,
        propagateChanges,
        onScalingGroupsChange,
        determineInsertionIndex,
        filterKeyword,
        protectedTabs,
        onActiveGroupChange
    ]);

    // Enhanced remove group with cumulative recalculation and tab config maintenance
    const removeScalingGroup = useCallback((index) => {
        const groupToRemove = scalingGroups[index];
        if (protectedTabs.has(groupToRemove.id)) {
            setErrors(prev => ({
                ...prev,
                removal: `Cannot remove protected group "${groupToRemove.name}"`
            }));
            return;
        }

        // Remove the group
        let newGroups = scalingGroups.filter((_, idx) => idx !== index);

        // Propagate changes if we're removing a group that's not the last one
        if (index < newGroups.length) {
            // If we're removing a group that's not the first one, use the previous group's results
            // Otherwise, reset to original base values
            if (index > 0) {
                // Propagate changes starting from the group before the one we just removed
                newGroups = propagateChanges(newGroups, index - 1);
            } else {
                // If we removed the first group, the new first group should use original base values
                const firstGroup = {...newGroups[0]};
                firstGroup.items = firstGroup.items.map(item => ({
                    ...item,
                    baseValue: item.originalBaseValue || item.baseValue,
                    scaledValue: calculateScaledValue(
                        item.originalBaseValue || item.baseValue,
                        item.operation,
                        item.scalingFactor
                    )
                }));
                newGroups[0] = firstGroup;

                // Then propagate changes from this group onward
                newGroups = propagateChanges(newGroups, 0);
            }
        }

        setScalingGroups(newGroups);

        // Update selected group and notify parent if needed
        const newSelectedIndex = Math.max(0, selectedGroup - (selectedGroup >= index ? 1 : 0));
        setSelectedGroup(newSelectedIndex);
        if (onActiveGroupChange) {
            onActiveGroupChange(newSelectedIndex, filterKeyword);
        }

        // Update tab configs
        const newTabConfigs = newGroups.map(group => ({
            id: group.id,
            label: group.name,
            isProtected: protectedTabs.has(group.id),
            _scalingType: group._scalingType || filterKeyword
        }));
        setTabConfigs(newTabConfigs);

        // Add to history
        addToHistory(
            newGroups,
            'remove_group',
            `Removed scaling group "${groupToRemove.name}" and updated cumulative values`,
            {
                groupId: groupToRemove.id,
                groupIndex: index,
                removedGroup: groupToRemove,
                tabConfigs: newTabConfigs
            }
        );

        if (onScalingGroupsChange) {
            onScalingGroupsChange(newGroups);
        }
    }, [
        scalingGroups,
        selectedGroup,
        addToHistory,
        protectedTabs,
        propagateChanges,
        calculateScaledValue,
        onScalingGroupsChange,
        filterKeyword,
        onActiveGroupChange
    ]);

    // Hook to update summary results
    useEffect(() => {
        // Only process if callback is provided
        if (onFinalResultsGenerated) {
            // Create summary items with all the final results
            const allItemsById = {};

            // First, gather all item IDs from all groups
            scalingGroups.forEach(group => {
                group.items.forEach(item => {
                    if (!allItemsById[item.id]) {
                        allItemsById[item.id] = { ...item, scaledValues: {} };
                    }
                });
            });

            // Then, gather all scaled values for each item across all groups
            scalingGroups.forEach(group => {
                group.items.forEach(item => {
                    if (allItemsById[item.id]) {
                        allItemsById[item.id].scaledValues[group.id] = item.scaledValue;
                    }
                });
            });

            // For each item, calculate its final result (from the last group where it appears)
            const summaryItems = Object.values(allItemsById).map(item => {
                const scaledValueEntries = Object.entries(item.scaledValues || {});
                // Get the last group's scaled value as the final result
                const finalResult = scaledValueEntries.length > 0
                    ? scaledValueEntries[scaledValueEntries.length - 1][1]
                    : item.originalValue || item.baseValue;

                return {
                    ...item,
                    finalResult
                };
            });

            // Call the provided callback with the summary results
            onFinalResultsGenerated(summaryItems, filterKeyword);
        }
    }, [scalingGroups, onFinalResultsGenerated, filterKeyword]);

    // Define components for Scaling Item
    const ScalingItem = ({ item, onUpdate }) => {
        return (
            <div className="scaling-item">
                <div className="scaling-item-header">
                    <div className="item-label">{item.label}</div>
                    {(item.vKey || item.rKey) && (
                        <div className="item-badges">
                            {item.vKey && <span className="badge v-badge">{item.vKey}</span>}
                            {item.rKey && <span className="badge r-badge">{item.rKey}</span>}
                        </div>
                    )}
                </div>

                <div className="scaling-item-body">
                    <div className="scaling-values">
                        <div className="base-value">
                            <span className="value-label">Base:</span>
                            <span className="value">{item.baseValue.toFixed(2)}</span>
                        </div>

                        <div className="scaling-controls">
                            <select
                                className="operation-select"
                                value={item.operation}
                                onChange={(e) => onUpdate({
                                    ...item,
                                    operation: e.target.value,
                                    scaledValue: calculateScaledValue(item.baseValue, e.target.value, item.scalingFactor)
                                })}
                            >
                                {operations.map(op => (
                                    <option key={op.id} value={op.id} title={op.description}>
                                        {op.symbol} ({op.label})
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                className="factor-input"
                                value={item.scalingFactor}
                                onChange={(e) => {
                                    const newFactor = parseFloat(e.target.value) || 0;
                                    onUpdate({
                                        ...item,
                                        scalingFactor: newFactor,
                                        scaledValue: calculateScaledValue(item.baseValue, item.operation, newFactor)
                                    });
                                }}
                                step="0.1"
                            />
                        </div>

                        <div className="scaled-value">
                            <span className="value-label">Result:</span>
                            <span className={`value ${item.scaledValue > item.baseValue ? 'positive' : item.scaledValue < item.baseValue ? 'negative' : ''}`}>
                {item.scaledValue.toFixed(2)}
              </span>
                        </div>
                    </div>

                    <div className="scaling-item-actions">
                        <label className="enabled-toggle">
                            <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={() => onUpdate({
                                    ...item,
                                    enabled: !item.enabled,
                                    scaledValue: !item.enabled
                                        ? calculateScaledValue(item.baseValue, item.operation, item.scalingFactor)
                                        : item.baseValue
                                })}
                            />
                            <span>Enabled</span>
                        </label>

                        <input
                            type="text"
                            className="notes-input"
                            value={item.notes || ''}
                            onChange={(e) => onUpdate({
                                ...item,
                                notes: e.target.value
                            })}
                            placeholder="Add notes..."
                        />
                    </div>
                </div>
            </div>
        );
    };

    // Scaling Group Component
    const ScalingGroup = ({ group, index, onUpdate, onRemove, isProtected }) => {
        const [isExpanded, setIsExpanded] = useState(true);
        const [isRenaming, setIsRenaming] = useState(false);
        const [newName, setNewName] = useState(group.name);

        // Handle item update within this group
        const handleItemUpdate = (updatedItem) => {
            const updatedItems = group.items.map(item =>
                item.id === updatedItem.id ? updatedItem : item
            );

            onUpdate({
                ...group,
                items: updatedItems
            });
        };

        return (
            <Card className={`scaling-group ${isProtected ? 'protected' : ''}`}>
                <CardHeader>
                    <div className="group-header">
                        <div className="expand-toggle" onClick={() => setIsExpanded(!isExpanded)}>
              <span className={`toggle-icon ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {isExpanded ? '▼' : '▶'}
              </span>
                        </div>

                        {isRenaming ? (
                            <div className="rename-controls">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        onUpdate({ ...group, name: newName });
                                        setIsRenaming(false);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCheck} />
                                </button>
                                <button onClick={() => setIsRenaming(false)}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                        ) : (
                            <h3 className="group-title">{group.name}</h3>
                        )}

                        <div className="group-actions">
                            <button
                                className="rename-button"
                                onClick={() => setIsRenaming(true)}
                                disabled={isProtected}
                                title="Rename Group"
                            >
                                <FontAwesomeIcon icon={faEdit} />
                            </button>

                            <button
                                className="protection-button"
                                onClick={() => toggleProtection(group.id)}
                                title={protectedTabs.has(group.id) ? "Unprotect Group" : "Protect Group"}
                            >
                                <FontAwesomeIcon icon={protectedTabs.has(group.id) ? faLock : faLockOpen} />
                            </button>

                            <button
                                className="remove-button"
                                onClick={() => onRemove(index)}
                                disabled={isProtected}
                                title="Remove Group"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    </div>
                </CardHeader>

                {isExpanded && (
                    <CardContent>
                        <div className="scaling-items">
                            <DndProvider backend={HTML5Backend}>
                                {group.items.map((item, itemIndex) => (
                                    <DraggableScalingItem
                                        key={item.id}
                                        item={item}
                                        index={itemIndex}
                                        moveItem={(dragIndex, hoverIndex) => {
                                            const dragItem = group.items[dragIndex];
                                            const updatedItems = [...group.items];
                                            updatedItems.splice(dragIndex, 1);
                                            updatedItems.splice(hoverIndex, 0, dragItem);

                                            onUpdate({
                                                ...group,
                                                items: updatedItems
                                            });
                                        }}
                                        V={V}
                                        R={R}
                                        toggleV={toggleV}
                                        toggleR={toggleR}
                                    >
                                        <ScalingItem
                                            item={item}
                                            onUpdate={handleItemUpdate}
                                        />
                                    </DraggableScalingItem>
                                ))}
                            </DndProvider>
                        </div>
                    </CardContent>
                )}
            </Card>
        );
    };

    // Main render function for ExtendedScaling
    const calculateSummaryItems = () => {
        // Prepare items for summary panel by collecting scaling values from all groups
        const summaryItems = [];

        // Create a map to efficiently track items by ID
        const itemsMap = new Map();

        // Process all groups sequentially to maintain cumulative nature
        scalingGroups.forEach(group => {
            group.items.forEach(item => {
                let summaryItem = itemsMap.get(item.id);

                if (!summaryItem) {
                    // Create new summary item if it doesn't exist yet
                    summaryItem = {
                        id: item.id,
                        label: item.label,
                        originalValue: item.originalBaseValue || item.baseValue,
                        scaledValues: {},
                        vKey: item.vKey,
                        rKey: item.rKey,
                        finalResult: item.scaledValue
                    };
                    itemsMap.set(item.id, summaryItem);
                    summaryItems.push(summaryItem);
                } else {
                    // Update the final result with the most recent scaled value
                    summaryItem.finalResult = item.scaledValue;
                }

                // Record the scaled value for this group
                summaryItem.scaledValues[group.id] = item.scaledValue;
            });
        });

        return summaryItems;
    };

    // Process items for summary display
    const summaryItems = calculateSummaryItems();

    return (
        <div className="extended-scaling-container">
            <div className="scaling-header">
                <h2>Extended Scaling - {filterKeyword || 'All Items'}</h2>

                <div className="scaling-controls">
                    <button className="add-group-button" onClick={addScalingGroup}>
                        <FontAwesomeIcon icon={faPlus} /> Add Scaling Group
                    </button>

                    <button className="undo-button" onClick={undo} disabled={historyIndex <= 0}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Undo
                    </button>

                    <button className="redo-button" onClick={redo} disabled={historyIndex >= history.length - 1}>
                        <FontAwesomeIcon icon={faArrowRight} /> Redo
                    </button>

                    <button className="help-button" onClick={() => setShowDocumentation(true)}>
                        <FontAwesomeIcon icon={faQuestion} /> Help
                    </button>

                    <button
                        className="export-button"
                        onClick={exportConfiguration}
                        disabled={isExporting}
                    >
                        {isExporting ? 'Exporting...' : 'Export Config'}
                    </button>

                    <input
                        type="file"
                        id="import-config"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={importConfiguration}
                        accept=".json"
                    />
                    <button
                        className="import-button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                    >
                        {isImporting ? 'Importing...' : 'Import Config'}
                    </button>
                </div>
            </div>

            {/* Display scaling groups */}
            <div className="scaling-groups">
                {scalingGroups.map((group, index) => (
                    <ScalingGroup
                        key={group.id}
                        group={group}
                        index={index}
                        onUpdate={(updatedGroup) => {
                            const newGroups = [...scalingGroups];
                            newGroups[index] = updatedGroup;

                            // If this is not the last group, propagate changes to subsequent groups
                            const updatedGroups = propagateChanges(newGroups, index);

                            setScalingGroups(updatedGroups);

                            // Add to history
                            addToHistory(
                                updatedGroups,
                                'update_group',
                                `Updated ${updatedGroup.name}`,
                                { groupIndex: index }
                            );

                            if (onScalingGroupsChange) {
                                onScalingGroupsChange(updatedGroups);
                            }
                        }}
                        onRemove={() => removeScalingGroup(index)}
                        isProtected={protectedTabs.has(group.id)}
                    />
                ))}
            </div>

            {/* Display summary panel */}
            <ScalingSummary
                items={summaryItems}
                tabConfigs={tabConfigs}
                onExpressionChange={(itemId, expression) => {
                    setItemExpressions(prev => ({
                        ...prev,
                        [itemId]: expression
                    }));
                }}
                V={V}
                R={R}
                toggleV={toggleV}
                toggleR={toggleR}
            />

            {/* Documentation popup */}
            {showDocumentation && (
                <div className="documentation-overlay">
                    <CumulativeDocumentation onClose={() => setShowDocumentation(false)} />
                </div>
            )}

            {/* Error display */}
            {Object.entries(errors).length > 0 && (
                <div className="errors-container">
                    {Object.entries(errors).map(([key, error]) => (
                        <div key={key} className="error-message">
                            <span className="error-key">{key}:</span> {error}
                            <button
                                className="dismiss-error"
                                onClick={() => setErrors(prev => {
                                    const newErrors = {...prev};
                                    delete newErrors[key];
                                    return newErrors;
                                })}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * GeneralFormConfigOriginal Component
 * Original version of the GeneralFormConfig component
 * @deprecated Use the imported GeneralFormConfig component instead
 */
const GeneralFormConfigOriginal = ({
                               formValues, // Now contains formMatrix structure
                               handleInputChange,
                               version,
                               filterKeyword,
                               V, toggleV,
                               R, toggleR,
                               F, toggleF,
                               RF, toggleRF,
                               S, setS,
                               setVersion,
                               summaryItems,
                           }) => {
    // Get icon mapping from formValues which now contains matrix structure
    const iconMapping = formValues ? formValues.iconMapping : {};

    //--------------------------------------------------------------------------
    // STATE MANAGEMENT
    //--------------------------------------------------------------------------
    const [showPopup, setShowPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [selectedItemId, setSelectedItemId] = useState();
    const [updateStatus, setUpdateStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Factual Precedence state
    const [showFactualPrecedence, setShowFactualPrecedence] = useState(false);
    const [factualPrecedencePosition, setFactualPrecedencePosition] = useState({ top: 0, left: 0 });
    const [factualItemId, setFactualItemId] = useState(null);

    // Label management state
    const [editingLabel, setEditingLabel] = useState(null);
    const [tempLabel, setTempLabel] = useState('');
    const [originalLabels, setOriginalLabels] = useState({});
    const [editedLabels, setEditedLabels] = useState({});

    // Get plant lifetime value for efficacy calculations
    const getLatestPlantLifetime = (formValues) => {
        // Extract the active version & zone
        const activeVersion = formValues?.versions?.active || 'v1';
        const activeZone = formValues?.zones?.active || 'z1';

        // Find plant lifetime in matrix
        const lifetimeParam = Object.values(formValues?.formMatrix || formValues || {})
            .find(item => item.id === 'plantLifetimeAmount10');

        if (lifetimeParam) {
            // Get value from matrix structure if available
            if (lifetimeParam.matrix && activeVersion && activeZone) {
                return lifetimeParam.matrix[activeVersion][activeZone] || 40;
            }
            // Fall back to direct value if matrix not available
            return lifetimeParam.value || 40;
        }
        return 40; // Default if not found
    };

    // Get S parameter number (used for sensitivity analysis)
    const getSNumber = (key) => {
        const match = key.match(/Amount(\d+)/);
        if (!match) return null;

        const num = parseInt(match[1]);
        if (num >= 10 && num <= 84) return `S${num}`; // S10-S79
        return null;
    };

    // Get V parameter number (variable parameters)
    const getVNumber = (vAmountNum) => {
        const num = parseInt(vAmountNum);
        if (num >= 40 && num <= 49) return `V${num - 39}`;
        if (num >= 50 && num <= 59) return `V${num - 49}`;
        return null;
    };

    // Get R parameter number (rate parameters)
    const getRNumber = (rAmountNum) => {
        const num = parseInt(rAmountNum);
        if (num >= 50 && num <= 69) return `R${num - 59}`;
        if (num >= 50 && num <= 79) return `R${num - 69}`;
        return null;
    };

    // Get F parameter number (factor parameters)
    const getFNumber = (key) => {
        const match = key.match(/Amount(\d+)/);
        if (!match) return null;

        const num = parseInt(match[1]);
        if (num >= 34 && num <= 38) return `F${num - 33}`;
        return null;
    };

    // Get RF parameter number (fixed revenue parameters)
    const getRFNumber = (key) => {
        const match = key.match(/Amount(\d+)/);
        if (!match) return null;

        const num = parseInt(match[1]);
        if (num >= 80 && num <= 84) return `RF${num - 79}`;
        return null;
    };

    // Get final calculated value from summary items
    const getFinalResultValue = (itemId) => {
        if (!summaryItems || summaryItems.length === 0) return null;

        const summaryItem = summaryItems.find(item => item.id === itemId);
        return summaryItem ? summaryItem.finalResult : null;
    };

    // Transform form values into displayable items with appropriate metadata
    const formItems = Object.keys(formValues?.formMatrix || formValues || {})
        .filter((key) => key.includes(filterKeyword))
        .map((key) => {
            const param = formValues?.formMatrix ? formValues?.formMatrix[key] : formValues?.[key];

            // For matrix-based form values, extract dynamic appendix information
            let vKey = null, rKey = null, fKey = null, rfKey = null, sKey = null;

            if (param.dynamicAppendix && param.dynamicAppendix.itemState) {
                // Extract from dynamic appendix if available
                vKey = param.dynamicAppendix.itemState.vKey;
                rKey = param.dynamicAppendix.itemState.rKey;
                fKey = param.dynamicAppendix.itemState.fKey;
                rfKey = param.dynamicAppendix.itemState.rfKey;
                sKey = param.dynamicAppendix.itemState.sKey;
            } else {
                // Fall back to older method
                vKey = key.includes('vAmount') ? getVNumber(key.replace('vAmount', '')) : null;
                rKey = key.includes('rAmount') ? getRNumber(key.replace('rAmount', '')) : null;
                fKey = getFNumber(key);
                rfKey = getRFNumber(key);
                sKey = getSNumber(key);
            }

            // Handle matrix-based form values
            let value, step, remarks, efficacyPeriod, placeholder, type, options;

            if (formValues?.versions && formValues?.zones) {
                // Get active version and zone
                const activeVersion = formValues?.versions?.active || 'v1';
                const activeZone = formValues?.zones?.active || 'z1';

                // Extract value from matrix
                value = param.matrix && param.matrix[activeVersion] && param.matrix[activeVersion][activeZone] !== undefined
                    ? param.matrix[activeVersion][activeZone]
                    : param.placeholder || '';

                // Extract other properties
                step = param.step;
                remarks = param.remarks;
                efficacyPeriod = param.efficacyPeriod;
                placeholder = param.placeholder;
                type = param.type;
                options = param.options;
            } else {
                // Fallback for non-matrix form values
                value = param.value;
                step = param.step;
                remarks = param.remarks;
                efficacyPeriod = param.efficacyPeriod;
                placeholder = param.placeholder;
                type = param.type;
                options = param.options;
            }

            return {
                id: key,
                label: param.label,
                value,
                step,
                remarks,
                efficacyPeriod,
                placeholder,
                type,
                options,
                vKey,
                rKey,
                fKey,
                rfKey,
                sKey
            };
        });

    // Store original labels when component mounts
    useEffect(() => {
        if (Object.keys(originalLabels).length === 0) {
            const labels = {};
            // Check if we're using the matrix structure
            if (formValues?.formMatrix) {
                Object.entries(formValues?.formMatrix).forEach(([key, value]) => {
                    labels[key] = value.label;
                });
            } else {
                Object.entries(formValues || {}).forEach(([key, value]) => {
                    if (value && value.label) {
                        labels[key] = value.label;
                    }
                });
            }
            setOriginalLabels(labels);
        }
    }, [formValues, originalLabels]);

    // Begin editing a label
    const handleLabelEdit = (itemId) => {
        setEditingLabel(itemId);
        // Get the current label from matrix or regular structure
        const currentLabel = formValues?.formMatrix
            ? formValues?.formMatrix[itemId]?.label
            : formValues?.[itemId]?.label;
        setTempLabel(currentLabel);
    };

    // Cancel label editing
    const handleCancelEdit = () => {
        setEditingLabel(null);
        setTempLabel('');
    };

    // Save edited label locally
    const handleLabelSave = (itemId) => {
        handleInputChange({ target: { value: tempLabel } }, itemId, 'label');
        setEditedLabels(prev => ({ ...prev, [itemId]: true }));
        setEditingLabel(null);
        setUpdateStatus('Label saved locally - remember to update form');
        setTimeout(() => setUpdateStatus(''), 3000);
    };

    // Update all edited labels to server
    const handleUpdateFormLabels = async () => {
        try {
            setIsUpdating(true);
            setUpdateStatus('Updating form labels...');

            const updates = {};
            Object.keys(editedLabels).forEach(key => {
                // Handle matrix-based form values
                if (formValues?.formMatrix && formValues?.formMatrix[key]) {
                    const param = formValues?.formMatrix[key];
                    const activeVersion = formValues?.versions?.active || 'v1';
                    const activeZone = formValues?.zones?.active || 'z1';

                    updates[key] = {
                        label: param.label,
                        value: param.matrix[activeVersion]?.[activeZone],
                        labelEdited: true // Flag to indicate the label was edited
                    };
                }
                // Fall back to original form values structure
                else if (formValues[key]) {
                    updates[key] = {
                        label: formValues[key].label,
                        value: formValues[key].value,
                        labelEdited: true // Flag to indicate the label was edited
                    };
                }
            });

            if (Object.keys(updates).length === 0) {
                setUpdateStatus('No edited labels to update');
                setIsUpdating(false);
                setTimeout(() => setUpdateStatus(''), 3000);
                return;
            }

            const response = await axios.post('http://localhost:3060/api/update-form-values', { updates });

            if (response.data.success) {
                // Clear tracking after successful update
                setEditedLabels({});
                setUpdateStatus(`${Object.keys(updates).length} labels updated successfully`);
                setTimeout(() => setUpdateStatus(''), 3000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error('Update failed:', error);
            setUpdateStatus(`Update failed: ${error.message}`);
            setTimeout(() => setUpdateStatus(''), 3000);
        } finally {
            setIsUpdating(false);
        }
    };

    // Reset all labels to original values using labelReferences
    const handleResetLabels = async () => {
        if (window.confirm('Reset all labels and default values to original values?')) {
            // First, reset labels locally
            const updatedLabels = {};
            Object.entries(labelReferences.propertyMapping || {}).forEach(([key, label]) => {
                // Handle matrix-based form values
                if (formValues?.formMatrix && formValues?.formMatrix[key]) {
                    handleInputChange({ target: { value: label } }, key, 'label');

                    // Also reset default values if available
                    if (labelReferences.defaultValues && labelReferences.defaultValues[key] !== undefined) {
                        // For matrix-based values, update in the active version and zone
                        const activeVersion = formValues?.versions?.active || 'v1';
                        const activeZone = formValues?.zones?.active || 'z1';

                        // Use updateParameterValue if it exists in the form values object
                        if (formValues.updateParameterValue) {
                            formValues.updateParameterValue(key, labelReferences.defaultValues[key], activeVersion, activeZone);
                        } else {
                            // Fallback to handleInputChange
                            handleInputChange({ target: { value: labelReferences.defaultValues[key] } }, key, 'value');
                        }
                    }

                    // Mark this label as edited so we can update the server
                    updatedLabels[key] = true;
                }
                // Fall back to original form values structure
                else if (formValues[key]) {
                    handleInputChange({ target: { value: label } }, key, 'label');

                    // Also reset default values if available
                    if (labelReferences.defaultValues && labelReferences.defaultValues[key] !== undefined) {
                        handleInputChange({ target: { value: labelReferences.defaultValues[key] } }, key, 'value');
                    }

                    // Mark this label as edited so we can update the server
                    updatedLabels[key] = true;
                }
            });

            // Update the server with all reset values
            try {
                setIsUpdating(true);
                setUpdateStatus('Updating form with original values...');

                const updates = {};
                Object.keys(updatedLabels).forEach(key => {
                    // Handle matrix-based form values
                    if (formValues?.formMatrix && formValues?.formMatrix[key]) {
                        const param = formValues?.formMatrix[key];
                        const activeVersion = formValues?.versions?.active || 'v1';
                        const activeZone = formValues?.zones?.active || 'z1';

                        updates[key] = {
                            label: param.label,
                            value: param.matrix[activeVersion]?.[activeZone],
                            labelEdited: true // Flag to indicate the label was reset
                        };
                    }
                    // Fall back to original form values structure
                    else if (formValues[key]) {
                        updates[key] = {
                            label: formValues[key].label,
                            value: formValues[key].value,
                            labelEdited: true // Flag to indicate the label was reset
                        };
                    }
                });

                if (Object.keys(updates).length > 0) {
                    const response = await axios.post('http://localhost:3060/api/update-form-values', { updates });

                    if (response.data.success) {
                        setUpdateStatus(`Reset complete: ${Object.keys(updates).length} items restored to original values`);
                    } else {
                        throw new Error(response.data.message);
                    }
                } else {
                    setUpdateStatus('No items to reset');
                }
            } catch (error) {
                console.error('Reset failed:', error);
                setUpdateStatus(`Reset failed: ${error.message}`);
            } finally {
                setIsUpdating(false);
                setEditedLabels({});
                setTimeout(() => setUpdateStatus(''), 3000);
            }
        }
    };

    // Handle increment button click
    const handleIncrement = (itemId) => {
        // Handle matrix-based form values
        if (formValues?.formMatrix) {
            const item = formValues?.formMatrix[itemId];
            const activeVersion = formValues?.versions?.active || 'v1';
            const activeZone = formValues?.zones?.active || 'z1';

            // Get current value from matrix
            const currentValue = item.matrix[activeVersion]?.[activeZone] || 0;
            const newValue = parseFloat(currentValue) + parseFloat(item.step || 1);

            // Use updateParameterValue if it exists
            if (formValues.updateParameterValue) {
                formValues.updateParameterValue(itemId, newValue, activeVersion, activeZone);
            } else {
                // Fallback to handleInputChange
                handleInputChange({ target: { value: newValue } }, itemId, 'value');
            }
        }
        // Fall back to original form values structure
        else {
            const item = formValues[itemId];
            const newValue = parseFloat(item.value) + parseFloat(item.step);
            handleInputChange({ target: { value: newValue } }, itemId, 'value');
        }
    };

    // Handle decrement button click
    const handleDecrement = (itemId) => {
        // Handle matrix-based form values
        if (formValues?.formMatrix) {
            const item = formValues?.formMatrix[itemId];
            const activeVersion = formValues?.versions?.active || 'v1';
            const activeZone = formValues?.zones?.active || 'z1';

            // Get current value from matrix
            const currentValue = item.matrix[activeVersion]?.[activeZone] || 0;
            const newValue = parseFloat(currentValue) - parseFloat(item.step || 1);

            // Use updateParameterValue if it exists
            if (formValues.updateParameterValue) {
                formValues.updateParameterValue(itemId, newValue, activeVersion, activeZone);
            } else {
                // Fallback to handleInputChange
                handleInputChange({ target: { value: newValue } }, itemId, 'value');
            }
        }
        // Fall back to original form values structure
        else {
            const item = formValues[itemId];
            const newValue = parseFloat(item.value) - parseFloat(item.step);
            handleInputChange({ target: { value: newValue } }, itemId, 'value');
        }
    };

    // Handle schedule/efficacy button click
    const handleScheduleClick = (e, itemId) => {
        const rect = e.target.getBoundingClientRect();
        setPopupPosition({
            top: rect.top + window.scrollY + 61.8,
            left: rect.left + rect.width + 1000,
        });
        setSelectedItemId(itemId);

        const latestPlantLifetime = getLatestPlantLifetime(formValues);

        // Handle efficacy period updates
        if (formValues?.formMatrix) {
            // For matrix-based form values, use the efficacyPeriod directly
            const efficacyPeriod = formValues?.formMatrix?.[itemId]?.efficacyPeriod || {};
            // Update the efficacy period end value
            handleInputChange({ target: { value: latestPlantLifetime } }, itemId, 'efficacyPeriod', 'end');
        } else {
            // For regular form values
            const efficacyPeriod = formValues?.[itemId]?.efficacyPeriod || {};
            handleInputChange({ target: { value: latestPlantLifetime } }, itemId, 'efficacyPeriod', 'end');
        }

        setShowPopup(true);
    };

    // FIXED: Factual precedence handlers
    const handleFactualPrecedenceClick = (event, itemId) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        // Calculate position relative to viewport with offset and boundary checking
        setFactualPrecedencePosition(() => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Default position (below the element)
            let top = rect.bottom + window.scrollY + 10; // 10px padding
            let left = rect.left + window.scrollX;

            // Right offset (add 300px to the right)
            left += 300;

            // Boundary checking (keep popup within viewport)
            const popupWidth = 550; // From CSS width
            const popupHeight = 400; // Estimated height

            // Adjust if would go off right edge
            if (left + popupWidth > viewportWidth) {
                left = viewportWidth - popupWidth - 20; // 20px margin
            }

            // Adjust if would go off bottom edge
            if (top + popupHeight > viewportHeight) {
                top = rect.top + window.scrollY - popupHeight - 10; // Show above instead
            }

            return { top, left };
        });
        // Set factual item ID separately from selected item ID
        setFactualItemId(itemId);
        setShowFactualPrecedence(true);
    };

    const handleCloseFactualPrecedence = () => {
        setShowFactualPrecedence(false);
        setFactualItemId(null);
    };

    // Main render for GeneralFormConfig
    return (
        <>
            {/* Label Management Section */}
            <div className="labels-section">
                <button
                    className="update-button"
                    onClick={handleUpdateFormLabels}
                    disabled={isUpdating}
                >
                    <FontAwesomeIcon icon={faSave} /> {isUpdating ? 'Updating...' : 'Update Form Labels'}
                </button>
                <button
                    className="reset-button"
                    onClick={handleResetLabels}
                >
                    <FontAwesomeIcon icon={faUndo} /> Reset Labels
                </button>
                {updateStatus && <span className="update-status">{updateStatus}</span>}
            </div>

            {/* Form Items */}
            {formItems.map((item) => (
                <div key={item.id} className={`form-item-container ${item.id === selectedItemId ? 'highlighted-container' : ''}`}>
                    {/* Parameter Type Checkboxes (V/R/F) */}
                    <div className="checkbox-section">
                        {item.vKey && (
                            <div className="checkbox-group">
                                <span className="checkbox-label">{item.vKey}</span>
                                <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    checked={V[item.vKey] === 'on'}
                                    onChange={() => toggleV(item.vKey)}
                                />
                            </div>
                        )}
                        {item.rKey && (
                            <div className="checkbox-group">
                                <span className="checkbox-label">{item.rKey}</span>
                                <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    checked={R[item.rKey] === 'on'}
                                    onChange={() => toggleR(item.rKey)}
                                />
                            </div>
                        )}
                        {item.fKey && (
                            <div className="checkbox-group">
                                <span className="checkbox-label">{item.fKey}</span>
                                <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    checked={F[item.fKey] === 'on'}
                                    onChange={() => toggleF(item.fKey)}
                                />
                            </div>
                        )}
                        {item.rfKey && (
                            <div className="checkbox-group">
                                <span className="checkbox-label">{item.rfKey}</span>
                                <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    checked={RF[item.rfKey] === 'on'}
                                    onChange={() => toggleRF(item.rfKey)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Main Input Section */}
                    <div className="main-input-section">
                        {/* Label and Icon */}
                        <div className="label-container">
                            {iconMapping && iconMapping[item.id] && (
                                <FontAwesomeIcon icon={iconMapping[item.id]} className="input-icon" />
                            )}
                            {editingLabel === item.id ? (
                                <div className="edit-label-container">
                                    <input
                                        type="text"
                                        value={tempLabel}
                                        onChange={(e) => setTempLabel(e.target.value)}
                                        className="label-edit-input"
                                    />
                                    <div className="edit-actions">
                                        <FontAwesomeIcon
                                            icon={faCheck}
                                            onClick={() => handleLabelSave(item.id)}
                                            className="edit-icon save"
                                        />
                                        <FontAwesomeIcon
                                            icon={faTimes}
                                            onClick={handleCancelEdit}
                                            className="edit-icon cancel"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="label-text">
                                    <FontAwesomeIcon
                                        icon={faEdit}
                                        onClick={() => handleLabelEdit(item.id)}
                                        className="edit-icon"
                                    />
                                    <span>{item.label}</span>
                                </div>
                            )}
                        </div>

                        {/* Numeric Input Controls */}
                        {item.type === 'number' && (
                            <div className="input-controls-section">
                                <div className="value-container">
                                    <input
                                        type="number"
                                        id={item.id}
                                        value={item.value !== undefined && item.value !== null && !isNaN(item.value) ? item.value : ''}
                                        onChange={(e) => {
                                            let value = parseFloat(e.target.value);
                                            value = isNaN(value) ? null : value;
                                            handleInputChange({ target: { value } }, item.id, 'value');
                                        }}
                                        className="value-input"
                                        placeholder={item.placeholder}
                                        step={item.step}
                                    />

                                    {/* Summary Results Display */}
                                    {getFinalResultValue(item.id) !== null && (
                                        <div className="final-result-container">
                      <span className="final-result-value">
                        Final: {getFinalResultValue(item.id).toFixed(2)}
                      </span>
                                            <span className="final-result-indicator">
                        ← Summary Result
                      </span>
                                        </div>
                                    )}

                                    <div className="increment-controls">
                                        <button className="control-button1" onClick={() => handleDecrement(item.id)}>-</button>
                                        <button className="control-button2" onClick={() => handleIncrement(item.id)}>+</button>
                                    </div>
                                </div>

                                {/* Step Value Input */}
                                <div className="step-container">
                                    <input
                                        type="number"
                                        id={`${item.id}-step`}
                                        value={item.step !== undefined && item.step !== null && !isNaN(item.step) ? item.step : ''}
                                        onChange={(e) => {
                                            let step = parseFloat(e.target.value);
                                            step = isNaN(step) ? '' : step;
                                            handleInputChange({ target: { value: step } }, item.id, 'step');
                                        }}
                                        className="step-input"
                                        placeholder="Step Value"
                                    />
                                </div>

                                {/* Remarks Field */}
                                <div className="remarks-container">
                                    <input
                                        type="text"
                                        id={`${item.id}-remarks`}
                                        value={item.remarks || ''}
                                        onChange={(e) => handleInputChange({ target: { value: e.target.value } }, item.id, 'remarks')}
                                        placeholder="Add remarks"
                                        className="remarks-input remarks-important"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="action-buttons">
                                    {/* Sensitivity Configuration */}
                                    {item.sKey && (
                                        <button
                                            className="action-button-sensitivity"
                                            onClick={() => {
                                                if (window.sensitivityActionRef && window.sensitivityActionRef.current) {
                                                    // First enable the parameter
                                                    window.sensitivityActionRef.current.toggleParameterEnabled(item.sKey);

                                                    // Then open configuration panel with a slight delay to ensure state updates
                                                    setTimeout(() => {
                                                        window.sensitivityActionRef.current.openParameterDetails(item.sKey);
                                                    }, 50);
                                                } else {
                                                    console.warn("Sensitivity configuration is not available");
                                                }
                                            }}
                                        >
                                            Configure Sensitivity
                                        </button>
                                    )}
                                    <button
                                        className="action-button-efficacy"
                                        onClick={(e) => handleScheduleClick(e, item.id)}
                                    >
                                        Specify Efficacy Period
                                    </button>
                                    <button
                                        className="action-button-factual"
                                        onClick={(e) => handleFactualPrecedenceClick(e, item.id)}
                                    >
                                        Find Factual Precedence
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Select Input Controls */}
                        {item.type === 'select' && (
                            <div className="input-controls-section">
                                <div className="value-container">
                                    <select
                                        id={item.id}
                                        value={item.value || ''}
                                        onChange={(e) => handleInputChange(e, item.id, 'value')}
                                        className="select-input"
                                    >
                                        {item.options && item.options.map((option, index) => (
                                            <option key={index} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Remarks Field */}
                                <div className="remarks-container">
                                    <input
                                        type="text"
                                        id={`${item.id}-remarks`}
                                        value={item.remarks || ''}
                                        onChange={(e) => handleInputChange({ target: { value: e.target.value } }, item.id, 'remarks')}
                                        placeholder="Add remarks"
                                        className="remarks-input remarks-important"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="action-buttons">
                                    {/* Same action buttons as for numeric inputs */}
                                    {item.sKey && (
                                        <button
                                            className="action-button-sensitivity"
                                            onClick={() => {
                                                if (window.sensitivityActionRef && window.sensitivityActionRef.current) {
                                                    window.sensitivityActionRef.current.toggleParameterEnabled(item.sKey);
                                                    setTimeout(() => {
                                                        window.sensitivityActionRef.current.openParameterDetails(item.sKey);
                                                    }, 50);
                                                } else {
                                                    console.warn("Sensitivity configuration is not available");
                                                }
                                            }}
                                        >
                                            Configure Sensitivity
                                        </button>
                                    )}
                                    <button
                                        className="action-button-efficacy"
                                        onClick={(e) => handleScheduleClick(e, item.id)}
                                    >
                                        Specify Efficacy Period
                                    </button>
                                    <button
                                        className="action-button-factual"
                                        onClick={(e) => handleFactualPrecedenceClick(e, item.id)}
                                    >
                                        Find Factual Precedence
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Popups */}
            {/* Note: Actual implementations of Popup and FactualPrecedence components would be needed */}
            {selectedItemId && showPopup && (
                <div className="efficacy-popup" style={popupPosition}>
                    {/* Efficacy Popup Content */}
                    <div className="popup-header">
                        <h3>Set Efficacy Period</h3>
                        <button onClick={() => {
                            setShowPopup(false);
                            setSelectedItemId(null);
                        }}>×</button>
                    </div>
                    <div className="popup-content">
                        {/* Efficacy Period Controls */}
                        <div className="efficacy-control">
                            <label>Start Year:</label>
                            <input
                                type="number"
                                min="0"
                                value={formValues?.formMatrix?.[selectedItemId]?.efficacyPeriod?.start?.value || 0}
                                onChange={(e) => handleInputChange({ target: { value: parseInt(e.target.value) || 0 } }, selectedItemId, 'efficacyPeriod', 'start')}
                            />
                        </div>
                        <div className="efficacy-control">
                            <label>End Year:</label>
                            <input
                                type="number"
                                min="0"
                                value={formValues?.formMatrix?.[selectedItemId]?.efficacyPeriod?.end?.value || 20}
                                onChange={(e) => handleInputChange({ target: { value: parseInt(e.target.value) || 20 } }, selectedItemId, 'efficacyPeriod', 'end')}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showFactualPrecedence && (
                <div className="factual-precedence-popup" style={factualPrecedencePosition}>
                    {/* Factual Precedence Content */}
                    <div className="popup-header">
                        <h3>Factual Precedence</h3>
                        <button onClick={handleCloseFactualPrecedence}>×</button>
                    </div>
                    <div className="popup-content">
                        <p>Finding factual precedence for: {factualItemId}</p>
                        {/* Placeholder for actual factual precedence implementation */}
                        <div className="factual-results">
                            <p>Placeholder for factual precedence results</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

/**
 * Integrated MatrixAppOriginal Component
 * Original version of the MatrixApp component
 * @deprecated Use the imported MatrixApp component instead
 */
const MatrixAppOriginal = ({
                       formValues,
                       handleInputChange,
                       version = "1",
                       S, setS,
                       F, toggleF,
                       V, setV, toggleV,
                       R, setR, toggleR,
                       RF, setRF, toggleRF,
                       subDynamicPlots, setSubDynamicPlots, toggleSubDynamicPlot,
                       scalingGroups, setScalingGroups,
                       finalResults, setFinalResults,
                   }) => {
    // Matrix Service
    const matrixService = useMemo(() => new MatrixSubmissionService(), []);

    // Tab state
    const [activeTab, setActiveTab] = useState('input');
    const [activeSubTab, setActiveSubTab] = useState('ProjectConfig');

    // Scaling states
    const [activeScalingGroups, setActiveScalingGroups] = useState({
        Amount4: 0,
        Amount5: 0,
        Amount6: 0,
        Amount7: 0
    });

    // Scaling base costs
    const [scalingBaseCosts, setScalingBaseCosts] = useState({});

    // Matrix-based processing
    useEffect(() => {
        // Create a mapping of all four Amount categories
        const amountCategories = ['Amount4', 'Amount5', 'Amount6', 'Amount7'];

        // Generate scalingBaseCosts with the same structure for all categories
        const updatedScalingBaseCosts = amountCategories.reduce((result, category) => {
            // Extract entries for this category
            const categoryEntries = Object.entries(formValues?.formMatrix || formValues || {})
                .filter(([key]) => key.includes(category));

            // Sort entries based on their numeric suffix
            categoryEntries.sort(([keyA], [keyB]) => {
                // Extract the numeric part after the category (e.g., "Amount40" -> "40")
                const suffixA = keyA.replace(category, '');
                const suffixB = keyB.replace(category, '');
                return parseInt(suffixA) - parseInt(suffixB);
            });

            // Map sorted entries to scaling items
            result[category] = categoryEntries.map(([key, value]) => {
                let paramValue;

                // Handle matrix-based values
                if (formValues?.versions?.active && formValues?.zones?.active) {
                    const activeVersion = formValues?.versions?.active;
                    const activeZone = formValues?.zones?.active;
                    paramValue = value.matrix?.[activeVersion]?.[activeZone] || 0;
                } else {
                    // Handle regular values
                    paramValue = value.value || 0;
                }

                return {
                    id: key,
                    label: value.label || `Unnamed ${category}`,
                    value: parseFloat(paramValue) || 0,
                    baseValue: parseFloat(paramValue) || 0,
                    vKey: value.dynamicAppendix?.itemState?.vKey || null,
                    rKey: value.dynamicAppendix?.itemState?.rKey || null
                };
            });

            return result;
        }, {});

        // Update state
        setScalingBaseCosts(updatedScalingBaseCosts);
    }, [formValues]);

    // Handle active group change
    const handleActiveGroupChange = (groupIndex, filterKeyword) => {
        setActiveScalingGroups(prev => ({
            ...prev,
            [filterKeyword]: groupIndex
        }));
    };

    // Handle final results generated
    const handleFinalResultsGenerated = (summaryItems, filterKeyword) => {
        setFinalResults(prev => ({
            ...prev,
            [filterKeyword]: summaryItems
        }));
    };

    // Handle form submission
    const handleSubmitCompleteSet = async () => {
        try {
            // Get the active version from matrix state
            const activeVersion = formValues?.versions?.active || "v1";
            const numericVersion = activeVersion.replace(/\D/g, '');

            // Use MatrixSubmissionService to submit form values
            const submissionResult = await matrixService.submitMatrixFormValues(
                formValues,
                numericVersion
            );

            console.log('Submission result:', submissionResult);
            alert('Form values submitted successfully');
        } catch (error) {
            console.error('Error during form submission:', error);
            alert(`Error submitting form values: ${error.message}`);
        }
    };

    // Process scaling groups for various categories
    const getFilteredScalingGroups = (filterKeyword) => {
        return scalingGroups.filter(g => g._scalingType === filterKeyword);
    };

    return (
        <div className="matrix-app">
            <Tabs selectedIndex={activeTab === 'input' ? 0 : 1} onSelect={index => setActiveTab(index === 0 ? 'input' : 'results')}>
                <TabList className="main-tabs">
                    <Tab>Input Configuration</Tab>
                    <Tab>Results & Visualization</Tab>
                </TabList>

                <TabPanel>
                    {/* Input Configuration Panel */}
                    <div className="input-panel">
                        {/* Sub-tab buttons */}
                        <div className="sub-tab-buttons">
                            <button
                                className={`sub-tab-button ${activeSubTab === 'ProjectConfig' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('ProjectConfig')}
                            >
                                Project Configuration
                            </button>
                            <button
                                className={`sub-tab-button ${activeSubTab === 'LoanConfig' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('LoanConfig')}
                            >
                                Loan Configuration
                            </button>
                            <button
                                className={`sub-tab-button ${activeSubTab === 'RatesConfig' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('RatesConfig')}
                            >
                                Rates & Fixed Costs
                            </button>
                            <button
                                className={`sub-tab-button ${activeSubTab === 'Process1Config' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('Process1Config')}
                            >
                                Process Quantities (Vs, units)
                            </button>
                            <button
                                className={`sub-tab-button ${activeSubTab === 'Process2Config' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('Process2Config')}
                            >
                                Process Costs <br /> (Vs, $ / unit)
                            </button>
                            <button
                                className={`sub-tab-button ${activeSubTab === 'Revenue1Config' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('Revenue1Config')}
                            >
                                Additional Revenue Quantities<br /> (Rs, units)
                            </button>
                            <button
                                className={`sub-tab-button ${activeSubTab === 'Revenue2Config' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('Revenue2Config')}
                            >
                                Additional Revenue Prices <br /> (Rs, $ / unit)
                            </button>
                            <button
                                className={`sub-tab-button ${activeSubTab === 'Scaling' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('Scaling')}
                            >
                                + Scaling
                            </button>
                            <button
                                className={`sub-tab-button ${activeSubTab === 'FixedRevenueConfig' ? 'active' : ''}`}
                                onClick={() => setActiveSubTab('FixedRevenueConfig')}
                            >
                                Fixed Revenue Components <br /> (RFs, $)
                            </button>
                        </div>

                        {/* Sub-tab content */}
                        <div className="sub-tab-content">
                            {/* Version and Zone Management - Only show with matrix-based form values */}
                            {formValues?.versions && formValues?.zones && (
                                <div className="matrix-selectors">
                                    <div className="version-selector">
                                        <h3>Version</h3>
                                        <select
                                            value={formValues?.versions?.active || 'v1'}
                                            onChange={e => formValues?.setActiveVersion?.(e.target.value)}
                                        >
                                            {formValues?.versions?.list?.map(version => (
                                                <option key={version} value={version}>
                                                    {formValues?.versions?.metadata?.[version]?.label || version}
                                                </option>
                                            ))}
                                        </select>
                                        <button onClick={() => {
                                            const label = prompt("Enter name for new version:", `Version ${(formValues?.versions?.list?.length || 0) + 1}`);
                                            if (label) formValues?.createVersion?.(label);
                                        }}>+ New Version</button>
                                    </div>
                                    <div className="zone-selector">
                                        <h3>Zone</h3>
                                        <select
                                            value={formValues?.zones?.active || 'z1'}
                                            onChange={e => formValues?.setActiveZone?.(e.target.value)}
                                        >
                                            {formValues?.zones?.list?.map(zone => (
                                                <option key={zone} value={zone}>
                                                    {formValues?.zones?.metadata?.[zone]?.label || zone}
                                                </option>
                                            ))}
                                        </select>
                                        <button onClick={() => {
                                            const label = prompt("Enter name for new zone:", `Zone ${(formValues?.zones?.list?.length || 0) + 1}`);
                                            if (label) formValues?.createZone?.(label);
                                        }}>+ New Zone</button>
                                    </div>
                                </div>
                            )}

                            {/* Project Config */}
                            {activeSubTab === 'ProjectConfig' && (
                                <GeneralFormConfig
                                    formValues={formValues}
                                    handleInputChange={handleInputChange}
                                    version={version}
                                    filterKeyword="Amount1"
                                    S={S || {}}
                                    setS={setS}
                                    setVersion={version => {/* Version update handler */}}
                                />
                            )}

                            {/* Loan Config */}
                            {activeSubTab === 'LoanConfig' && (
                                <GeneralFormConfig
                                    formValues={formValues}
                                    handleInputChange={handleInputChange}
                                    version={version}
                                    filterKeyword="Amount2"
                                    S={S || {}}
                                    setS={setS}
                                    setVersion={version => {/* Version update handler */}}
                                />
                            )}

                            {/* Rates Config */}
                            {activeSubTab === 'RatesConfig' && (
                                <GeneralFormConfig
                                    formValues={formValues}
                                    handleInputChange={handleInputChange}
                                    version={version}
                                    filterKeyword="Amount3"
                                    F={F}
                                    toggleF={toggleF}
                                    S={S || {}}
                                    setS={setS}
                                    setVersion={version => {/* Version update handler */}}
                                />
                            )}

                            {/* Process1 Config */}
                            {activeSubTab === 'Process1Config' && (
                                <>
                                    <GeneralFormConfig
                                        formValues={formValues}
                                        handleInputChange={handleInputChange}
                                        version={version}
                                        filterKeyword="Amount4"
                                        V={V}
                                        setV={setV}
                                        R={R}
                                        setR={setR}
                                        toggleR={toggleR}
                                        toggleV={toggleV}
                                        S={S || {}}
                                        setS={setS}
                                        setVersion={version => {/* Version update handler */}}
                                        summaryItems={finalResults.Amount4}
                                    />
                                    <ExtendedScaling
                                        baseCosts={scalingBaseCosts.Amount4 || []}
                                        onScaledValuesChange={(scaledValues) => {/* Scaled values handler */}}
                                        initialScalingGroups={getFilteredScalingGroups('Amount4')}
                                        onScalingGroupsChange={(newGroups) => {
                                            const otherGroups = scalingGroups.filter(g => g._scalingType !== 'Amount4');
                                            const updatedGroups = newGroups.map(g => ({...g, _scalingType: 'Amount4'}));
                                            setScalingGroups([...otherGroups, ...updatedGroups]);
                                        }}
                                        filterKeyword="Amount4"
                                        V={V}
                                        R={R}
                                        toggleV={toggleV}
                                        toggleR={toggleR}
                                        onFinalResultsGenerated={handleFinalResultsGenerated}
                                        activeGroupIndex={activeScalingGroups.Amount4 || 0}
                                        onActiveGroupChange={handleActiveGroupChange}
                                    />
                                </>
                            )}

                            {/* Process2 Config */}
                            {activeSubTab === 'Process2Config' && (
                                <>
                                    <GeneralFormConfig
                                        formValues={formValues}
                                        handleInputChange={handleInputChange}
                                        version={version}
                                        filterKeyword="Amount5"
                                        V={V}
                                        setV={setV}
                                        R={R}
                                        setR={setR}
                                        toggleR={toggleR}
                                        toggleV={toggleV}
                                        S={S || {}}
                                        setS={setS}
                                        setVersion={version => {/* Version update handler */}}
                                        summaryItems={finalResults.Amount5}
                                    />
                                    <ExtendedScaling
                                        baseCosts={scalingBaseCosts.Amount5 || []}
                                        onScaledValuesChange={(scaledValues) => {/* Scaled values handler */}}
                                        initialScalingGroups={getFilteredScalingGroups('Amount5')}
                                        onScalingGroupsChange={(newGroups) => {
                                            const otherGroups = scalingGroups.filter(g => g._scalingType !== 'Amount5');
                                            const updatedGroups = newGroups.map(g => ({...g, _scalingType: 'Amount5'}));
                                            setScalingGroups([...otherGroups, ...updatedGroups]);
                                        }}
                                        filterKeyword="Amount5"
                                        V={V}
                                        R={R}
                                        toggleV={toggleV}
                                        toggleR={toggleR}
                                        onFinalResultsGenerated={handleFinalResultsGenerated}
                                        activeGroupIndex={activeScalingGroups.Amount5 || 0}
                                        onActiveGroupChange={handleActiveGroupChange}
                                    />
                                </>
                            )}

                            {/* Other config tabs would follow the same pattern */}

                            {/* Add buttons section */}
                            <div className="form-actions">
                                <button
                                    className="submit-button"
                                    onClick={handleSubmitCompleteSet}
                                >
                                    Submit Complete Set
                                </button>
                                <button
                                    className="sync-button"
                                    onClick={() => formValues.syncWithBackend && formValues.syncWithBackend()}
                                >
                                    Sync with Backend
                                </button>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <TabPanel>
                    {/* Results & Visualization Panel */}
                    <div className="results-panel">
                        <h2>Results & Visualization</h2>
                        <p>This panel would contain charts, tables, and visualization of calculation results.</p>
                    </div>
                </TabPanel>
            </Tabs>
        </div>
    );
};

// Export the imported modularized components
// The original components are still available as GeneralFormConfigOriginal and MatrixAppOriginal
export {
    MatrixSubmissionService,
    ExtendedScaling,
    GeneralFormConfig,
    MatrixApp,
    Tooltip,
    CumulativeDocumentation
};
