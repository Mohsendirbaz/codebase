# StickerHeader.css Documentation

## Overview
The StickerHeader CSS file defines a sophisticated animated header component with floating stickers, neumorphic design patterns, and interactive game elements. This is one of the most complex CSS files in the system, featuring advanced animations, layered visual effects, and responsive design patterns.

## Architectural Structure

### 1. Core Container Architecture

#### Primary Container `.sticker-header`
- **Positioning**: Relative positioning for absolute child elements
- **Layout**: Flexbox column with center alignment
- **Sizing**: Full width with dynamic height based on CSS variables
- **Visual Design**: Neumorphic gradient background with layered spacing

#### Sticker Container System `.sticker-container`
- **Positioning**: Absolute overlay covering the entire header
- **Layering**: Semi-transparent (0.85 opacity) for depth perception
- **Purpose**: Houses all floating sticker elements

### 2. Animation System

#### Floating Animation Framework
```css
@keyframes floating {
    0%, 100% {
        transform: translateY(0) rotate(var(--sticker-rotate-degree, 3deg));
        box-shadow: var(--neu-shadow-md);
    }
    50% {
        transform: translateY(var(--sticker-float-distance, -20px)) 
                  rotate(calc(var(--sticker-rotate-degree, 3deg) * -1));
        box-shadow: var(--neu-shadow-lg);
    }
}
```

**Key Features:**
- Dynamic rotation using CSS variables
- Alternating shadow depth for 3D effect
- Smooth easing with spatial transition timing
- Infinite loop with alternate direction

#### Sticker Animation Classes
- `.sticker-floating`: Applies continuous floating animation
- `.dipole-influenced`: Physics-based interaction simulation
- Hover states with scale and z-index manipulation

### 3. Visual Design Patterns

#### Neumorphic Design Implementation
1. **Base Neumorphism**
   - Multi-layer box shadows for depth
   - Gradient backgrounds for soft appearance
   - Subtle borders with transparency

2. **Enhanced Effects**
   - Backdrop blur for modern glass-morphism
   - Inset shadows for pressed states
   - Dynamic shadow adjustments on interaction

#### Color Variation System
The CSS implements 8 unique gradient variations for stickers:
```css
.sticker:nth-of-type(1) { background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); }
.sticker:nth-of-type(2) { background: linear-gradient(135deg, var(--accent-color), var(--info-color)); }
/* ... continues for 8 variations */
```

### 4. Interactive Control System

#### Animation Controls Panel
- **Positioning**: Fixed bottom-right with high z-index (100)
- **Features**: 
  - Range sliders for real-time animation adjustment
  - Visual feedback with neumorphic styling
  - Backdrop blur for UI separation

#### Control Components
1. **Slider Inputs**: Custom styled range inputs with themed thumbs
2. **Value Display**: Real-time value feedback
3. **Group Organization**: Logical grouping with labels

### 5. Dipole Physics Simulation

#### Marker System
- `.dipole-marker`: Visual representation of force fields
- **Types**:
  - `.attractive`: Radial gradient with primary color
  - `.repulsive`: Radial gradient with danger color
- **Visual Effects**: Dashed borders and gradient falloff

### 6. Text Visibility Enhancement

#### Multi-Strategy Text Rendering
```css
.sticker-text {
    /* Primary visibility */
    background-color: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(2px);
    
    /* Enhanced with pseudo-element */
    &::before {
        background: rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
    }
}
```

### 7. Game Integration System

#### Game Menu Architecture
1. **Menu Button**: Fixed positioning with hover animations
2. **Dropdown Menu**: 
   - Neumorphic styling with backdrop blur
   - List-based game selection
   - Hover state transformations

#### Game Overlay System
- **Full-screen overlay**: Fixed positioning with backdrop blur
- **Visibility states**: CSS-driven show/hide animations
- **Container nesting**: Proper z-index management (9999-10001)

### 8. Theme Adaptations

#### Dark Theme Enhancements
```css
:root.dark-theme .sticker {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5), 
                inset 0 1px 1px rgba(255, 255, 255, 0.1);
}
```

#### Creative Theme Variations
- Enhanced border colors with primary color integration
- Glow effects on dipole-influenced elements
- Dynamic shadow adjustments

### 9. Responsive Design Strategy

#### Breakpoint: 768px
**Adjustments:**
- Reduced padding and spacing
- Scaled typography (1.8x for title, 1x for subtitle)
- Smaller animation control panel (240px → 180px)
- Reduced dipole marker opacity for mobile performance

### 10. Performance Optimizations

#### Hardware Acceleration
- `will-change: transform` on animated elements
- GPU-accelerated properties (transform, opacity)
- Efficient transition timing

#### Visual Performance
- Backdrop filter usage limited to key elements
- Shadow complexity reduced on mobile
- Animation frame optimization

## Component Hierarchy

```
.sticker-header
├── .sticker-container
│   ├── .sticker (multiple)
│   │   └── .sticker-text
│   └── .dipole-marker (multiple)
├── .header-content
│   ├── .header-title
│   └── .header-subtitle
├── .animation-controls
│   └── .control-group (multiple)
├── .games-menu-button
├── .games-menu
│   ├── .games-menu-header
│   └── .games-list
│       └── .game-option (multiple)
└── .game-overlay
    └── .game-container
        ├── .tictactoe-container
        └── .whakamole-container
```

## CSS Variable Dependencies

### Spatial Variables
- `--spatial-container-height`
- `--spatial-container-width`
- `--spatial-transition-timing`

### Neumorphic Variables
- `--neu-gradient-basic`
- `--neu-shadow-sm/md/lg`
- `--neu-border-radius-sm/md/lg`

### Model System Variables
- `--model-spacing-xs/sm/md/lg`
- `--model-font-size-sm/md/lg`

### Color System
- Primary, secondary, accent colors
- Text colors (primary, secondary)
- Border colors with RGB variants
- State colors (info, warning, danger, success)

## Best Practices & Usage Notes

1. **Animation Performance**: The floating animation uses CSS variables for dynamic control without JavaScript manipulation
2. **Accessibility**: High contrast text with multiple visibility strategies
3. **Maintainability**: Consistent use of CSS variables for theming
4. **Scalability**: Component-based architecture allows easy extension
5. **Browser Compatibility**: Fallbacks for older browsers (backdrop-filter)

This CSS file represents a mature implementation of modern CSS techniques including animations, neumorphic design, responsive layouts, and interactive controls.