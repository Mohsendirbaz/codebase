# DecarbonizationPathwayPanel Component Documentation

## Overview
The `DecarbonizationPathwayPanel` is the main component for displaying, comparing, and analyzing decarbonization pathways in the ModEcon Matrix System. It provides a comprehensive interface for exploring various hydrogen production methods and other decarbonization strategies, with special focus on hard-to-decarbonize sectors.

## Purpose
- Display and organize decarbonization pathways in multiple views
- Enable side-by-side comparison of up to 4 pathways
- Filter and sort pathways by various metrics
- Provide detailed analysis of individual pathways
- Support hard-to-decarbonize sector identification

## Key Features

### 1. Multiple View Modes
- **List View**: Tabular overview of all pathways with key metrics
- **Detail View**: In-depth analysis of a single pathway
- **Compare View**: Side-by-side comparison of selected pathways

### 2. Advanced Filtering
- **Category Filter**: Filter by pathway category (renewable, fossil, low-carbon, etc.)
- **Hard-to-Decarbonize Filter**: Focus on challenging sectors
- **Sorting Options**: Sort by cost, emissions, readiness, water usage, or overall score

### 3. Comprehensive Metrics Display
- Cost per kg H₂
- Carbon intensity (emissions)
- Technology readiness level
- Water consumption
- Implementation timeline

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pathways` | `Object` | `{}` | Object containing all pathway data |
| `activePathwayId` | `String` | - | ID of the currently selected pathway |
| `comparisonPathwayIds` | `Array` | `[]` | Array of pathway IDs selected for comparison |
| `metrics` | `Object` | `{}` | Additional metrics data for pathways |
| `onSelectPathway` | `Function` | - | Callback when a pathway is selected |
| `onAddToComparison` | `Function` | - | Callback to add pathway to comparison |
| `onRemoveFromComparison` | `Function` | - | Callback to remove pathway from comparison |
| `onCategoryChange` | `Function` | - | Callback when category filter changes |
| `filterHardToDecarbonize` | `Boolean` | `false` | Whether to show only hard-to-decarbonize pathways |
| `onToggleHardToDecarbonizeFilter` | `Function` | - | Callback to toggle the filter |

## Component Architecture

### State Management
- `view`: Current view mode ('list', 'detail', 'compare')
- `sortBy`: Current sorting criteria
- `selectedCategory`: Active category filter

### Computed Values
- `categories`: Extracted from all pathways
- `filteredPathways`: Pathways after applying filters and sorting
- `activePathway`: Currently selected pathway object
- `comparisonPathways`: Pathway objects selected for comparison

## UI Components

### 1. Header Section
```javascript
<div className="pathway-panel-header">
  <h2>Decarbonization Pathways</h2>
  <div className="pathway-controls">
    {/* View selector, filters, and sorting */}
  </div>
</div>
```

### 2. List View
Displays pathways in a sortable table format:
- Pathway name with category indicator
- Cost ($/kg H₂)
- Emissions (kg CO₂e/kg H₂)
- Readiness level and year
- Water usage
- Action buttons for comparison

### 3. Detail View
Shows comprehensive information about a single pathway:
- Full pathway card (via `DecarbonizationPathwayCard`)
- Greenhouse gas emissions analysis
- Implementation timeline (via `DecarbonizationTargetTimeline`)
- Resource requirements table

### 4. Compare View
Enables visual comparison of multiple pathways:
- Comparison charts for key metrics
- Individual pathway cards in comparison mode
- Clear comparison button

## View Management Logic

The component automatically switches views based on user actions:
```javascript
useEffect(() => {
  if (comparisonPathwayIds.length > 0) {
    setView('compare');
  } else if (view === 'compare') {
    setView('list');
  }
}, [comparisonPathwayIds, view]);
```

## Sorting Implementation

Pathways can be sorted by multiple criteria:
```javascript
switch (sortBy) {
  case 'cost':
    return (a.economics?.["Real Levelized Cost ($/kg H₂)"] || 999) - 
           (b.economics?.["Real Levelized Cost ($/kg H₂)"] || 999);
  case 'emissions':
    return (a.carbonIntensity || 999) - (b.carbonIntensity || 999);
  case 'readiness':
    return (a.readinessYear || 2050) - (b.readinessYear || 2050);
  // ... more cases
}
```

## Integration with Child Components

### 1. DecarbonizationPathwayCard
Used in both detail and compare views:
```javascript
<DecarbonizationPathwayCard 
  pathway={activePathway}
  metrics={metrics[activePathway.id] || {}}
  isComparison={false}
  isInComparison={comparisonPathwayIds.includes(activePathway.id)}
  onAddToComparison={() => handleAddToComparison(activePathway.id)}
  onRemoveFromComparison={() => handleRemoveFromComparison(activePathway.id)}
/>
```

### 2. PathwayComparisonChart
Used in compare view for visualizing metrics:
```javascript
<PathwayComparisonChart 
  pathways={comparisonPathways}
  dataKey="economics.Real Levelized Cost ($/kg H₂)"
  format={(value) => `$${value?.toFixed(2)}`}
  ascending={true}
  color="#2c7bb6"
/>
```

### 3. DecarbonizationTargetTimeline
Shows implementation timeline in detail view:
```javascript
<DecarbonizationTargetTimeline 
  maturityLevel={activePathway.maturityLevel}
  readinessYear={activePathway.readinessYear}
/>
```

## Styling
Component uses dedicated CSS: `./styles/DecarbonizationPathwayPanel.css`

Key style classes:
- `.decarbonization-pathway-panel`: Main container
- `.pathway-list-item`: Individual pathway rows
- `.hard-to-decarbonize-badge`: Special indicator
- `.comparison-charts`: Chart container grid
- `.pathway-controls`: Control panel styling

## Usage Example

```javascript
<DecarbonizationPathwayPanel
  pathways={pathwaysData}
  activePathwayId="wind-pem"
  comparisonPathwayIds={["solar-pem", "natgas-ccs"]}
  metrics={pathwayMetrics}
  onSelectPathway={(id) => dispatch(selectPathway(id))}
  onAddToComparison={(id) => dispatch(addToComparison(id))}
  onRemoveFromComparison={(id) => dispatch(removeFromComparison(id))}
  onCategoryChange={(cat) => dispatch(setCategory(cat))}
  filterHardToDecarbonize={showHardToDecarbonize}
  onToggleHardToDecarbonizeFilter={(val) => dispatch(toggleFilter(val))}
/>
```

## Performance Optimizations
- Memoized filtering and sorting with `useMemo`
- Animated transitions with `framer-motion`
- Limited comparison to 4 pathways maximum
- Efficient re-renders through proper prop management

## Accessibility Features
- Proper labeling for all interactive elements
- Radio button groups for options
- Clear visual indicators for active states
- Keyboard navigation support

## Future Enhancements
1. Export comparison results to PDF/Excel
2. Advanced filtering by multiple criteria
3. Custom metric creation and visualization
4. Integration with carbon pricing APIs
5. Pathway recommendation engine based on user requirements