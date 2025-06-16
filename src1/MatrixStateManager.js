/**
 * MatrixStateManager.js
 *
 * Comprehensive state management system for the ModEcon Matrix application.
 * Provides a centralized state management solution using React Context API
 * with integrated backend synchronization, version/zone control, and support
 * for all specialized matrix data types.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import axios from 'axios';

// Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5007',
    SENSITIVITY_URL: 'http://localhost:2500',
    ENDPOINTS: {
        SYNC_MATRIX: '/sync_matrix',
        GET_MATRIX: '/get_matrix',
        SUBMIT_MATRIX: '/submit_matrix',
        RUN_CALCULATION: '/run',
        PRICE: '/price',
        SENSITIVITY: '/sensitivity/configure'
    }
};

// Define Matrix Context
const MatrixContext = createContext(null);

/**
 * Matrix reducer for handling complex state updates
 */
function matrixReducer(state, action) {
    switch (action.type) {
        case 'INITIALIZE_MATRIX':
            return {
                ...state,
                formMatrix: action.payload.formMatrix || {},
                versions: action.payload.versions || { active: 'v1', list: ['v1'], metadata: {} },
                zones: action.payload.zones || { active: 'z1', list: ['z1'], metadata: {} },
                scalingGroups: action.payload.scalingGroups || [],
                ready: true
            };

        case 'UPDATE_PARAMETER':
            return {
                ...state,
                formMatrix: {
                    ...state.formMatrix,
                    [action.payload.parameterId]: {
                        ...state.formMatrix[action.payload.parameterId],
                        matrix: {
                            ...state.formMatrix[action.payload.parameterId].matrix || {},
                            [action.payload.version]: {
                                ...(state.formMatrix[action.payload.parameterId].matrix || {})[action.payload.version] || {},
                                [action.payload.zone]: action.payload.value
                            }
                        }
                    }
                },
                history: [
                    {
                        timestamp: new Date().toISOString(),
                        action: 'UPDATE_PARAMETER',
                        parameterId: action.payload.parameterId,
                        version: action.payload.version,
                        zone: action.payload.zone,
                        oldValue: state.formMatrix[action.payload.parameterId]?.matrix?.[action.payload.version]?.[action.payload.zone],
                        newValue: action.payload.value
                    },
                    ...state.history || []
                ].slice(0, 100) // Limit history to 100 entries
            };

        case 'UPDATE_PARAMETER_PROPERTY':
            return {
                ...state,
                formMatrix: {
                    ...state.formMatrix,
                    [action.payload.parameterId]: {
                        ...state.formMatrix[action.payload.parameterId],
                        [action.payload.property]: action.payload.value
                    }
                }
            };

        case 'UPDATE_EFFICACY_PERIOD':
            return {
                ...state,
                formMatrix: {
                    ...state.formMatrix,
                    [action.payload.parameterId]: {
                        ...state.formMatrix[action.payload.parameterId],
                        efficacyPeriod: {
                            ...state.formMatrix[action.payload.parameterId]?.efficacyPeriod || {},
                            [action.payload.version]: action.payload.efficacyData
                        }
                    }
                }
            };

        case 'CREATE_VERSION':
            const newVersionId = `v${state.versions.list.length + 1}`;
            return {
                ...state,
                versions: {
                    ...state.versions,
                    active: newVersionId,
                    list: [...state.versions.list, newVersionId],
                    metadata: {
                        ...state.versions.metadata,
                        [newVersionId]: {
                            label: action.payload?.label || `Version ${state.versions.list.length + 1}`,
                            description: action.payload?.description || '',
                            createdAt: new Date().toISOString()
                        }
                    }
                }
            };

        case 'SET_ACTIVE_VERSION':
            return {
                ...state,
                versions: {
                    ...state.versions,
                    active: action.payload
                }
            };

        case 'UPDATE_VERSION_METADATA':
            return {
                ...state,
                versions: {
                    ...state.versions,
                    metadata: {
                        ...state.versions.metadata,
                        [action.payload.versionId]: {
                            ...state.versions.metadata[action.payload.versionId],
                            ...action.payload.metadata
                        }
                    }
                }
            };

        case 'CREATE_ZONE':
            const newZoneId = `z${state.zones.list.length + 1}`;
            return {
                ...state,
                zones: {
                    ...state.zones,
                    active: newZoneId,
                    list: [...state.zones.list, newZoneId],
                    metadata: {
                        ...state.zones.metadata,
                        [newZoneId]: {
                            label: action.payload?.label || `Zone ${state.zones.list.length + 1}`,
                            description: action.payload?.description || '',
                            createdAt: new Date().toISOString(),
                            coordinates: action.payload?.coordinates || { longitude: 0, latitude: 0 },
                            assets: action.payload?.assets || []
                        }
                    }
                }
            };

        case 'ADD_ZONES':
            const newZones = {};
            const newZoneList = [...state.zones.list];

            // Process each new zone
            Object.entries(action.payload).forEach(([zoneId, metadata]) => {
                if (!state.zones.list.includes(zoneId)) {
                    newZoneList.push(zoneId);
                    newZones[zoneId] = metadata;
                }
            });

            return {
                ...state,
                zones: {
                    ...state.zones,
                    list: newZoneList,
                    metadata: {
                        ...state.zones.metadata,
                        ...newZones
                    }
                }
            };

        case 'SET_ACTIVE_ZONE':
            return {
                ...state,
                zones: {
                    ...state.zones,
                    active: action.payload
                }
            };

        case 'UPDATE_ZONE_METADATA':
            return {
                ...state,
                zones: {
                    ...state.zones,
                    metadata: {
                        ...state.zones.metadata,
                        [action.payload.zoneId]: {
                            ...state.zones.metadata[action.payload.zoneId],
                            ...action.payload.metadata
                        }
                    }
                }
            };

        case 'UPDATE_ZONE_COORDINATES':
            return {
                ...state,
                zones: {
                    ...state.zones,
                    metadata: {
                        ...state.zones.metadata,
                        [action.payload.zoneId]: {
                            ...state.zones.metadata[action.payload.zoneId],
                            coordinates: action.payload.coordinates
                        }
                    }
                }
            };

        case 'UPDATE_ZONE_ASSETS':
            return {
                ...state,
                zones: {
                    ...state.zones,
                    metadata: {
                        ...state.zones.metadata,
                        [action.payload.zoneId]: {
                            ...state.zones.metadata[action.payload.zoneId],
                            assets: action.payload.assets
                        }
                    }
                }
            };

        case 'DELETE_ZONE':
            if (!state.zones.list.includes(action.payload)) {
                return state;
            }

            const filteredList = state.zones.list.filter(id => id !== action.payload);
            const filteredMetadata = { ...state.zones.metadata };
            delete filteredMetadata[action.payload];

            // If the active zone is deleted, set a new active zone
            const newActive = action.payload === state.zones.active && filteredList.length > 0
                ? filteredList[0]
                : state.zones.active;

            return {
                ...state,
                zones: {
                    ...state.zones,
                    list: filteredList,
                    metadata: filteredMetadata,
                    active: newActive
                }
            };

        case 'COMBINE_ZONES':
            // Check if all zoneIds exist
            const validZoneIds = action.payload.zoneIds.filter(id => state.zones.list.includes(id));
            if (validZoneIds.length === 0) {
                return state;
            }

            // Calculate the centroid of all zones
            const totalZones = validZoneIds.length;
            let sumLon = 0;
            let sumLat = 0;

            validZoneIds.forEach(id => {
                const coords = state.zones.metadata[id].coordinates;
                sumLon += coords.longitude;
                sumLat += coords.latitude;
            });

            const avgCoordinates = {
                longitude: sumLon / totalZones,
                latitude: sumLat / totalZones
            };

            // Combine assets from all zones
            const combinedAssets = [];
            validZoneIds.forEach(id => {
                const zoneAssets = state.zones.metadata[id].assets || [];
                zoneAssets.forEach(asset => {
                    combinedAssets.push({
                        ...asset,
                        id: `${asset.id}-from-${id}` // Create unique IDs
                    });
                });
            });

            // Create new zone metadata
            const newZoneMetadata = {
                label: action.payload.newZoneMetadata?.label || `Combined Zone (${validZoneIds.join(', ')})`,
                description: action.payload.newZoneMetadata?.description || `Combined from zones: ${validZoneIds.join(', ')}`,
                coordinates: avgCoordinates,
                assets: combinedAssets,
                createdAt: new Date().toISOString()
            };

            // Remove old zones and add new combined zone
            const newCombinedList = [...state.zones.list.filter(id => !validZoneIds.includes(id)), action.payload.newZoneId];
            const newCombinedMetadata = {
                ...Object.fromEntries(
                    Object.entries(state.zones.metadata).filter(([id]) => !validZoneIds.includes(id))
                ),
                [action.payload.newZoneId]: newZoneMetadata
            };

            return {
                ...state,
                zones: {
                    ...state.zones,
                    list: newCombinedList,
                    metadata: newCombinedMetadata,
                    active: action.payload.newZoneId
                }
            };

        case 'SPLIT_ZONE':
            if (!state.zones.list.includes(action.payload.zoneId)) {
                return state;
            }

            const zoneToSplit = state.zones.metadata[action.payload.zoneId];
            const { coordinates, assets } = zoneToSplit;

            // Split assets among new zones
            const splitZones = {};
            const assetCount = assets.length;
            const zoneCount = action.payload.newZoneIds.length;

            if (action.payload.splitType === 'equal') {
                // Split assets equally
                action.payload.newZoneIds.forEach((newId, index) => {
                    const startIdx = Math.floor(index * assetCount / zoneCount);
                    const endIdx = Math.floor((index + 1) * assetCount / zoneCount);
                    const zoneAssets = assets.slice(startIdx, endIdx);

                    // Create slight offset for coordinates to separate the zones visually
                    const offsetLon = (Math.random() - 0.5) * 0.01;
                    const offsetLat = (Math.random() - 0.5) * 0.01;

                    splitZones[newId] = {
                        label: `${zoneToSplit.label} - Split ${index + 1}`,
                        description: `Split from zone ${action.payload.zoneId}`,
                        coordinates: {
                            longitude: coordinates.longitude + offsetLon,
                            latitude: coordinates.latitude + offsetLat
                        },
                        assets: zoneAssets,
                        createdAt: new Date().toISOString()
                    };
                });
            } else if (action.payload.splitType === 'byType') {
                // Group assets by type
                const assetsByType = {};
                assets.forEach(asset => {
                    if (!assetsByType[asset.type]) {
                        assetsByType[asset.type] = [];
                    }
                    assetsByType[asset.type].push(asset);
                });

                // Distribute asset types among zones
                const types = Object.keys(assetsByType);
                action.payload.newZoneIds.forEach((newId, index) => {
                    const zoneTypes = types.filter((_, i) => i % zoneCount === index);
                    const zoneAssets = zoneTypes.flatMap(type => assetsByType[type] || []);

                    // Create slight offset for coordinates
                    const offsetLon = (Math.random() - 0.5) * 0.01;
                    const offsetLat = (Math.random() - 0.5) * 0.01;

                    splitZones[newId] = {
                        label: `${zoneToSplit.label} - ${zoneTypes.join('/')}`,
                        description: `Split from zone ${action.payload.zoneId} (${zoneTypes.join('/')})`,
                        coordinates: {
                            longitude: coordinates.longitude + offsetLon,
                            latitude: coordinates.latitude + offsetLat
                        },
                        assets: zoneAssets,
                        createdAt: new Date().toISOString()
                    };
                });
            }

            // Create new zone list and metadata
            const newSplitList = [...state.zones.list.filter(id => id !== action.payload.zoneId), ...action.payload.newZoneIds];
            const newSplitMetadata = {
                ...Object.fromEntries(
                    Object.entries(state.zones.metadata).filter(([id]) => id !== action.payload.zoneId)
                ),
                ...splitZones
            };

            return {
                ...state,
                zones: {
                    ...state.zones,
                    list: newSplitList,
                    metadata: newSplitMetadata,
                    active: action.payload.newZoneIds[0] // Set first new zone as active
                }
            };

        case 'UPDATE_SCALING_GROUPS':
            return {
                ...state,
                scalingGroups: action.payload
            };

        case 'UPDATE_FINAL_RESULTS':
            return {
                ...state,
                finalResults: {
                    ...state.finalResults || {},
                    [action.payload.filterKeyword]: action.payload.results
                }
            };

        case 'TOGGLE_PARAMETER_FLAG':
            const { parameterId, flag, value } = action.payload;
            return {
                ...state,
                [flag]: {
                    ...state[flag],
                    [parameterId]: value !== undefined ? value : !(state[flag]?.[parameterId] === 'on')
                        ? 'on'
                        : 'off'
                }
            };

        case 'SET_CALCULATION_RESULTS':
            return {
                ...state,
                calculationResults: {
                    ...state.calculationResults,
                    [action.payload.version]: action.payload.results
                }
            };

        case 'SET_SENSITIVITY_PARAMETERS':
            return {
                ...state,
                S: action.payload
            };

        case 'SYNC_COMPLETE':
            return {
                ...state,
                lastSyncTime: new Date().toISOString()
            };

        default:
            return state;
    }
}

/**
 * MatrixProvider - Context provider for matrix state management
 * Acts as the single source of truth for all matrix data
 */
export function MatrixProvider({ children, initialData = {} }) {
    // Initial state setup
    const initialState = {
        formMatrix: {},            // Main matrix data structure
        versions: {                // Version management
            active: 'v1',
            list: ['v1'],
            metadata: {
                v1: { label: 'Version 1', description: '', createdAt: new Date().toISOString() }
            }
        },
        zones: {                   // Zone management
            active: 'z1',
            list: ['z1'],
            metadata: {
                z1: {
                    label: 'Zone 1',
                    description: '',
                    createdAt: new Date().toISOString(),
                    coordinates: { longitude: 0, latitude: 0 },
                    assets: []
                }
            }
        },
        S: {},                     // Sensitivity analysis parameters
        F: {},                     // Fixed cost flags
        V: {},                     // Variable flags
        R: {},                     // Revenue flags
        RF: {},                    // Fixed revenue flags
        subDynamicPlots: {         // Dynamic plot configuration
            SP1: 'off',
            SP2: 'off',
            SP3: 'off',
            SP4: 'off',
            SP5: 'off',
            SP6: 'off',
            SP7: 'off',
            SP8: 'off'
        },
        scalingGroups: [],         // Scaling group definitions
        finalResults: {},          // Final calculation results
        calculationResults: {},    // Raw calculation results
        history: [],               // Edit history
        errorLog: [],              // Error tracking
        ready: false,              // Initialization status
        ...initialData             // Override with any provided initial data
    };

    // Use reducer for complex state management
    const [state, dispatch] = useReducer(matrixReducer, initialState);

    // Track sync status
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState(null);

    // API client setup
    const apiClient = useMemo(() => {
        return axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: 30000
        });
    }, []);

    /**
     * Initialize matrix data from backend or provided data
     */
    const initializeMatrix = useCallback(async (data = null) => {
        try {
            let matrixData;

            if (data) {
                // Use provided data
                matrixData = data;
            } else {
                // Fetch from backend
                setSyncing(true);
                const response = await apiClient.get(API_CONFIG.ENDPOINTS.GET_MATRIX);
                matrixData = response.data;
                setSyncing(false);
            }

            // Dispatch initialization action
            dispatch({
                type: 'INITIALIZE_MATRIX',
                payload: matrixData
            });

            return matrixData;
        } catch (error) {
            setSyncError(error.message || 'Failed to initialize matrix data');
            setSyncing(false);
            console.error('Matrix initialization error:', error);
            return null;
        }
    }, [apiClient]);

    /**
     * Synchronize state with backend
     */
    const syncWithBackend = useCallback(async () => {
        try {
            setSyncing(true);
            setSyncError(null);

            // Send current state to backend
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SYNC_MATRIX, {
                formMatrix: state.formMatrix,
                versions: state.versions,
                zones: state.zones,
                scalingGroups: state.scalingGroups
            });

            // Update state with response (only if different)
            if (response.data && response.data.formMatrix) {
                dispatch({
                    type: 'INITIALIZE_MATRIX',
                    payload: response.data
                });
            }

            // Mark sync as complete
            dispatch({ type: 'SYNC_COMPLETE' });
            setSyncing(false);

            return response.data;
        } catch (error) {
            setSyncError(error.message || 'Synchronization failed');
            setSyncing(false);
            console.error('Matrix sync error:', error);
            return null;
        }
    }, [apiClient, state.formMatrix, state.versions, state.zones, state.scalingGroups]);

    /**
     * Get effective parameter value considering version, zone, and efficacy period
     */
    const getEffectiveValue = useCallback((parameterId, version = null, zone = null) => {
        // Use active version/zone if not specified
        const targetVersion = version || state.versions.active;
        const targetZone = zone || state.zones.active;

        // Get the parameter
        const parameter = state.formMatrix[parameterId];
        if (!parameter) return null;

        // Handle matrix-based values
        if (parameter.matrix && parameter.matrix[targetVersion] && parameter.matrix[targetVersion][targetZone] !== undefined) {
            return parameter.matrix[targetVersion][targetZone];
        }

        // Check efficacy periods
        if (parameter.efficacyPeriod && parameter.efficacyPeriod[targetVersion]) {
            const efficacyData = parameter.efficacyPeriod[targetVersion];
            // Efficacy period implementation would go here
            // Return efficacy-adjusted value
        }

        // Fall back to base value
        return parameter.value !== undefined ? parameter.value : null;
    }, [state.formMatrix, state.versions.active, state.zones.active]);

    /**
     * Update parameter value for specific version and zone
     */
    const updateParameterValue = useCallback((parameterId, value, version = null, zone = null) => {
        // Use active version/zone if not specified
        const targetVersion = version || state.versions.active;
        const targetZone = zone || state.zones.active;

        dispatch({
            type: 'UPDATE_PARAMETER',
            payload: {
                parameterId,
                value,
                version: targetVersion,
                zone: targetZone
            }
        });
    }, [state.versions.active, state.zones.active]);

    /**
     * Update parameter property (non-matrix property like label)
     */
    const updateParameterProperty = useCallback((parameterId, property, value) => {
        dispatch({
            type: 'UPDATE_PARAMETER_PROPERTY',
            payload: {
                parameterId,
                property,
                value
            }
        });
    }, []);

    /**
     * Update efficacy period for a parameter
     */
    const updateEfficacyPeriod = useCallback((parameterId, efficacyData, version = null) => {
        const targetVersion = version || state.versions.active;

        dispatch({
            type: 'UPDATE_EFFICACY_PERIOD',
            payload: {
                parameterId,
                efficacyData,
                version: targetVersion
            }
        });
    }, [state.versions.active]);

    /**
     * Handle standard input change
     */
    const handleInputChange = useCallback((parameterId, value, property = null) => {
        if (property) {
            // Update a specific property
            updateParameterProperty(parameterId, property, value);
        } else {
            // Update matrix value for current version/zone
            updateParameterValue(parameterId, value);
        }
    }, [updateParameterProperty, updateParameterValue]);

    /**
     * Create new version
     */
    const createVersion = useCallback((metadata = {}) => {
        dispatch({
            type: 'CREATE_VERSION',
            payload: metadata
        });
    }, []);

    /**
     * Set active version
     */
    const setActiveVersion = useCallback((versionId) => {
        if (state.versions.list.includes(versionId)) {
            dispatch({
                type: 'SET_ACTIVE_VERSION',
                payload: versionId
            });
        } else {
            console.error(`Version ${versionId} does not exist`);
        }
    }, [state.versions.list]);

    /**
     * Update version metadata
     */
    const updateVersionMetadata = useCallback((versionId, metadata) => {
        if (state.versions.list.includes(versionId)) {
            dispatch({
                type: 'UPDATE_VERSION_METADATA',
                payload: {
                    versionId,
                    metadata
                }
            });
        } else {
            console.error(`Version ${versionId} does not exist`);
        }
    }, [state.versions.list]);

    /**
     * Create new zone
     */
    const createZone = useCallback((metadata = {}) => {
        dispatch({
            type: 'CREATE_ZONE',
            payload: metadata
        });
    }, []);

    /**
     * Add multiple zones at once
     */
    const addZones = useCallback((zonesData) => {
        dispatch({
            type: 'ADD_ZONES',
            payload: zonesData
        });
    }, []);

    /**
     * Set active zone
     */
    const setActiveZone = useCallback((zoneId) => {
        if (state.zones.list.includes(zoneId)) {
            dispatch({
                type: 'SET_ACTIVE_ZONE',
                payload: zoneId
            });
        } else {
            console.error(`Zone ${zoneId} does not exist`);
        }
    }, [state.zones.list]);

    /**
     * Update zone metadata
     */
    const updateZoneMetadata = useCallback((zoneId, metadata) => {
        if (state.zones.list.includes(zoneId)) {
            dispatch({
                type: 'UPDATE_ZONE_METADATA',
                payload: {
                    zoneId,
                    metadata
                }
            });
        } else {
            console.error(`Zone ${zoneId} does not exist`);
        }
    }, [state.zones.list]);

    /**
     * Update zone coordinates
     */
    const updateZoneCoordinates = useCallback((zoneId, coordinates) => {
        if (state.zones.list.includes(zoneId)) {
            dispatch({
                type: 'UPDATE_ZONE_COORDINATES',
                payload: {
                    zoneId,
                    coordinates
                }
            });
        } else {
            console.error(`Zone ${zoneId} does not exist`);
        }
    }, [state.zones.list]);

    /**
     * Update zone assets
     */
    const updateZoneAssets = useCallback((zoneId, assets) => {
        if (state.zones.list.includes(zoneId)) {
            dispatch({
                type: 'UPDATE_ZONE_ASSETS',
                payload: {
                    zoneId,
                    assets
                }
            });
        } else {
            console.error(`Zone ${zoneId} does not exist`);
        }
    }, [state.zones.list]);

    /**
     * Delete a zone
     */
    const deleteZone = useCallback((zoneId) => {
        if (state.zones.list.includes(zoneId)) {
            dispatch({
                type: 'DELETE_ZONE',
                payload: zoneId
            });
        } else {
            console.error(`Zone ${zoneId} does not exist`);
        }
    }, [state.zones.list]);

    /**
     * Group zones by proximity
     */
    const groupZonesByProximity = useCallback((distanceThreshold = 10000) => {
        // Implementation would use turf.js to calculate distances between zones
        // and group them based on the distance threshold
        console.log(`Grouping zones with distance threshold: ${distanceThreshold}m`);

        // This is a placeholder implementation
        // In a real implementation, you would use turf.js to calculate distances
        return [
            { name: 'Group 1', zones: state.zones.list.slice(0, Math.floor(state.zones.list.length / 2)) },
            { name: 'Group 2', zones: state.zones.list.slice(Math.floor(state.zones.list.length / 2)) }
        ];
    }, [state.zones.list]);

    /**
     * Cluster zones by attribute
     */
    const clusterZonesByAttribute = useCallback((attribute, clusterCount = 3) => {
        // Implementation would use a clustering algorithm to group zones
        // based on the specified attribute
        console.log(`Clustering zones by ${attribute} into ${clusterCount} clusters`);

        // This is a placeholder implementation
        // In a real implementation, you would use a clustering algorithm
        const zoneIds = state.zones.list;
        const clusters = [];

        for (let i = 0; i < Math.min(clusterCount, zoneIds.length); i++) {
            clusters.push({
                name: `Cluster ${i+1}`,
                zones: zoneIds.filter((_, index) => index % clusterCount === i)
            });
        }

        return clusters;
    }, [state.zones.list]);

    /**
     * Combine multiple zones into a single zone
     */
    const combineZones = useCallback((zoneIds, newZoneId, newZoneMetadata) => {
        dispatch({
            type: 'COMBINE_ZONES',
            payload: {
                zoneIds,
                newZoneId,
                newZoneMetadata
            }
        });
    }, []);

    /**
     * Split a zone into multiple zones
     */
    const splitZone = useCallback((zoneId, newZoneIds, splitType = 'equal') => {
        dispatch({
            type: 'SPLIT_ZONE',
            payload: {
                zoneId,
                newZoneIds,
                splitType
            }
        });
    }, []);

    /**
     * Calculate zone statistics
     */
    const calculateZoneStatistics = useCallback(() => {
        return {
            totalZones: state.zones.list.length,
            zonesWithAssets: state.zones.list.filter(zoneId =>
                (state.zones.metadata[zoneId].assets || []).length > 0
            ).length,
            averageAssetsPerZone: state.zones.list.reduce((total, zoneId) =>
                total + (state.zones.metadata[zoneId].assets || []).length, 0
            ) / state.zones.list.length,
            largestZone: state.zones.list.reduce((largest, zoneId) => {
                const currentAssets = (state.zones.metadata[zoneId].assets || []).length;
                return currentAssets > largest.assetCount
                    ? { id: zoneId, assetCount: currentAssets }
                    : largest;
            }, { id: null, assetCount: -1 }).id
        };
    }, [state.zones.list, state.zones.metadata]);

    /**
     * Update scaling groups
     */
    const updateScalingGroups = useCallback((newGroups) => {
        dispatch({
            type: 'UPDATE_SCALING_GROUPS',
            payload: newGroups
        });
    }, []);

    /**
     * Handle final calculation results
     */
    const handleFinalResultsGenerated = useCallback((results, filterKeyword) => {
        dispatch({
            type: 'UPDATE_FINAL_RESULTS',
            payload: {
                filterKeyword,
                results
            }
        });
    }, []);

    /**
     * Toggle flag for parameter (V, F, R, RF, etc.)
     */
    const toggleParameterFlag = useCallback((parameterId, flag, value) => {
        if (!['S', 'F', 'V', 'R', 'RF', 'subDynamicPlots'].includes(flag)) {
            console.error(`Invalid flag: ${flag}`);
            return;
        }

        dispatch({
            type: 'TOGGLE_PARAMETER_FLAG',
            payload: {
                parameterId,
                flag,
                value
            }
        });
    }, []);

    /**
     * Flag-specific toggle helpers
     */
    const toggleF = useCallback((parameterId, value) => {
        toggleParameterFlag(parameterId, 'F', value);
    }, [toggleParameterFlag]);

    const toggleV = useCallback((parameterId, value) => {
        toggleParameterFlag(parameterId, 'V', value);
    }, [toggleParameterFlag]);

    const toggleR = useCallback((parameterId, value) => {
        toggleParameterFlag(parameterId, 'R', value);
    }, [toggleParameterFlag]);

    const toggleRF = useCallback((parameterId, value) => {
        toggleParameterFlag(parameterId, 'RF', value);
    }, [toggleParameterFlag]);

    const toggleSubDynamicPlot = useCallback((plotId, value) => {
        toggleParameterFlag(plotId, 'subDynamicPlots', value);
    }, [toggleParameterFlag]);

    /**
     * Set sensitivity parameters
     */
    const setS = useCallback((sensitivityParams) => {
        dispatch({
            type: 'SET_SENSITIVITY_PARAMETERS',
            payload: sensitivityParams
        });
    }, []);

    /**
     * Run calculation
     */
    const runCalculation = useCallback(async (options = {}) => {
        try {
            const {
                selectedVersions = [state.versions.active.replace('v', '')],
                calculationOption = 'calculateForPrice',
                targetRow = 20,
                includeRemarks = false,
                includeCustomFeatures = false,
                useSummaryItems = true
            } = options;

            // Prepare payload
            const payload = {
                selectedVersions,
                selectedV: state.V,
                selectedF: state.F,
                selectedR: state.R,
                selectedRF: state.RF,
                selectedCalculationOption: calculationOption,
                targetRow: parseInt(targetRow, 10),
                SenParameters: state.S,
                formValues: state.formMatrix,
                summaryItems: useSummaryItems ? state.finalResults : {}
            };

            // Send calculation request
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.RUN_CALCULATION, payload);

            // Store results
            selectedVersions.forEach(version => {
                dispatch({
                    type: 'SET_CALCULATION_RESULTS',
                    payload: {
                        version,
                        results: response.data
                    }
                });
            });

            return response.data;
        } catch (error) {
            console.error('Calculation error:', error);
            return { error: error.message || 'Calculation failed' };
        }
    }, [
        apiClient,
        state.versions.active,
        state.V,
        state.F,
        state.R,
        state.RF,
        state.S,
        state.formMatrix,
        state.finalResults
    ]);

    /**
     * Run sensitivity analysis
     */
    const runSensitivityAnalysis = useCallback(async (options = {}) => {
        try {
            const {
                selectedVersions = [state.versions.active.replace('v', '')],
                calculationOption = 'calculateForPrice',
                targetRow = 20,
                includeRemarks = false,
                includeCustomFeatures = false,
                useSummaryItems = true
            } = options;

            // Create sensitivity API client
            const sensitivityClient = axios.create({
                baseURL: API_CONFIG.SENSITIVITY_URL,
                timeout: 30000
            });

            // Prepare payload (same as regular calculation)
            const payload = {
                selectedVersions,
                selectedV: state.V,
                selectedF: state.F,
                selectedR: state.R,
                selectedRF: state.RF,
                selectedCalculationOption: calculationOption,
                targetRow: parseInt(targetRow, 10),
                SenParameters: state.S,
                formValues: state.formMatrix,
                summaryItems: useSummaryItems ? state.finalResults : {}
            };

            // Run baseline calculation first
            const baselineResponse = await sensitivityClient.post('/run-baseline', payload);

            // Generate sensitivity configurations
            const configResponse = await sensitivityClient.post(API_CONFIG.ENDPOINTS.SENSITIVITY, payload);

            // Run full sensitivity analysis
            const sensitivityResponse = await sensitivityClient.post('/runs', payload);

            // Return combined results
            return {
                baseline: baselineResponse.data,
                config: configResponse.data,
                sensitivity: sensitivityResponse.data
            };
        } catch (error) {
            console.error('Sensitivity analysis error:', error);
            return { error: error.message || 'Sensitivity analysis failed' };
        }
    }, [
        state.versions.active,
        state.V,
        state.F,
        state.R,
        state.RF,
        state.S,
        state.formMatrix,
        state.finalResults
    ]);

    /**
     * Submit all data to backend
     */
    const submitCompleteSet = useCallback(async () => {
        try {
            // Prepare submission payload
            const submission = {
                formMatrix: state.formMatrix,
                versions: state.versions,
                zones: state.zones,
                scalingGroups: state.scalingGroups,
                S: state.S,
                F: state.F,
                V: state.V,
                R: state.R,
                RF: state.RF
            };

            // Submit to backend
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SUBMIT_MATRIX, submission);

            return response.data;
        } catch (error) {
            console.error('Matrix submission error:', error);
            return { error: error.message || 'Submission failed' };
        }
    }, [
        apiClient,
        state.formMatrix,
        state.versions,
        state.zones,
        state.scalingGroups,
        state.S,
        state.F,
        state.V,
        state.R,
        state.RF
    ]);

    /**
     * Reset state with optional selective reset
     */
    const handleReset = useCallback((resetOptions = { S: true, F: true, V: true, R: true, RF: true }) => {
        // Implementation depends on what should be reset
        // For each flag that should be reset, set it to default values

        if (resetOptions.S) {
            dispatch({ type: 'SET_SENSITIVITY_PARAMETERS', payload: {} });
        }

        if (resetOptions.F) {
            const resetF = {};
            Object.keys(state.F).forEach(key => {
                resetF[key] = 'off';
            });
            dispatch({ type: 'TOGGLE_PARAMETER_FLAG', payload: { flag: 'F', ...resetF } });
        }

        // Similar implementation for other flags
    }, [state.F]);

    // Initialization effect
    useEffect(() => {
        // Only initialize if not ready
        if (!state.ready) {
            initializeMatrix(initialData);
        }
    }, [initializeMatrix, state.ready, initialData]);

    // Create context value
    const contextValue = {
        // State data
        formMatrix: state.formMatrix,
        versions: state.versions,
        zones: state.zones,
        scalingGroups: state.scalingGroups,
        finalResults: state.finalResults,
        calculationResults: state.calculationResults,
        history: state.history,
        S: state.S,
        F: state.F,
        V: state.V,
        R: state.R,
        RF: state.RF,
        subDynamicPlots: state.subDynamicPlots,

        // Status
        ready: state.ready,
        syncing,
        syncError,

        // Actions
        initializeMatrix,
        syncWithBackend,
        getEffectiveValue,
        updateParameterValue,
        updateParameterProperty,
        updateEfficacyPeriod,
        handleInputChange,
        createVersion,
        setActiveVersion,
        updateVersionMetadata,
        createZone,
        setActiveZone,
        addZones,
        updateZoneMetadata,
        updateZoneCoordinates,
        updateZoneAssets,
        deleteZone,
        groupZonesByProximity,
        clusterZonesByAttribute,
        combineZones,
        splitZone,
        calculateZoneStatistics,
        updateScalingGroups,
        handleFinalResultsGenerated,
        toggleF,
        toggleV,
        toggleR,
        toggleRF,
        toggleSubDynamicPlot,
        setS,
        runCalculation,
        runSensitivityAnalysis,
        submitCompleteSet,
        handleReset
    };

    return (
        <MatrixContext.Provider value={contextValue}>
            {children}
        </MatrixContext.Provider>
    );
}

/**
 * useMatrixState - Hook for accessing the matrix state context
 */
export function useMatrixState() {
    const context = useContext(MatrixContext);

    if (!context) {
        throw new Error('useMatrixState must be used within a MatrixProvider');
    }

    return context;
}

/**
 * useMatrixSync - Hook for matrix synchronization operations
 */
export function useMatrixSync() {
    const {
        syncWithBackend,
        syncing,
        syncError,
        submitCompleteSet,
        lastSyncTime
    } = useMatrixState();

    return {
        syncWithBackend,
        syncing,
        syncError,
        submitCompleteSet,
        lastSyncTime
    };
}

/**
 * useVersionZone - Hook for version and zone management
 */
export function useVersionZone() {
    const {
        versions,
        zones,
        createVersion,
        setActiveVersion,
        updateVersionMetadata,
        createZone,
        setActiveZone,
        addZones,
        updateZoneMetadata,
        updateZoneCoordinates,
        updateZoneAssets,
        deleteZone,
        groupZonesByProximity,
        clusterZonesByAttribute,
        combineZones,
        splitZone,
        calculateZoneStatistics
    } = useMatrixState();

    return {
        versions,
        zones,
        createVersion,
        setActiveVersion,
        updateVersionMetadata,
        createZone,
        setActiveZone,
        addZones,
        updateZoneMetadata,
        updateZoneCoordinates,
        updateZoneAssets,
        deleteZone,
        groupZonesByProximity,
        clusterZonesByAttribute,
        combineZones,
        splitZone,
        calculateZoneStatistics
    };
}

/**
 * useMatrixParameters - Hook for working with matrix parameters
 */
export function useMatrixParameters() {
    const {
        formMatrix,
        getEffectiveValue,
        updateParameterValue,
        updateParameterProperty,
        updateEfficacyPeriod,
        handleInputChange
    } = useMatrixState();

    return {
        formMatrix,
        getEffectiveValue,
        updateParameterValue,
        updateParameterProperty,
        updateEfficacyPeriod,
        handleInputChange
    };
}

/**
 * useMatrixFlags - Hook for working with flags (V, F, R, RF)
 */
export function useMatrixFlags() {
    const {
        F, V, R, RF, subDynamicPlots,
        toggleF, toggleV, toggleR, toggleRF, toggleSubDynamicPlot,
        setS, S
    } = useMatrixState();

    return {
        F, V, R, RF, subDynamicPlots, S,
        toggleF, toggleV, toggleR, toggleRF, toggleSubDynamicPlot, setS
    };
}

/**
 * useMatrixCalculation - Hook for calculation operations
 */
export function useMatrixCalculation() {
    const {
        runCalculation,
        runSensitivityAnalysis,
        calculationResults,
        finalResults,
        handleFinalResultsGenerated
    } = useMatrixState();

    return {
        runCalculation,
        runSensitivityAnalysis,
        calculationResults,
        finalResults,
        handleFinalResultsGenerated
    };
}

/**
 * useMatrixScaling - Hook for scaling operations
 */
export function useMatrixScaling() {
    const {
        scalingGroups,
        updateScalingGroups,
        finalResults,
        handleFinalResultsGenerated
    } = useMatrixState();

    return {
        scalingGroups,
        updateScalingGroups,
        finalResults,
        handleFinalResultsGenerated
    };
}

/**
 * getParametersByType - Utility function to get parameters by type
 */
export function getParametersByType(formMatrix, filterKeyword) {
    if (!formMatrix) return [];

    return Object.entries(formMatrix)
        .filter(([key]) => key.includes(filterKeyword))
        .map(([key, value]) => ({
            id: key,
            ...value
        }))
        .sort((a, b) => {
            // Extract numeric part for sorting
            const numA = parseInt(a.id.replace(/[^\d]/g, ''), 10) || 0;
            const numB = parseInt(b.id.replace(/[^\d]/g, ''), 10) || 0;
            return numA - numB;
        });
}

/**
 * getParameterValue - Utility function to get parameter value
 */
export function getParameterValue(formMatrix, parameterId, version, zone) {
    if (!formMatrix || !parameterId) return null;

    const parameter = formMatrix[parameterId];
    if (!parameter) return null;

    // If matrix-based value exists, return it
    if (parameter.matrix && parameter.matrix[version] && parameter.matrix[version][zone] !== undefined) {
        return parameter.matrix[version][zone];
    }

    // Otherwise return base value
    return parameter.value !== undefined ? parameter.value : null;
}

/**
 * Utility to prepare data for API
 */
export function prepareDataForSubmission(state, options = {}) {
    const {
        includeHistory = false,
        includeCalculationResults = false
    } = options;

    // Basic data
    const submissionData = {
        formMatrix: state.formMatrix,
        versions: state.versions,
        zones: state.zones,
        scalingGroups: state.scalingGroups,
        S: state.S,
        F: state.F,
        V: state.V,
        R: state.R,
        RF: state.RF
    };

    // Optional data
    if (includeHistory) {
        submissionData.history = state.history;
    }

    if (includeCalculationResults) {
        submissionData.calculationResults = state.calculationResults;
        submissionData.finalResults = state.finalResults;
    }

    return submissionData;
}

// Export the main components and hooks
export {
    MatrixContext,
    matrixReducer
};

// Default export for simpler importing
export default {
    MatrixProvider,
    useMatrixState,
    useMatrixSync,
    useVersionZone,
    useMatrixParameters,
    useMatrixFlags,
    useMatrixCalculation,
    useMatrixScaling
};