/**
 * StateManagementIntegration.js
 *
 * Integration of the decarbonization pathways state management with the core architecture.
 * This module adds the decarbonizationStateManager to the existing state management system.
 */
import { createDecarbonizationPathwaysFactory, createDecarbonizationPathwaysReducer, createDecarbonizationPathwaysSelectors } from './DecarbonizationPathwaysFactory';

/**
 * Creates a state manager for a specific domain
 * 
 * @param {string} domain - The domain name
 * @param {Object} initialState - Initial state for the domain
 * @returns {Object} State manager for the domain
 */
const createStateManager = (domain, initialState = {}) => {
  // Create reducer function
  const createReducer = (reducerMap) => {
    return (state = initialState, action) => {
      const handler = reducerMap[action.type];
      return handler ? handler(state, action) : state;
    };
  };

  // Create action creator
  const createActionCreator = (type, payloadCreator) => {
    return (...args) => {
      const payload = payloadCreator ? payloadCreator(...args) : {};
      return { type, payload };
    };
  };

  // Create selector
  const createSelector = (inputSelectors, resultFunc) => {
    return (state, ...args) => {
      const inputs = inputSelectors.map(selector => 
        typeof selector === 'function' ? selector(state, ...args) : selector
      );
      return resultFunc(...inputs);
    };
  };

  return {
    createReducer,
    createActionCreator,
    createSelector,
    domain
  };
};

// Domain-specific state managers
const climateStateManager = createStateManager('climate', {
  emissionFactors: {},
  emissionUnits: { current: 'SI' },
  hardToDecarbonizeSectors: {},
  regulatoryThresholds: {},
  regionSystem: 'SI',
  carbonFootprints: {}
});

const coordinateStateManager = createStateManager('coordinate', {
  zoneCoordinates: {},
  zoneAssets: {},
  locationFacts: {},
  mapSettings: {
    zoom: 5,
    centerCoordinates: { longitude: 0, latitude: 0 },
    activeLayer: 'default'
  },
  visualizationLayers: []
});

// New Decarbonization Pathways State Manager
const decarbonizationStateManager = createStateManager('decarbonization', {
  pathways: {},
  activePathwayId: null,
  comparisonPathwayIds: [],
  pathwayVisibility: {},
  activeCategory: null,
  pathwayMetrics: {},
  filterHardToDecarbonize: false
});

// Create factories for decarbonization pathways
const decarbonizationActions = createDecarbonizationPathwaysFactory(decarbonizationStateManager);
const decarbonizationReducer = createDecarbonizationPathwaysReducer(decarbonizationStateManager);
const decarbonizationSelectors = createDecarbonizationPathwaysSelectors(decarbonizationStateManager);

// Export state managers and factories
export {
  climateStateManager,
  coordinateStateManager,
  decarbonizationStateManager,
  decarbonizationActions,
  decarbonizationReducer,
  decarbonizationSelectors,
  createStateManager
};