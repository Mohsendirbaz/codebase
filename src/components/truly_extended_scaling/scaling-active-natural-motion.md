# Scaling Active Natural Motion Documentation

## Overview
The `scaling-active-natural-motion.js` file is a completely self-sufficient, standalone JavaScript visualization that creates an interactive 3D motion effect for scaling group items. It requires no external dependencies and can be included in any HTML page with a simple script tag.

## Key Features

### 1. **Self-Contained Implementation**
- No external dependencies required
- Automatically initializes when loaded
- Creates its own DOM structure
- Includes all styling inline

### 2. **3D Motion Effects**
- Perspective-based 3D transformations
- Smooth rotation animations
- Dynamic z-axis translations
- Natural easing functions

### 3. **Interactive Behaviors**
- Hover effects with item scaling
- Click to select/deselect items
- Non-selected items rotate and fade
- Selected item comes to front

## Configuration Parameters

### Base Item Parameters
```javascript
ITEM_WIDTH = 100;              // Width in pixels
ITEM_HEIGHT = 140;             // Height in pixels
ITEM_SPACING = 20;             // Space between items
ITEM_BORDER_RADIUS = 12;       // Border radius
```

### Motion Effect Parameters
```javascript
ROTATION_ANGLE = 60;           // Rotation for non-focused items (degrees)
HOVER_SCALE = 1.2;             // Scale on hover
SELECTED_SCALE = 1.2;          // Scale when selected
NON_SELECTED_SCALE = 0.9;      // Scale for others when one selected
Z_TRANSLATION_ACTIVE = 100;    // Z-axis translation for active items
PERSPECTIVE = 1200;            // 3D perspective value
```

### Animation Parameters
```javascript
TRANSITION_DURATION = 0.5;     // Duration in seconds
TRANSITION_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';  // Bounce effect
```

### Visual Effects
```javascript
ACTIVE_SHADOW = '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 15px 5px rgba(59, 130, 246, 0.3)';
DEFAULT_SHADOW = '0 4px 10px rgba(0, 0, 0, 0.2)';
NON_SELECTED_OPACITY = 0.6;    // Opacity when not selected
```

## Implementation Structure

### 1. **IIFE Pattern**
The entire code is wrapped in an Immediately Invoked Function Expression to avoid global namespace pollution:
```javascript
(function() {
  // All code here
})();
```

### 2. **State Management**
```javascript
let hoveredIndex = null;       // Currently hovered item
let selectedIndex = null;      // Currently selected item
```

### 3. **Sample Data**
```javascript
const items = [
  { id: 1, title: 'Scaling Group 1', icon: '◈', color: '#4338ca' },
  { id: 2, title: 'Scaling Group 2', icon: '◆', color: '#4338ca' },
  // ... more items
];
```

## Key Functions

### `getPositions()`
Calculates horizontal positions for items in a centered row:
- Computes visible width accounting for overlap
- Centers the entire group
- Returns x,y coordinates for each item

### `getItemStyle(position, index)`
Determines transform and style properties based on interaction state:
- Calculates z-index for proper layering
- Applies rotation to non-active items
- Scales active items
- Manages opacity transitions

### `applyStyles(element, styles)`
Utility function to apply multiple CSS properties to an element.

### `createItemElement(item, position, index)`
Creates individual item DOM elements with:
- Gradient backgrounds
- Icon and title display
- Edge highlights
- Event listeners

### `updateAllItems()`
Updates all item styles when interaction state changes.

### `createVisualization()`
Main function that:
- Creates container structure
- Adds title and instructions
- Generates all item elements
- Appends to document body

### `initialize()`
Handles DOM ready state and triggers visualization creation.

## Usage

### Basic Integration
```html
<script src="scaling-active-natural-motion.js"></script>
```

### Customization
To customize the visualization, modify the configuration parameters at the top of the file:

```javascript
// Example: Increase item size
const ITEM_WIDTH = 120;
const ITEM_HEIGHT = 160;

// Example: Change rotation angle
const ROTATION_ANGLE = 45;

// Example: Modify colors
const items = [
  { id: 1, title: 'Custom Item', icon: '★', color: '#e74c3c' },
  // ...
];
```

## Visual Effects Explained

### Z-Layer Management
- Items use calculated z-indices for proper overlap
- Active items get extreme z-translation (100px)
- Creates natural left-to-right stacking

### Transform Calculations
```javascript
transform: `translate3d(${x}px, ${y}px, ${z}px) rotateZ(${angle}deg) scale(${scale})`
```

### Interaction States
1. **Default**: Items in normal position with slight overlap
2. **Hover**: Item scales up and comes forward
3. **Selected**: Item stays scaled, others rotate and fade
4. **Transition**: Smooth animations between all states

## Browser Compatibility

The visualization uses modern CSS features:
- CSS3 3D transforms
- CSS transitions
- Flexbox layout
- Modern JavaScript (ES6+)

Recommended browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Considerations

- Uses CSS transforms for hardware acceleration
- Minimal DOM manipulation
- Event delegation for efficiency
- RequestAnimationFrame not needed (CSS handles animations)

## Extending the Visualization

### Adding More Items
```javascript
const items = [
  // ... existing items
  { id: 6, title: 'New Group', icon: '◉', color: '#9b59b6' },
];
```

### Custom Animations
Modify the easing function for different effects:
```javascript
// Elastic effect
TRANSITION_EASING = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';

// Smooth ease
TRANSITION_EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
```

### Dynamic Content
The visualization can be modified to accept dynamic data by exposing a global function:
```javascript
window.updateNaturalMotionItems = function(newItems) {
  items = newItems;
  // Re-render visualization
};
```

## Integration with Scaling System

This visualization is designed to work with the broader scaling system by:
- Providing visual feedback for scaling group selection
- Demonstrating relationships between groups
- Offering an intuitive interface for group management
- Supporting the natural motion metaphor for data exploration