/**
 * DecarbonizationPathwaysFactory.js
 *
 * Factory for creating actions, reducers, and selectors for managing decarbonization pathways.
 * This module provides a comprehensive state management solution for hydrogen production methods
 * and other decarbonization strategies.
 */
import { getAPIPrecedenceData } from '../find_factual_precedence/components/modules/FactualPrecedence/APIFactualPrecedence';

/**
 * Creates action creators for managing decarbonization pathways
 * 
 * @param {Object} stateManager - The state manager instance
 * @returns {Object} Action creators for pathway management
 */
const createDecarbonizationPathwaysFactory = (stateManager) => {
  // Action creators
  const actions = {
    updatePathwayData: stateManager.createActionCreator(
      'UPDATE_PATHWAY_DATA',
      (pathwayId, data, source) => ({ pathwayId, data, source })
    ),
    setActivePathway: stateManager.createActionCreator(
      'SET_ACTIVE_PATHWAY',
      (pathwayId) => ({ pathwayId })
    ),
    setComparisonPathways: stateManager.createActionCreator(
      'SET_COMPARISON_PATHWAYS',
      (pathwayIds) => ({ pathwayIds })
    ),
    updatePathwayVisibility: stateManager.createActionCreator(
      'UPDATE_PATHWAY_VISIBILITY',
      (pathwayId, isVisible) => ({ pathwayId, isVisible })
    ),
    clearPathwayComparison: stateManager.createActionCreator(
      'CLEAR_PATHWAY_COMPARISON'
    ),
    setPathwayCategory: stateManager.createActionCreator(
      'SET_PATHWAY_CATEGORY',
      (category) => ({ category })
    ),
    updatePathwayMetrics: stateManager.createActionCreator(
      'UPDATE_PATHWAY_METRICS',
      (pathwayId, metrics) => ({ pathwayId, metrics })
    ),
    toggleHardToDecarbonizeFilter: stateManager.createActionCreator(
      'TOGGLE_HARD_TO_DECARBONIZE_FILTER',
      (value) => ({ value })
    ),
    updatePathwayProperties: stateManager.createActionCreator(
      'UPDATE_PATHWAY_PROPERTIES',
      (pathwayId, properties) => ({ pathwayId, properties })
    ),
    batchUpdatePathways: stateManager.createActionCreator(
      'BATCH_UPDATE_PATHWAYS',
      (updates) => ({ updates })
    )
  };

  // Thunk for fetching pathway data
  actions.fetchPathwayData = (pathwayId, category) => async (dispatch) => {
    try {
      // Context for factual precedence
      const context = {
        label: `Decarbonization Pathway: ${pathwayId}`,
        value: pathwayId,
        type: 'decarbonization-pathway',
        remarks: `Fetching data for ${category} pathway`,
        pathwayContext: { category }
      };
      
      const pathwayData = await getAPIPrecedenceData('decarbonization-pathway', context);
      
      if (pathwayData && pathwayData.data) {
        dispatch(actions.updatePathwayData(
          pathwayId, 
          pathwayData.data,
          pathwayData.source || "Factual Precedence"
        ));
        
        // Calculate and update metrics
        const metrics = calculatePathwayMetrics(pathwayData.data);
        dispatch(actions.updatePathwayMetrics(pathwayId, metrics));
        
        return { success: true, data: pathwayData };
      }
      return { success: false };
    } catch (error) {
      console.error('Error fetching pathway data:', error);
      return { success: false, error };
    }
  };
  
  // Thunk for loading default pathway data
  actions.loadDefaultPathwayData = () => async (dispatch) => {
    try {
      // Default hydrogen production pathways
      const defaultPathways = {
        "wind-pem": {
          id: "wind-pem",
          name: "Wind PEM",
          description: "Hydrogen production via electrolysis using wind power",
          category: "renewable",
          isHardToDecarbonize: false,
          inputs: {
            "Electricity (Commercial) kWh": 0.98,
            "Electricity (Industrial) kWh": null,
            "Electricity (On-shore wind) kWh": 55.50,
            "Natural Gas (Commercial) mmBtu": null,
            "Natural Gas (Industrial) mmBtu": null,
            "Biomass (s.ton)": null,
            "Coal (mmBtu)": null,
            "Diesel (gal)": null,
            "Water Total (gal)": 3.78
          },
          economics: {
            "Real Levelized Cost ($/kg H₂)": 2.77
          },
          carbonIntensity: 1.2, // kg CO2e/kg H2
          maturityLevel: "commercial",
          readinessYear: 2023
        },
        "solar-pem": {
          id: "solar-pem",
          name: "Solar PEM",
          description: "Hydrogen production via electrolysis using solar power",
          category: "renewable",
          isHardToDecarbonize: false,
          inputs: {
            "Electricity (Commercial) kWh": 0.98,
            "Electricity (Industrial) kWh": null,
            "Electricity (On-shore wind) kWh": null,
            "Natural Gas (Commercial) mmBtu": null,
            "Natural Gas (Industrial) mmBtu": null,
            "Biomass (s.ton)": null,
            "Coal (mmBtu)": null,
            "Diesel (gal)": null,
            "Water Total (gal)": 3.78
          },
          economics: {
            "Real Levelized Cost ($/kg H₂)": 2.35
          },
          carbonIntensity: 1.5, // kg CO2e/kg H2
          maturityLevel: "commercial",
          readinessYear: 2022
        },
        "natgas-ccs": {
          id: "natgas-ccs",
          name: "Natural Gas w/ CCS",
          description: "Hydrogen production via steam methane reforming with carbon capture",
          category: "low-carbon",
          isHardToDecarbonize: true,
          inputs: {
            "Electricity (Commercial) kWh": 0.98,
            "Electricity (Industrial) kWh": 3.49,
            "Electricity (On-shore wind) kWh": null,
            "Natural Gas (Commercial) mmBtu": null,
            "Natural Gas (Industrial) mmBtu": 0.16,
            "Biomass (s.ton)": null,
            "Coal (mmBtu)": null,
            "Diesel (gal)": null,
            "Water Total (gal)": 8.12
          },
          economics: {
            "Real Levelized Cost ($/kg H₂)": 5.04
          },
          carbonIntensity: 1.8, // kg CO2e/kg H2
          maturityLevel: "early-commercial",
          readinessYear: 2025
        },
        "natgas-noccs": {
          id: "natgas-noccs",
          name: "Natural Gas no CCS",
          description: "Hydrogen production via steam methane reforming without carbon capture",
          category: "fossil",
          isHardToDecarbonize: true,
          inputs: {
            "Electricity (Commercial) kWh": 0.98,
            "Electricity (Industrial) kWh": 0.13,
            "Electricity (On-shore wind) kWh": null,
            "Natural Gas (Commercial) mmBtu": null,
            "Natural Gas (Industrial) mmBtu": 0.16,
            "Biomass (s.ton)": null,
            "Coal (mmBtu)": null,
            "Diesel (gal)": null,
            "Water Total (gal)": 4.34
          },
          economics: {
            "Real Levelized Cost ($/kg H₂)": 1.70
          },
          carbonIntensity: 10.4, // kg CO2e/kg H2
          maturityLevel: "mature",
          readinessYear: 2020
        },
        "solid-oxide": {
          id: "solid-oxide",
          name: "Solid Oxide PEM",
          description: "Hydrogen production via solid oxide electrolysis",
          category: "emerging",
          isHardToDecarbonize: false,
          inputs: {
            "Electricity (Commercial) kWh": 0.98,
            "Electricity (Industrial) kWh": 36.80,
            "Electricity (On-shore wind) kWh": null,
            "Natural Gas (Commercial) mmBtu": null,
            "Natural Gas (Industrial) mmBtu": 0.06,
            "Biomass (s.ton)": null,
            "Coal (mmBtu)": null,
            "Diesel (gal)": null,
            "Water Total (gal)": 2.38
          },
          economics: {
            "Real Levelized Cost ($/kg H₂)": 4.53
          },
          carbonIntensity: 2.3, // kg CO2e/kg H2
          maturityLevel: "demonstration",
          readinessYear: 2027
        },
        "biomass-pem": {
          id: "biomass-pem",
          name: "Biomass",
          description: "Hydrogen production via biomass gasification",
          category: "renewable",
          isHardToDecarbonize: false,
          inputs: {
            "Electricity (Commercial) kWh": 0.98,
            "Electricity (Industrial) kWh": 55.50,
            "Electricity (On-shore wind) kWh": null,
            "Natural Gas (Commercial) mmBtu": null,
            "Natural Gas (Industrial) mmBtu": null,
            "Biomass (s.ton)": 0.015,
            "Coal (mmBtu)": null,
            "Diesel (gal)": null,
            "Water Total (gal)": 3.78
          },
          economics: {
            "Real Levelized Cost ($/kg H₂)": 4.64
          },
          carbonIntensity: 2.0, // kg CO2e/kg H2
          maturityLevel: "demonstration",
          readinessYear: 2026
        },
        "coal-ccs": {
          id: "coal-ccs",
          name: "Coal w/ CCS",
          description: "Hydrogen production via coal gasification with carbon capture",
          category: "fossil",
          isHardToDecarbonize: true,
          inputs: {
            "Electricity (Commercial) kWh": 0.98,
            "Electricity (Industrial) kWh": null,
            "Electricity (On-shore wind) kWh": null,
            "Natural Gas (Commercial) mmBtu": 0.006,
            "Natural Gas (Industrial) mmBtu": null,
            "Biomass (s.ton)": null,
            "Coal (mmBtu)": 0.19,
            "Diesel (gal)": null,
            "Water Total (gal)": 3.45
          },
          economics: {
            "Real Levelized Cost ($/kg H₂)": 2.16
          },
          carbonIntensity: 2.5, // kg CO2e/kg H2
          maturityLevel: "demonstration",
          readinessYear: 2028
        },
        "coal-noccs": {
          id: "coal-noccs",
          name: "Coal no CCS",
          description: "Hydrogen production via coal gasification without carbon capture",
          category: "fossil",
          isHardToDecarbonize: true,
          inputs: {
            "Electricity (Commercial) kWh": 0.98,
            "Electricity (Industrial) kWh": 1.04,
            "Electricity (On-shore wind) kWh": null,
            "Natural Gas (Commercial) mmBtu": null,
            "Natural Gas (Industrial) mmBtu": null,
            "Biomass (s.ton)": null,
            "Coal (mmBtu)": 0.19,
            "Diesel (gal)": null,
            "Water Total (gal)": 7.94
          },
          economics: {
            "Real Levelized Cost ($/kg H₂)": 10.30
          },
          carbonIntensity: 18.2, // kg CO2e/kg H2
          maturityLevel: "mature",
          readinessYear: 2020
        }
      };

      // Batch update all pathways
      dispatch(actions.batchUpdatePathways(defaultPathways));
      
      // Set default active and comparison pathways
      dispatch(actions.setActivePathway("wind-pem"));
      dispatch(actions.setComparisonPathways(["solar-pem", "natgas-ccs", "natgas-noccs"]));
      
      return { success: true };
    } catch (error) {
      console.error('Error loading default pathway data:', error);
      return { success: false, error };
    }
  };

  // Helper function to calculate pathway metrics
  const calculatePathwayMetrics = (pathwayData) => {
    // Calculate various metrics for comparison
    const metrics = {
      costEffectiveness: 0,
      emissionReduction: 0,
      implementationTimeframe: 0,
      waterEfficiency: 0,
      overallScore: 0
    };
    
    // Logic for cost effectiveness (inverse of cost, normalized to 0-100)
    if (pathwayData.economics && pathwayData.economics["Real Levelized Cost ($/kg H₂)"]) {
      const cost = pathwayData.economics["Real Levelized Cost ($/kg H₂)"];
      // Assuming $10/kg as high benchmark for normalization
      metrics.costEffectiveness = Math.max(0, Math.min(100, (1 - cost/10) * 100));
    }
    
    // Logic for emission reduction (inverse of carbon intensity, normalized to 0-100)
    if (pathwayData.carbonIntensity) {
      // Assuming 20 kg CO2e/kg H2 as high benchmark
      metrics.emissionReduction = Math.max(0, Math.min(100, (1 - pathwayData.carbonIntensity/20) * 100));
    }
    
    // Logic for implementation timeframe (based on readiness year, normalized to 0-100)
    if (pathwayData.readinessYear) {
      // 2020 as earliest, 2035 as latest for normalization
      metrics.implementationTimeframe = Math.max(0, Math.min(100, ((2035 - pathwayData.readinessYear) / 15) * 100));
    }
    
    // Logic for water efficiency (inverse of water usage, normalized to 0-100)
    if (pathwayData.inputs && pathwayData.inputs["Water Total (gal)"]) {
      // Assuming 10 gal as high benchmark
      metrics.waterEfficiency = Math.max(0, Math.min(100, (1 - pathwayData.inputs["Water Total (gal)"]/10) * 100));
    }
    
    // Calculate overall score (weighted average)
    metrics.overallScore = (
      metrics.costEffectiveness * 0.35 + 
      metrics.emissionReduction * 0.35 + 
      metrics.implementationTimeframe * 0.15 + 
      metrics.waterEfficiency * 0.15
    );
    
    return metrics;
  };
  
  return actions;
};

/**
 * Creates a reducer for decarbonization pathways
 * 
 * @param {Object} stateManager - The state manager instance
 * @returns {Function} Reducer function for pathway state
 */
const createDecarbonizationPathwaysReducer = (stateManager) => {
  return stateManager.createReducer({
    'UPDATE_PATHWAY_DATA': (state, action) => {
      const { pathwayId, data, source } = action.payload;
      return {
        ...state,
        pathways: {
          ...state.pathways,
          [pathwayId]: {
            ...state.pathways[pathwayId] || {},
            ...data,
            source: source || state.pathways[pathwayId]?.source,
            lastUpdated: new Date().toISOString()
          }
        }
      };
    },
    'SET_ACTIVE_PATHWAY': (state, action) => {
      return {
        ...state,
        activePathwayId: action.payload.pathwayId
      };
    },
    'SET_COMPARISON_PATHWAYS': (state, action) => {
      return {
        ...state,
        comparisonPathwayIds: action.payload.pathwayIds
      };
    },
    'UPDATE_PATHWAY_VISIBILITY': (state, action) => {
      const { pathwayId, isVisible } = action.payload;
      return {
        ...state,
        pathwayVisibility: {
          ...state.pathwayVisibility,
          [pathwayId]: isVisible
        }
      };
    },
    'CLEAR_PATHWAY_COMPARISON': (state) => {
      return {
        ...state,
        comparisonPathwayIds: []
      };
    },
    'SET_PATHWAY_CATEGORY': (state, action) => {
      return {
        ...state,
        activeCategory: action.payload.category
      };
    },
    'UPDATE_PATHWAY_METRICS': (state, action) => {
      const { pathwayId, metrics } = action.payload;
      return {
        ...state,
        pathwayMetrics: {
          ...state.pathwayMetrics,
          [pathwayId]: metrics
        }
      };
    },
    'TOGGLE_HARD_TO_DECARBONIZE_FILTER': (state, action) => {
      return {
        ...state,
        filterHardToDecarbonize: action.payload.value
      };
    },
    'UPDATE_PATHWAY_PROPERTIES': (state, action) => {
      const { pathwayId, properties } = action.payload;
      return {
        ...state,
        pathways: {
          ...state.pathways,
          [pathwayId]: {
            ...state.pathways[pathwayId],
            ...properties
          }
        }
      };
    },
    'BATCH_UPDATE_PATHWAYS': (state, action) => {
      return {
        ...state,
        pathways: {
          ...state.pathways,
          ...action.payload.updates
        }
      };
    }
  });
};

/**
 * Creates selectors for accessing decarbonization pathway state
 * 
 * @param {Object} stateManager - The state manager instance
 * @returns {Object} Selectors for pathway state
 */
const createDecarbonizationPathwaysSelectors = (stateManager) => {
  const getPathways = stateManager.createSelector(
    state => state.pathways,
    pathways => pathways
  );
  
  const getActivePathwayId = stateManager.createSelector(
    state => state.activePathwayId,
    activePathwayId => activePathwayId
  );
  
  const getActivePathway = stateManager.createSelector(
    [getPathways, getActivePathwayId],
    (pathways, activePathwayId) => pathways[activePathwayId] || null
  );
  
  const getComparisonPathwayIds = stateManager.createSelector(
    state => state.comparisonPathwayIds,
    comparisonPathwayIds => comparisonPathwayIds
  );
  
  const getComparisonPathways = stateManager.createSelector(
    [getPathways, getComparisonPathwayIds],
    (pathways, comparisonPathwayIds) => 
      comparisonPathwayIds.map(id => pathways[id] || null).filter(Boolean)
  );
  
  const getPathwayCategories = stateManager.createSelector(
    getPathways,
    pathways => {
      const categories = new Set();
      Object.values(pathways).forEach(pathway => {
        if (pathway.category) categories.add(pathway.category);
      });
      return Array.from(categories);
    }
  );
  
  const getActiveCategory = stateManager.createSelector(
    state => state.activeCategory,
    activeCategory => activeCategory
  );
  
  const getPathwaysByCategory = stateManager.createSelector(
    [getPathways, getActiveCategory, state => state.filterHardToDecarbonize],
    (pathways, activeCategory, filterHardToDecarbonize) => {
      return Object.values(pathways).filter(pathway => {
        const categoryMatch = !activeCategory || pathway.category === activeCategory;
        const hardToDecarbonizeMatch = !filterHardToDecarbonize || pathway.isHardToDecarbonize;
        return categoryMatch && (filterHardToDecarbonize ? hardToDecarbonizeMatch : true);
      });
    }
  );
  
  const getPathwayMetrics = stateManager.createSelector(
    state => state.pathwayMetrics,
    metrics => metrics
  );
  
  const getPathwayVisibility = stateManager.createSelector(
    state => state.pathwayVisibility,
    visibility => visibility
  );
  
  const getVisiblePathways = stateManager.createSelector(
    [getPathways, getPathwayVisibility],
    (pathways, visibility) => {
      return Object.entries(pathways)
        .filter(([id]) => visibility[id] !== false)
        .map(([_, pathway]) => pathway);
    }
  );
  
  const getHardToDecarbonizeSectors = stateManager.createSelector(
    getPathways,
    pathways => Object.values(pathways).filter(p => p.isHardToDecarbonize)
  );
  
  return {
    getPathways,
    getActivePathwayId,
    getActivePathway,
    getComparisonPathwayIds,
    getComparisonPathways,
    getPathwayCategories,
    getActiveCategory,
    getPathwaysByCategory,
    getPathwayMetrics,
    getPathwayVisibility,
    getVisiblePathways,
    getHardToDecarbonizeSectors
  };
};

export {
  createDecarbonizationPathwaysFactory,
  createDecarbonizationPathwaysReducer,
  createDecarbonizationPathwaysSelectors
};