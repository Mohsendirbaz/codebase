# HomePage_neumorphic-tabs.css Documentation

## Overview
This CSS file implements a sophisticated neumorphic design system for tab components, featuring soft UI elements with depth, shadows, and smooth transitions. The design creates a modern, tactile interface that appears to physically respond to user interactions.

## Architectural Structure

### 1. Neumorphic Design System

#### Core Visual Philosophy
The neumorphic (new + skeuomorphic) design creates UI elements that appear to extrude from or press into the background, using:
- Dual-tone shadows for depth perception
- Gradient backgrounds for subtle dimensionality
- Smooth transitions for organic interactions
- Layered visual effects for realism

## Core Styles

### Base Tab Button
```css
.HomePageTabs .tab-button {
  background: linear-gradient(145deg, #e6e6e6, #ffffff);
  border-radius: 10px;
  padding: 15px 25px;
  margin: 10px;
  font-weight: 500;
  color: #333;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
```

**Features**:
- Linear gradient for soft appearance
- Rounded corners for modern look
- Generous padding for touch targets
- Smooth transitions for interactions

### Gradient Overlay
```css
.HomePageTabs .tab-button::before,
.sub-tab-buttons .sub-tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.3)
  );
  pointer-events: none;
}
```

**Purpose**: Adds subtle shine effect to enhance depth perception

## Interactive States

### Hover State
```css
.HomePageTabs .tab-button:hover,
.sub-tab-buttons .sub-tab-button:hover {
  transform: translateY(-2px);
  box-shadow: 10px 10px 20px #c3c3c3,
              -10px -10px 20px #ffffff;
}
```

**Effects**:
- Slight upward movement
- Enhanced shadow depth
- Creates "lifted" appearance

### Focus State
```css
.HomePageTabs .tab-button:focus,
.sub-tab-buttons .sub-tab-button:focus {
  outline: none;
  box-shadow: 0px 15px 24px #b8b8b8,
              0px -15px 24px #ffffff;
  transform: translateY(-3px);
}
```

**Accessibility**: Provides clear focus indication without outline

### Active State
```css
.HomePageTabs .tab-button.active,
.sub-tab-buttons .sub-tab-button.active {
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  box-shadow: 0px 15px 24px #b8b8b8,
              0px -15px 24px #ffffff;
  transform: translateY(0);
  color: darkblue;
  font-weight: bolder;
}
```

**Visual Indicators**:
- Inverted gradient
- Deeper shadows
- Color change to dark blue
- Increased font weight

## Container Layouts

### Main Tab Container
```css
.HomePageTabs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
  background: var(--primary-color);
  border-radius: 15px;
  margin-bottom: 20px;
}
```

### Sub-Tab Container
```css
.sub-tab-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 15px;
  padding: 15px;
  margin-bottom: 20px;
}
```

**Features**:
- Flexible wrapping for responsive design
- Consistent spacing with gap
- Left-aligned sub-tabs

## Responsive Design

### Button Sizing
```css
.sub-tab-buttons .sub-tab-button {
  flex: 0 0 auto;
  min-width: 150px;
  max-width: 250px;
}
```

**Constraints**:
- Minimum width ensures readability
- Maximum width prevents overstretching
- Auto flex basis for natural sizing

### Z-Index Management
```css
.sub-tab-buttons .sub-tab-button.active {
  position: relative;
  z-index: 1;
}

.sub-tab-buttons .sub-tab-button:hover {
  z-index: 2;
}
```

**Purpose**: Ensures active and hovered tabs appear above others

## Typography Consistency

### Uniform Text Size
```css
.HomePageTabs .tab-button *,
.sub-tab-buttons .sub-tab-button * {
  font-size: 16px !important;
  line-height: 1.5;
}
```

**Note**: Forces consistent text size across all tab content

### Sub-Tab Adjustments
```css
.sub-tab-button {
  padding: 12px 20px;
  margin: 8px;
  font-size: 14px;
}
```

**Differentiation**: Slightly smaller for visual hierarchy

## Reset Styles

```css
.tab-button,
.sub-tab-button {
  border: none;
  background-color: transparent;
}
```

**Purpose**: Removes default button styling for custom design

## CSS Variables Integration

### Variable Usage
- `var(--primary-color)`: Main container background
- `var(--neu-shadow-md)`: Medium neumorphic shadow
- `var(--neu-shadow-sm)`: Small neumorphic shadow
- `var(--dark-blue)`: Active tab text color

## Visual Effects

### Shadow Types

1. **Hover Shadow**:
   ```css
   box-shadow: 10px 10px 20px #c3c3c3,
               -10px -10px 20px #ffffff;
   ```

2. **Active/Focus Shadow**:
   ```css
   box-shadow: 0px 15px 24px #b8b8b8,
               0px -15px 24px #ffffff;
   ```

### Transform Effects
- **Hover**: `translateY(-2px)` - Subtle lift
- **Focus**: `translateY(-3px)` - More pronounced lift
- **Active**: `translateY(0)` - Pressed appearance

## Best Practices

1. **Accessibility**
   - Maintain sufficient color contrast
   - Provide clear focus indicators
   - Ensure touch targets are adequate

2. **Performance**
   - Use CSS transforms for animations
   - Minimize repaints with transforms
   - Keep transitions smooth (0.3s)

3. **Consistency**
   - Apply same styles to main and sub-tabs
   - Maintain visual hierarchy
   - Use consistent spacing

4. **Responsiveness**
   - Allow wrapping for smaller screens
   - Set min/max widths appropriately
   - Test on various devices

## Integration

This stylesheet works with:
- Main navigation tabs
- Sub-navigation tabs
- Any button-based tab system
- React tab components

## Browser Compatibility

- Modern browsers fully supported
- Fallbacks for older browsers:
  - Linear gradients degrade gracefully
  - Box shadows have wide support
  - Transforms well-supported

This neumorphic design system creates an engaging, modern interface that provides clear visual feedback and maintains excellent usability across different contexts and screen sizes.