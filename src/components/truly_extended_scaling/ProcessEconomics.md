# ProcessEconomics Component Documentation

## Overview
The `ProcessEconomics` component serves as the central state management hub for climate module integration. It manages climate data, coordinate information, regulatory thresholds, and maintains a comprehensive history of all state changes. This component bridges the gap between economic modeling and environmental impact assessment.

## Key Features

### 1. **Climate Impact Tracking**
- Hard-to-decarbonize sector management
- Dynamic emission factor configuration
- Multi-unit emission tracking (SI/Field units)
- Hydrogen gate definition for scope categorization

### 2. **Geographic Integration**
- Zone-based coordinate tracking
- Location-specific asset management
- API integration for location-based facts
- Regional emission factor updates

### 3. **Regulatory Compliance**
- Multi-level threshold tracking (local, state, federal)
- Dynamic threshold updates based on region
- Automated compliance checking

### 4. **History Management**
- Complete state snapshots
- Undo/redo functionality
- Action tracking with descriptions
- Export/import configuration support

## State Structure

### Climate Module State
```javascript
{
  hardToDecarbonizeSectors: {
    'Energy': Boolean,
    'Steel': Boolean,
    'Cement': Boolean,
    // ... other sectors
  },
  emissionFactors: {
    'Equipment Cost': Number,
    'Installation': Number,
    'Material': Number,
    // ... other factors
  },
  emissionUnits: {
    current: 'SI' | 'Field',
    SI: { name: String, conversionFactor: Number },
    Field: { name: String, conversionFactor: Number }
  },
  hydrogenGateDefinition: {
    scope1Keywords: Array<String>,
    scope2Keywords: Array<String>
  },
  regulatoryThresholds: {
    local: { name, enabled, threshold, description },
    state: { name, enabled, threshold, description },
    federal: { name, enabled, threshold, description }
  },
  regionSystem: 'SI' | 'Europe'
}
```

### Coordinate Component State
```javascript
{
  zoneCoordinates: { [zoneId]: { longitude, latitude } },
  zoneAssets: { [zoneId]: Array<Asset> },
  locationFacts: { [coordKey]: FactsData }
}
```

### History State
```javascript
{
  history: Array<HistoryEntry>,
  historyIndex: Number
}
```

## Key Functions

### State Management

#### `captureClimateSnapshot()`
Creates a complete snapshot of the current climate state for history tracking.

#### `addToHistory(entry)`
Adds a new entry to the history with:
- Unique ID and timestamp
- Action type and description
- Relevant state snapshots

### Coordinate Management

#### `handleCoordinateChange(zoneId, coordinates)`
Updates coordinates for a specific zone and logs the change to history.

#### `handleAssetChange(zoneId, assets)`
Updates assets for a zone with history tracking.

### Climate Module Actions

#### `handleEmissionFactorChange(itemType, value)`
Updates emission factors with validation and history tracking.

#### `handleToggleHardToDecarbonize(sector)`
Toggles hard-to-decarbonize status for sectors.

#### `handleUnitChange(unitType)`
Switches between SI and Field units.

#### `handleRegionSystemChange(system)`
Changes the region system (SI/Europe).

### History Operations

#### `undo()`
Reverts to the previous state in history.

#### `redo()`
Advances to the next state in history.

### Data Integration

#### `fetchLocationFacts(coords)`
Fetches location-specific precedence data:
- Creates API-compatible form values
- Retrieves regional emission factors
- Updates factors based on location

#### `fetchAssetCarbonIntensity(asset, coords)`
Gets asset-specific carbon intensity:
- Location-aware intensity values
- Updates asset properties
- Maintains data source tracking

#### `fetchRegulatoryThresholds(regionSystem)`
Retrieves region-specific regulatory thresholds:
- Multi-level compliance data
- Dynamic threshold updates
- Description enrichment

### Synchronization

#### `synchronizeCoordinateClimate(zoneId)`
Synchronizes climate data with geographic coordinates:
1. Fetches location facts
2. Updates asset carbon intensities
3. Logs synchronization to history

### Configuration Management

#### `exportConfiguration()`
Exports complete configuration in v2.0.0 format:
```javascript
{
  version: "2.0.0",
  metadata: {
    exportDate: ISO String,
    exportedBy: String,
    description: String
  },
  currentState: {
    climateModule: { ... },
    coordinates: { ... }
  },
  history: Array
}
```

#### `importConfiguration(importedData)`
Imports configuration with version awareness:
- Handles v2.0.0 format
- Backward compatibility warnings
- Complete state restoration

## Integration with FactualPrecedence API

The component integrates with the FactualPrecedence API for:
- Location-based emission factors
- Asset carbon intensity data
- Regional regulatory information

### API Call Examples

```javascript
// Location facts
{
  label: `Location at lon, lat`,
  value: `longitude,latitude`,
  type: 'coordinate-location',
  remarks: `Geographic coordinates for climate impact analysis`
}

// Asset carbon intensity
{
  label: asset.name,
  value: asset.type,
  type: 'asset-carbon-intensity',
  remarks: `Asset type: ${type}, Location: ${coords}`
}

// Regulatory thresholds
{
  label: `Regulatory Thresholds for ${region}`,
  value: 'carbon-regulation',
  type: 'climate-regulation',
  remarks: `System: ${regionSystem}`
}
```

## Usage Example

```javascript
function MyComponent() {
  const processEconomics = ProcessEconomics();
  
  // Access state
  const { emissionFactors, zoneCoordinates } = processEconomics;
  
  // Update emission factor
  processEconomics.handleEmissionFactorChange('Material', 4.2);
  
  // Update coordinates
  processEconomics.handleCoordinateChange('zone1', {
    longitude: -122.4194,
    latitude: 37.7749
  });
  
  // Undo last action
  processEconomics.undo();
  
  // Export configuration
  const config = processEconomics.exportConfiguration();
}
```

## Performance Considerations

- Memoized callbacks prevent unnecessary re-renders
- Efficient state updates with spread operators
- Asynchronous API calls with proper error handling
- History limited by array slicing on new branches

## Future Enhancements

- Real-time collaboration support
- Advanced filtering for history
- Batch operations for multiple zones
- Enhanced caching for API responses
- WebSocket integration for live updates