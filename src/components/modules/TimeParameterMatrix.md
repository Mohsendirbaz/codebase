# TimeParameterMatrix.js - Architectural Summary

## Overview
A sophisticated React component (368 lines) that visualizes parameters and scaling groups across time units in a matrix format. It highlights conflicts where degree of freedom constraints are violated and provides interactive exploration capabilities.

## Core Architecture

### Level 1: Component Purpose
- **Matrix Visualization**: Display parameters vs. time periods
- **Conflict Detection**: Highlight constraint violations
- **Interactive Exploration**: Click and hover interactions
- **View Modes**: Parameter-only or with scaling groups

### Level 2: Props Interface
```javascript
{
  parameters: object,         // Parameters with efficacy periods
  scalingGroups: object,     // Scaling groups per parameter
  plantLifetime: number,     // Total years (default: 20)
  onConflictClick: Function  // Conflict click handler
}
```

### Level 3: State Management
```javascript
State Structure:
- selectedYear: number|null         // Currently selected year
- selectedParam: string|null        // Selected parameter ID
- selectedScalingGroup: string|null // Selected scaling group
- conflicts: Array                  // Detected conflicts
- hoveredCell: object|null         // Currently hovered cell
- viewMode: 'parameter'|'scalingGroup' // Display mode
- flattenedParameters: Array       // Flattened display data
```

### Level 4: Data Processing

#### Years Generation
```javascript
years = Array.from({ length: plantLifetime }, (_, i) => i + 1)
// Creates [1, 2, 3, ..., plantLifetime]
```

#### Parameter Flattening
```javascript
Parameter Mode:
[
  { type: 'parameter', id: 'param1' },
  { type: 'parameter', id: 'param2' }
]

Scaling Group Mode:
[
  { 
    type: 'scalingGroup', 
    id: 'param1_sg1',
    paramId: 'param1',
    scalingGroupId: 'sg1'
  }
]
```

### Level 5: Conflict Detection System

#### Conflict Finding Algorithm
- Uses capacityTracker service
- Checks degree of freedom constraints
- Identifies overlapping periods
- Maps conflicts to specific years

#### Conflict Data Structure
```javascript
conflict = {
  paramId: string,
  scalingGroupId: string,
  year: number
}
```

### Level 6: Matrix Rendering

#### Grid Structure
```
      Year 1  Year 2  Year 3 ... Year N
Param1  [ ]     [X]     [X]       [ ]
Param2  [X]     [ ]     [C]       [X]
Param3  [ ]     [X]     [ ]       [ ]

Legend:
[ ] - Inactive
[X] - Active
[C] - Conflict
```

#### Cell Types
1. **Empty Cell**: No efficacy period
2. **Active Cell**: Within efficacy period
3. **Conflict Cell**: Constraint violation
4. **Hover Cell**: Interactive highlight

### Level 7: View Modes

#### Parameter View
- Shows parameters only
- Simplified display
- Broader overview
- Faster rendering

#### Scaling Group View
- Expands to show scaling groups
- Detailed analysis
- Group-specific conflicts
- Hierarchical display

### Level 8: Interactive Features

#### Cell Interactions
```javascript
handleCellClick(item, year):
- Select parameter/year
- Highlight related cells
- Show detailed info
- Trigger parent callbacks

handleCellHover(item, year):
- Visual feedback
- Tooltip display
- Related highlighting
- Preview information
```

#### Selection Management
- Single selection model
- Clear visual indicators
- Keyboard navigation ready
- Touch-friendly targets

### Level 9: Performance Optimizations

#### Memoization
```javascript
useMemo:
- Years array generation
- Expensive calculations
- Render optimization
```

#### Effect Dependencies
- Minimal re-renders
- Targeted updates
- Efficient conflict detection
- Lazy calculations

### Level 10: Visual Design

#### CSS Classes
```css
.time-parameter-matrix
.matrix-container
.matrix-header
.matrix-body
.matrix-row
.matrix-cell
.matrix-cell--active
.matrix-cell--conflict
.matrix-cell--hover
.matrix-cell--selected
.parameter-label
.year-label
.view-mode-toggle
.legend
```

#### Color Coding
- Active: Green/Blue
- Inactive: Gray
- Conflict: Red/Orange
- Hover: Highlight
- Selected: Border

## Advanced Features

### Conflict Resolution
- Visual conflict indicators
- Click-to-resolve actions
- Automatic suggestions
- Constraint visualization

### Export Capabilities
- Matrix data export
- Image generation
- CSV/Excel formats
- API integration

### Filtering Options
- Parameter filtering
- Year range selection
- Conflict-only view
- Active-only display

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode

## Integration Points

### CapacityTracker Service
```javascript
capacityTracker.findDegreeOfFreedomConflicts()
capacityTracker.updatePlantLifetimeUsage()
```

### Parent Communication
- Conflict notifications
- Selection changes
- View mode updates
- Data modifications

## Usage Pattern
```javascript
<TimeParameterMatrix
  parameters={parameterData}
  scalingGroups={scalingData}
  plantLifetime={20}
  onConflictClick={handleConflictClick}
/>
```

## Performance Considerations
- Virtual scrolling for large matrices
- Chunked rendering for many parameters
- Debounced hover effects
- Optimized conflict detection

This component provides a comprehensive visualization tool for understanding parameter timing and conflicts in the financial modeling system.