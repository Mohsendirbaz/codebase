# Decarbonization Service Documentation

## Overview

The `decarbonizationService.js` module provides a comprehensive API for managing decarbonization pathways in the process economics system. It handles data retrieval from Firebase/Firestore with automatic fallback to mock data during development.

## API Methods

### `getDecarbonizationPathways()`

Retrieves all available decarbonization pathways.

**Signature:**
```javascript
async getDecarbonizationPathways() => Promise<Object>
```

**Returns:**
- Object containing pathway data keyed by pathway ID
- Falls back to mock data if Firebase is unavailable

**Example Response:**
```javascript
{
  "wind-pem": {
    id: "wind-pem",
    name: "Wind PEM",
    description: "Hydrogen production via electrolysis using wind power",
    category: "renewable",
    isHardToDecarbonize: false,
    inputs: {...},
    economics: {...},
    carbonIntensity: 1.2,
    maturityLevel: "commercial",
    readinessYear: 2023
  },
  // Additional pathways...
}
```

### `getDecarbonizationPathwayById(pathwayId)`

Retrieves a specific decarbonization pathway by its ID.

**Signature:**
```javascript
async getDecarbonizationPathwayById(pathwayId: string) => Promise<Object|null>
```

**Parameters:**
- `pathwayId` - Unique identifier for the pathway

**Returns:**
- Pathway object if found, null otherwise
- Falls back to mock data on error

### `getDecarbonizationPathwaysByCategory(category)`

Filters pathways by category.

**Signature:**
```javascript
async getDecarbonizationPathwaysByCategory(category: string) => Promise<Array>
```

**Parameters:**
- `category` - Category to filter by ("renewable", "low-carbon", "fossil", "emerging")

**Returns:**
- Array of pathway objects matching the category

### `getHardToDecarbonizePathways()`

Retrieves pathways marked as hard to decarbonize.

**Signature:**
```javascript
async getHardToDecarbonizePathways() => Promise<Array>
```

**Returns:**
- Array of pathway objects where `isHardToDecarbonize` is true

### `savePathwayToLibrary(pathway, userId)`

Saves a decarbonization pathway to user's personal library.

**Signature:**
```javascript
async savePathwayToLibrary(pathway: Object, userId?: string) => Promise<boolean>
```

**Parameters:**
- `pathway` - Pathway object to save
- `userId` - Optional user ID (defaults to current user)

**Returns:**
- Boolean indicating success status

## Data Structures

### Pathway Object Structure

```javascript
{
  id: string,                    // Unique identifier
  name: string,                  // Display name
  description: string,           // Detailed description
  category: string,              // Category classification
  isHardToDecarbonize: boolean, // Difficulty indicator
  inputs: {                      // Resource requirements
    "Electricity (Commercial) kWh": number|null,
    "Electricity (Industrial) kWh": number|null,
    "Electricity (On-shore wind) kWh": number|null,
    "Natural Gas (Commercial) mmBtu": number|null,
    "Natural Gas (Industrial) mmBtu": number|null,
    "Biomass (s.ton)": number|null,
    "Coal (mmBtu)": number|null,
    "Diesel (gal)": number|null,
    "Water Total (gal)": number
  },
  economics: {
    "Real Levelized Cost ($/kg H₂)": number
  },
  carbonIntensity: number,       // kg CO2e/kg H2
  maturityLevel: string,         // "mature", "commercial", "early-commercial", "demonstration"
  readinessYear: number          // Year technology becomes available
}
```

### Library Item Format

When saving to library, pathways are converted to this format:

```javascript
{
  id: string,
  name: string,
  description: string,
  category: "Decarbonization Pathway",
  tags: Array<string>,
  modeler: "Climate Module",
  configuration: {
    version: "1.0.0",
    metadata: {
      exportDate: ISO string,
      description: string,
      scalingType: "Decarbonization"
    },
    currentState: {
      id: string,
      pathwayType: "decarbonization",
      data: Object  // Original pathway data
    }
  }
}
```

## Integration Patterns

### Firebase Integration

The service uses Firebase Firestore for persistent storage:
- Collection: `decarbonization_pathways`
- Automatic mock data fallback when `useMockFirebase` is true
- Error handling with fallback to mock data

### Library Integration

Uses the `libraryService` module to save pathways:
```javascript
const { saveToPersonalLibrary } = require('./libraryService');
await saveToPersonalLibrary(userId, item);
```

## Error Handling

All methods implement comprehensive error handling:
1. Try Firebase/Firestore operation
2. On error, log to console
3. Fall back to mock data
4. Return safe default values

**Error Response Patterns:**
- `getDecarbonizationPathways()` - Returns mock data object
- `getDecarbonizationPathwayById()` - Returns null or mock item
- `getDecarbonizationPathwaysByCategory()` - Returns filtered mock array
- `savePathwayToLibrary()` - Returns false

## Mock Data Strategy

The service includes comprehensive mock data for 8 pathways:

### Categories:
- **Renewable**: wind-pem, solar-pem, biomass-pem
- **Low-carbon**: natgas-ccs
- **Fossil**: natgas-noccs, coal-ccs, coal-noccs
- **Emerging**: solid-oxide

### Mock Data Features:
- Realistic input parameters
- Varying carbon intensities (1.2 - 18.2 kg CO2e/kg H2)
- Different maturity levels
- Readiness years from 2020 to 2028
- Economic data (levelized costs)

## Usage Examples

```javascript
import { 
  getDecarbonizationPathways,
  getDecarbonizationPathwayById,
  savePathwayToLibrary 
} from './decarbonizationService';

// Get all pathways
const pathways = await getDecarbonizationPathways();

// Get specific pathway
const windPEM = await getDecarbonizationPathwayById('wind-pem');

// Get renewable pathways
const renewables = await getDecarbonizationPathwaysByCategory('renewable');

// Save to library
const saved = await savePathwayToLibrary(windPEM, 'user-123');
```

## Testing Considerations

- Mock mode automatically activates when `useMockFirebase` is true
- All methods return predictable mock data for testing
- Mock data covers all categories and pathway types
- Error scenarios gracefully fall back to mock data