# DecarbonizationPathwaysFactory Documentation

## Overview
The `DecarbonizationPathwaysFactory` is a comprehensive factory module that creates actions, reducers, and selectors for managing decarbonization pathways state. It follows the Redux pattern and provides a complete state management solution for hydrogen production methods and other decarbonization strategies.

## Purpose
- Create standardized action creators for pathway management
- Generate reducers for handling pathway state updates
- Provide selectors for efficient state access
- Manage pathway data fetching and metrics calculation
- Support batch operations and filtering

## Architecture

### Factory Pattern Implementation
The module exports three main factory functions:
1. `createDecarbonizationPathwaysFactory` - Creates action creators
2. `createDecarbonizationPathwaysReducer` - Creates the reducer
3. `createDecarbonizationPathwaysSelectors` - Creates selectors

## Action Creators

### Basic Actions

#### `updatePathwayData(pathwayId, data, source)`
Updates data for a specific pathway.
```javascript
dispatch(actions.updatePathwayData('wind-pem', newData, 'API'));
```

#### `setActivePathway(pathwayId)`
Sets the currently active pathway for detailed view.
```javascript
dispatch(actions.setActivePathway('solar-pem'));
```

#### `setComparisonPathways(pathwayIds)`
Sets pathways for comparison view.
```javascript
dispatch(actions.setComparisonPathways(['wind-pem', 'solar-pem', 'natgas-ccs']));
```

#### `updatePathwayVisibility(pathwayId, isVisible)`
Controls pathway visibility in the UI.
```javascript
dispatch(actions.updatePathwayVisibility('coal-noccs', false));
```

#### `clearPathwayComparison()`
Clears all pathways from comparison.
```javascript
dispatch(actions.clearPathwayComparison());
```

#### `setPathwayCategory(category)`
Sets the active category filter.
```javascript
dispatch(actions.setPathwayCategory('renewable'));
```

#### `updatePathwayMetrics(pathwayId, metrics)`
Updates calculated metrics for a pathway.
```javascript
dispatch(actions.updatePathwayMetrics('wind-pem', calculatedMetrics));
```

#### `toggleHardToDecarbonizeFilter(value)`
Toggles the hard-to-decarbonize filter.
```javascript
dispatch(actions.toggleHardToDecarbonizeFilter(true));
```

#### `batchUpdatePathways(updates)`
Updates multiple pathways at once.
```javascript
dispatch(actions.batchUpdatePathways({
  'wind-pem': { ...windData },
  'solar-pem': { ...solarData }
}));
```

### Thunk Actions

#### `fetchPathwayData(pathwayId, category)`
Asynchronously fetches pathway data from the factual precedence API.
```javascript
const result = await dispatch(actions.fetchPathwayData('wind-pem', 'renewable'));
```

Features:
- Integration with factual precedence API
- Automatic metrics calculation
- Error handling with fallback

#### `loadDefaultPathwayData()`
Loads the default set of hydrogen production pathways.
```javascript
await dispatch(actions.loadDefaultPathwayData());
```

Includes 8 default pathways:
- Wind PEM
- Solar PEM
- Natural Gas with/without CCS
- Solid Oxide PEM
- Biomass
- Coal with/without CCS

## State Structure

```javascript
{
  pathways: {
    'pathway-id': {
      id: string,
      name: string,
      description: string,
      category: string,
      isHardToDecarbonize: boolean,
      inputs: {
        "Electricity (Commercial) kWh": number,
        "Natural Gas (Industrial) mmBtu": number,
        "Water Total (gal)": number,
        // ... other inputs
      },
      economics: {
        "Real Levelized Cost ($/kg H₂)": number
      },
      carbonIntensity: number,
      maturityLevel: string,
      readinessYear: number,
      source: string,
      lastUpdated: string
    }
  },
  activePathwayId: string,
  comparisonPathwayIds: string[],
  pathwayVisibility: {
    'pathway-id': boolean
  },
  activeCategory: string,
  pathwayMetrics: {
    'pathway-id': {
      costEffectiveness: number,
      emissionReduction: number,
      implementationTimeframe: number,
      waterEfficiency: number,
      overallScore: number
    }
  },
  filterHardToDecarbonize: boolean
}
```

## Reducer Implementation

The reducer handles all actions and updates state immutably:

```javascript
const reducer = createDecarbonizationPathwaysReducer(stateManager);
```

Key features:
- Immutable state updates
- Timestamp tracking for updates
- Proper merging of partial updates
- Support for batch operations

## Selectors

### Basic Selectors

#### `getPathways`
Returns all pathways.
```javascript
const pathways = useSelector(selectors.getPathways);
```

#### `getActivePathway`
Returns the currently active pathway.
```javascript
const activePathway = useSelector(selectors.getActivePathway);
```

#### `getComparisonPathways`
Returns pathways selected for comparison.
```javascript
const comparisonPathways = useSelector(selectors.getComparisonPathways);
```

### Computed Selectors

#### `getPathwayCategories`
Extracts unique categories from all pathways.
```javascript
const categories = useSelector(selectors.getPathwayCategories);
// Returns: ['renewable', 'fossil', 'low-carbon', 'emerging']
```

#### `getPathwaysByCategory`
Returns filtered pathways based on category and hard-to-decarbonize filter.
```javascript
const filteredPathways = useSelector(selectors.getPathwaysByCategory);
```

#### `getVisiblePathways`
Returns only pathways marked as visible.
```javascript
const visiblePathways = useSelector(selectors.getVisiblePathways);
```

#### `getHardToDecarbonizeSectors`
Returns pathways marked as hard-to-decarbonize.
```javascript
const hardSectors = useSelector(selectors.getHardToDecarbonizeSectors);
```

## Metrics Calculation

The `calculatePathwayMetrics` function computes standardized metrics:

```javascript
{
  costEffectiveness: 0-100,      // Inverse of cost
  emissionReduction: 0-100,      // Inverse of carbon intensity
  implementationTimeframe: 0-100, // Based on readiness year
  waterEfficiency: 0-100,        // Inverse of water usage
  overallScore: 0-100            // Weighted average
}
```

Weighting:
- Cost Effectiveness: 35%
- Emission Reduction: 35%
- Implementation Timeframe: 15%
- Water Efficiency: 15%

## Integration Example

```javascript
// In your state management setup
const stateManager = createStateManager();

// Create factories
const pathwayActions = createDecarbonizationPathwaysFactory(stateManager);
const pathwayReducer = createDecarbonizationPathwaysReducer(stateManager);
const pathwaySelectors = createDecarbonizationPathwaysSelectors(stateManager);

// In your component
const MyComponent = () => {
  const dispatch = useDispatch();
  const activePathway = useSelector(pathwaySelectors.getActivePathway);
  
  useEffect(() => {
    dispatch(pathwayActions.loadDefaultPathwayData());
  }, []);
  
  const handleSelectPathway = (id) => {
    dispatch(pathwayActions.setActivePathway(id));
  };
  
  return (
    <DecarbonizationPathwayPanel
      pathways={pathways}
      activePathwayId={activePathway?.id}
      onSelectPathway={handleSelectPathway}
    />
  );
};
```

## Default Pathway Data

The factory includes comprehensive default data for 8 hydrogen production pathways:

| Pathway | Category | Hard to Decarbonize | Carbon Intensity | Cost |
|---------|----------|-------------------|------------------|------|
| Wind PEM | renewable | No | 1.2 | $2.77 |
| Solar PEM | renewable | No | 1.5 | $2.35 |
| Natural Gas w/ CCS | low-carbon | Yes | 1.8 | $5.04 |
| Natural Gas no CCS | fossil | Yes | 10.4 | $1.70 |
| Solid Oxide PEM | emerging | No | 2.3 | $4.53 |
| Biomass | renewable | No | 2.0 | $4.64 |
| Coal w/ CCS | fossil | Yes | 2.5 | $2.16 |
| Coal no CCS | fossil | Yes | 18.2 | $10.30 |

## Error Handling

The factory implements robust error handling:
- Try-catch blocks in async actions
- Fallback to cached data
- Error logging to console
- Success/failure return values

## Performance Considerations

1. **Memoized Selectors**: All selectors use memoization for performance
2. **Batch Updates**: Support for updating multiple pathways in one action
3. **Selective Updates**: Only update changed properties
4. **Efficient Filtering**: Client-side filtering with memoization

## Future Enhancements

1. **Persistence Layer**: Add local storage or database persistence
2. **Optimistic Updates**: Update UI before API confirmation
3. **Undo/Redo Support**: Track state history for undo functionality
4. **Real-time Updates**: WebSocket integration for live data
5. **Advanced Caching**: Implement cache invalidation strategies