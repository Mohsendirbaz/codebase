# Filtered Factual Precedence Component

## Overview
An advanced filtering system for factual precedence data that provides intelligent filter suggestions, multi-category filtering, and enhanced user experience. Wraps the FactualPrecedenceBase with sophisticated filtering capabilities.

## Architecture

### Component Structure
- **Type**: React Component with sub-components
- **Size**: 395 lines
- **Pattern**: Filter-enhanced data display
- **Dependencies**: FactualPrecedenceBase, keyPointsMapping, axios

### Sub-Components
1. **FilterPanel**: Intelligent filter interface
2. **FilteredFactualPrecedence**: Main wrapper component

## Core Features

### 1. Intelligent Filter Suggestions
- Context-aware recommendations
- Industry-based auto-suggestions
- Technology and region matching
- One-click application

### 2. Multi-Category Filtering
- Dynamic category expansion
- Active filter counting
- Clear all functionality
- Visual filter indicators

### 3. Enhanced UX
- Auto-expand first category
- Suggested filter highlighting
- Collapsible categories
- Filter action buttons

## Filter Panel Component

### Props
| Prop | Type | Description |
|------|------|-------------|
| `id` | string | Parameter identifier |
| `selectedFilters` | object | Active filter state |
| `onFilterChange` | function | Filter update handler |
| `industryContext` | string | Industry context data |

### State Management
- `expandedCategories`: UI expansion state
- `suggestedFilters`: AI-suggested filters

### Filter Suggestion Logic
```javascript
// Industry-based suggestions
if (industryContext.includes('energy')) {
  suggestions.push({ category: 'industryType', id: 'energy' });
}

// Technology context
if (industryContext.includes('innovative')) {
  suggestions.push({ category: 'technology', id: 'emerging' });
}

// Regional context
if (industryContext.includes('north america')) {
  suggestions.push({ category: 'region', id: 'north_america' });
}
```

### Key Methods

#### toggleCategory
- Expands/collapses filter categories
- Maintains UI state

#### handleFilterToggle
- Updates filter selection
- Propagates to parent

#### clearAllFilters
- Removes all active filters
- Iterates through categories

#### applySuggestedFilters
- Applies AI recommendations
- Avoids duplicates

## Main Component Features

### Data Fetching
Enhanced precedence data retrieval with:
- Industry context integration
- Filter-based querying
- Score-based sorting
- Comprehensive filtering

### Filtering System

#### Filter Categories
- **Industry Type**: Manufacturing, Chemical, Energy, etc.
- **Technology**: Conventional, Emerging, Hybrid
- **Region**: Geographic filtering
- **Capacity**: Small, Medium, Large scale
- **Time Period**: Era-based filtering

#### Scoring Algorithm
```javascript
calculateRelevanceScore(keyPoint) {
  let score = 0;
  
  // Context matching
  if (contextMatch) score += 3;
  
  // Active filter matching
  activeFilters.forEach(filter => {
    if (keyPoint[category] === filter) score += 5;
  });
  
  // Keyword relevance
  if (keywordMatch) score += 2;
  
  return score;
}
```

### Data Processing Pipeline
1. **Fetch Key Points**: Load relevant data
2. **Apply Filters**: Category-based filtering
3. **Calculate Scores**: Relevance scoring
4. **Sort Results**: Score-based ordering
5. **Enhance Data**: Add metadata

## UI Components

### Filter Panel Layout
```
┌─────────────────────────────┐
│ Refine Results              │
│ Clear All (3) | Suggested   │
├─────────────────────────────┤
│ ▼ Industry Type             │
│   □ Manufacturing           │
│   ☑ Chemical (suggested)    │
│   □ Energy                  │
├─────────────────────────────┤
│ ▶ Technology                │
├─────────────────────────────┤
│ ▶ Region                    │
└─────────────────────────────┘
```

### Visual Indicators
- **Suggested**: Highlighted filters
- **Active**: Checked state
- **Count**: Active filter badge
- **Expand/Collapse**: +/- icons

## CSS Classes

### Layout Classes
- `.filter-panel`: Main container
- `.filter-panel-header`: Header section
- `.filter-actions`: Button group
- `.filter-category`: Category block
- `.filter-options`: Options list

### State Classes
- `.expanded`/`.collapsed`: Category states
- `.suggested`: AI-recommended
- `.active-filter`: Selected state

### Interactive Classes
- `.clear-filters-button`: Clear action
- `.suggested-filters-button`: Apply suggestions
- `.filter-checkbox`: Filter option
- `.category-toggle`: Expand/collapse

## Data Flow

### Filter Application Flow
1. User selects filters
2. `onFilterChange` callback
3. Parent state update
4. Data re-fetching
5. Score recalculation
6. UI update

### Suggestion Flow
1. Context analysis
2. Suggestion generation
3. Visual highlighting
4. One-click application
5. Filter state update

## Performance Optimizations

### Efficient Filtering
- Memoized filter results
- Lazy category expansion
- Debounced updates
- Cached suggestions

### Smart Defaults
- Auto-expand relevant category
- Pre-select common filters
- Context-aware suggestions
- Progressive disclosure

## Integration Example

```jsx
<FilteredFactualPrecedence
  show={true}
  position={position}
  onClose={handleClose}
  formValues={formData}
  id="Amount5_process"
  handleInputChange={updateValue}
/>
```

## Best Practices

### Filter Design
- Clear category labels
- Logical groupings
- Visual feedback
- Easy reset options

### Performance
- Debounced filtering
- Efficient scoring
- Minimal re-renders
- Cached computations

### User Experience
- Progressive disclosure
- Smart suggestions
- Clear actions
- Responsive feedback