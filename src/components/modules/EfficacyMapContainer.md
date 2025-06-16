# EfficacyMapContainer.js - Architectural Summary

## Overview
A container component (365 lines) that orchestrates the efficacy time and degree of freedom visualization system. It integrates TimeParameterMatrix, ConflictResolutionPanel, and CapacityMapPanel to provide comprehensive parameter management with capacity tracking.

## Core Architecture

### Level 1: Component Purpose
- **Integration Hub**: Combines three major visualization components
- **Capacity Management**: Tracks usage against system limits
- **Conflict Resolution**: Handles overlapping efficacy periods
- **State Coordination**: Synchronizes data across child components

### Level 2: Props Interface
```javascript
{
  parameters: object,              // Parameters with efficacy periods
  scalingGroups: object,          // Scaling groups per parameter
  plantLifetime: number,          // Plant lifetime in years (default: 20)
  configurableVersions: number,   // Number of versions (default: 20)
  maxScalingGroups: number,       // Max groups per parameter (default: 5)
  maxSensitivityVariations: number, // Max variations (default: 6)
  onParameterUpdate: Function,    // Parameter update callback
  onCapacityConfigChange: Function // Capacity change callback
}
```

### Level 3: State Management
```javascript
State Structure:
- showConflictPanel: boolean       // Conflict panel visibility
- showCapacityPanel: boolean       // Capacity panel visibility
- selectedConflict: object|null    // Selected conflict details
- conflictingPeriods: Array        // List of conflicts
- usageStats: object              // Capacity usage statistics
- currentState: {
    usedParameters: number,
    scalingGroupsPerParameter: object,
    variationsPerParameterScalingGroup: object,
    usedVersions: number,
    yearsConfigured: number
  }
```

### Level 4: Capacity Tracking Integration

#### Capacity Limits Setup
```javascript
capacityTracker.setCapacityLimit('plantLifetime', plantLifetime)
capacityTracker.setCapacityLimit('configurableVersions', configurableVersions)
capacityTracker.setCapacityLimit('maxScalingGroups', maxScalingGroups)
capacityTracker.setCapacityLimit('maxSensitivityVariations', maxSensitivityVariations)
```

#### Usage Updates
- Plant lifetime usage
- Configurable versions usage
- Parameters count
- Scaling groups total
- Sensitivity variations sum

### Level 5: Child Component Integration

#### TimeParameterMatrix
- Main visualization grid
- Parameter timeline display
- Interactive period editing
- Conflict detection

#### ConflictResolutionPanel
- Displays period overlaps
- Resolution strategies
- Auto-fix capabilities
- Manual adjustments

#### CapacityMapPanel
- Visual capacity indicators
- Usage statistics
- Limit warnings
- Optimization suggestions

### Level 6: Effect Hook Management

#### Capacity Limit Updates
```javascript
useEffect(() => {
  Dependencies: [plantLifetime, configurableVersions, maxScalingGroups, maxSensitivityVariations]
  Actions:
  - Set capacity limits
  - Update usage tracking
  - Refresh usage stats
})
```

#### Current State Calculation
```javascript
useEffect(() => {
  Dependencies: [parameters, scalingGroups]
  Actions:
  - Count used parameters
  - Calculate scaling groups per parameter
  - Estimate sensitivity variations
  - Update capacity tracker
})
```

### Level 7: Conflict Detection System

#### Conflict Identification
- Period overlap detection
- Parameter collision checking
- Timeline conflict analysis
- Multi-parameter conflicts

#### Conflict Data Structure
```javascript
conflict = {
  parameterId: string,
  conflictingWith: Array<parameterId>,
  periods: Array<{start, end}>,
  severity: 'low'|'medium'|'high',
  resolutionOptions: Array
}
```

### Level 8: Statistics Calculation

#### Usage Metrics
```javascript
usageStats = {
  parameters: {
    used: number,
    limit: number,
    percentage: number
  },
  scalingGroups: {...},
  sensitivityVariations: {...},
  versions: {...},
  plantLifetime: {...}
}
```

#### Dynamic Calculations
- Real-time usage updates
- Percentage calculations
- Trend analysis
- Capacity warnings

### Level 9: Event Handlers

#### handleConflictSelection(conflict)
- Opens conflict panel
- Loads conflict details
- Prepares resolution options
- Updates UI state

#### handleCapacityChange(type, value)
- Updates capacity limits
- Recalculates usage
- Triggers callbacks
- Refreshes display

#### handleParameterUpdate(parameterId, data)
- Updates parameter data
- Recalculates conflicts
- Updates capacity usage
- Propagates to parent

### Level 10: UI Layout Structure

```
EfficacyMapContainer
├── Header Section
│   ├── Title
│   ├── Statistics Summary
│   └── Action Buttons
├── Main Content
│   ├── TimeParameterMatrix
│   │   ├── Timeline Grid
│   │   ├── Parameter Rows
│   │   └── Interactive Elements
│   ├── ConflictResolutionPanel (conditional)
│   │   ├── Conflict List
│   │   ├── Resolution Options
│   │   └── Action Buttons
│   └── CapacityMapPanel (conditional)
│       ├── Capacity Visualizations
│       ├── Usage Meters
│       └── Recommendations
└── Footer
    ├── Legend
    └── Controls
```

## Advanced Features

### Optimization Engine
- Automatic conflict resolution
- Capacity optimization
- Period compression
- Resource balancing

### Visualization Modes
- Timeline view
- Capacity heatmap
- Conflict overlay
- Usage trends

### Export Capabilities
- Configuration export
- Report generation
- Image snapshots
- Data downloads

## Performance Optimizations
- Memoized calculations
- Lazy component loading
- Virtual scrolling for large datasets
- Debounced updates

## Integration Points
- CapacityTrackingService
- Parameter state management
- Backend synchronization
- Export services

## Usage Pattern
```javascript
<EfficacyMapContainer
  parameters={parameterData}
  scalingGroups={scalingGroupData}
  plantLifetime={20}
  configurableVersions={20}
  maxScalingGroups={5}
  maxSensitivityVariations={6}
  onParameterUpdate={handleParameterUpdate}
  onCapacityConfigChange={handleCapacityChange}
/>
```

This component serves as the central orchestrator for complex parameter visualization and management with comprehensive capacity tracking and conflict resolution capabilities.