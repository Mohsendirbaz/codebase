import React, { useState, useEffect, useCallback } from 'react';
import { getAPIPrecedenceData } from '../find_factual_precedence/components/modules/FactualPrecedence/APIFactualPrecedence';

/**
 * ProcessEconomics Component
 * 
 * Central state management component for the Climate Module integration.
 * Manages climate data, coordinate data, and history tracking.
 */
function ProcessEconomics() {
  // Climate module core state
  const [hardToDecarbonizeSectors, setHardToDecarbonizeSectors] = useState({
    'Energy': true,
    'Steel': true,
    'Cement': true,
    'Chemicals': true,
    'Transportation': true,
    'Agriculture': true,
    'Waste': false,
    'Buildings': false
  });
  const [emissionFactors, setEmissionFactors] = useState({
    'Equipment Cost': 2.5,
    'Installation': 1.2,
    'Material': 3.8,
    'Energy': 4.5,
    'Transportation': 5.2,
    'Labor': 0.8,
    'Maintenance': 1.0,
    'Disposal': 2.0,
    'default': 1.0
  });
  const [emissionUnits, setEmissionUnits] = useState({
    current: 'SI', // SI or Field
    SI: {
      name: 'kg CO₂e',
      conversionFactor: 1.0 // Base unit
    },
    Field: {
      name: 'lb CO₂e',
      conversionFactor: 2.20462 // kg to lb conversion
    }
  });
  const [hydrogenGateDefinition, setHydrogenGateDefinition] = useState({
    scope1Keywords: ['hydrogen production', 'electrolysis', 'reforming', 'compression', 'purification'],
    scope2Keywords: ['electricity', 'power', 'grid', 'energy purchase']
  });
  const [regulatoryThresholds, setRegulatoryThresholds] = useState({
    local: {
      name: 'Local Regulations',
      enabled: true,
      threshold: 1000, // kg CO2e
      description: 'City/County level emissions reporting requirements'
    },
    state: {
      name: 'State Regulations',
      enabled: true,
      threshold: 10000, // kg CO2e
      description: 'State level emissions reporting requirements'
    },
    federal: {
      name: 'Federal Regulations',
      enabled: true,
      threshold: 25000, // kg CO2e
      description: 'Federal level emissions reporting requirements'
    }
  });
  const [regionSystem, setRegionSystem] = useState('SI'); // 'SI' or 'Europe'

  // Coordinate component state
  const [zoneCoordinates, setZoneCoordinates] = useState({});
  const [zoneAssets, setZoneAssets] = useState({});
  const [locationFacts, setLocationFacts] = useState({});

  // History state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Capture a complete snapshot of the climate state
  const captureClimateSnapshot = useCallback(() => ({
    hardToDecarbonizeSectors,
    emissionFactors,
    emissionUnits,
    hydrogenGateDefinition,
    regulatoryThresholds,
    regionSystem,
    zoneCoordinates,
    zoneAssets,
    locationFacts
  }), [
    hardToDecarbonizeSectors,
    emissionFactors,
    emissionUnits,
    hydrogenGateDefinition,
    regulatoryThresholds,
    regionSystem,
    zoneCoordinates,
    zoneAssets,
    locationFacts
  ]);

  // Add an entry to the history
  const addToHistory = useCallback((entry) => {
    const historyEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      action: entry.action,
      description: entry.description,
      snapshots: {
        // Include different data based on action type
        ...(entry.scalingGroups ? { scalingGroups: JSON.parse(JSON.stringify(entry.scalingGroups)) } : {}),
        ...(entry.climate ? { climate: entry.climate } : {}),
        ...(entry.coordinates ? { coordinates: entry.coordinates } : {}),
        ...(entry.assets ? { assets: entry.assets } : {})
      }
    };

    // Update history array with new entry
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(historyEntry);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Coordinate-specific action handlers
  const handleCoordinateChange = useCallback((zoneId, coordinates) => {
    // Update the coordinates for this zone
    setZoneCoordinates(prev => ({
      ...prev,
      [zoneId]: coordinates
    }));

    // Add to history
    addToHistory({
      action: 'coordinate_update',
      description: `Updated coordinates for Zone ${zoneId}`,
      climate: captureClimateSnapshot(),
      coordinates: {
        zoneId,
        previous: zoneCoordinates[zoneId],
        current: coordinates
      }
    });
  }, [zoneCoordinates, addToHistory, captureClimateSnapshot]);

  const handleAssetChange = useCallback((zoneId, assets) => {
    // Update the assets for this zone
    setZoneAssets(prev => ({
      ...prev,
      [zoneId]: assets
    }));

    // Add to history
    addToHistory({
      action: 'asset_update',
      description: `Updated assets for Zone ${zoneId}`,
      climate: captureClimateSnapshot(),
      assets: {
        zoneId,
        previous: zoneAssets[zoneId],
        current: assets
      }
    });
  }, [zoneAssets, addToHistory, captureClimateSnapshot]);

  // Climate module action handlers
  const handleEmissionFactorChange = useCallback((itemType, value) => {
    setEmissionFactors(prev => {
      const newFactors = {
        ...prev,
        [itemType]: parseFloat(value) || 0
      };

      // Add to history
      addToHistory({
        action: 'emission_factor_update',
        description: `Updated emission factor for ${itemType}`,
        climate: {
          ...captureClimateSnapshot(),
          emissionFactors: newFactors
        }
      });

      return newFactors;
    });
  }, [addToHistory, captureClimateSnapshot]);

  const handleToggleHardToDecarbonize = useCallback((sector) => {
    setHardToDecarbonizeSectors(prev => {
      const newSectors = {
        ...prev,
        [sector]: !prev[sector]
      };

      // Add to history
      addToHistory({
        action: 'hard_to_decarbonize_update',
        description: `${prev[sector] ? 'Removed' : 'Added'} ${sector} as hard to decarbonize sector`,
        climate: {
          ...captureClimateSnapshot(),
          hardToDecarbonizeSectors: newSectors
        }
      });

      return newSectors;
    });
  }, [addToHistory, captureClimateSnapshot]);

  const handleUnitChange = useCallback((unitType) => {
    setEmissionUnits(prev => {
      const newUnits = {
        ...prev,
        current: unitType
      };

      // Add to history
      addToHistory({
        action: 'unit_change',
        description: `Changed emission units to ${unitType}`,
        climate: {
          ...captureClimateSnapshot(),
          emissionUnits: newUnits
        }
      });

      return newUnits;
    });
  }, [addToHistory, captureClimateSnapshot]);

  const handleRegionSystemChange = useCallback((system) => {
    setRegionSystem(system);

    // Add to history
    addToHistory({
      action: 'region_system_change',
      description: `Changed region system to ${system}`,
      climate: {
        ...captureClimateSnapshot(),
        regionSystem: system
      }
    });
  }, [addToHistory, captureClimateSnapshot]);

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevEntry = history[prevIndex];

      // Restore state from the previous entry
      if (prevEntry.snapshots.climate) {
        const climate = prevEntry.snapshots.climate;

        if (climate.hardToDecarbonizeSectors) setHardToDecarbonizeSectors(climate.hardToDecarbonizeSectors);
        if (climate.emissionFactors) setEmissionFactors(climate.emissionFactors);
        if (climate.emissionUnits) setEmissionUnits(climate.emissionUnits);
        if (climate.hydrogenGateDefinition) setHydrogenGateDefinition(climate.hydrogenGateDefinition);
        if (climate.regulatoryThresholds) setRegulatoryThresholds(climate.regulatoryThresholds);
        if (climate.regionSystem) setRegionSystem(climate.regionSystem);
        if (climate.zoneCoordinates) setZoneCoordinates(climate.zoneCoordinates);
        if (climate.zoneAssets) setZoneAssets(climate.zoneAssets);
        if (climate.locationFacts) setLocationFacts(climate.locationFacts);
      }

      // Update history index
      setHistoryIndex(prevIndex);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextEntry = history[nextIndex];

      // Restore state from the next entry
      if (nextEntry.snapshots.climate) {
        const climate = nextEntry.snapshots.climate;

        if (climate.hardToDecarbonizeSectors) setHardToDecarbonizeSectors(climate.hardToDecarbonizeSectors);
        if (climate.emissionFactors) setEmissionFactors(climate.emissionFactors);
        if (climate.emissionUnits) setEmissionUnits(climate.emissionUnits);
        if (climate.hydrogenGateDefinition) setHydrogenGateDefinition(climate.hydrogenGateDefinition);
        if (climate.regulatoryThresholds) setRegulatoryThresholds(climate.regulatoryThresholds);
        if (climate.regionSystem) setRegionSystem(climate.regionSystem);
        if (climate.zoneCoordinates) setZoneCoordinates(climate.zoneCoordinates);
        if (climate.zoneAssets) setZoneAssets(climate.zoneAssets);
        if (climate.locationFacts) setLocationFacts(climate.locationFacts);
      }

      // Update history index
      setHistoryIndex(nextIndex);
    }
  }, [history, historyIndex]);

  // Export configuration in v2.0.0 format
  const exportConfiguration = useCallback(() => {
    const exportData = {
      version: "2.0.0",
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: "IntegratedModel",
        description: "Complete scaling and climate impact configuration with geographic coordinates"
      },
      currentState: {
        // Climate module state
        climateModule: {
          hardToDecarbonizeSectors,
          emissionFactors,
          emissionUnits,
          hydrogenGateDefinition,
          regulatoryThresholds,
          regionSystem
        },

        // Coordinate component state
        coordinates: {
          zoneCoordinates,
          zoneAssets,
          locationFacts
        }
      },
      history: history
    };

    return exportData;
  }, [
    hardToDecarbonizeSectors,
    emissionFactors,
    emissionUnits,
    hydrogenGateDefinition,
    regulatoryThresholds,
    regionSystem,
    zoneCoordinates,
    zoneAssets,
    locationFacts,
    history
  ]);

  // Import configuration
  const importConfiguration = useCallback((importedData) => {
    // Determine format version
    const isV2Format = importedData.version === "2.0.0";

    // Import climate module state if available
    if (isV2Format) {
      if (importedData.currentState.climateModule) {
        const climate = importedData.currentState.climateModule;
        setHardToDecarbonizeSectors(climate.hardToDecarbonizeSectors);
        setEmissionFactors(climate.emissionFactors);
        setEmissionUnits(climate.emissionUnits);
        setHydrogenGateDefinition(climate.hydrogenGateDefinition);
        setRegulatoryThresholds(climate.regulatoryThresholds);
        setRegionSystem(climate.regionSystem);
      }

      // Import coordinate data
      if (importedData.currentState.coordinates) {
        const coords = importedData.currentState.coordinates;

        if (coords.zoneCoordinates) {
          setZoneCoordinates(coords.zoneCoordinates);
        }

        if (coords.zoneAssets) {
          setZoneAssets(coords.zoneAssets);
        }

        if (coords.locationFacts) {
          setLocationFacts(coords.locationFacts);
        }
      }

      // Import history if available
      if (importedData.history) {
        setHistory(importedData.history);
        setHistoryIndex(importedData.history.length - 1);
      }
    } else {
      // Handle older format without climate and coordinate data
      console.warn("Importing from older format - climate and coordinate data not available");
    }
  }, []);

  // Fetch location-based precedence data
  const fetchLocationFacts = useCallback(async (coords) => {
    try {
      // Create a form value for the API call
      const formValue = {
        label: `Location at ${coords.longitude.toFixed(6)}, ${coords.latitude.toFixed(6)}`,
        value: `${coords.longitude},${coords.latitude}`,
        type: 'coordinate-location',
        remarks: `Geographic coordinates for climate impact analysis`
      };

      // Use the existing FactualPrecedence API
      const factsData = await getAPIPrecedenceData('coordinate-location', formValue);

      if (factsData) {
        setLocationFacts(prev => ({
          ...prev,
          [coords.longitude.toFixed(4) + ',' + coords.latitude.toFixed(4)]: factsData
        }));

        // Extract region-specific emission factors if available
        if (factsData.examples) {
          const regionFactors = factsData.examples.filter(ex => 
            ex.entity === "Emission Factors" || ex.entity === "Regional Factors"
          );

          if (regionFactors.length > 0) {
            // Update emission factors based on location
            const updatedFactors = { ...emissionFactors };

            regionFactors.forEach(factor => {
              if (factor.type && factor.value) {
                updatedFactors[factor.type] = parseFloat(factor.value);
              }
            });

            setEmissionFactors(updatedFactors);

            // Add to history
            addToHistory({
              action: 'location_emission_factors_update',
              description: `Updated emission factors based on location data`,
              climate: {
                ...captureClimateSnapshot(),
                emissionFactors: updatedFactors
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching location facts:', error);
    }
  }, [emissionFactors, addToHistory, captureClimateSnapshot]);

  // Fetch asset-specific carbon intensity data
  const fetchAssetCarbonIntensity = useCallback(async (asset, coords) => {
    try {
      // Create a form value for the API call
      const formValue = {
        label: asset.name,
        value: asset.type,
        type: 'asset-carbon-intensity',
        remarks: `Asset type: ${asset.type}, Location: ${coords.longitude.toFixed(4)},${coords.latitude.toFixed(4)}`
      };

      // Use the existing FactualPrecedence API
      const factsData = await getAPIPrecedenceData('asset-carbon-intensity', formValue);

      if (factsData) {
        // If we have a recommended value, use it to update the asset's carbon intensity
        if (factsData.recommendedValue) {
          const newIntensity = parseFloat(factsData.recommendedValue);

          if (!isNaN(newIntensity)) {
            // Update the asset with the new carbon intensity
            const updatedAsset = {
              ...asset,
              carbonIntensity: newIntensity,
              // Store the source of this intensity value
              carbonIntensitySource: 'FactualPrecedence',
              // Store the location where this intensity was determined
              carbonIntensityLocation: `${coords.longitude.toFixed(4)},${coords.latitude.toFixed(4)}`
            };

            // Update the assets for this zone
            setZoneAssets(prev => {
              // Find which zone this asset belongs to
              let targetZoneId = null;

              for (const [zoneId, assets] of Object.entries(prev)) {
                if (assets.some(a => a.id === asset.id)) {
                  targetZoneId = zoneId;
                  break;
                }
              }

              if (targetZoneId) {
                const updatedAssets = prev[targetZoneId].map(a => 
                  a.id === asset.id ? updatedAsset : a
                );

                // Add to history
                addToHistory({
                  action: 'asset_carbon_intensity_update',
                  description: `Updated carbon intensity for asset ${asset.name}`,
                  climate: captureClimateSnapshot(),
                  assets: {
                    zoneId: targetZoneId,
                    assetId: asset.id,
                    previous: asset,
                    current: updatedAsset
                  }
                });

                return {
                  ...prev,
                  [targetZoneId]: updatedAssets
                };
              }

              return prev;
            });
          }
        }

        return factsData;
      }
    } catch (error) {
      console.error('Error fetching asset carbon intensity:', error);
    }

    return null;
  }, [addToHistory, captureClimateSnapshot]);

  // Fetch regulatory thresholds based on region system
  const fetchRegulatoryThresholds = useCallback(async (regionSystem) => {
    try {
      // Create a form value for the API call
      const formValue = {
        label: `Regulatory Thresholds for ${regionSystem} Region`,
        value: 'carbon-regulation',
        type: 'climate-regulation',
        remarks: `System: ${regionSystem}`
      };

      // Call the FactualPrecedence API
      const regulationData = await getAPIPrecedenceData('climate-regulation', formValue);

      if (regulationData && regulationData.examples) {
        // Process regulation data
        const processedThresholds = {
          local: { ...regulatoryThresholds.local },
          state: { ...regulatoryThresholds.state },
          federal: { ...regulatoryThresholds.federal }
        };

        // Update thresholds based on precedence data
        regulationData.examples.forEach(example => {
          const level = example.entity.toLowerCase();

          if (level.includes('local') || level.includes('city') || level.includes('county')) {
            processedThresholds.local.threshold = parseFloat(example.value) || processedThresholds.local.threshold;
            processedThresholds.local.description = example.description || processedThresholds.local.description;
          } else if (level.includes('state') || level.includes('provincial')) {
            processedThresholds.state.threshold = parseFloat(example.value) || processedThresholds.state.threshold;
            processedThresholds.state.description = example.description || processedThresholds.state.description;
          } else if (level.includes('federal') || level.includes('national')) {
            processedThresholds.federal.threshold = parseFloat(example.value) || processedThresholds.federal.threshold;
            processedThresholds.federal.description = example.description || processedThresholds.federal.description;
          }
        });

        // Update regulatory thresholds
        setRegulatoryThresholds(processedThresholds);

        // Add to history
        addToHistory({
          action: 'climate_regulation_update',
          description: `Updated regulatory thresholds based on ${regionSystem} standards`,
          climate: captureClimateSnapshot()
        });
      }
    } catch (error) {
      console.error('Error fetching regulatory thresholds:', error);
    }
  }, [regulatoryThresholds, addToHistory, captureClimateSnapshot]);

  // Update emission factors when region system changes
  useEffect(() => {
    fetchRegulatoryThresholds(regionSystem);
  }, [regionSystem, fetchRegulatoryThresholds]);

  // Update asset carbon intensities based on location
  const updateAssetCarbonIntensitiesByLocation = useCallback(async (zoneId, coords) => {
    // Get assets for this zone
    const assets = zoneAssets[zoneId] || [];

    if (assets.length === 0) return;

    // Process each asset
    for (const asset of assets) {
      await fetchAssetCarbonIntensity(asset, coords);
    }

    // Add to history
    addToHistory({
      action: 'zone_assets_carbon_intensity_update',
      description: `Updated carbon intensities for all assets in Zone ${zoneId}`,
      climate: captureClimateSnapshot()
    });
  }, [zoneAssets, fetchAssetCarbonIntensity, addToHistory, captureClimateSnapshot]);

  // Synchronize coordinate and climate data
  const synchronizeCoordinateClimate = useCallback(async (zoneId) => {
    const coords = zoneCoordinates[zoneId];

    if (!coords) return;

    // First, fetch location facts to update emission factors
    await fetchLocationFacts(coords);

    // Then, update asset carbon intensities based on location
    await updateAssetCarbonIntensitiesByLocation(zoneId, coords);

    // Add to history
    addToHistory({
      action: 'coordinate_climate_sync',
      description: `Synchronized climate data with coordinates for Zone ${zoneId}`,
      climate: captureClimateSnapshot()
    });
  }, [zoneCoordinates, fetchLocationFacts, updateAssetCarbonIntensitiesByLocation, addToHistory, captureClimateSnapshot]);

  return {
    // State
    hardToDecarbonizeSectors,
    emissionFactors,
    emissionUnits,
    hydrogenGateDefinition,
    regulatoryThresholds,
    regionSystem,
    zoneCoordinates,
    zoneAssets,
    locationFacts,
    history,
    historyIndex,

    // Actions
    handleCoordinateChange,
    handleAssetChange,
    handleEmissionFactorChange,
    handleToggleHardToDecarbonize,
    handleUnitChange,
    handleRegionSystemChange,
    undo,
    redo,
    exportConfiguration,
    importConfiguration,
    fetchLocationFacts,
    fetchRegulatoryThresholds,
    fetchAssetCarbonIntensity,
    updateAssetCarbonIntensitiesByLocation,
    synchronizeCoordinateClimate
  };
}

export default ProcessEconomics;
