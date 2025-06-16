# VersionSelector.css Documentation

## Overview

The VersionSelector.css file implements a sophisticated, neumorphic-styled version selection component with advanced theming support. This component combines elements from both VersionSelector and CommonSelector patterns, featuring responsive design, connection status indicators, and smooth interactive animations.

## Architecture Summary

### Component Structure
```
.version-selector-container (Root Container)
├── ::before (Gradient Overlay)
├── .version-controls
│   ├── .connection-status
│   └── .refresh-button
├── label (Field Label)
└── select (Dropdown/Multi-select)
    ├── select[multiple] (Multi-select variant)
    └── Scrollbar customization
```

### CSS Variable Dependencies
The component relies heavily on CSS custom properties:
- `--neu-background`: Neumorphic background
- `--neu-border-radius-*`: Border radius tokens
- `--neu-shadow-*`: Shadow depth levels
- `--model-spacing-*`: Spacing scale
- `--model-font-size-*`: Typography scale
- `--primary-color` / `--secondary-color`: Theme colors
- `--text-color`: Dynamic text color

## Visual Design Patterns

### Neumorphic Design System

#### Container Styling
```css
Background: var(--neu-background)
Padding: calc(var(--model-spacing-md) * 1.2)
Border-radius: var(--neu-border-radius-lg)
Box-shadow: var(--neu-shadow-sm)
```

#### Gradient Overlay Effect
```css
::before {
  background: var(--neu-gradient-highlight)
  opacity: 0.4
  z-index: 1
  Full coverage with border-radius matching
}
```

This creates a subtle highlight effect that enhances the neumorphic appearance.

### Layout System

#### Flexible Container
- **Base Layout**: Column direction, full width
- **Responsive Behavior**: 
  - Mobile (< 768px): Stacked vertically
  - Desktop (≥ 768px): Row with wrap, justified spacing
- **Sizing**: 45% flex basis with 300px minimum

#### Z-Index Layering
```
1. Gradient overlay (z-index: 1)
2. Interactive elements (z-index: 2)
```

### Interactive Elements

#### Select Element Design
```css
Base State:
- Min-height: calc(var(--model-spacing-md) * 4)
- Padding: Asymmetric for visual balance
- Border: 2px transparent (focus indicator ready)
- Shadow: Neumorphic depth effect

Hover State:
- Transform: translateY(-2px) (lift effect)
- Shadow: Enhanced depth

Focus State:
- Border-color: Primary theme color
- Shadow: Pressed/inset effect
```

#### Multi-Select Specific
```css
Height: calc(var(--model-spacing-md) * 12.5)
Right padding: Extra space for scrollbar
Selected options: Primary color background
```

### Connection Status System

#### Status Indicators
Three connection states with semantic colors:

1. **Connected**
   ```css
   color: var(--success-color)
   Icon: Implicit success indicator
   ```

2. **Error**
   ```css
   color: var(--error-color)
   Visual alert for failures
   ```

3. **Disconnected**
   ```css
   color: var(--warning-color)
   Warning state indication
   ```

#### Refresh Button
```css
.refresh-button {
  Base: Transparent, no border
  Hover: Background fill + scale(1.1)
  Active: scale(0.9) for tactile feedback
  Disabled: Spinning animation (1s infinite)
}
```

### Custom Scrollbar Design

Webkit-based scrollbar customization:
```css
Width: calc(var(--model-spacing-sm) * 0.75)
Track: Matches neumorphic background
Thumb: Primary color with hover state
Border-radius: Consistent with design system
```

### Animation System

#### Loading States
```css
.loading {
  opacity: 0.7
  transform: translateY(10px)
  Indicates pending state
}

.loaded {
  opacity: 1
  transform: translateY(0)
  Smooth entrance animation
}
```

#### Spin Animation
```css
@keyframes spin {
  Continuous 360° rotation
  Used for refresh button loading state
  Linear timing for smooth motion
}
```

## Responsive Design

### Breakpoint Strategy

#### Mobile First (< 768px)
- Full width containers
- Reduced select height (3x spacing units)
- Stacked layout maintained

#### Desktop Enhancement (≥ 768px)
- Flex-row with wrapping
- Justified spacing between elements
- Larger gap (1.5x spacing units)

### Adaptive Typography

Font sizes scale with CSS variables:
- Labels: `var(--model-font-size-md)`
- Select options: Inherits from system
- Status text: 0.8em (relative scaling)

## Component States

### Container States
1. **Default**: Standard neumorphic appearance
2. **Loading**: Reduced opacity, downward shift
3. **Loaded**: Full opacity, original position

### Select States
1. **Default**: Subtle shadow, transparent border
2. **Hover**: Elevated appearance
3. **Focus**: Primary color border, pressed shadow
4. **Multiple Selection**: Highlighted options

### Button States
1. **Default**: Minimal appearance
2. **Hover**: Background fill, scaled up
3. **Active**: Scaled down for feedback
4. **Disabled**: Spinning animation

## Visual Hierarchy

1. **Primary**: Select element (largest, interactive)
2. **Secondary**: Labels and version controls
3. **Tertiary**: Connection status indicators
4. **Quaternary**: Refresh button (utility action)

## Theming Integration

The component seamlessly integrates with theme systems:

```css
Text colors: var(--text-color)
Backgrounds: var(--neu-background)
Accents: var(--primary-color), var(--secondary-color)
Status colors: var(--success-color), var(--error-color), var(--warning-color)
```

### Dark Theme Support
Automatic adaptation through CSS variables:
- Text colors invert appropriately
- Shadows adjust for dark backgrounds
- Gradient overlays maintain visibility

## Performance Optimizations

- **Transform-based animations** (GPU accelerated)
- **CSS containment** through relative positioning
- **Efficient selectors** avoiding deep nesting
- **Variable-based theming** reduces redundancy

## Accessibility Considerations

- **Focus indicators** clearly visible
- **Color not sole indicator** (icons/text supplement)
- **Sufficient contrast** via theme variables
- **Touch targets** meet minimum size requirements
- **Loading states** communicated visually

## Integration Patterns

### State Management Integration
```css
Connection status attributes:
- data-status="connected"
- data-status="error"
- data-status="disconnected"
```

### Event Handling Hooks
- Refresh button interactions
- Select change events
- Loading state transitions

### Theme System Compatibility
- Uses CSS custom properties throughout
- Respects system color preferences
- Adapts to parent theme context

## Usage Guidelines

### Best Practices
1. **Container Placement**: Allow sufficient spacing for shadows
2. **Loading States**: Trigger `.loading` class during data fetch
3. **Connection Status**: Update data attributes in real-time
4. **Multiple Selection**: Limit visible options for usability

### Common Patterns
```html
<!-- Single Select -->
<div class="version-selector-container">
  <label>Version</label>
  <select>...</select>
</div>

<!-- Multi-Select with Status -->
<div class="version-selector-container">
  <div class="version-controls">
    <span class="connection-status" data-status="connected">●</span>
    <button class="refresh-button">↻</button>
  </div>
  <label>Versions</label>
  <select multiple>...</select>
</div>
```