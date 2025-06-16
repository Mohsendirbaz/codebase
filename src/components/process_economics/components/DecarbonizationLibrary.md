# DecarbonizationLibrary Component Documentation

## Overview

DecarbonizationLibrary is a comprehensive component for exploring, comparing, and managing decarbonization pathways. It provides advanced filtering, sorting, comparison features, and integration with personal libraries. This is one of the most complex components in the process economics system, featuring multiple view modes, metrics calculation, and sophisticated data visualization.

## Architecture

### Component Hierarchy
```
DecarbonizationLibrary
├── Popular Pathways Carousel (conditional)
├── Library Header
│   ├── Category Navigation
│   └── View Options
│       ├── Sort Selector
│       ├── View Mode Toggle
│       └── Hard-to-Decarbonize Filter
└── Content Area
    ├── Grid/List View (simple mode)
    └── DecarbonizationPathwayPanel (advanced mode)
```

### State Management
- `pathways`: Object containing all pathway data
- `activePathwayId`: Currently selected pathway
- `comparisonPathwayIds`: Array of pathways in comparison (max 4)
- `selectedCategory`: Current category filter
- `viewMode`: 'grid' or 'list' display mode
- `sortOption`: Current sorting criterion
- `showSortOptions`: Dropdown visibility
- `popularPathways`: Trending pathways data
- `filterHardToDecarbonize`: Boolean filter state
- `pathwayMetrics`: Calculated metrics for each pathway

## Component Props

```javascript
{
  onImportConfiguration: Function,  // Handler for importing pathway configurations
  userId: String,                   // Current user ID for personal library
  isSearchView: Boolean             // Simplified view mode flag (default: false)
}
```

## Core Features

### 1. Pathway Metrics Calculation
Sophisticated algorithm calculating multiple performance indicators:
- **Cost Effectiveness**: Inverse of levelized cost (0-100 scale)
- **Emission Reduction**: Based on carbon intensity (0-100 scale)
- **Implementation Timeframe**: Readiness year scoring (0-100 scale)
- **Water Efficiency**: Water usage optimization (0-100 scale)
- **Overall Score**: Weighted average of all metrics

### 2. Multi-Criteria Sorting
Available sort options:
- Name (alphabetical)
- Cost (levelized cost)
- Emissions (carbon intensity)
- Readiness (implementation year)
- Water usage
- Overall score

### 3. Advanced Filtering
- Category-based filtering
- Hard-to-decarbonize sector focus
- Combined filter application

### 4. Comparison Feature
- Select up to 4 pathways for comparison
- Visual comparison in panel view
- Add/remove from comparison dynamically

### 5. Personal Library Integration
- Convert pathways to library format
- Save with metadata and tags
- Success/error feedback

## Key Functions

### `calculatePathwayMetrics(pathway)`
```javascript
const calculatePathwayMetrics = (pathway) => {
  const metrics = {
    costEffectiveness: 0,
    emissionReduction: 0,
    implementationTimeframe: 0,
    waterEfficiency: 0,
    overallScore: 0
  };
  
  // Complex calculations for each metric
  // Weighted average for overall score:
  metrics.overallScore = (
    metrics.costEffectiveness * 0.35 + 
    metrics.emissionReduction * 0.35 + 
    metrics.implementationTimeframe * 0.15 + 
    metrics.waterEfficiency * 0.15
  );
  
  return metrics;
};
```

### `handleAddToPersonal(pathway)`
Converts pathway data to library-compatible format:
```javascript
const item = {
  id: pathway.id,
  name: pathway.name,
  description: pathway.description,
  category: "Decarbonization Pathway",
  tags: [pathway.category, pathway.isHardToDecarbonize ? "Hard to Decarbonize" : ""],
  modeler: "Climate Module",
  configuration: {
    version: "1.0.0",
    metadata: {
      exportDate: new Date().toISOString(),
      description: `Decarbonization pathway for ${pathway.name}`,
      scalingType: "Decarbonization"
    },
    currentState: {
      id: pathway.id,
      pathwayType: "decarbonization",
      data: pathway
    }
  }
};
```

### Filtering and Sorting Logic
```javascript
// Multi-stage filtering
const filteredPathways = Object.values(pathways).filter(pathway => {
  const categoryMatch = selectedCategory === 'all' || pathway.category === selectedCategory;
  const hardToDecarbonizeMatch = !filterHardToDecarbonize || pathway.isHardToDecarbonize;
  return categoryMatch && hardToDecarbonizeMatch;
});

// Dynamic sorting based on selected criterion
const sortedPathways = [...filteredPathways].sort((a, b) => {
  switch(sortOption) {
    case 'score':
      return (pathwayMetrics[b.id]?.overallScore || 0) - 
             (pathwayMetrics[a.id]?.overallScore || 0);
    // ... other cases
  }
});
```

## UI Components

### View Modes
1. **Search View**: Simplified grid of pathway cards
2. **Standard View**: Full interface with all features
3. **Grid Layout**: Card-based display
4. **List Layout**: Compact row format

### Interactive Elements
- Category selector navigation
- Dropdown sort menu with 6 options
- Toggle buttons for view modes
- Checkbox for sector filtering
- Comparison management controls

### Popular Pathways Section
- Carousel display for trending items
- Usage statistics integration
- Custom card components
- Quick import functionality

## Integration Points

### Service Dependencies
- `decarbonizationService`: Pathway data fetching
- `libraryService`: Personal library operations
- `usageTracker`: Analytics and popularity tracking

### Child Components
- `DecarbonizationPathwayCard`: Individual pathway display
- `DecarbonizationPathwayPanel`: Advanced comparison view
- `CategorySelector`: Navigation component
- `PopularItemsCarousel`: Trending items display

### Data Flow
1. Load pathways from service on mount
2. Calculate metrics for all pathways
3. Fetch usage statistics for popular items
4. Apply filters and sorting
5. Render appropriate view based on mode

## Performance Optimizations

### React.useMemo Usage
- Category extraction from pathways
- Filtered pathways calculation
- Sorted pathways generation

### Conditional Rendering
- Popular carousel only when data available
- Search view for simplified display
- Sort options dropdown on demand

## Best Practices

### Data Management
- Comprehensive error handling for async operations
- Loading states for better UX
- Null checks for optional pathway properties
- Default values for missing metrics

### User Experience
- Maximum 4 pathways for comparison
- Clear visual feedback for actions
- Intuitive filtering and sorting
- Responsive design considerations

### Code Organization
- Logical function grouping
- Clear variable naming
- Comprehensive comments
- Modular design patterns

## Metrics Calculation Details

### Weighting System
- Cost Effectiveness: 35%
- Emission Reduction: 35%
- Implementation Time: 15%
- Water Efficiency: 15%

### Normalization Benchmarks
- Cost: $10/kg H₂ (high benchmark)
- Emissions: 20 kg CO2e/kg H2 (high benchmark)
- Readiness: 2020-2035 range
- Water: 10 gallons (high benchmark)

## Future Enhancements

1. **Advanced Analytics**
   - Pathway recommendation engine
   - Personalized scoring weights
   - Historical trend analysis
   - Regional optimization

2. **Enhanced Comparison**
   - Export comparison results
   - Share comparison views
   - Save comparison sets
   - Visual charts integration

3. **Data Enrichment**
   - Real-time market data
   - Policy impact indicators
   - Technology maturity levels
   - Supply chain considerations

4. **UI/UX Improvements**
   - Advanced filtering UI
   - Batch operations
   - Keyboard shortcuts
   - Mobile optimization