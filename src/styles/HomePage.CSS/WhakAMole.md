# WhakAMole.css Documentation

## Overview

The WhakAMole.css file styles an interactive whack-a-mole game component with a sophisticated neumorphic design system. The component features dynamic theming support, smooth animations, and a polished game interface that integrates seamlessly with the application's design language.

## Architecture Summary

### Component Structure
```
.whakamole-container (Game Container)
├── .whakamole-header
│   ├── h2 (Game Title)
│   └── .close-button
├── .game-info (Score/Timer Display)
├── .game-start
│   ├── .difficulty-select
│   │   └── select (Difficulty Dropdown)
│   └── .start-button
├── .game-grid
│   └── .mole-hole (9 instances in 3x3 grid)
│       ├── .mole (Animated Element)
│       └── .dirt (Ground Element)
└── .game-over
    └── h3 (Final Score)
```

## Visual Design Patterns

### Container Design

#### Neumorphic Styling
```css
Width: 340px (fixed for consistent game area)
Background: var(--neu-gradient-basic)
Border-radius: var(--neu-border-radius-lg)
Box-shadow: var(--neu-shadow-lg)
Border: 1px solid with transparency
Backdrop-filter: blur(10px)
```

The container uses:
- **Fixed width** for predictable game layout
- **Gradient backgrounds** for depth
- **Large shadows** for floating appearance
- **Backdrop blur** for modern glass effect
- **Centered positioning** with `margin: 0 auto`

### Layout System

#### Header Layout
```css
.whakamole-header {
  display: flex
  justify-content: space-between
  align-items: center
  Margin-bottom: var(--model-spacing-md)
}
```

#### Game Grid
```css
.game-grid {
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: 10px
  Initial opacity: 0.7 (inactive state)
  Active opacity: 1
}
```

### Game Elements

#### Mole Holes
Each hole is a perfectly square element:
```css
.mole-hole {
  position: relative
  width: 100%
  padding-top: 100% (maintains square ratio)
  border-radius: 50% (circular holes)
  overflow: hidden
}
```

#### Dirt Layer
Ground representation:
```css
.dirt {
  position: absolute
  bottom: 0
  height: 30%
  Background gradient: var(--accent-color) to var(--secondary-color)
  Border-radius: 0 0 50% 50% (curved bottom)
}
```

#### Mole Animation
The core game mechanic:
```css
.mole {
  Initial position: bottom: -100% (hidden)
  Active position: bottom: 30% (visible)
  Transition: bottom 0.1s ease-out
  Background gradient for visual interest
  Border-radius: 50% 50% 0 0 (rounded top)
}
```

### Interactive Elements

#### Start Button
```css
Padding: Dynamic spacing units
Background: Neumorphic gradient
Border: Subtle with transparency
Shadow transitions on hover
Scale transformation: 1.05 on hover
```

#### Difficulty Selector
```css
select {
  Neumorphic background
  Matching border styling
  Consistent border-radius
  Theme-aware text color
}
```

#### Close Button
Minimalist design:
```css
background: none
border: none
font-size: 24px
cursor: pointer
```

### State Management

#### Game States

1. **Inactive Grid**
   ```css
   .game-grid {
     opacity: 0.7
   }
   ```

2. **Active Grid**
   ```css
   .game-grid.active {
     opacity: 1
   }
   ```

3. **Mole Appearance**
   ```css
   .mole-hole.active .mole {
     bottom: 30% (pops up)
   }
   ```

4. **Hit Animation**
   ```css
   .mole-hole:active .mole {
     transform: scale(0.9)
     transition: transform 0.1s ease-in
   }
   ```

### Color System

#### Dynamic Theme Variables
- **Backgrounds**: `var(--neu-gradient-basic)`
- **Text**: `var(--text-color)`
- **Borders**: `rgba(var(--border-color-rgb), opacity)`
- **Game Elements**:
  - Dirt: `var(--accent-color)` to `var(--secondary-color)`
  - Mole: `var(--danger-color)` to `var(--warning-color)`

### Animation System

#### Mole Movement
```css
Transition: bottom 0.1s ease-out
Fast pop-up animation for gameplay
Transform origin at bottom for natural movement
```

#### Button Interactions
```css
Hover transition: 0.3s ease
Scale and shadow changes
Smooth, responsive feedback
```

#### Grid Activation
```css
Opacity transition: 0.3s ease
Subtle fade-in effect
```

## Theme Adaptations

### Dark Theme Overrides

#### Container Enhancement
```css
:root.dark-theme .whakamole-container {
  Deeper shadows with black base
  Subtle white inset highlight
  Enhanced depth perception
}
```

#### Game Element Colors
```css
Dark dirt: #543814 to #3c2a0e (earthy browns)
Dark mole: #8a5c36 to #724c2c (muted browns)
Better contrast in dark environments
```

## Visual Hierarchy

1. **Primary**: Active moles (gameplay focus)
2. **Secondary**: Score/timer information
3. **Tertiary**: Control buttons
4. **Quaternary**: Background elements (dirt, inactive holes)

## Responsive Considerations

While using fixed width (340px), the component:
- **Centers automatically** with margin auto
- **Maintains proportions** with percentage-based sizing
- **Scales internal elements** relative to container
- **Preserves touch targets** for mobile play

## Performance Optimizations

- **GPU-accelerated transforms** for mole movement
- **Efficient animations** with single property transitions
- **Minimal repaints** through transform/opacity changes
- **Optimized selectors** avoiding complex chains

## Accessibility Features

- **Clear visual feedback** for interactions
- **Sufficient color contrast** in both themes
- **Large touch targets** (full mole holes)
- **Visible focus states** for keyboard navigation
- **Semantic HTML structure** with proper headings

## Game-Specific Styling

### Score Display
```css
.game-info {
  Flex layout for even distribution
  Background highlight for visibility
  Rounded corners matching design system
  Clear typography with bold weight
}
```

### Difficulty Levels
Styled dropdown that:
- Matches neumorphic aesthetic
- Provides clear selection feedback
- Maintains theme consistency
- Offers sufficient contrast

### Game Over State
- Clear heading hierarchy
- Maintains component styling
- Provides closure to game session

## Integration Notes

This component integrates with:
- **Theme system** via CSS variables
- **Animation libraries** through CSS classes
- **Game logic** via state classes
- **Layout system** through positioning

## Usage Patterns

### Typical Implementation
```html
<div class="whakamole-container">
  <!-- Game content -->
</div>
```

### State Management
- Add `.active` to `.game-grid` when game starts
- Add `.active` to `.mole-hole` when mole appears
- Handle `.mole-hole:active` for hit detection

### Theme Awareness
Component automatically adapts to:
- Light/dark theme switches
- Custom theme variables
- System color preferences