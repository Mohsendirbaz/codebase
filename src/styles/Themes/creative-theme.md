# Creative Theme Documentation

## Overview
The Creative Theme is a vibrant and expressive theme featuring bright teal accents with purple undertones. This theme emphasizes modern neumorphic design principles with dynamic spatial transformations, making it ideal for creative and innovative applications.

## Architectural Structure

### 1. Color System Architecture

#### Base Color Palette
```css
--primary-color: #2be2df (Vibrant Teal)
--secondary-color: #66bb6a (Green)
--background-color: #f5f7fa (Light Gray-Blue)
--neu-background: #f1eef7 (Light Purple Tint)
```

The color system is built on a foundation of vibrant teal (#2be2df) as the primary accent, creating an energetic and modern aesthetic. The purple-tinted neumorphic background (#f1eef7) adds depth and sophistication.

#### Semantic Color Tokens
- **Success**: #28a745 (Standard green for positive actions)
- **Danger**: #dc3545 (Standard red for destructive actions)
- **Warning**: #ffc107 (Amber for caution states)
- **Info**: #17a2b8 (Cyan for informational elements)

#### RGB Color Values
Each primary color includes RGB equivalents for advanced color manipulation:
- Primary: rgb(43, 226, 223)
- Danger: rgb(220, 53, 69)
- Success: rgb(40, 167, 69)

### 2. Neumorphic Design System

The theme implements a sophisticated neumorphic design language with multiple shadow variations:

#### Shadow Architecture
```css
--neu-light-shadow: rgba(255, 255, 255, 0.85)
--neu-dark-shadow: rgba(138, 43, 226, 0.15) /* Purple tint */
```

#### Shadow Variations
1. **Flat Shadow**: No elevation (0px offset)
2. **Pressed Shadow**: Inset shadows for pressed states
3. **Small Shadow**: 3px offset for subtle elevation
4. **Medium Shadow**: 5px offset for standard elevation
5. **Large Shadow**: 8px offset for prominent elements

#### Gradient System
Three gradient variations support the neumorphic aesthetic:
- **Basic**: 145deg angle from white to purple-tinted background
- **Pressed**: Inverted gradient for interactive states
- **Highlight**: 45deg overlay for emphasis

### 3. Spatial Transform System

The theme includes advanced 3D transformation capabilities:

#### Perspective Settings
```css
--spatial-perspective: 1000px
--spatial-perspective-origin-x: 0%
--spatial-perspective-origin-y: 0%
```

#### Animation Configuration
- **Timing Function**: cubic-bezier(0.42, 0, 0.05, 0.99) - Sharp acceleration
- **Duration**: 0.5s standard transformation time
- **Container Dimensions**: 24rem × 16rem spatial container

### 4. Layout & Spacing System

#### Spacing Scale
The theme uses a calculated spacing system based on a 1rem unit:
- **XS**: 0.25rem (4px)
- **SM**: 0.5rem (8px)
- **MD**: 1rem (16px)
- **LG**: 1.5rem (24px)
- **XL**: 2rem (32px)

#### Model-Specific Spacing
Additional spacing tokens for component models:
- `--model-spacing-xs`: 4px
- `--model-spacing-sm`: 8px
- `--model-spacing-md`: 16px
- `--model-spacing-lg`: 24px

### 5. Typography System

#### Font Sizes
- **Small**: 14px (detail text, captions)
- **Medium**: 16px (body text)
- **Large**: 18px (headings, emphasis)
- **Spatial Text**: 1.5rem (24px for 3D elements)

### 6. Animation & Transitions

#### Timing Presets
- **Fast**: 0.2s (micro-interactions)
- **Medium**: 0.3s (standard transitions)
- **Slow**: 0.5s (complex animations)

#### Easing Functions
1. **Standard**: cubic-bezier(0.4, 0, 0.2, 1)
2. **In-Out**: cubic-bezier(0.83, 0, 0.17, 1)
3. **Bounce**: cubic-bezier(0.34, 1.56, 0.64, 1)

### 7. Component-Specific Styling

#### Floating Sticker Header
```css
--sticker-float-duration: 5s
--sticker-rotate-degree: 3deg
--sticker-float-distance: -20px
```

#### Year Column Accents
- Primary: #2be2df (matches main theme)
- Hover: #25c9c6 (darker variant)

### 8. Responsive Design

#### Breakpoints
- **SM**: 640px (mobile landscape)
- **MD**: 768px (tablet)
- **LG**: 1024px (desktop)
- **XL**: 1280px (large desktop)
- **2XL**: 1536px (ultra-wide)

### 9. Dark Mode Adaptation

The theme includes a comprehensive dark mode media query that:
- Inverts the color scheme to dark backgrounds (#0f172a)
- Adjusts component transparency for visibility
- Modifies tooltip styling with translucent backgrounds
- Applies subtle transparency to interactive elements

## Visual Design Patterns

### Neumorphic Elements
Components appear to extrude from or press into the background through careful shadow and gradient application. The purple-tinted shadows create a unique creative atmosphere.

### Color Psychology
- **Vibrant Teal**: Represents innovation, creativity, and forward-thinking
- **Purple Undertones**: Add sophistication and artistic flair
- **Light Backgrounds**: Maintain clarity and reduce eye strain

### Interactive States
- **Hover**: Darker accent colors and modified shadows
- **Active**: Pressed neumorphic effect with inverted gradients
- **Focus**: Enhanced border colors with primary accent

## Implementation Guidelines

### Using the Theme
1. Apply the `.creative-theme` class to the root element
2. Utilize CSS variables for consistent styling
3. Leverage neumorphic classes for depth effects
4. Implement spatial transforms for dynamic interactions

### Best Practices
- Use semantic color tokens for UI feedback
- Apply consistent spacing using the scale system
- Implement smooth transitions for state changes
- Ensure sufficient contrast for accessibility

### Performance Considerations
- Shadow effects are GPU-accelerated
- Transitions use optimized timing functions
- Spatial transforms leverage hardware acceleration