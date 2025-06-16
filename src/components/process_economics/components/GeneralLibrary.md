# GeneralLibrary Component Documentation

## Component Overview
The GeneralLibrary component serves as the primary interface for browsing and managing process economics configurations in a shared library system. It provides a sophisticated browsing experience with multiple view modes, sorting options, and categorization capabilities.

### Core Functionality
- **Library browsing**: Display and browse shared configuration items
- **Category filtering**: Filter items by category with dynamic category extraction
- **Sorting mechanisms**: Multiple sort options (name, category, date, popularity, complexity)
- **View modes**: Toggle between grid and list views
- **Popular items carousel**: Showcase frequently used configurations
- **Personal library integration**: Add items to personal library with shelf selection

### Dependencies
- React (useState, useEffect)
- framer-motion (AnimatePresence, motion)
- @heroicons/react (UI icons)
- ItemCard (child component)
- CategorySelector (child component)
- PopularItemsCarousel (child component)
- libraryService (saveToPersonalLibrary)
- usageTrackingService (usageTracker)

## Architecture Summary

### Level 1: Component Entry and Props
```
GeneralLibrary({ items, onImportConfiguration, isSearchView })
├─ Primary library browsing interface
├─ Supports full browsing mode and simplified search view
└─ Manages popular items loading and display
```

### Level 2: State Management
```
State Architecture:
├─ selectedCategory: Active category filter
├─ viewMode: Current display mode (grid/list)
├─ sortOption: Active sorting criterion
├─ showSortOptions: Sort dropdown visibility
├─ popularItems: Cached popular configurations
└─ isLoadingPopular: Popular items loading state
```

### Level 3: Functional Architecture
```
Data Flow:
├─ Popular Items Loading
│  ├─ useEffect initialization
│  ├─ usageTracker.getPopularItems(6)
│  └─ State update with popular items
├─ Category Extraction
│  ├─ Extract unique categories from items
│  └─ Prepend 'all' option
├─ Item Filtering
│  ├─ Apply category filter
│  └─ Return filtered item set
└─ Item Sorting
   ├─ Apply selected sort option
   └─ Support for 5 sort criteria
```

### Level 4: Rendering Architecture
```
Component Structure:
├─ Search View Mode (Simplified)
│  └─ Direct grid rendering of sorted items
└─ Full Library Mode
   ├─ Popular Items Section
   │  ├─ Section header with icon
   │  └─ PopularItemsCarousel component
   ├─ Library Header
   │  ├─ CategorySelector
   │  └─ View Options
   │     ├─ Sort Selector (dropdown)
   │     └─ View Mode Toggle (grid/list)
   └─ Library Content
      ├─ AnimatePresence wrapper
      ├─ Mapped ItemCard components
      └─ Empty state message
```

### Level 5: Component Integration Points
```
External Integrations:
├─ saveToPersonalLibrary Service
│  ├─ userId parameter
│  ├─ item data
│  └─ optional shelf parameter
├─ usageTracker Service
│  └─ getPopularItems(limit)
├─ ItemCard Component
│  ├─ item prop
│  ├─ onImport callback
│  ├─ onAddToPersonal callback
│  └─ viewMode prop
├─ CategorySelector Component
│  ├─ categories array
│  ├─ selectedCategory
│  └─ onSelectCategory callback
└─ PopularItemsCarousel Component
   ├─ items array
   ├─ onImport callback
   └─ onAddToPersonal callback
```

## Key Features

### 1. Dynamic Category Management
The component automatically extracts unique categories from the item dataset and provides a category selector with an "all" option:
```javascript
const categories = ['all', ...new Set(items.map(item => item.category))];
```

### 2. Advanced Sorting System
Five sorting options with intelligent comparisons:
- **Name**: Alphabetical ordering
- **Category**: Group by category
- **Date**: Most recent first
- **Complexity**: Based on scaling group count
- **Popularity**: Based on usage statistics

### 3. Dual View Modes
- **Grid View**: Card-based layout for visual browsing
- **List View**: Compact list format for efficient scanning

### 4. Popular Items Integration
Asynchronously loads and displays the 6 most popular configurations in a carousel format, providing quick access to frequently used items.

### 5. Personal Library Integration
Seamless integration with personal library functionality:
```javascript
const handleAddToPersonal = async (item, userId, shelf = null) => {
  await saveToPersonalLibrary(userId, item, shelf);
  alert(`Added "${item.name}" to your personal library${shelf ? ` (${shelf})` : ''}`);
};
```

## Technical Implementation Details

### Animation and Transitions
Uses framer-motion for smooth item animations:
- Initial state: `opacity: 0, y: 20`
- Animate state: `opacity: 1, y: 0`
- Exit state: `opacity: 0, y: -20`
- Duration: 200ms

### Complexity Calculation
Sorting by complexity uses the total number of scaling groups as a metric:
```javascript
b.configuration.currentState.scalingGroups.length - 
a.configuration.currentState.scalingGroups.length
```

### Error Handling
- Try-catch blocks for popular items loading
- Console error logging for debugging
- User-friendly error messages via alerts

### Performance Considerations
- Conditional rendering based on `isSearchView` prop
- Efficient category extraction using Set
- Memoized sort operations on filtered data

## Usage Example
```jsx
<GeneralLibrary 
  items={libraryItems}
  onImportConfiguration={(config) => handleImport(config)}
  isSearchView={false}
/>
```

## CSS Classes and Styling
- `.general-library`: Main container
- `.popular-items-section`: Popular carousel section
- `.general-library-header`: Header with controls
- `.general-library-content`: Main content area
- `.grid-view` / `.list-view`: View mode classes
- `.empty-library`: Empty state styling