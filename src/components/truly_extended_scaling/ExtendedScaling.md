# ExtendedScaling.js - Architectural Summary

## Overview
A comprehensive React component (1659 lines) that implements an advanced scaling system with cumulative calculations, climate integration, coordinate mapping, and visualization capabilities. It serves as the primary interface for complex parameter scaling operations in the ModEcon Matrix System.

## Core Architecture

### Level 1: Component Purpose
- **Scaling Operations**: Multi-parameter scaling with various mathematical operations
- **Climate Integration**: Carbon footprint tracking and climate zone mapping
- **Coordinate System**: Geographic asset management
- **Visualization**: Multiple view modes for data analysis

### Level 2: Props Interface
```javascript
{
  baseCosts: Array,              // Base cost parameters
  onScaledValuesChange: Function, // Scaled value callback
  onSave: Function,              // Save handler
  initialScalingGroups: Array,   // Initial groups
  onScalingGroupsChange: Function, // Group change handler
  filterKeyword: string,         // Search filter
  V: object,                     // V parameters
  R: object,                     // R parameters
  toggleV: Function,             // V toggle handler
  toggleR: Function,             // R toggle handler
  activeGroupIndex: number,      // Active tab index
  onActiveGroupChange: Function, // Tab change handler
  onFinalResultsGenerated: Function // Results callback
}
```

### Level 3: State Management Architecture

#### Core State
```javascript
- history: Array                    // Undo/redo history
- historyIndex: number             // Current history position
- historyEntries: Array            // History metadata
- errors: object                   // Validation errors
- protectedTabs: Set               // Locked tabs
- tabConfigs: Array                // Tab configurations
- itemExpressions: object          // Custom expressions
- carbonFootprints: object         // Environmental data
```

#### UI State
```javascript
- showDeleteModal: boolean         // Delete confirmation
- showCoordinates: boolean         // Coordinate view
- showFactFinder: boolean          // Fact finder panel
- showVisualization: boolean       // Viz panel
- showDocumentation: boolean       // Help docs
- isExporting: boolean             // Export status
- isImporting: boolean             // Import status
```

#### Geographic State
```javascript
- selectedZone: object             // Current zone
- zoneAssets: Array                // Zone resources
- factFinderData: object           // Geographic facts
```

### Level 4: Component Integration

#### External Libraries
- **@headlessui/react**: Tab components
- **@heroicons/react**: Icon system
- **mathjs**: Mathematical operations
- **react-dnd**: Drag and drop
- **framer-motion**: Animations
- **prop-types**: Type checking

#### Internal Components
- ScalingSummary
- DeleteConfirmationModal
- ScalingGroupsPreview
- ClimateModule
- CoordinateContainer
- CoordinateComponent
- CoordinateFactFinder
- Tooltip (from ui)
- CumulativeDocumentation
- DraggableScalingItem

### Level 5: Scaling Operations System

#### Operation Types
```javascript
From scalingOperations utility:
- multiply: Base × Factor
- power: Base ^ Factor
- divide: Base ÷ Factor
- log: Logarithmic scaling
- add: Base + Factor
- subtract: Base - Factor
- sqrt: Square root
- modulo: Remainder
- expression: Custom math
```

#### Calculation Engine
- Uses calculateScaledValue utility
- Error handling with state updates
- Expression evaluation with mathjs
- Propagation system for dependencies

### Level 6: History Management

#### Undo/Redo System
- State snapshots on changes
- Navigation through history
- Entry metadata tracking
- Memory-efficient storage

#### History Entry Structure
```javascript
{
  timestamp: Date,
  action: string,
  previousState: object,
  newState: object,
  description: string
}
```

### Level 7: Climate Integration Features

#### Carbon Footprint Tracking
- Per-item carbon calculations
- Zone-based emissions
- Aggregate reporting
- Visualization support

#### Climate Zones
- Geographic boundary mapping
- Zone-specific parameters
- Climate factor integration
- Environmental optimization

### Level 8: Coordinate System

#### Geographic Features
- Interactive map integration
- Asset placement and tracking
- Zone boundary management
- Distance calculations

#### Fact Finder
- Location-based data lookup
- Resource availability
- Regulatory information
- Market conditions

### Level 9: Visualization Modes

#### Visualization Types
```javascript
visualizationType options:
- 'summary': Overview charts
- 'comparison': Side-by-side
- 'trends': Time series
- 'heatmap': Intensity grid
- 'network': Relationship graph
```

### Level 10: Tab Management

#### Tab Features
- Dynamic tab creation
- Tab protection/locking
- Custom tab configurations
- Drag-and-drop reordering

#### Tab Config Structure
```javascript
{
  id: string,
  label: string,
  protected: boolean,
  color: string,
  icon: string,
  metadata: object
}
```

### Level 11: Import/Export System

#### Export Features
- JSON format export
- CSV data export
- Configuration backup
- Selective export options

#### Import Features
- File validation
- Merge strategies
- Conflict resolution
- Progress tracking

### Level 12: Error Handling

#### Error Types
- Validation errors
- Calculation errors
- Import/export errors
- Network errors

#### Error Display
- Inline error messages
- Toast notifications
- Error boundaries
- Recovery suggestions

### Level 13: Performance Features

#### Optimization Strategies
- Memoized calculations
- Lazy component loading
- Virtual scrolling
- Debounced updates

#### Memory Management
- History size limits
- Cleanup on unmount
- Efficient state updates
- Resource pooling

### Level 14: Accessibility

#### A11y Features
- Keyboard navigation
- Screen reader support
- Focus management
- ARIA labels

### Level 15: Advanced Features

#### Expression Evaluator
- Custom mathematical expressions
- Variable substitution
- Function library
- Syntax validation

#### Propagation System
- Dependency tracking
- Cascade updates
- Circular reference detection
- Performance optimization

## Key UI Sections

### Main Layout
```
ExtendedScaling
├── Header
│   ├── Title
│   ├── Action Buttons
│   └── View Toggles
├── Tab Container
│   ├── Tab List
│   └── Tab Panels
│       ├── Scaling Items
│       ├── Operations
│       └── Results
├── Side Panels
│   ├── Climate Module
│   ├── Coordinate View
│   └── Visualization
└── Modals
    ├── Delete Confirmation
    ├── Documentation
    └── Fact Finder
```

## Usage Pattern
```javascript
<ExtendedScaling
  baseCosts={costParameters}
  onScaledValuesChange={handleScaledValues}
  onSave={handleSave}
  initialScalingGroups={groups}
  onScalingGroupsChange={handleGroupChange}
  filterKeyword={searchTerm}
  V={vParameters}
  R={rParameters}
  toggleV={handleToggleV}
  toggleR={handleToggleR}
  activeGroupIndex={currentTab}
  onActiveGroupChange={handleTabChange}
  onFinalResultsGenerated={handleResults}
/>
```

This component provides a sophisticated scaling interface with environmental awareness, geographic integration, and comprehensive visualization capabilities for complex financial modeling scenarios.