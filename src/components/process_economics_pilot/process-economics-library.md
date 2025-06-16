# Process Economics Library Component

## Overview
A comprehensive library management system for pre-costed process equipment configurations. This large component (1513 lines) provides search, filter, import/export, and storage capabilities for scaling configurations, with inline CSS styling.

## Architecture

### Component Structure
- **Type**: React Functional Component with inline styles
- **Size**: 1513 lines (including ~700 lines of CSS)
- **Pattern**: Modal-based library interface
- **Dependencies**: Heroicons, Headless UI, Framer Motion

### State Management
1. **Library Data**
   - `libraryItems`: Complete item collection
   - `filteredItems`: Search/filter results
   - `selectedItem`: Currently selected item

2. **UI State**
   - `searchTerm`: Search input
   - `selectedCategories`: Active filters
   - `complexityFilter`: Complexity level filter
   - `showFilters`: Filter panel visibility

3. **Save/Import State**
   - `isSaving`: Save modal visibility
   - `saveName`, `saveCategory`, `saveTags`: New item metadata
   - `saveTagInput`: Tag input field

## Core Features

### 1. Library Management
- **Local Storage**: Persistent item storage
- **Import/Export**: JSON file support
- **CRUD Operations**: Create, read, delete items
- **Sample Data**: Demo items included

### 2. Search & Filter System
- **Text Search**: Name, description, tags
- **Category Filter**: Equipment type selection
- **Complexity Filter**: Simple/Medium/Complex
- **Tag System**: Multi-tag support

### 3. Item Structure
```javascript
{
    id: 'unique-id',
    name: 'Equipment Name',
    category: 'Equipment Category',
    description: 'Detailed description',
    tags: ['tag1', 'tag2'],
    dateAdded: ISO string,
    configuration: {
        version: "1.2.0",
        metadata: {...},
        currentState: {
            scalingGroups: [...],
            tabConfigs: [...]
        }
    }
}
```

## UI Components

### Main Layout
1. **Header Section**
   - Title and close button
   - Import/Export buttons
   - Save current configuration

2. **Search Bar**
   - Icon-enhanced input
   - Real-time filtering
   - Clear functionality

3. **Filter Panel**
   - Toggle visibility
   - Category checkboxes
   - Complexity radio buttons

4. **Two-Column Layout**
   - Left: Item list
   - Right: Item details

### Item List Display
- **Item Cards**: Clickable selection
- **Metadata Display**: Category, complexity, date
- **Visual Indicators**: Selection state
- **Tag Display**: Inline tag chips

### Detail Panel
- **Item Information**: Full details
- **Metadata Grid**: Structured info
- **Action Buttons**:
  - Import Configuration
  - Export to File
  - Delete Item

### Save Modal
- **Form Fields**:
  - Name input (required)
  - Category dropdown
  - Tag management
- **Tag System**:
  - Add via Enter key
  - Remove individual tags
  - Visual tag display

## Key Functions

### Data Operations
1. **loadLibrary()**
   - Checks localStorage first
   - Falls back to sample data
   - Could integrate API calls

2. **saveToLibrary()**
   - Validates input
   - Generates unique ID
   - Updates localStorage

3. **importFromLibrary()**
   - Calls parent callback
   - Passes configuration
   - Closes library

4. **exportToFile()**
   - Creates JSON blob
   - Triggers download
   - Cleanup resources

### Filtering Logic
```javascript
// Search across multiple fields
item.name.toLowerCase().includes(searchLower) ||
item.description.toLowerCase().includes(searchLower) ||
item.tags.some(tag => tag.toLowerCase().includes(searchLower))

// Category filtering
selectedCategories.length === 0 || 
selectedCategories.includes(item.category)

// Complexity calculation
const groupCount = item.configuration.currentState.scalingGroups?.length || 0;
```

## Equipment Categories
- Heat Exchangers
- Pumps & Compressors
- Vessels & Tanks
- Reactors
- Separation Equipment
- Material Handling
- Utilities

## Sample Library Items

### Heat Exchanger Example
```javascript
{
    name: 'Shell & Tube Heat Exchanger',
    category: 'Heat Exchangers',
    description: 'Standard shell & tube heat exchanger with six-tenths rule scaling',
    tags: ['heat transfer', 'shell & tube', 'standard'],
    configuration: {
        scalingType: "Amount4",
        scalingGroups: [/* Capacity scaling groups */]
    }
}
```

## CSS Architecture (Inline)

### Layout Classes
- `.process-economics-library`: Main container
- `.library-content`: Two-column grid
- `.library-sidebar`: Left panel
- `.library-main`: Right panel

### Component Classes
- `.search-container`: Search bar wrapper
- `.filter-panel`: Filter controls
- `.library-item`: Item card
- `.library-item-details`: Detail view

### State Classes
- `.selected`: Active item
- `.filter-active`: Active filter
- `.modal-overlay`: Modal backdrop

## Integration Points

### Props Interface
- `onImportConfiguration`: Import callback
- `onClose`: Close handler
- `currentConfiguration`: Active config
- `filterKeyword`: Category context

### Data Flow
1. Parent provides current configuration
2. User selects/creates library item
3. Import triggers callback with config
4. Parent updates scaling groups

## Performance Considerations
- Large inline CSS (optimization opportunity)
- Efficient filtering with useMemo
- Debounced search recommended
- Virtual scrolling for large libraries

## Future Enhancements
- Server-side storage
- Shared libraries
- Version control
- Configuration validation
- Advanced search options