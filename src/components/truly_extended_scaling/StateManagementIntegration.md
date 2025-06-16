# StateManagementIntegration.js Documentation

## Overview

The `StateManagementIntegration.js` module provides a unified state management system for the decarbonization pathways application. It integrates multiple domain-specific state managers (climate, coordinate, and decarbonization) and provides factory functions for creating reducers, actions, and selectors.

## Architecture

### Core Components

1. **State Manager Factory** - Generic function for creating domain-specific state managers
2. **Domain-Specific Managers** - Pre-configured managers for climate, coordinate, and decarbonization domains
3. **Integration Layer** - Connects state managers with the decarbonization pathways factory

## State Managers

### 1. Climate State Manager

Manages climate-related data and configurations:

```javascript
const climateStateManager = createStateManager('climate', {
  emissionFactors: {},
  emissionUnits: { current: 'SI' },
  hardToDecarbonizeSectors: {},
  regulatoryThresholds: {},
  regionSystem: 'SI',
  carbonFootprints: {}
});
```

**State Properties:**
- `emissionFactors` - Emission factors by category/sector
- `emissionUnits` - Current unit system for emissions
- `hardToDecarbonizeSectors` - Sectors difficult to decarbonize
- `regulatoryThresholds` - Regulatory compliance thresholds
- `regionSystem` - Regional measurement system
- `carbonFootprints` - Calculated carbon footprints

### 2. Coordinate State Manager

Manages geographical and mapping data:

```javascript
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
```

**State Properties:**
- `zoneCoordinates` - Coordinate data for zones
- `zoneAssets` - Assets associated with zones
- `locationFacts` - Facts about locations
- `mapSettings` - Map visualization settings
- `visualizationLayers` - Available visualization layers

### 3. Decarbonization State Manager

Manages decarbonization pathways and related data:

```javascript
const decarbonizationStateManager = createStateManager('decarbonization', {
  pathways: {},
  activePathwayId: null,
  comparisonPathwayIds: [],
  pathwayVisibility: {},
  activeCategory: null,
  pathwayMetrics: {},
  filterHardToDecarbonize: false
});
```

**State Properties:**
- `pathways` - Collection of decarbonization pathways
- `activePathwayId` - Currently selected pathway
- `comparisonPathwayIds` - Pathways selected for comparison
- `pathwayVisibility` - Visibility settings for pathways
- `activeCategory` - Currently active category filter
- `pathwayMetrics` - Metrics for pathway evaluation
- `filterHardToDecarbonize` - Filter for hard-to-decarbonize sectors

## Factory Functions

### createStateManager(domain, initialState)

Creates a state manager for a specific domain with the following utilities:

#### Returns Object with:

1. **createReducer(reducerMap)**
   - Creates a reducer function from an action-type-to-handler map
   - Parameters:
     - `reducerMap` - Object mapping action types to handler functions
   - Returns: Redux-compatible reducer function

2. **createActionCreator(type, payloadCreator)**
   - Creates an action creator function
   - Parameters:
     - `type` - Action type string
     - `payloadCreator` - Optional function to create payload
   - Returns: Action creator function

3. **createSelector(inputSelectors, resultFunc)**
   - Creates a selector with memoization support
   - Parameters:
     - `inputSelectors` - Array of input selector functions
     - `resultFunc` - Function to compute derived data
   - Returns: Selector function

4. **domain**
   - The domain name string

## Integration with Decarbonization Pathways

The module integrates with the DecarbonizationPathwaysFactory to create:

```javascript
const decarbonizationActions = createDecarbonizationPathwaysFactory(decarbonizationStateManager);
const decarbonizationReducer = createDecarbonizationPathwaysReducer(decarbonizationStateManager);
const decarbonizationSelectors = createDecarbonizationPathwaysSelectors(decarbonizationStateManager);
```

## Usage Examples

### Creating a Custom State Manager

```javascript
import { createStateManager } from './StateManagementIntegration';

const customStateManager = createStateManager('custom', {
  data: [],
  loading: false,
  error: null
});

// Create reducer
const customReducer = customStateManager.createReducer({
  'CUSTOM_LOAD_START': (state) => ({ ...state, loading: true }),
  'CUSTOM_LOAD_SUCCESS': (state, action) => ({
    ...state,
    loading: false,
    data: action.payload
  }),
  'CUSTOM_LOAD_ERROR': (state, action) => ({
    ...state,
    loading: false,
    error: action.payload
  })
});

// Create actions
const loadStart = customStateManager.createActionCreator('CUSTOM_LOAD_START');
const loadSuccess = customStateManager.createActionCreator(
  'CUSTOM_LOAD_SUCCESS',
  (data) => data
);

// Create selectors
const selectData = customStateManager.createSelector(
  [state => state.custom],
  custom => custom.data
);
```

### Using Pre-configured State Managers

```javascript
import {
  climateStateManager,
  coordinateStateManager,
  decarbonizationStateManager,
  decarbonizationActions,
  decarbonizationSelectors
} from './StateManagementIntegration';

// Use actions
const addPathway = decarbonizationActions.addPathway(pathwayData);
const setActivePathway = decarbonizationActions.setActivePathway(pathwayId);

// Use selectors
const activePathway = decarbonizationSelectors.getActivePathway(state);
const visiblePathways = decarbonizationSelectors.getVisiblePathways(state);
```

## Best Practices

1. **Domain Separation** - Keep state managers focused on specific domains
2. **Immutability** - Always return new state objects in reducers
3. **Selector Composition** - Build complex selectors from simple ones
4. **Action Naming** - Use consistent naming conventions (DOMAIN_ACTION_TYPE)
5. **Initial State** - Provide complete initial state to avoid undefined errors

## Integration Points

- **Redux Store** - State managers integrate with Redux store configuration
- **React Components** - Use React-Redux hooks to connect components
- **Middleware** - Compatible with Redux middleware (thunk, saga, etc.)
- **DevTools** - Full Redux DevTools support for debugging

## Type Safety

While implemented in JavaScript, the module follows patterns that support TypeScript migration:

```typescript
interface StateManager<T> {
  createReducer: (reducerMap: ReducerMap<T>) => Reducer<T>;
  createActionCreator: <P>(type: string, payloadCreator?: PayloadCreator<P>) => ActionCreator<P>;
  createSelector: <R>(inputSelectors: Selector[], resultFunc: ResultFunc<R>) => Selector<R>;
  domain: string;
}
```

## Performance Considerations

1. **Selector Memoization** - Selectors cache results for identical inputs
2. **Shallow Equality** - State updates trigger re-renders only on reference changes
3. **Lazy Initialization** - State managers created on-demand
4. **Minimal Re-renders** - Fine-grained selectors minimize component updates

## Future Enhancements

1. **TypeScript Migration** - Add full type definitions
2. **Middleware Integration** - Built-in async action support
3. **State Persistence** - Local storage integration
4. **Time Travel** - Enhanced debugging with state history
5. **Module Federation** - Support for micro-frontend architecture