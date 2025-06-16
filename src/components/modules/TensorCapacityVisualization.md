# TensorCapacityVisualization Component

## Overview
The `TensorCapacityVisualization` component is a sophisticated 3D visualization tool that represents the multidimensional capacity space of the system as a tensor. It provides an interactive exploration interface for understanding the relationships between parameters, scaling groups, sensitivity variations, years, and versions.

## Purpose
- Visualize theoretical capacity space as an interactive 3D tensor
- Show capacity utilization across multiple dimensions
- Enable exploration of multidimensional data relationships
- Provide insights into system usage patterns and available capacity

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `currentState` | Object | Yes | Current state containing usage data |
| `onClose` | Function | Yes | Function to call when closing the visualization |

## State Management
- **Rotation State**: Controls 3D rotation angles (X and Y axes)
- **Auto-rotation**: Toggle for automatic rotation animation
- **Drag Controls**: Mouse interaction state for manual rotation
- **Active Dimensions**: Currently displayed dimensions (max 3)
- **Active Slices**: Selected cross-sections for each dimension
- **Hover/Selection**: Tracks cell interaction states
- **Usage Data**: Calculated capacity utilization metrics

## Key Features

### 1. Tensor Dimensions
Dynamically defines dimensions based on capacity limits:
- **Parameters**: S10, S11, S12... (based on capacity limit)
- **Scaling Groups**: SG1, SG2, SG3... (max scaling groups)
- **Sensitivity Variations**: V1, V2, V3... (max variations)
- **Years**: 1, 2, 3... (plant lifetime)
- **Versions**: v1, v2, v3... (configurable versions)

### 2. Capacity Calculation
```javascript
const theoreticalCapacity = Object.values(tensorDimensions)
  .reduce((acc, dim) => acc * dim.size, 1);
```

### 3. Usage Visualization
- Calculates dimension usage percentages
- Generates active cells based on current usage (27% utilized)
- Distributes active cells according to usage patterns

### 4. Interactive Controls
- **Click and drag**: Rotate the 3D tensor cube
- **Dimension selectors**: Toggle between different dimension views
- **Auto-rotate toggle**: Enable/disable automatic rotation
- **Hover effects**: Show cell information on hover
- **Cell selection**: Click cells for detailed information

## Visual Elements

### Capacity Summary
Displays:
- Total theoretical capacity (formatted with K/M/B suffixes)
- Current usage count and percentage
- Visual representation of capacity utilization

### Dimension Selectors
Interactive buttons showing:
- Dimension name and label
- Usage percentage for each dimension
- Active/inactive state indicators

### 3D Tensor Space
- Rotatable 3D cube visualization
- Grid-based cell representation
- Color-coded dimensions
- Opacity variations for usage indication

## Interaction Guide
1. **Rotation**: Click and drag to manually rotate the tensor
2. **Dimension Selection**: Click dimension buttons to change view
3. **Auto-rotate**: Toggle automatic rotation on/off
4. **Cell Interaction**: Hover for info, click for selection
5. **Slice Navigation**: Adjust slices to explore cross-sections

## Constants
- `CUBE_SIZE`: 400px (main cube dimensions)
- `CELL_SIZE`: 16px (individual cell size)
- `CELL_SPACING`: 4px (gap between cells)
- `GRID_OPACITY`: 0.15 (transparency for grid)
- `HOVER_SCALE`: 1.2 (scale factor on hover)
- `INACTIVE_OPACITY`: 0.3 (opacity for inactive cells)
- `ROTATION_SPEED`: 0.0005 (auto-rotation speed)

## Dimension Colors
```javascript
const DIMENSION_COLORS = {
  parameters: '#4338ca',            // Indigo
  scalingGroups: '#0891b2',         // Cyan
  sensitivityVariations: '#7c3aed', // Violet
  years: '#16a34a',                 // Green
  versions: '#d97706'               // Amber
};
```

## Performance Considerations
- Uses `useMemo` for expensive calculations
- Implements RAF (requestAnimationFrame) for smooth animations
- Limits active cell generation to prevent infinite loops
- Efficient event handling with proper cleanup

## Integration
The component integrates with:
- `CapacityTrackingService`: For capacity limits and tracking
- CSS styling: `TensorCapacityVisualization.css`

## Usage Example
```jsx
import TensorCapacityVisualization from './TensorCapacityVisualization';

const MyComponent = () => {
  const [showTensor, setShowTensor] = useState(false);
  const currentState = {
    usedParameters: 45,
    scalingGroupsPerParameter: { /* ... */ },
    variationsPerParameterScalingGroup: { /* ... */ },
    usedVersions: 3,
    yearsConfigured: 20
  };

  return (
    <>
      {showTensor && (
        <TensorCapacityVisualization
          currentState={currentState}
          onClose={() => setShowTensor(false)}
        />
      )}
    </>
  );
};
```

## Mathematical Model
The tensor represents a 5-dimensional space where each point (p, sg, sv, y, v) represents:
- p: Parameter index
- sg: Scaling group index
- sv: Sensitivity variation index
- y: Year index
- v: Version index

Total capacity = ∏(dimension_size) for all dimensions

## Future Enhancements
- WebGL-based rendering for larger datasets
- Real-time capacity updates
- Advanced filtering and search within tensor space
- Export visualization as image/data
- VR/AR support for immersive exploration