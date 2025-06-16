# Dark Theme Documentation

## Overview
The Dark Theme features a sophisticated rich dark blue color scheme designed for low-light environments and extended viewing sessions. This theme emphasizes visual comfort while maintaining professional aesthetics through carefully balanced contrast ratios and muted accent colors.

## Architectural Structure

### 1. Color System Architecture

#### Base Color Palette
```css
--primary-color: #121a2e (Deep Navy)
--secondary-color: #1e2746 (Dark Blue-Gray)
--background-color: #121a2e (Matching Primary)
--text-color: #e0e0e0 (Light Gray)
```

The dark theme is built on a foundation of deep navy blues, creating a cohesive and immersive dark interface. The color choices minimize eye strain while maintaining sufficient contrast for readability.

#### Color Hierarchy
1. **Primary Surface**: #121a2e - Deepest layer for main backgrounds
2. **Secondary Surface**: #1e2746 - Elevated surfaces and cards
3. **Border Layer**: #2a3356 - Subtle definition between elements
4. **Interactive Blue**: #4079b2 - HTML-level app background

#### Semantic Color Adaptations
- **Success**: #28a745 (Maintained for consistency)
- **Danger**: #dc3545 (Standard red, high visibility)
- **Warning**: #ffc107 (Bright amber for dark backgrounds)
- **Info**: #17a2b8 (Cyan, optimized for dark mode)

#### Dark Mode Specific Colors
```css
--model-color-background-dark: #0f2237 (Ultra-deep navy)
--model-color-background-alt-dark: #497eb5 (Lighter blue accent)
--model-color-border-dark: #5a94cd (Bright blue borders)
```

### 2. Neumorphic Dark Design System

The neumorphic implementation is adapted for dark surfaces with inverted shadow dynamics:

#### Shadow Architecture
```css
--neu-light-shadow: rgba(40, 53, 105, 0.2) /* Blue-tinted highlight */
--neu-dark-shadow: rgba(0, 0, 0, 0.3) /* Deep shadow */
```

#### Dark Neumorphic Characteristics
- Light shadows use blue tints instead of white
- Dark shadows are deeper and more subtle
- Gradients shift between dark blue variants
- Pressed states create subtle depth illusions

#### Gradient Adaptations
```css
--neu-gradient-basic: linear-gradient(145deg, #242e54, #1a263f)
--neu-gradient-highlight: linear-gradient(45deg, rgba(40, 53, 105, 0.05), rgba(40, 53, 105, 0.15))
```

### 3. Contrast & Accessibility

#### Text Contrast Ratios
- Primary text (#e0e0e0) on background (#121a2e): ~11:1
- Secondary text (#adb5bd) on background: ~7:1
- Both exceed WCAG AAA standards

#### Interactive Element Contrast
- Hover states: #659cd2 (bright blue)
- Active states: Maintained semantic colors
- Focus indicators: High-contrast borders

### 4. Specialized Dark Components

#### Input Styling
```css
--input-background: #1e2746 (Elevated from base)
--input-border: #2a3356 (Subtle definition)
```

#### Year Column Accent
```css
--accent-color: #63733f (Muted olive green)
--accent-hover-color: #556331 (Darker variant)
```
The olive green accent provides a natural contrast to the blue theme while remaining easy on the eyes.

### 5. HTML-Level Theme Variables

The theme defines additional variables at the HTML level:
```css
--app-background: #4079b2 (Brighter blue)
--sidebar-background: #5a94cd (Even brighter)
--border-color: #051b3c (Very dark blue)
```

These create a layered depth effect with progressively lighter blues.

### 6. Media Query Dark Mode Support

The theme includes a secondary dark mode adaptation for system preferences:
```css
@media (prefers-color-scheme: dark) {
  --app-background: #0f172a (Near black)
  --sidebar-background: #1e293b (Dark gray-blue)
}
```

This ensures compatibility with OS-level dark mode preferences.

### 7. Component-Specific Dark Adaptations

#### Scaling Components
- Background: rgba(255, 255, 255, 0.02) - Minimal white overlay
- Inputs: rgba(255, 255, 255, 0.03) - Slightly elevated

#### Tooltips
- Background: rgba(30, 41, 59, 0.95) - Near-opaque dark
- Border: rgba(59, 130, 246, 0.3) - Subtle blue glow

## Visual Design Patterns

### Dark UI Principles
1. **Depth Through Elevation**: Lighter shades indicate higher elevation
2. **Reduced Brightness**: All colors are muted to prevent glare
3. **Blue-Shifted Grays**: Prevent harsh pure grays
4. **Accent Restraint**: Limited use of bright colors

### Color Psychology in Dark Mode
- **Deep Navy**: Professional, calming, reduces eye strain
- **Blue-Gray Surfaces**: Maintains visual interest without harshness
- **Olive Accents**: Natural, easy on eyes, good contrast

### Surface Hierarchy
1. **Base Level**: #121a2e (deepest)
2. **Card Level**: #1e2746 (elevated)
3. **Modal Level**: #0f2237 (ultra-deep for focus)
4. **Interactive Level**: #497eb5 (brightest for actions)

## Implementation Guidelines

### Using the Dark Theme
1. Apply `.dark-theme` class to root element
2. Ensure all text meets contrast requirements
3. Use elevation to indicate component hierarchy
4. Implement smooth transitions between states

### Best Practices for Dark Interfaces
- Avoid pure black (#000000) - use deep blues instead
- Limit bright accent usage to important actions
- Use opacity for disabled states rather than color changes
- Ensure focus indicators are highly visible

### Performance Optimizations
- Reduced color values can improve OLED display battery life
- Fewer bright pixels reduce overall power consumption
- Dark themes can reduce eye strain in low-light conditions

### Accessibility Considerations
- All text maintains WCAG AA compliance minimum
- Interactive elements have clear hover/focus states
- Color is not the sole indicator of state changes
- Sufficient contrast for users with visual impairments