// ClimateModuleEnhanced.js
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import CoordinateContainerEnhanced from './coordinate-container-enhanced';
import { getAPIPrecedenceData } from '../find_factual_precedence/components/modules/FactualPrecedence/APIFactualPrecedence';
import './styles/ClimateModuleEnhanced.css';

/**
 * ClimateModuleEnhanced Component
 * 
 * Enhanced version of the ClimateModule component that adds multi-zone selection
 * capabilities and boundary file downloads.
 * 
 * This component extends the scaling system to track carbon footprints
 * of scaling items groups at the zone-cost component item level, and adds
 * support for working with multiple zones spanning a convex area.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.scalingGroups - Array of scaling groups
 * @param {Object} props.versions - Versions configuration
 * @param {Object} props.zones - Zones configuration
 * @param {Function} props.onCarbonFootprintChange - Callback when carbon footprint values change
 * @param {Boolean} props.showCoordinateComponent - Whether to show the coordinate component
 */
const ClimateModuleEnhanced = ({ 
  scalingGroups = [], 
  versions = { active: 'v1', list: ['v1'] },
  zones = { active: 'z1', list: ['z1'] },
  onCarbonFootprintChange = () => {},
  showCoordinateComponent = true
}) => {
  // Reuse all state from the original ClimateModule component
  const [carbonFootprints, setCarbonFootprints] = useState({});

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

  const [hydrogenGateDefinition, setHydrogenGateDefinition] = useState({
    scope1Keywords: ['hydrogen production', 'electrolysis', 'reforming', 'compression', 'purification'],
    scope2Keywords: ['electricity', 'power', 'grid', 'energy purchase'],
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
    current: 'SI',
    SI: {
      name: 'kg CO₂e',
      conversionFactor: 1.0
    },
    Field: {
      name: 'lb CO₂e',
      conversionFactor: 2.20462
    }
  });

  const [regulatoryThresholds, setRegulatoryThresholds] = useState({
    local: {
      name: 'Local Regulations',
      enabled: true,
      threshold: 1000,
      description: 'City/County level emissions reporting requirements'
    },
    state: {
      name: 'State Regulations',
      enabled: true,
      threshold: 10000,
      description: 'State level emissions reporting requirements'
    },
    federal: {
      name: 'Federal Regulations',
      enabled: true,
      threshold: 25000,
      description: 'Federal level emissions reporting requirements'
    }
  });

  const [complianceStatus, setComplianceStatus] = useState({
    overall: 'compliant',
    local: 'compliant',
    state: 'compliant',
    federal: 'compliant',
    details: {}
  });

  const [carbonIncentives, setCarbonIncentives] = useState({
    available: false,
    loading: false,
    error: null,
    data: {
      local: [],
      state: [],
      federal: []
    },
    filtered: {
      local: [],
      state: [],
      federal: []
    },
    totalValue: 0
  });

  const [regionSystem, setRegionSystem] = useState('SI');

  // Enhanced state for multi-zone support
  const [zoneGenerationMode, setZoneGenerationMode] = useState('standard'); // 'standard', 'grid', 'custom'
  const [zoneGenerationOptions, setZoneGenerationOptions] = useState({
    gridSize: { rows: 3, columns: 3 },
    zoneSize: { width: 1, height: 1, unit: 'km' },
    zoneShape: 'square', // 'square', 'hexagon', 'circle'
    namingPattern: 'Zone-{x}-{y}',
    nameStartIndex: 1
  });
  const [generatedZones, setGeneratedZones] = useState([]);
  const [zoneClusterAnalysis, setZoneClusterAnalysis] = useState({
    enabled: false,
    clusters: [],
    analysisType: 'emissions', // 'emissions', 'regulatory', 'combined'
    clusterCount: 3
  });

  // Calculate carbon footprint for all scaling items across all zones and versions
  const calculateCarbonFootprints = useCallback(() => {
    const newCarbonFootprints = {};

    // Iterate through all versions
    versions.list.forEach(versionId => {
      if (!newCarbonFootprints[versionId]) {
        newCarbonFootprints[versionId] = {};
      }

      // Iterate through all zones
      zones.list.forEach(zoneId => {
        if (!newCarbonFootprints[versionId][zoneId]) {
          newCarbonFootprints[versionId][zoneId] = {};
        }

        // Get zone assets if available
        const zoneAssets = zones.metadata?.[zoneId]?.assets || [];

        // Create a special group for zone assets if there are any
        if (zoneAssets.length > 0 && !newCarbonFootprints[versionId][zoneId]['zone-assets']) {
          newCarbonFootprints[versionId][zoneId]['zone-assets'] = {
            groupId: 'zone-assets',
            groupName: 'Zone Assets',
            totalCarbonFootprint: 0,
            hardToDecarbonizeFootprint: 0,
            standardFootprint: 0,
            scope1Footprint: 0,
            scope2Footprint: 0,
            scope3Footprint: 0,
            items: {}
          };

          // Calculate carbon footprint for each asset in the zone
          let assetGroupTotal = 0;
          let assetHardToDecarbonizeTotal = 0;
          let assetStandardTotal = 0;
          let assetScope1Total = 0;
          let assetScope2Total = 0;
          let assetScope3Total = 0;

          zoneAssets.forEach(asset => {
            // Calculate carbon footprint based on asset's carbon intensity
            const assetCarbonFootprint = asset.carbonIntensity || 0;

            // Store the carbon footprint for this asset
            newCarbonFootprints[versionId][zoneId]['zone-assets'].items[asset.id] = {
              itemId: asset.id,
              itemLabel: asset.name,
              baseValue: 1, // Assets don't have a base value like scaling items
              scaledValue: 1,
              emissionFactor: asset.carbonIntensity || 0,
              carbonFootprint: assetCarbonFootprint,
              isHardToDecarbonize: asset.isHardToDecarbonize || false,
              scope: 1, // Assets are typically scope 1 (direct emissions)
              carbonFootprintSI: assetCarbonFootprint,
              carbonFootprintField: assetCarbonFootprint * emissionUnits.Field.conversionFactor
            };

            // Add to appropriate totals
            assetGroupTotal += assetCarbonFootprint;
            if (asset.isHardToDecarbonize) {
              assetHardToDecarbonizeTotal += assetCarbonFootprint;
            } else {
              assetStandardTotal += assetCarbonFootprint;
            }

            // Assets are typically scope 1 (direct emissions)
            assetScope1Total += assetCarbonFootprint;
          });

          // Update asset group totals
          newCarbonFootprints[versionId][zoneId]['zone-assets'].totalCarbonFootprint = assetGroupTotal;
          newCarbonFootprints[versionId][zoneId]['zone-assets'].hardToDecarbonizeFootprint = assetHardToDecarbonizeTotal;
          newCarbonFootprints[versionId][zoneId]['zone-assets'].standardFootprint = assetStandardTotal;
          newCarbonFootprints[versionId][zoneId]['zone-assets'].scope1Footprint = assetScope1Total;
          newCarbonFootprints[versionId][zoneId]['zone-assets'].scope2Footprint = assetScope2Total;
          newCarbonFootprints[versionId][zoneId]['zone-assets'].scope3Footprint = assetScope3Total;
          newCarbonFootprints[versionId][zoneId]['zone-assets'].totalCarbonFootprintSI = assetGroupTotal;
          newCarbonFootprints[versionId][zoneId]['zone-assets'].totalCarbonFootprintField = 
            assetGroupTotal * emissionUnits.Field.conversionFactor;
        }

        // Iterate through all scaling groups
        scalingGroups.forEach(group => {
          if (!newCarbonFootprints[versionId][zoneId][group.id]) {
            newCarbonFootprints[versionId][zoneId][group.id] = {
              groupId: group.id,
              groupName: group.name,
              totalCarbonFootprint: 0,
              hardToDecarbonizeFootprint: 0,
              standardFootprint: 0,
              scope1Footprint: 0,
              scope2Footprint: 0,
              scope3Footprint: 0,
              items: {}
            };
          }

          // Calculate carbon footprint for each item in the group
          let groupTotal = 0;
          let hardToDecarbonizeTotal = 0;
          let standardTotal = 0;
          let scope1Total = 0;
          let scope2Total = 0;
          let scope3Total = 0;

          group.items.forEach(item => {
            // Skip disabled items
            if (!item.enabled) return;

            // Determine the emission factor for this item
            const itemType = item.label.split(' ').slice(0, 2).join(' ');
            const emissionFactor = emissionFactors[itemType] || emissionFactors[item.label] || emissionFactors.default;

            // Calculate carbon footprint based on scaled value and emission factor
            const carbonFootprint = item.scaledValue * emissionFactor;

            // Determine if this item belongs to a hard to decarbonize sector
            const sectorKeywords = Object.keys(hardToDecarbonizeSectors);
            const isHardToDecarbonize = sectorKeywords.some(keyword => 
              item.label.toLowerCase().includes(keyword.toLowerCase()) && 
              hardToDecarbonizeSectors[keyword]
            );

            // Determine the scope based on hydrogen gate definition
            const itemLabelLower = item.label.toLowerCase();
            let scope = 3; // Default to scope 3

            // Check if item matches scope 1 keywords (direct emissions)
            if (hydrogenGateDefinition.scope1Keywords.some(keyword => 
              itemLabelLower.includes(keyword.toLowerCase())
            )) {
              scope = 1;
            } 
            // Check if item matches scope 2 keywords (purchased energy)
            else if (hydrogenGateDefinition.scope2Keywords.some(keyword => 
              itemLabelLower.includes(keyword.toLowerCase())
            )) {
              scope = 2;
            }

            // Store the carbon footprint for this item
            newCarbonFootprints[versionId][zoneId][group.id].items[item.id] = {
              itemId: item.id,
              itemLabel: item.label,
              baseValue: item.baseValue,
              scaledValue: item.scaledValue,
              emissionFactor,
              carbonFootprint,
              isHardToDecarbonize,
              scope,
              // Add unit-specific values
              carbonFootprintSI: carbonFootprint, // kg CO2e (base unit)
              carbonFootprintField: carbonFootprint * emissionUnits.Field.conversionFactor // lb CO2e
            };

            // Add to appropriate totals
            groupTotal += carbonFootprint;
            if (isHardToDecarbonize) {
              hardToDecarbonizeTotal += carbonFootprint;
            } else {
              standardTotal += carbonFootprint;
            }

            // Add to appropriate scope totals
            if (scope === 1) {
              scope1Total += carbonFootprint;
            } else if (scope === 2) {
              scope2Total += carbonFootprint;
            } else {
              scope3Total += carbonFootprint;
            }
          });

          // Update group totals
          newCarbonFootprints[versionId][zoneId][group.id].totalCarbonFootprint = groupTotal;
          newCarbonFootprints[versionId][zoneId][group.id].hardToDecarbonizeFootprint = hardToDecarbonizeTotal;
          newCarbonFootprints[versionId][zoneId][group.id].standardFootprint = standardTotal;
          newCarbonFootprints[versionId][zoneId][group.id].scope1Footprint = scope1Total;
          newCarbonFootprints[versionId][zoneId][group.id].scope2Footprint = scope2Total;
          newCarbonFootprints[versionId][zoneId][group.id].scope3Footprint = scope3Total;

          // Add unit-specific totals
          newCarbonFootprints[versionId][zoneId][group.id].totalCarbonFootprintSI = groupTotal;
          newCarbonFootprints[versionId][zoneId][group.id].totalCarbonFootprintField = 
            groupTotal * emissionUnits.Field.conversionFactor;
        });
      });
    });

    setCarbonFootprints(newCarbonFootprints);
    onCarbonFootprintChange(newCarbonFootprints);

    // Calculate compliance status based on the active version and zone
    calculateComplianceStatus(newCarbonFootprints);
  }, [
    scalingGroups, 
    versions, 
    zones, 
    zones.metadata, 
    emissionFactors, 
    hardToDecarbonizeSectors, 
    emissionUnits, 
    hydrogenGateDefinition,
    onCarbonFootprintChange
  ]);

  // Calculate compliance status based on total emissions and regulatory thresholds
  const calculateComplianceStatus = useCallback((footprints) => {
    const activeVersion = versions.active || versions.list[0];
    const activeZone = zones.active || zones.list[0];
    const activeFootprints = footprints[activeVersion]?.[activeZone] || {};

    // Calculate total emissions across all groups
    const totalEmissions = Object.values(activeFootprints).reduce(
      (total, group) => total + group.totalCarbonFootprint, 
      0
    );

    // Check compliance against each regulatory level
    const newComplianceStatus = {
      details: {
        totalEmissions,
        thresholds: { ...regulatoryThresholds }
      }
    };

    // Local compliance
    if (regulatoryThresholds.local.enabled) {
      if (totalEmissions > regulatoryThresholds.local.threshold) {
        newComplianceStatus.local = 'non-compliant';
      } else if (totalEmissions > regulatoryThresholds.local.threshold * 0.8) {
        newComplianceStatus.local = 'warning';
      } else {
        newComplianceStatus.local = 'compliant';
      }
    } else {
      newComplianceStatus.local = 'not-applicable';
    }

    // State compliance
    if (regulatoryThresholds.state.enabled) {
      if (totalEmissions > regulatoryThresholds.state.threshold) {
        newComplianceStatus.state = 'non-compliant';
      } else if (totalEmissions > regulatoryThresholds.state.threshold * 0.8) {
        newComplianceStatus.state = 'warning';
      } else {
        newComplianceStatus.state = 'compliant';
      }
    } else {
      newComplianceStatus.state = 'not-applicable';
    }

    // Federal compliance
    if (regulatoryThresholds.federal.enabled) {
      if (totalEmissions > regulatoryThresholds.federal.threshold) {
        newComplianceStatus.federal = 'non-compliant';
      } else if (totalEmissions > regulatoryThresholds.federal.threshold * 0.8) {
        newComplianceStatus.federal = 'warning';
      } else {
        newComplianceStatus.federal = 'compliant';
      }
    } else {
      newComplianceStatus.federal = 'not-applicable';
    }

    // Determine overall compliance status (worst case)
    if (
      newComplianceStatus.local === 'non-compliant' ||
      newComplianceStatus.state === 'non-compliant' ||
      newComplianceStatus.federal === 'non-compliant'
    ) {
      newComplianceStatus.overall = 'non-compliant';
    } else if (
      newComplianceStatus.local === 'warning' ||
      newComplianceStatus.state === 'warning' ||
      newComplianceStatus.federal === 'warning'
    ) {
      newComplianceStatus.overall = 'warning';
    } else {
      newComplianceStatus.overall = 'compliant';
    }

    setComplianceStatus(newComplianceStatus);

    // After calculating compliance status, fetch carbon incentives
    fetchCarbonIncentives(totalEmissions, activeZone);
  }, [versions, zones, zones.metadata, regulatoryThresholds]);

  // Fetch carbon incentives data from FactualPrecedence module
  const fetchCarbonIncentives = useCallback(async (totalEmissions, zoneId) => {
    // Skip if already loading
    if (carbonIncentives.loading) return;

    setCarbonIncentives(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      // Create a mock form value for the API call
      const formValue = {
        label: `Carbon Incentives for Zone ${zoneId}`,
        value: totalEmissions.toString(),
        type: 'carbon-incentives',
        remarks: `Total emissions: ${totalEmissions} kg CO2e, Region: ${regionSystem}`
      };

      // Call the FactualPrecedence API
      const incentivesData = await getAPIPrecedenceData('carbon-incentives', formValue);

      if (!incentivesData) {
        throw new Error('No incentives data available');
      }

      // Process the incentives data
      const processedData = {
        local: [],
        state: [],
        federal: []
      };

      // Extract incentives by level
      if (incentivesData.examples) {
        incentivesData.examples.forEach(example => {
          const level = example.entity.toLowerCase();

          // Determine which level this incentive belongs to
          if (level.includes('local') || level.includes('city') || level.includes('county')) {
            processedData.local.push({
              id: `local-${processedData.local.length}`,
              name: example.source || 'Local Incentive',
              description: example.description || 'Carbon reduction incentive at local level',
              value: parseFloat(example.value) || 0,
              unit: example.unit || '$',
              year: example.year || new Date().getFullYear(),
              eligibility: example.eligibility || 'All carbon reduction projects',
              region: example.region || 'All'
            });
          } else if (level.includes('state') || level.includes('provincial')) {
            processedData.state.push({
              id: `state-${processedData.state.length}`,
              name: example.source || 'State Incentive',
              description: example.description || 'Carbon reduction incentive at state level',
              value: parseFloat(example.value) || 0,
              unit: example.unit || '$',
              year: example.year || new Date().getFullYear(),
              eligibility: example.eligibility || 'All carbon reduction projects',
              region: example.region || 'All'
            });
          } else if (level.includes('federal') || level.includes('national')) {
            processedData.federal.push({
              id: `federal-${processedData.federal.length}`,
              name: example.source || 'Federal Incentive',
              description: example.description || 'Carbon reduction incentive at federal level',
              value: parseFloat(example.value) || 0,
              unit: example.unit || '$',
              year: example.year || new Date().getFullYear(),
              eligibility: example.eligibility || 'All carbon reduction projects',
              region: example.region || 'All'
            });
          }
        });
      }

      // If no data was found, create fallback data
      if (!processedData.local.length && !processedData.state.length && !processedData.federal.length) {
        // Create fallback data based on region system
        if (regionSystem === 'SI') {
          processedData.local.push({
            id: 'local-fallback',
            name: 'Local Carbon Tax Rebate',
            description: 'Rebate for local carbon tax payments based on emissions reduction',
            value: totalEmissions > 5000 ? 0 : totalEmissions * 0.02,
            unit: '$',
            year: new Date().getFullYear(),
            eligibility: 'Emissions under 5,000 kg CO2e',
            region: 'All'
          });

          processedData.state.push({
            id: 'state-fallback',
            name: 'State Green Energy Credit',
            description: 'Credit for implementing green energy solutions',
            value: totalEmissions > 15000 ? 0 : 500,
            unit: '$',
            year: new Date().getFullYear(),
            eligibility: 'Emissions under 15,000 kg CO2e',
            region: 'All'
          });

          processedData.federal.push({
            id: 'federal-fallback',
            name: 'Federal Carbon Reduction Incentive',
            description: 'Incentive for significant carbon footprint reduction',
            value: totalEmissions > 25000 ? 0 : 1000,
            unit: '$',
            year: new Date().getFullYear(),
            eligibility: 'Emissions under 25,000 kg CO2e',
            region: 'All'
          });
        } else { // Europe system
          processedData.local.push({
            id: 'local-fallback-eu',
            name: 'Municipal Climate Fund',
            description: 'Local funding for climate-friendly projects',
            value: totalEmissions > 5000 ? 0 : totalEmissions * 0.03,
            unit: '€',
            year: new Date().getFullYear(),
            eligibility: 'Emissions under 5,000 kg CO2e',
            region: 'Europe'
          });

          processedData.state.push({
            id: 'state-fallback-eu',
            name: 'Regional Carbon Trading Credit',
            description: 'Credit from regional carbon trading scheme',
            value: totalEmissions > 15000 ? 0 : 600,
            unit: '€',
            year: new Date().getFullYear(),
            eligibility: 'Emissions under 15,000 kg CO2e',
            region: 'Europe'
          });

          processedData.federal.push({
            id: 'federal-fallback-eu',
            name: 'EU Emissions Trading System Benefit',
            description: 'Benefit from EU ETS for low-emission operations',
            value: totalEmissions > 25000 ? 0 : 1200,
            unit: '€',
            year: new Date().getFullYear(),
            eligibility: 'Emissions under 25,000 kg CO2e',
            region: 'Europe'
          });
        }
      }

      // Filter incentives based on compliance status and region
      const filteredData = {
        local: processedData.local.filter(incentive => {
          // Filter by region if specified
          if (incentive.region !== 'All' && incentive.region !== regionSystem) {
            return false;
          }

          // Filter by compliance status
          if (complianceStatus.local === 'non-compliant') {
            return false; // No incentives for non-compliant zones
          }

          // Check eligibility based on emissions
          if (incentive.eligibility.includes('under') && 
              incentive.eligibility.match(/under ([\d,]+)/)) {
            const limit = parseFloat(incentive.eligibility.match(/under ([\d,]+)/)[1].replace(',', ''));
            return totalEmissions <= limit;
          }

          return true;
        }),

        state: processedData.state.filter(incentive => {
          // Filter by region if specified
          if (incentive.region !== 'All' && incentive.region !== regionSystem) {
            return false;
          }

          // Filter by compliance status
          if (complianceStatus.state === 'non-compliant') {
            return false; // No incentives for non-compliant zones
          }

          // Check eligibility based on emissions
          if (incentive.eligibility.includes('under') && 
              incentive.eligibility.match(/under ([\d,]+)/)) {
            const limit = parseFloat(incentive.eligibility.match(/under ([\d,]+)/)[1].replace(',', ''));
            return totalEmissions <= limit;
          }

          return true;
        }),

        federal: processedData.federal.filter(incentive => {
          // Filter by region if specified
          if (incentive.region !== 'All' && incentive.region !== regionSystem) {
            return false;
          }

          // Filter by compliance status
          if (complianceStatus.federal === 'non-compliant') {
            return false; // No incentives for non-compliant zones
          }

          // Check eligibility based on emissions
          if (incentive.eligibility.includes('under') && 
              incentive.eligibility.match(/under ([\d,]+)/)) {
            const limit = parseFloat(incentive.eligibility.match(/under ([\d,]+)/)[1].replace(',', ''));
            return totalEmissions <= limit;
          }

          return true;
        })
      };

      // Calculate total value of all applicable incentives
      const totalValue = [
        ...filteredData.local,
        ...filteredData.state,
        ...filteredData.federal
      ].reduce((sum, incentive) => sum + incentive.value, 0);

      // Update state with processed data
      setCarbonIncentives({
        available: true,
        loading: false,
        error: null,
        data: processedData,
        filtered: filteredData,
        totalValue
      });
    } catch (error) {
      console.error('Error fetching carbon incentives:', error);
      setCarbonIncentives(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch carbon incentives'
      }));
    }
  }, [carbonIncentives.loading, complianceStatus, regionSystem]);

  // Handle zone generation mode change
  const handleZoneGenerationModeChange = useCallback((mode) => {
    setZoneGenerationMode(mode);
  }, []);

  // Handle zone generation option change
  const handleZoneGenerationOptionChange = useCallback((option, value) => {
    setZoneGenerationOptions(prev => {
      if (option.includes('.')) {
        const [parent, child] = option.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [option]: value
      };
    });
  }, []);

  // Handle zone cluster analysis option change
  const handleZoneClusterAnalysisChange = useCallback((option, value) => {
    setZoneClusterAnalysis(prev => ({
      ...prev,
      [option]: value
    }));
  }, []);

  // Calculate carbon footprints whenever scaling groups, versions, zones, or emission factors change
  useEffect(() => {
    calculateCarbonFootprints();
  }, [scalingGroups, versions, zones, zones.metadata, emissionFactors, calculateCarbonFootprints]);

  // Handle emission factor change
  const handleEmissionFactorChange = (itemType, value) => {
    setEmissionFactors(prev => ({
      ...prev,
      [itemType]: parseFloat(value) || 0
    }));
  };

  // Handle toggle for hard to decarbonize sector
  const handleToggleHardToDecarbonize = (sector) => {
    setHardToDecarbonizeSectors(prev => ({
      ...prev,
      [sector]: !prev[sector]
    }));
  };

  // Handle unit change
  const handleUnitChange = (unitType) => {
    setEmissionUnits(prev => ({
      ...prev,
      current: unitType
    }));
  };

  // Handle regulatory threshold change
  const handleThresholdChange = (level, value) => {
    setRegulatoryThresholds(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        threshold: parseFloat(value) || 0
      }
    }));
  };

  // Handle toggle for regulatory level
  const handleToggleRegulatory = (level) => {
    setRegulatoryThresholds(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        enabled: !prev[level].enabled
      }
    }));
  };

  // Get active version and zone
  const activeVersion = versions.active || versions.list[0];
  const activeZone = zones.active || zones.list[0];

  // Get carbon footprints for active version and zone
  const activeCarbonFootprints = carbonFootprints[activeVersion]?.[activeZone] || {};

  // Calculate total carbon footprint across all groups
  const totalCarbonFootprint = Object.values(activeCarbonFootprints).reduce(
    (total, group) => total + group.totalCarbonFootprint, 
    0
  );

  // Calculate hard to decarbonize and standard footprints
  const totalHardToDecarbonizeFootprint = Object.values(activeCarbonFootprints).reduce(
    (total, group) => total + (group.hardToDecarbonizeFootprint || 0), 
    0
  );

  const totalStandardFootprint = Object.values(activeCarbonFootprints).reduce(
    (total, group) => total + (group.standardFootprint || 0), 
    0
  );

  // Calculate scope 1, 2, and 3 footprints
  const totalScope1Footprint = Object.values(activeCarbonFootprints).reduce(
    (total, group) => total + (group.scope1Footprint || 0), 
    0
  );

  const totalScope2Footprint = Object.values(activeCarbonFootprints).reduce(
    (total, group) => total + (group.scope2Footprint || 0), 
    0
  );

  const totalScope3Footprint = Object.values(activeCarbonFootprints).reduce(
    (total, group) => total + (group.scope3Footprint || 0), 
    0
  );

  // Get the current unit name and conversion factor
  const currentUnitName = emissionUnits[emissionUnits.current].name;
  const currentUnitFactor = emissionUnits[emissionUnits.current].conversionFactor;

  // Format a value with the current unit
  const formatWithUnit = (value) => {
    const convertedValue = emissionUnits.current === 'SI' 
      ? value 
      : value * emissionUnits.Field.conversionFactor;
    return `${convertedValue.toFixed(2)} ${currentUnitName}`;
  };

  // JSX for the zone generation panel
  const renderZoneGenerationPanel = () => {
    return (
      <div className="climate-module-zone-panel">
        <div className="zone-panel-header">
          <h3>Multi-Zone Generation</h3>
          <div className="zone-panel-modes">
            <button 
              className={`zone-panel-mode ${zoneGenerationMode === 'standard' ? 'active' : ''}`}
              onClick={() => handleZoneGenerationModeChange('standard')}
            >
              Standard Grid
            </button>
            <button 
              className={`zone-panel-mode ${zoneGenerationMode === 'custom' ? 'active' : ''}`}
              onClick={() => handleZoneGenerationModeChange('custom')}
            >
              Custom Shape
            </button>
          </div>
        </div>

        <div className="zone-panel-content">
          {zoneGenerationMode === 'standard' && (
            <div className="zone-grid-options">
              <div className="zone-grid-options-group">
                <label>Grid Size:</label>
                <div className="grid-size-inputs">
                  <div className="grid-size-input">
                    <label>Rows:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="20"
                      value={zoneGenerationOptions.gridSize.rows}
                      onChange={(e) => handleZoneGenerationOptionChange('gridSize.rows', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="grid-size-input">
                    <label>Columns:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="20"
                      value={zoneGenerationOptions.gridSize.columns}
                      onChange={(e) => handleZoneGenerationOptionChange('gridSize.columns', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </div>

              <div className="zone-grid-options-group">
                <label>Zone Size:</label>
                <div className="zone-size-inputs">
                  <div className="zone-size-input">
                    <label>Width:</label>
                    <input 
                      type="number" 
                      min="0.1" 
                      step="0.1"
                      value={zoneGenerationOptions.zoneSize.width}
                      onChange={(e) => handleZoneGenerationOptionChange('zoneSize.width', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div className="zone-size-input">
                    <label>Height:</label>
                    <input 
                      type="number" 
                      min="0.1" 
                      step="0.1"
                      value={zoneGenerationOptions.zoneSize.height}
                      onChange={(e) => handleZoneGenerationOptionChange('zoneSize.height', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div className="zone-size-input">
                    <label>Unit:</label>
                    <select
                      value={zoneGenerationOptions.zoneSize.unit}
                      onChange={(e) => handleZoneGenerationOptionChange('zoneSize.unit', e.target.value)}
                    >
                      <option value="m">Meters</option>
                      <option value="km">Kilometers</option>
                      <option value="mi">Miles</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="zone-grid-options-group">
                <label>Zone Shape:</label>
                <div className="zone-shape-options">
                  <label className="zone-shape-option">
                    <input 
                      type="radio" 
                      name="zoneShape"
                      value="square" 
                      checked={zoneGenerationOptions.zoneShape === 'square'}
                      onChange={() => handleZoneGenerationOptionChange('zoneShape', 'square')}
                    />
                    <span className="shape-icon square"></span>
                    <span>Square</span>
                  </label>
                  <label className="zone-shape-option">
                    <input 
                      type="radio" 
                      name="zoneShape"
                      value="hexagon" 
                      checked={zoneGenerationOptions.zoneShape === 'hexagon'}
                      onChange={() => handleZoneGenerationOptionChange('zoneShape', 'hexagon')}
                    />
                    <span className="shape-icon hexagon"></span>
                    <span>Hexagon</span>
                  </label>
                  <label className="zone-shape-option">
                    <input 
                      type="radio" 
                      name="zoneShape"
                      value="circle" 
                      checked={zoneGenerationOptions.zoneShape === 'circle'}
                      onChange={() => handleZoneGenerationOptionChange('zoneShape', 'circle')}
                    />
                    <span className="shape-icon circle"></span>
                    <span>Circle</span>
                  </label>
                </div>
              </div>

              <div className="zone-grid-options-group">
                <label>Naming Pattern:</label>
                <input 
                  type="text" 
                  value={zoneGenerationOptions.namingPattern}
                  onChange={(e) => handleZoneGenerationOptionChange('namingPattern', e.target.value)}
                  placeholder="Zone-{x}-{y}"
                />
                <div className="naming-info">
                  <span>Use {'{x}'} for column index and {'{y}'} for row index</span>
                </div>
              </div>

              <div className="zone-grid-options-group">
                <label>Start Index:</label>
                <input 
                  type="number" 
                  min="0" 
                  value={zoneGenerationOptions.nameStartIndex}
                  onChange={(e) => handleZoneGenerationOptionChange('nameStartIndex', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="zone-grid-action">
                <button className="generate-zones-btn">
                  Generate {zoneGenerationOptions.gridSize.rows * zoneGenerationOptions.gridSize.columns} Zones
                </button>
              </div>
            </div>
          )}

          {zoneGenerationMode === 'custom' && (
            <div className="zone-custom-options">
              <p>Select an area on the map to define a custom zone shape.</p>
              <p>Use the Multi-Zone Selection tool to draw areas and generate zones.</p>

              <div className="zone-custom-link">
                <button 
                  className="go-to-multi-zone-btn"
                  onClick={() => {
                    // Scroll to the coordinate component section
                    const coordinateSection = document.querySelector('.coordinate-container-enhanced');
                    if (coordinateSection) {
                      coordinateSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Go to Multi-Zone Selection Tool
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // JSX for zone cluster analysis panel
  const renderZoneClusterAnalysisPanel = () => {
    return (
      <div className="climate-module-cluster-panel">
        <div className="cluster-panel-header">
          <h3>Zone Cluster Analysis</h3>
          <div className="cluster-toggle">
            <label className="cluster-toggle-label">
              <input 
                type="checkbox" 
                checked={zoneClusterAnalysis.enabled}
                onChange={() => handleZoneClusterAnalysisChange('enabled', !zoneClusterAnalysis.enabled)}
              />
              <span className="cluster-toggle-slider"></span>
              <span>Enable Analysis</span>
            </label>
          </div>
        </div>

        <div className="cluster-panel-content">
          {zoneClusterAnalysis.enabled ? (
            <>
              <div className="cluster-options">
                <div className="cluster-option-group">
                  <label>Analysis Type:</label>
                  <select
                    value={zoneClusterAnalysis.analysisType}
                    onChange={(e) => handleZoneClusterAnalysisChange('analysisType', e.target.value)}
                  >
                    <option value="emissions">Emissions Based</option>
                    <option value="regulatory">Regulatory Compliance</option>
                    <option value="combined">Combined Factors</option>
                  </select>
                </div>

                <div className="cluster-option-group">
                  <label>Number of Clusters:</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={zoneClusterAnalysis.clusterCount}
                    onChange={(e) => handleZoneClusterAnalysisChange('clusterCount', parseInt(e.target.value) || 3)}
                  />
                </div>

                <div className="cluster-action">
                  <button className="run-analysis-btn">
                    Run Cluster Analysis
                  </button>
                </div>
              </div>

              <div className="cluster-results">
                <p>Analysis will run across {zones.list.length} zones and identify patterns based on {zoneClusterAnalysis.analysisType} data.</p>

                {zoneClusterAnalysis.clusters.length > 0 ? (
                  <div className="cluster-visualization">
                    <h4>Cluster Results</h4>
                    {/* Visualization would go here */}
                    <p>Cluster visualization would appear here after analysis.</p>
                  </div>
                ) : (
                  <div className="no-clusters">
                    <p>No clusters have been generated yet. Click "Run Cluster Analysis" to begin.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="cluster-disabled">
              <p>Zone cluster analysis is currently disabled. Enable it to identify patterns across zones.</p>
              <p>This analysis can help identify:</p>
              <ul>
                <li>Groups of zones with similar emission profiles</li>
                <li>Regulatory compliance clusters</li>
                <li>Areas that may benefit from coordinated emissions reduction strategies</li>
              </ul>
              <button 
                className="enable-cluster-btn"
                onClick={() => handleZoneClusterAnalysisChange('enabled', true)}
              >
                Enable Cluster Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="climate-module-enhanced">
      <div className="climate-module-header">
        <div className="climate-module-header-top">
          <h3>Climate Module - Enhanced Multi-Zone Carbon Footprint Tracking</h3>
          <div className="climate-module-controls">
            <div className="climate-module-unit-toggle">
              <span>Units:</span>
              <div className="climate-module-unit-buttons">
                <button 
                  className={`climate-module-unit-button ${emissionUnits.current === 'SI' ? 'active' : ''}`}
                  onClick={() => handleUnitChange('SI')}
                >
                  SI ({emissionUnits.SI.name})
                </button>
                <button 
                  className={`climate-module-unit-button ${emissionUnits.current === 'Field' ? 'active' : ''}`}
                  onClick={() => handleUnitChange('Field')}
                >
                  Field ({emissionUnits.Field.name})
                </button>
              </div>
            </div>

            <div className="climate-module-region-toggle">
              <span>Region:</span>
              <div className="climate-module-region-buttons">
                <button 
                  className={`climate-module-region-button ${regionSystem === 'SI' ? 'active' : ''}`}
                  onClick={() => setRegionSystem('SI')}
                  title="Standard International system with USD currency"
                >
                  SI/USD
                </button>
                <button 
                  className={`climate-module-region-button ${regionSystem === 'Europe' ? 'active' : ''}`}
                  onClick={() => setRegionSystem('Europe')}
                  title="European system with EUR currency"
                >
                  Europe/EUR
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="climate-module-summary">
          <div className="climate-module-total">
            <span>Total Carbon Footprint:</span>
            <span className="climate-module-value">
              {formatWithUnit(totalCarbonFootprint)}
            </span>
          </div>
          <div className="climate-module-version-zone">
            <span>Version: {activeVersion}</span>
            <span>Zone: {activeZone}</span>
            <span>Total Zones: {zones.list.length}</span>
          </div>
        </div>
      </div>

      {/* Zone Generation and Cluster Analysis Panels */}
      <div className="climate-module-enhanced-panels">
        {renderZoneGenerationPanel()}
        {renderZoneClusterAnalysisPanel()}
      </div>

      {/* Regulatory Compliance Status */}
      <div className={`climate-module-compliance climate-module-compliance-${complianceStatus.overall}`}>
        <div className="climate-module-compliance-header">
          <h4>Regulatory Compliance Status</h4>
          <div className={`climate-module-compliance-badge ${complianceStatus.overall}`}>
            {complianceStatus.overall === 'compliant' && 'Compliant'}
            {complianceStatus.overall === 'warning' && 'Warning'}
            {complianceStatus.overall === 'non-compliant' && 'Non-Compliant'}
          </div>
        </div>
        <div className="climate-module-compliance-levels">
          <div className={`climate-module-compliance-level ${complianceStatus.local}`}>
            <span className="climate-module-compliance-level-name">Local</span>
            <span className="climate-module-compliance-level-status">
              {complianceStatus.local === 'compliant' && '✓'}
              {complianceStatus.local === 'warning' && '⚠️'}
              {complianceStatus.local === 'non-compliant' && '✗'}
              {complianceStatus.local === 'not-applicable' && 'N/A'}
            </span>
          </div>
          <div className={`climate-module-compliance-level ${complianceStatus.state}`}>
            <span className="climate-module-compliance-level-name">State</span>
            <span className="climate-module-compliance-level-status">
              {complianceStatus.state === 'compliant' && '✓'}
              {complianceStatus.state === 'warning' && '⚠️'}
              {complianceStatus.state === 'non-compliant' && '✗'}
              {complianceStatus.state === 'not-applicable' && 'N/A'}
            </span>
          </div>
          <div className={`climate-module-compliance-level ${complianceStatus.federal}`}>
            <span className="climate-module-compliance-level-name">Federal</span>
            <span className="climate-module-compliance-level-status">
              {complianceStatus.federal === 'compliant' && '✓'}
              {complianceStatus.federal === 'warning' && '⚠️'}
              {complianceStatus.federal === 'non-compliant' && '✗'}
              {complianceStatus.federal === 'not-applicable' && 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Carbon Incentives Channel */}
      <div className="climate-module-incentives">
        <div className="climate-module-incentives-header">
          <h4>Carbon Incentives Channel</h4>
          {carbonIncentives.available && (
            <div className="climate-module-incentives-total">
              Total Available: 
              <span className="climate-module-incentives-value">
                {regionSystem === 'SI' ? '$' : '€'}{carbonIncentives.totalValue.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {carbonIncentives.loading ? (
          <div className="climate-module-incentives-loading">
            Loading carbon incentives data...
          </div>
        ) : carbonIncentives.error ? (
          <div className="climate-module-incentives-error">
            Error: {carbonIncentives.error}
          </div>
        ) : !carbonIncentives.available ? (
          <div className="climate-module-incentives-empty">
            No carbon incentives data available. Ensure compliance with regulatory requirements to qualify for incentives.
          </div>
        ) : (
          <div className="climate-module-incentives-content">
            {/* Local Incentives */}
            <div className="climate-module-incentives-section">
              <div className="climate-module-incentives-section-header">
                <h5>Local Incentives</h5>
                <span className="climate-module-incentives-count">
                  {carbonIncentives.filtered.local.length} available
                </span>
              </div>

              {carbonIncentives.filtered.local.length === 0 ? (
                <div className="climate-module-incentives-none">
                  No local incentives available
                  {complianceStatus.local === 'non-compliant' && 
                    ' - Achieve local compliance to qualify for incentives'}
                </div>
              ) : (
                <div className="climate-module-incentives-list">
                  {carbonIncentives.filtered.local.map(incentive => (
                    <div key={incentive.id} className="climate-module-incentive-item">
                      <div className="climate-module-incentive-name">
                        {incentive.name}
                        <span className="climate-module-incentive-year">
                          ({incentive.year})
                        </span>
                      </div>
                      <div className="climate-module-incentive-description">
                        {incentive.description}
                      </div>
                      <div className="climate-module-incentive-details">
                        <span className="climate-module-incentive-eligibility">
                          {incentive.eligibility}
                        </span>
                        <span className="climate-module-incentive-value">
                          {incentive.unit}{incentive.value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* State Incentives */}
            <div className="climate-module-incentives-section">
              <div className="climate-module-incentives-section-header">
                <h5>State Incentives</h5>
                <span className="climate-module-incentives-count">
                  {carbonIncentives.filtered.state.length} available
                </span>
              </div>

              {carbonIncentives.filtered.state.length === 0 ? (
                <div className="climate-module-incentives-none">
                  No state incentives available
                  {complianceStatus.state === 'non-compliant' && 
                    ' - Achieve state compliance to qualify for incentives'}
                </div>
              ) : (
                <div className="climate-module-incentives-list">
                  {carbonIncentives.filtered.state.map(incentive => (
                    <div key={incentive.id} className="climate-module-incentive-item">
                      <div className="climate-module-incentive-name">
                        {incentive.name}
                        <span className="climate-module-incentive-year">
                          ({incentive.year})
                        </span>
                      </div>
                      <div className="climate-module-incentive-description">
                        {incentive.description}
                      </div>
                      <div className="climate-module-incentive-details">
                        <span className="climate-module-incentive-eligibility">
                          {incentive.eligibility}
                        </span>
                        <span className="climate-module-incentive-value">
                          {incentive.unit}{incentive.value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Federal Incentives */}
            <div className="climate-module-incentives-section">
              <div className="climate-module-incentives-section-header">
                <h5>Federal Incentives</h5>
                <span className="climate-module-incentives-count">
                  {carbonIncentives.filtered.federal.length} available
                </span>
              </div>

              {carbonIncentives.filtered.federal.length === 0 ? (
                <div className="climate-module-incentives-none">
                  No federal incentives available
                  {complianceStatus.federal === 'non-compliant' && 
                    ' - Achieve federal compliance to qualify for incentives'}
                </div>
              ) : (
                <div className="climate-module-incentives-list">
                  {carbonIncentives.filtered.federal.map(incentive => (
                    <div key={incentive.id} className="climate-module-incentive-item">
                      <div className="climate-module-incentive-name">
                        {incentive.name}
                        <span className="climate-module-incentive-year">
                          ({incentive.year})
                        </span>
                      </div>
                      <div className="climate-module-incentive-description">
                        {incentive.description}
                      </div>
                      <div className="climate-module-incentive-details">
                        <span className="climate-module-incentive-eligibility">
                          {incentive.eligibility}
                        </span>
                        <span className="climate-module-incentive-value">
                          {incentive.unit}{incentive.value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="climate-module-breakdown">
        <div className="climate-module-breakdown-item">
          <div className="climate-module-breakdown-label">Hard to Decarbonize Sectors:</div>
          <div className="climate-module-breakdown-value hard-to-decarbonize">
            {formatWithUnit(totalHardToDecarbonizeFootprint)}
            <span className="climate-module-breakdown-percentage">
              ({totalCarbonFootprint ? ((totalHardToDecarbonizeFootprint / totalCarbonFootprint) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>
        <div className="climate-module-breakdown-item">
          <div className="climate-module-breakdown-label">Standard Sectors:</div>
          <div className="climate-module-breakdown-value standard">
            {formatWithUnit(totalStandardFootprint)}
            <span className="climate-module-breakdown-percentage">
              ({totalCarbonFootprint ? ((totalStandardFootprint / totalCarbonFootprint) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>
      </div>

      <div className="climate-module-scopes">
        <h4>Emissions by Scope (Hydrogen Gate Definition)</h4>
        <div className="climate-module-scopes-grid">
          <div className="climate-module-scope">
            <div className="climate-module-scope-header">
              <span className="climate-module-scope-title">Scope 1</span>
              <span className="climate-module-scope-subtitle">Direct Emissions</span>
            </div>
            <div className="climate-module-scope-value">
              {formatWithUnit(totalScope1Footprint)}
              <span className="climate-module-scope-percentage">
                ({totalCarbonFootprint ? ((totalScope1Footprint / totalCarbonFootprint) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>

          <div className="climate-module-scope">
            <div className="climate-module-scope-header">
              <span className="climate-module-scope-title">Scope 2</span>
              <span className="climate-module-scope-subtitle">Purchased Energy</span>
            </div>
            <div className="climate-module-scope-value">
              {formatWithUnit(totalScope2Footprint)}
              <span className="climate-module-scope-percentage">
                ({totalCarbonFootprint ? ((totalScope2Footprint / totalCarbonFootprint) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>

          <div className="climate-module-scope">
            <div className="climate-module-scope-header">
              <span className="climate-module-scope-title">Scope 3</span>
              <span className="climate-module-scope-subtitle">Value Chain Emissions</span>
            </div>
            <div className="climate-module-scope-value">
              {formatWithUnit(totalScope3Footprint)}
              <span className="climate-module-scope-percentage">
                ({totalCarbonFootprint ? ((totalScope3Footprint / totalCarbonFootprint) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content for scaling groups remains the same as original component */}
      <div className="climate-module-content">
        <div className="climate-module-groups">
          {Object.values(activeCarbonFootprints).map(group => (
            <motion.div 
              key={group.groupId}
              className="climate-module-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="climate-module-group-header">
                <h4>{group.groupName}</h4>
                <div className="climate-module-group-totals">
                  <span className="climate-module-group-total">
                    {group.totalCarbonFootprint.toFixed(2)} kg CO2e
                  </span>
                  {group.hardToDecarbonizeFootprint > 0 && (
                    <span className="climate-module-group-hard-to-decarbonize">
                      Hard to Decarbonize: {group.hardToDecarbonizeFootprint.toFixed(2)} kg CO2e
                    </span>
                  )}
                </div>
              </div>

              <div className="climate-module-items">
                {Object.values(group.items).map(item => (
                  <div 
                    key={item.itemId} 
                    className={`climate-module-item ${item.isHardToDecarbonize ? 'hard-to-decarbonize' : ''}`}
                  >
                    <div className="climate-module-item-label">
                      {item.itemLabel}
                      <div className="climate-module-item-badges">
                        {item.isHardToDecarbonize && (
                          <span className="climate-module-item-badge hard-to-decarbonize">Hard to Decarbonize</span>
                        )}
                        <span className={`climate-module-item-badge scope-${item.scope}`}>
                          Scope {item.scope}
                        </span>
                      </div>
                    </div>
                    <div className="climate-module-item-values">
                      <div className="climate-module-item-value">
                        <span>Base: {item.baseValue.toFixed(2)}</span>
                      </div>
                      <div className="climate-module-item-value">
                        <span>Scaled: {item.scaledValue.toFixed(2)}</span>
                      </div>
                      <div className="climate-module-item-value">
                        <span>Emission Factor: {item.emissionFactor.toFixed(2)}</span>
                      </div>
                      <div className="climate-module-item-carbon">
                        <span>{formatWithUnit(item.carbonFootprint)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="climate-module-sidebar">
          <div className="climate-module-factors">
            <h4>Emission Factors (kg CO2e per unit)</h4>
            <div className="climate-module-factors-grid">
              {Object.entries(emissionFactors).map(([itemType, factor]) => (
                <div key={itemType} className="climate-module-factor">
                  <label htmlFor={`factor-${itemType}`}>{itemType}:</label>
                  <input
                    id={`factor-${itemType}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={factor}
                    onChange={(e) => handleEmissionFactorChange(itemType, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="climate-module-sectors">
            <h4>Hard to Decarbonize Sectors</h4>
            <div className="climate-module-sectors-grid">
              {Object.entries(hardToDecarbonizeSectors).map(([sector, isHard]) => (
                <div key={sector} className="climate-module-sector">
                  <label className="climate-module-sector-toggle">
                    <input
                      type="checkbox"
                      checked={isHard}
                      onChange={() => handleToggleHardToDecarbonize(sector)}
                    />
                    <span className="climate-module-sector-slider"></span>
                    <span className="climate-module-sector-label">{sector}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="climate-module-hydrogen-gate">
            <h4>Hydrogen Gate Definition</h4>
            <p className="climate-module-hydrogen-description">
              Define scope categorization based on hydrogen production gate as reference point
            </p>

            <div className="climate-module-scope-keywords">
              <h5>Scope 1 Keywords (Direct Emissions)</h5>
              <div className="climate-module-keywords-list">
                {hydrogenGateDefinition.scope1Keywords.map((keyword, index) => (
                  <div key={index} className="climate-module-keyword">
                    <span>{keyword}</span>
                    <button 
                      className="climate-module-keyword-remove"
                      onClick={() => {
                        const newKeywords = [...hydrogenGateDefinition.scope1Keywords];
                        newKeywords.splice(index, 1);
                        setHydrogenGateDefinition(prev => ({
                          ...prev,
                          scope1Keywords: newKeywords
                        }));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="climate-module-keyword-add">
                  <input
                    type="text"
                    placeholder="Add keyword..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setHydrogenGateDefinition(prev => ({
                          ...prev,
                          scope1Keywords: [...prev.scope1Keywords, e.target.value.trim()]
                        }));
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="climate-module-scope-keywords">
              <h5>Scope 2 Keywords (Purchased Energy)</h5>
              <div className="climate-module-keywords-list">
                {hydrogenGateDefinition.scope2Keywords.map((keyword, index) => (
                  <div key={index} className="climate-module-keyword">
                    <span>{keyword}</span>
                    <button 
                      className="climate-module-keyword-remove"
                      onClick={() => {
                        const newKeywords = [...hydrogenGateDefinition.scope2Keywords];
                        newKeywords.splice(index, 1);
                        setHydrogenGateDefinition(prev => ({
                          ...prev,
                          scope2Keywords: newKeywords
                        }));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="climate-module-keyword-add">
                  <input
                    type="text"
                    placeholder="Add keyword..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setHydrogenGateDefinition(prev => ({
                          ...prev,
                          scope2Keywords: [...prev.scope2Keywords, e.target.value.trim()]
                        }));
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="climate-module-scope-note">
              <p>Note: All other emissions are categorized as Scope 3 (Value Chain)</p>
            </div>
          </div>

          {/* Regulatory Thresholds Configuration */}
          <div className="climate-module-regulatory">
            <h4>Regulatory Thresholds Configuration</h4>
            <p className="climate-module-regulatory-description">
              Configure emission thresholds for regulatory compliance at different levels
            </p>

            <div className="climate-module-regulatory-levels">
              {/* Local Regulations */}
              <div className="climate-module-regulatory-level">
                <div className="climate-module-regulatory-header">
                  <label className="climate-module-regulatory-toggle">
                    <input
                      type="checkbox"
                      checked={regulatoryThresholds.local.enabled}
                      onChange={() => handleToggleRegulatory('local')}
                    />
                    <span className="climate-module-regulatory-slider"></span>
                  </label>
                  <h5>{regulatoryThresholds.local.name}</h5>
                </div>
                <div className="climate-module-regulatory-content">
                  <p className="climate-module-regulatory-description">
                    {regulatoryThresholds.local.description}
                  </p>
                  <div className="climate-module-regulatory-threshold">
                    <label>Threshold ({emissionUnits.SI.name}):</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={regulatoryThresholds.local.threshold}
                      onChange={(e) => handleThresholdChange('local', e.target.value)}
                      disabled={!regulatoryThresholds.local.enabled}
                    />
                  </div>
                  <div className={`climate-module-regulatory-status ${complianceStatus.local}`}>
                    Status: 
                    {complianceStatus.local === 'compliant' && ' Compliant'}
                    {complianceStatus.local === 'warning' && ' Warning'}
                    {complianceStatus.local === 'non-compliant' && ' Non-Compliant'}
                    {complianceStatus.local === 'not-applicable' && ' Not Applicable'}
                  </div>
                </div>
              </div>

              {/* State Regulations */}
              <div className="climate-module-regulatory-level">
                <div className="climate-module-regulatory-header">
                  <label className="climate-module-regulatory-toggle">
                    <input
                      type="checkbox"
                      checked={regulatoryThresholds.state.enabled}
                      onChange={() => handleToggleRegulatory('state')}
                    />
                    <span className="climate-module-regulatory-slider"></span>
                  </label>
                  <h5>{regulatoryThresholds.state.name}</h5>
                </div>
                <div className="climate-module-regulatory-content">
                  <p className="climate-module-regulatory-description">
                    {regulatoryThresholds.state.description}
                  </p>
                  <div className="climate-module-regulatory-threshold">
                    <label>Threshold ({emissionUnits.SI.name}):</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={regulatoryThresholds.state.threshold}
                      onChange={(e) => handleThresholdChange('state', e.target.value)}
                      disabled={!regulatoryThresholds.state.enabled}
                    />
                  </div>
                  <div className={`climate-module-regulatory-status ${complianceStatus.state}`}>
                    Status: 
                    {complianceStatus.state === 'compliant' && ' Compliant'}
                    {complianceStatus.state === 'warning' && ' Warning'}
                    {complianceStatus.state === 'non-compliant' && ' Non-Compliant'}
                    {complianceStatus.state === 'not-applicable' && ' Not Applicable'}
                  </div>
                </div>
              </div>

              {/* Federal Regulations */}
              <div className="climate-module-regulatory-level">
                <div className="climate-module-regulatory-header">
                  <label className="climate-module-regulatory-toggle">
                    <input
                      type="checkbox"
                      checked={regulatoryThresholds.federal.enabled}
                      onChange={() => handleToggleRegulatory('federal')}
                    />
                    <span className="climate-module-regulatory-slider"></span>
                  </label>
                  <h5>{regulatoryThresholds.federal.name}</h5>
                </div>
                <div className="climate-module-regulatory-content">
                  <p className="climate-module-regulatory-description">
                    {regulatoryThresholds.federal.description}
                  </p>
                  <div className="climate-module-regulatory-threshold">
                    <label>Threshold ({emissionUnits.SI.name}):</label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={regulatoryThresholds.federal.threshold}
                      onChange={(e) => handleThresholdChange('federal', e.target.value)}
                      disabled={!regulatoryThresholds.federal.enabled}
                    />
                  </div>
                  <div className={`climate-module-regulatory-status ${complianceStatus.federal}`}>
                    Status: 
                    {complianceStatus.federal === 'compliant' && ' Compliant'}
                    {complianceStatus.federal === 'warning' && ' Warning'}
                    {complianceStatus.federal === 'non-compliant' && ' Non-Compliant'}
                    {complianceStatus.federal === 'not-applicable' && ' Not Applicable'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Coordinate Component with Multi-Zone Selection */}
      {showCoordinateComponent && (
        <div className="climate-module-coordinate-section">
          <h4>Enhanced Zone Coordinates & Multi-Zone Selection</h4>
          <CoordinateContainerEnhanced 
            carbonFootprints={carbonFootprints}
            regulatoryThresholds={regulatoryThresholds}
            complianceStatus={complianceStatus}
          />
        </div>
      )}
    </div>
  );
};

ClimateModuleEnhanced.propTypes = {
  scalingGroups: PropTypes.array,
  versions: PropTypes.object,
  zones: PropTypes.object,
  onCarbonFootprintChange: PropTypes.func,
  showCoordinateComponent: PropTypes.bool
};

export default ClimateModuleEnhanced;
