# Scaling Components Index

## Overview
Export module for scaling-related components, providing drag-and-drop functionality and comprehensive summary displays for the scaling system.

## Module Structure

### Current Exports
1. **DraggableScalingItem**
   - Drag-and-drop item component
   - Checkbox integration
   - Smooth animations

2. **ScalingSummary**
   - Cumulative calculation display
   - Filtering and search
   - Expandable detail views

### Export Pattern
- Named exports for clarity
- Direct component access
- Clean module interface

## Usage

### Import Examples
```javascript
// Individual imports
import { DraggableScalingItem, ScalingSummary } from './components/scaling';

// Specific import
import { ScalingSummary } from './components/scaling';
```

### Module Import
```javascript
import * as ScalingComponents from './components/scaling';
const { DraggableScalingItem, ScalingSummary } = ScalingComponents;
```

## Module Information
- **Location**: components/scaling
- **Type**: Component aggregator
- **Purpose**: Scaling UI components

## Component Relationships
- DraggableScalingItem: Individual item management
- ScalingSummary: Aggregate view and calculations
- Complementary functionality

## Future Expansion
- Additional scaling visualizations
- Export/import utilities
- Scaling presets
- Advanced calculation components