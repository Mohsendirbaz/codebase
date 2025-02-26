# InheritanceControl Component Documentation

## Overview
The InheritanceControl component is a React-based visualization tool that displays inheritance relationships between models using an interactive canvas. It renders a graph showing connections between a base model and its variants, with visual indicators for filters and departure percentages.

## Props
- `models`: Object containing model data for variants with the following structure:
  ```javascript
  {
    variant1: {
      filters: {
        cost: boolean,
        time: boolean,
        process: boolean
      },
      departure: number // percentage value
    },
    variant2: {
      filters: {
        cost: boolean,
        time: boolean,
        process: boolean
      },
      departure: number // percentage value
    }
  }
  ```
- `onUpdate`: Callback function for handling updates (currently unused in implementation)

## Visual Elements

### Canvas Layout
- Dimensions: 400x200 pixels
- Base model position: Centered at top (x: width/2, y: 40)
- Core Cost position: Left bottom quarter (x: width/4, y: height-40)
- Brand Cost position: Right bottom quarter (x: width*3/4, y: height-40)

### Connection Lines
1. **Active Connection**
   - Blue color (#3b82f6) when variant has active filters
   - Thicker line width (3px) on hover
   - Dashed style when selected

2. **Inactive Connection**
   - Light gray color (#e2e8f0)
   - Standard line width (2px)
   - Solid style

### Indicators
1. **Departure Percentage**
   - Displayed as percentage value on connection lines
   - Enhanced visibility when connection is hovered/active
   - Background highlight on hover

2. **Filter Labels**
   - Shows active filters (Cost, Time, Process)
   - Capitalized first letter
   - Enhanced visibility when connection is hovered/active
   - Background highlight on hover

### Legend
- Active inheritance indicator
- Inactive inheritance indicator
- Hover tip for user guidance

## Interactivity

### Mouse Events
1. **Hover**
   - Detects when mouse is near connection lines (5px threshold)
   - Highlights connection and associated indicators
   - Shows background highlights for labels

2. **Click**
   - Toggles active state of connection
   - Changes line style to dashed when active
   - Can be toggled off by clicking again

## Technical Implementation

### Canvas Drawing
- Uses HTML5 Canvas for rendering
- Redraws on:
  - Model data changes
  - Hover state changes
  - Active connection changes

### Event Handling
- Implements mouse move detection for hover effects
- Implements click detection for toggling active state
- Uses getBoundingClientRect() for accurate mouse position calculation

### Helper Functions
- `getConnectionAtPoint`: Determines if mouse is near a connection line
- `isPointNearLine`: Calculates distance between point and line
- `drawInheritanceGraph`: Main drawing function
- `drawFilterIndicators`: Renders filter and departure information
- `drawDepartureLabel`: Renders departure percentage
- `drawFilterLabels`: Renders active filter labels

## Styling
- Custom CSS file (InheritanceControl.css) for container and legend styling
- System UI font family for text elements
- Responsive canvas sizing
- Smooth hover transitions
- Clear visual hierarchy with active/inactive states
