# useMatrixFormValues.js - Architectural Summary

## Overview
A custom React hook (349 lines) that provides comprehensive matrix-based form values management with version and zone support. It replaces traditional form state management with a multi-dimensional matrix approach for the ModEcon Matrix System.

## Core Architecture

### Level 1: Hook Purpose
- **Matrix State Management**: Multi-dimensional parameter storage
- **Version Control**: Multiple version support
- **Zone Management**: Geographic segmentation
- **State Synchronization**: Backend integration

### Level 2: State Structure

#### Version Management
```javascript
versions = {
  list: ["v1"],              // Version IDs
  active: "v1",              // Current version
  metadata: {
    "v1": {
      label: "Base Case",
      description: "Default financial case",
      created: timestamp,
      modified: timestamp
    }
  }
}
```

#### Zone Management
```javascript
zones = {
  list: ["z1"],              // Zone IDs
  active: "z1",              // Current zone
  metadata: {
    "z1": {
      label: "Local",
      description: "Local market zone",
      created: timestamp
    }
  }
}
```

### Level 3: Matrix State Architecture

#### Form Matrix Structure
```javascript
formMatrix = {
  [parameterId]: {
    value: number,           // Default value
    label: string,           // Display name
    unit: string,            // Unit of measure
    matrix: {
      [versionId]: {
        [zoneId]: value      // Version-Zone specific value
      }
    },
    efficacyPeriod: {...},   // Time-based effectiveness
    sensitivity: boolean,     // Sensitivity flag
    factor: boolean          // Factor parameter flag
  }
}
```

### Level 4: Special Parameter States

#### Parameter Categories
```javascript
S: {}    // Sensitivity parameters
F: {}    // Factor parameters
V: {}    // Version-specific values
R: {}    // Rate parameters
RF: {}   // Revenue factor parameters
```

#### Dynamic Plots
```javascript
subDynamicPlots = {
  SP1: "off",
  SP2: "off",
  // ... SP3-SP9
}
```

### Level 5: UI State Management

#### Reset Options
```javascript
showResetOptions: boolean
resetOptions = {
  S: true,    // Reset sensitivity
  F: true,    // Reset factors
  V: true,    // Reset versions
  R: true     // Reset rates
}
```

#### Run Options
```javascript
showRunOptions: boolean
runOptions = {
  useSummaryItems: true,
  includeRemarks: false,
  includeCustomFeatures: false
}
```

### Level 6: Hook Methods (Expected)

#### State Getters
- `getMatrixValue(parameterId, versionId?, zoneId?)`
- `getCurrentVersionValues()`
- `getZoneValues(zoneId)`
- `getParameterAcrossVersions(parameterId)`

#### State Setters
- `updateMatrixValue(parameterId, value, versionId?, zoneId?)`
- `setActiveVersion(versionId)`
- `setActiveZone(zoneId)`
- `batchUpdateMatrix(updates)`

#### Version Operations
- `createVersion(id, metadata, copyFrom?)`
- `deleteVersion(versionId)`
- `cloneVersion(sourceId, targetId)`
- `mergeVersions(version1, version2)`

#### Zone Operations
- `createZone(id, metadata)`
- `deleteZone(zoneId)`
- `copyZoneValues(sourceZone, targetZone)`

### Level 7: Synchronization Features

#### Backend Integration
```javascript
isSyncing: boolean  // Sync status indicator

Expected methods:
- syncWithBackend()
- loadFromServer(versionId?)
- saveToServer()
- resolveConflicts()
```

### Level 8: Icon Mapping System
Maps parameter types to UI icons for visual enhancement:
- Financial parameters → money icons
- Time parameters → clock icons
- Rate parameters → percentage icons
- Process parameters → industrial icons

### Level 9: Scaling Integration

#### Scaling State
```javascript
scalingGroups: Array        // Scaling group definitions
scalingBaseCosts: object    // Base cost mappings
finalResults: object        // Calculated results
```

### Level 10: Hook Return Value

#### Expected Return Structure
```javascript
return {
  // State
  formMatrix,
  versions,
  zones,
  S, F, V, R, RF,
  subDynamicPlots,
  scalingGroups,
  scalingBaseCosts,
  finalResults,
  
  // UI State
  showResetOptions,
  resetOptions,
  showDynamicPlotsOptions,
  showRunOptions,
  runOptions,
  isSyncing,
  
  // Methods
  updateMatrixValue,
  setActiveVersion,
  setActiveZone,
  createVersion,
  deleteVersion,
  createZone,
  deleteZone,
  syncWithBackend,
  handleReset,
  handleRun,
  
  // Utilities
  getMatrixValue,
  getCurrentVersionValues,
  getParameterAcrossVersions
}
```

## Advanced Features

### Optimization
- Memoized calculations
- Batch state updates
- Selective re-renders
- Lazy initialization

### Validation
- Type checking
- Range validation
- Dependency validation
- Cross-parameter rules

### History
- Undo/redo support
- Change tracking
- Audit trail
- Version comparison

## Usage Pattern
```javascript
function Component() {
  const {
    formMatrix,
    versions,
    updateMatrixValue,
    setActiveVersion
  } = useMatrixFormValues();
  
  // Use matrix values
  const value = formMatrix[parameterId]?.matrix?.[versions.active]?.[zones.active];
  
  // Update value
  updateMatrixValue(parameterId, newValue);
}
```

This hook provides a powerful abstraction for managing complex multi-dimensional form data with comprehensive version and zone support.