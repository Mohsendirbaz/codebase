# HomePage3.css Documentation

## Overview
HomePage3.css focuses on theme transitions, loading states, and interactive UI elements. This stylesheet implements sophisticated visual effects for theme switching, loading overlays, and calculation interface components.

## Architecture Summary

### Component Hierarchy
```
Theme System
├── .theme-ribbon
│   ├── ::before (glow effect)
│   └── .theme-buttons
│       └── .theme-button (.active)
├── Loading System
│   └── .loading-overlay
│       └── .loading-spinner
└── Calculation Interface
    ├── .calculation-options
    │   ├── .calculation-row
    │   └── .calculation-input-group
    ├── .target-row-container
    └── .property-selector-container
```

## Visual Design Patterns

### Theme Transition System

#### Advanced Animation Architecture
The theme transition implements a sophisticated glow effect that follows the theme change:

```css
.theme-ribbon::before {
    content: '';
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
    pointer-events: none;
    opacity: 0;
}
```

##### Animation Details
1. **Glow Element**: 30x30px circular gradient
2. **Base State**: Hidden (opacity: 0)
3. **Activation**: `.theme-transition` class triggers visibility
4. **Movement**: Custom CSS variables for dynamic positioning
   - `--glow-start-x`, `--glow-start-y`: Starting position
   - `--glow-end-x`, `--glow-end-y`: Ending position
5. **Timing**: 1.2s with cubic-bezier easing

##### Theme-Specific Variations
```css
.theme-ribbon.to-dark::before {
    background: radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 70%);
}
```
- Dark theme transition uses inverted gradient
- Maintains same animation timing and movement

#### Theme Button Design
```css
.theme-button {
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    transition: all 0.2s ease;
}
```
- **States**: Default, hover, and active
- **Active State**: Primary color background with white text
- **Transitions**: Smooth 0.2s for all properties

### Loading State System

#### Full-Screen Overlay
```css
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}
```
- **Coverage**: Full viewport with fixed positioning
- **Background**: Semi-transparent black (50% opacity)
- **Z-index**: 9999 ensures topmost layer
- **Content**: Centered using flexbox

#### Animated Spinner
```css
.loading-spinner {
    width: 50px;
    height: 50px;
    border: 5px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
```
- **Design**: Circular border with color break
- **Animation**: Continuous 360° rotation
- **Performance**: Hardware-accelerated transform

### Calculation Interface Components

#### Options Container
```css
.calculation-options {
    margin-top: 20px;
    padding: 15px;
    background-color: var(--sidebar-background);
    border-radius: 8px;
    border: 1px solid var(--border-color);
}
```
- Consistent container styling with theme
- Rounded corners for modern appearance
- Clear visual separation with border

#### Layout Patterns
1. **Row Layout**: Flexbox with center alignment and 10px gaps
2. **Input Groups**: Horizontal arrangement for related controls
3. **Target Container**: Flexible container for dynamic content

### Interactive States

#### Button Disability
```css
.button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```
- Visual feedback through reduced opacity
- Cursor change for clear interaction prevention

## Animation Specifications

### Theme Transition Animation
```css
@keyframes moveGlow {
    0% {
        transform: translate(var(--glow-start-x), var(--glow-start-y));
    }
    100% {
        transform: translate(var(--glow-end-x), var(--glow-end-y));
    }
}
```
- **Type**: Position-based animation
- **Variables**: Dynamic start/end positions
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1) - Material Design standard

### Loading Spinner Animation
```css
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
```
- **Type**: Continuous rotation
- **Duration**: 1 second per revolution
- **Timing**: Linear for consistent speed

## Layout Architecture

### Spacing System
- **Containers**: 20px top margins, 15px padding
- **Elements**: 10px gaps in flex layouts
- **Sections**: Clear hierarchical spacing

### Responsive Considerations
- Fixed dimensions for loading spinner
- Flexible layouts for calculation options
- Theme buttons adapt to container width

## CSS Variables Integration
- `--border-color`: Consistent border styling
- `--primary-color`: Theme accent color
- `--sidebar-background`: Container backgrounds

## Performance Optimizations
1. **Hardware Acceleration**: Transform-based animations
2. **Efficient Selectors**: No deep nesting
3. **Transition Limiting**: Only necessary properties
4. **Pointer Events**: Disabled on decorative elements

## Accessibility Features
- Clear disabled states for buttons
- High contrast loading overlay
- Sufficient touch targets (8px + 16px padding)
- Visual feedback for all interactions

## Advanced Features
1. **Dynamic Positioning**: CSS variable-based animation paths
2. **Theme-Aware Transitions**: Different effects for light/dark
3. **State Management**: Class-based animation triggers
4. **Layer Management**: Strategic z-index usage