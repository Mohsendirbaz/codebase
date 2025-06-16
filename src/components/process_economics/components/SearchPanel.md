# SearchPanel Component

## Overview
The `SearchPanel` component provides a comprehensive search interface with advanced filtering capabilities. It features real-time search, collapsible filter panel, category and complexity filters, and visual indicators for active filters.

## Component Architecture

### Props Interface
```javascript
{
  onSearch: Function  // Callback with (searchTerm, filters) parameters
}
```

### State Management
```javascript
const [searchTerm, setSearchTerm] = useState('');      // Search input value
const [showFilters, setShowFilters] = useState(false); // Filter panel visibility
const [filters, setFilters] = useState({
  categories: [],      // Selected category filters
  complexity: null     // Selected complexity level
});
```

## Core Features

### 1. Search Input System

#### Real-time Search
Search triggers immediately on input change:
```javascript
const handleSearchChange = (e) => {
  const value = e.target.value;
  setSearchTerm(value);
  onSearch(value, getActiveFilters());
};
```

#### Clear Functionality
- Clear button appears when search term exists
- Resets search while maintaining filters
- Visual X icon for intuitive UX

### 2. Advanced Filter System

#### Filter Categories
1. **Categories**: Multi-select from predefined list
2. **Complexity**: Single-select with three levels
   - Simple (1-2 groups)
   - Medium (3-5 groups)
   - Complex (6+ groups)

#### Filter Toggle Logic
```javascript
// Toggle category - allows multiple selections
const toggleCategoryFilter = (category) => {
  setFilters(prev => {
    const newCategories = prev.categories.includes(category)
      ? prev.categories.filter(c => c !== category)
      : [...prev.categories, category];
    // ... update and trigger search
  });
};

// Set complexity - single selection with toggle
const setComplexityFilter = (complexity) => {
  setFilters(prev => {
    const newComplexity = prev.complexity === complexity ? null : complexity;
    // ... update and trigger search
  });
};
```

### 3. Filter Panel Animation
Uses Framer Motion for smooth expand/collapse:
```javascript
<motion.div 
  className="filters-panel"
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: 'auto', opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.2 }}
>
```

### 4. Active Filter Indication
Visual feedback for filter state:
- Filter count badge on button
- Highlighted button when filters active
- Individual filter selection states

## Component Structure

```
SearchPanel
├── Search Bar
│   ├── Search Input Container
│   │   ├── Search Icon
│   │   ├── Input Field
│   │   └── Clear Button (conditional)
│   └── Filter Button (with count badge)
└── Filters Panel (collapsible)
    ├── Category Section
    │   └── Category Buttons
    ├── Complexity Section
    │   └── Complexity Buttons
    └── Clear All Filters Button
```

## Filter Management

### Active Filter Tracking
```javascript
const activeFilterCount = 
  filters.categories.length + 
  (filters.complexity ? 1 : 0);
```

### Filter Aggregation
```javascript
const getActiveFilters = (currentFilters = filters) => {
  const activeFilters = {};
  
  if (currentFilters.categories.length > 0) {
    activeFilters.categories = currentFilters.categories;
  }
  
  if (currentFilters.complexity) {
    activeFilters.complexity = currentFilters.complexity;
  }
  
  return activeFilters;
};
```

## UI/UX Features

### 1. Search Bar Design
- Icon-prefixed input for context
- Placeholder text with search hints
- Clear button for quick reset
- Integrated filter toggle

### 2. Filter Button States
```javascript
className={`filter-button ${activeFilterCount > 0 ? 'has-filters' : ''}`}
```
- Visual distinction when filters active
- Count badge for quick reference
- Toggle behavior for panel

### 3. Filter Selection Feedback
- Selected filters highlighted
- Toggle behavior for all filters
- Clear visual states

### 4. Responsive Clear Action
- "Clear All Filters" disabled when no filters
- Immediate update propagation
- Maintains search term separately

## State Synchronization

### Search + Filter Coordination
Both search and filters trigger the parent callback:
```javascript
onSearch(searchTerm, getActiveFilters());
```

### Real-time Updates
- No submit button needed
- Immediate feedback
- Debouncing handled by parent if needed

## Styling Architecture

### CSS Classes
```css
.search-panel              // Root container
.search-bar               // Search and filter row
.search-input-L-container // Search input wrapper
.search-input-L           // Main search input
.filter-button            // Filter toggle button
.filters-panel            // Collapsible filter area
.category-filter          // Individual category button
.complexity-filter        // Individual complexity button
```

### Visual States
- `.has-filters`: Filter button with active filters
- `.selected`: Selected filter buttons
- `.disabled`: Disabled clear button

## Usage Example

```jsx
const handleSearch = (searchTerm, filters) => {
  // Apply search term
  let results = allItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Apply filters
  if (filters.categories?.length > 0) {
    results = results.filter(item => 
      filters.categories.includes(item.category)
    );
  }
  
  if (filters.complexity) {
    results = results.filter(item => 
      item.complexity === filters.complexity
    );
  }
  
  setFilteredResults(results);
};

<SearchPanel onSearch={handleSearch} />
```

## Accessibility Features

1. **Keyboard Navigation**: All controls keyboard accessible
2. **ARIA Labels**: Descriptive labels for controls
3. **Focus Management**: Logical tab order
4. **Visual Feedback**: Clear focus states

## Performance Considerations

1. **Controlled Updates**: Filters update independently
2. **Minimal Re-renders**: State updates are targeted
3. **No Debouncing**: Parent component handles if needed
4. **Efficient Filter Logic**: Single-pass filtering

## Best Practices Demonstrated

1. **Single Responsibility**: Each function has one purpose
2. **Composition**: Combines multiple filter types
3. **Controlled Components**: All inputs controlled
4. **Immediate Feedback**: No delays in UI updates

## Animation Details

### Panel Animation
- Smooth height transition
- Opacity fade for polish
- AnimatePresence for exit animation
- Short duration (200ms) for responsiveness

## Integration Points

### With Parent Component
- Single callback for all search/filter changes
- Parent handles actual filtering logic
- Flexible filter structure for extensibility

### With Data
- Categories imported from shared data source
- Complexity levels defined in component
- Easy to extend with new filter types

## Potential Enhancements

1. **Search History**: Recent searches dropdown
2. **Saved Filters**: Save filter combinations
3. **Advanced Syntax**: Support AND/OR operations
4. **Date Filters**: Add date range filtering
5. **Sort Options**: Integrate sorting controls
6. **Filter Presets**: Quick filter combinations
7. **Export Results**: Download filtered results
8. **Voice Search**: Audio input option

## Edge Cases Handled

1. **Empty Search**: Clear button only shows with content
2. **No Filters**: Clear filters button disabled
3. **Toggle Behavior**: Clicking active filter deselects
4. **State Persistence**: Maintains state during panel toggle