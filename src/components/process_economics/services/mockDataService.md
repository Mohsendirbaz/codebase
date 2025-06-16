# Mock Data Service Documentation

## Overview

The `mockDataService.js` module serves as a central repository for mock data used throughout the process economics system. It provides realistic test data for development, testing, and fallback scenarios when Firebase is unavailable.

## API Methods

### `getMockData(category, filters)`

Retrieves mock data filtered by various parameters.

**Signature:**
```javascript
getMockData(category: string, filters?: Object) => Array|Object|null
```

**Parameters:**
- `category` - Type of data to retrieve:
  - `'personalLibrary'` - User's personal library items
  - `'generalLibrary'` - Public/shared library items
  - `'ciloItems'` - CILO (Category-specific) items
  - `'userProfile'` - User profile data
  - `'shelves'` - Available shelf names
- `filters` - Optional filtering options:
  - `searchTerm` - Text search across name, description, tags, modeler
  - `category` - Filter by item category
  - `shelf` - Filter by shelf name or favorites
  - `userId` - Filter by user ID
  - `ciloType` - Specific CILO category
  - `startDate` - Filter items added after this date
  - `endDate` - Filter items added before this date
  - `sortBy` - Sort order ('name', 'dateAdded', 'dateModified', 'popularity', 'complexity')
  - `limit` - Maximum number of results

**Returns:**
- Filtered data based on category and filters
- Returns null if category not found

## Data Structures

### Personal Library Item

```javascript
{
  id: string,
  name: string,
  description: string,
  category: string,              // e.g., "Capital Cost Estimation"
  tags: Array<string>,
  shelf: string,                 // e.g., "favorites", "projects"
  isFavorite: boolean,
  userId: string,
  dateAdded: ISO string,
  dateModified?: ISO string,
  modeler: string,
  configuration: {
    version: string,
    metadata: {
      exportDate: ISO string,
      exportedBy: string,
      description: string,
      scalingType: string       // e.g., "Amount4", "Amount5"
    },
    currentState: {
      selectedGroupIndex: number,
      scalingGroups: Array<ScalingGroup>,
      protectedTabs: Array<string>,
      tabConfigs: Array<TabConfig>
    }
  }
}
```

### General Library Item

Similar to Personal Library Item but includes usage statistics:

```javascript
{
  // ... same base fields as Personal Library Item
  usage: {
    total: number,
    viewCount: number,
    importCount: number,
    shareCount: number
  }
}
```

### CILO Item Structure

```javascript
{
  id: string,
  name: string,
  description: string,
  category: string,              // e.g., "Equipment Sizing"
  tags: Array<string>,
  dateAdded: ISO string,
  modeler: string,
  usage: UsageStats,
  configuration: Configuration
}
```

### Scaling Group Structure

```javascript
{
  id: string,
  name: string,
  items: Array<{
    id: string,
    label: string,
    operation: string,          // 'add', 'multiply', 'power', 'subtract'
    scalingFactor: number
  }>
}
```

### Tab Configuration

```javascript
{
  id: string,
  label: string,
  isProtected: boolean,
  _scalingType: string
}
```

## Mock Data Categories

### Personal Library
- 2 sample items per user
- Categories: "Capital Cost Estimation", "ROI Models"
- Includes favorites and project shelves

### General Library
- Industry-standard models
- Lifecycle assessment frameworks
- Complete with usage statistics

### CILO Categories
1. **fluid-handling** - Pumping systems, hydraulics
2. **thermal-systems** - Heat exchangers, thermal optimization
3. **columns** - Distillation, separation equipment
4. **renewable-systems** - Solar PV, renewable energy
5. **power-grid** - Transmission, grid infrastructure

### User Profiles
```javascript
{
  id: string,
  name: string,
  email: string,
  createdAt: ISO string,
  lastActive: ISO string,
  isAnonymous: boolean,
  preferences: {
    defaultLibraryView: string,
    defaultSorting: string,
    showUsageStats: boolean
  }
}
```

### Shelves
Default shelves: `['favorites', 'projects', 'templates', 'archived']`

## Filtering and Sorting

### Search Functionality
Searches across:
- Item name
- Description
- Tags array
- Modeler name

### Sort Options
- `name` - Alphabetical order
- `dateAdded` - Newest first
- `dateModified` - Recently modified first
- `popularity` - By usage total
- `complexity` - By number of scaling groups

### Date Filtering
- Supports ISO date strings
- Filters based on `dateAdded` field
- Inclusive date ranges

## Usage Examples

```javascript
import { getMockData } from './mockDataService';

// Get all personal library items for a user
const personalItems = getMockData('personalLibrary', { userId: 'test-user-123' });

// Search general library
const searchResults = getMockData('generalLibrary', { 
  searchTerm: 'cost',
  sortBy: 'popularity',
  limit: 5 
});

// Get CILO items by type
const thermalItems = getMockData('ciloItems', { ciloType: 'thermal-systems' });

// Get favorites from personal library
const favorites = getMockData('personalLibrary', { 
  userId: 'test-user-123',
  shelf: 'favorites' 
});

// Get items by date range
const recentItems = getMockData('generalLibrary', {
  startDate: '2024-01-01',
  endDate: '2024-03-31',
  sortBy: 'dateAdded'
});
```

## Mock Data Features

### Realistic Data
- Proper ID formats using kebab-case
- Realistic timestamps
- Varied usage statistics
- Complete configuration objects

### Comprehensive Coverage
- Multiple scaling types (Amount4-7)
- Various operations (add, multiply, power, subtract)
- Different protection levels
- Multiple categories and tags

### Testing Scenarios
- Items with and without modifications
- Protected and unprotected tabs
- Various complexity levels
- Different user preferences

## Integration Patterns

### Development Mode
```javascript
if (useMockFirebase) {
  return getMockData('personalLibrary', { userId });
}
```

### Fallback Strategy
```javascript
try {
  // Try Firebase operation
  const data = await getFirebaseData();
  return data;
} catch (error) {
  // Fall back to mock data
  return getMockData('generalLibrary');
}
```

### Testing
```javascript
// Predictable test data
const testItem = getMockData('personalLibrary', { 
  userId: 'test-user-123' 
})[0];

expect(testItem.id).toBe('personal-item-1');
expect(testItem.name).toBe('My Custom Cost Model');
```

## Error Handling

- Returns `null` for unknown categories
- Returns empty arrays for no matches
- Handles missing or invalid filters gracefully
- Type-safe filter applications