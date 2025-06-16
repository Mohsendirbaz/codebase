# LibrarySystem.js - Process Economics Library Management System

## Overview

`LibrarySystem.js` is the main component for the Process Economics Library feature in the ModEcon Matrix System. It provides a comprehensive interface for managing, searching, and importing industrial process configurations across personal and shared libraries.

## Architecture

### Core Components
1. **Tabbed Interface**: Multiple library views using Headless UI tabs
2. **Library Types**: Personal, General, Specialized Systems, and Decarbonization Pathways
3. **Search System**: Cross-library search with filters
4. **Import/Export**: Configuration management tools
5. **Usage Tracking**: Analytics for library item usage

### State Management
```javascript
const [activeTab, setActiveTab] = useState(0);
const [personalLibrary, setPersonalLibrary] = useState([]);
const [generalLibrary, setGeneralLibrary] = useState([]);
const [searchResults, setSearchResults] = useState(null);
const [isSearching, setIsSearching] = useState(false);
const [showUsageStats, setShowUsageStats] = useState(false);
```

## Features

### Library Types

1. **Personal Library**
   - User-specific saved configurations
   - Editable and deletable items
   - Private to each user

2. **General Library**
   - Shared public configurations
   - Read-only access
   - Community-contributed content

3. **Specialized Systems (Cilos)**
   - Industry-specific equipment configurations
   - Categorized by industrial sector
   - Detailed technical specifications

4. **Decarbonization Pathways**
   - Net-zero transition strategies
   - Industry-specific pathways
   - Timeline and milestone tracking

### Search Functionality

```javascript
const searchInLibrary = (library, term, filters) => {
  // Multi-field search across:
  // - Item names
  // - Descriptions
  // - Tags
  // - Modeler names
}
```

Search features:
- Real-time filtering
- Multiple field matching
- Filter combination support
- Separate results view

### Usage Tracking

```javascript
const handleImportWithTracking = (configuration) => {
  // Tracks:
  // - Item ID
  // - User ID
  // - Source library
  // - Action type (import)
}
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `onImportConfiguration` | Function | Callback for importing a configuration |
| `onClose` | Function | Callback to close the library system |
| `currentConfiguration` | Object | Currently active configuration |
| `filterKeyword` | String | Pre-filter keyword |
| `userId` | String | Current user identifier |

## Tab Structure

### Tab Icons and Labels
- **Personal Library**: UserIcon - User's saved configurations
- **General Library**: GlobeAltIcon - Public configurations
- **Specialized Systems**: CubeIcon - Industrial equipment catalog
- **Decarbonization Pathways**: LeafIcon - Sustainability strategies
- **Search Results**: MagnifyingGlassIcon - Dynamic search tab

## Data Flow

1. **Library Loading**
   ```javascript
   useEffect(() => {
     const loadLibraries = async () => {
       const personalData = await getPersonalLibrary(userId);
       const generalData = await getGeneralLibrary();
     };
   }, [userId]);
   ```

2. **Import Process**
   - User selects configuration
   - Usage tracking records action
   - Configuration imported to main system

3. **Search Process**
   - User enters search term/filters
   - Both libraries searched simultaneously
   - Results displayed in separate tab

## Sub-Components

### Header Components
- `LibraryHeader`: Title bar with stats toggle
- `SearchPanel`: Search input and filters
- `ImportExportPanel`: Configuration management tools

### Content Components
- `PersonalLibrary`: Personal items display
- `GeneralLibrary`: Public items display
- `CiloExplorer`: Specialized equipment browser
- `DecarbonizationLibrary`: Sustainability pathways
- `UsageStatsOverview`: Analytics dashboard

## Services Integration

### Library Service
```javascript
import { getPersonalLibrary, getGeneralLibrary } from './services/libraryService';
```

### Usage Tracking
```javascript
import { usageTracker } from './services/usageTrackingService';
```

### Utilities
```javascript
import { generateUniqueId } from './utils/blockchainUtils';
```

## Styling

### CSS Imports
```css
import './styles/LibrarySystem.css'
import './styles/DecarbonizationComponents.css'
```

### Key Classes
- `.process-economics-library-system`: Main container
- `.library-navigation`: Navigation area
- `.library-tabs`: Tab list container
- `.library-tab-selected`: Active tab state
- `.library-panels`: Content panels

## Best Practices

1. **Performance**
   - Lazy load library data
   - Debounce search inputs
   - Cache search results

2. **User Experience**
   - Clear visual feedback
   - Loading states
   - Empty state messages

3. **Data Management**
   - Track all user interactions
   - Maintain data consistency
   - Handle errors gracefully

## Integration Points

- Integrates with main application state
- Connects to backend library services
- Tracks usage for analytics
- Supports configuration import/export

This component serves as the central hub for process economics knowledge sharing, enabling users to leverage community expertise and build upon existing industrial configurations.