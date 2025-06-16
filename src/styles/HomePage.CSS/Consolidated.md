# Consolidated.css - Architectural Summary

## Overview
A comprehensive stylesheet (2263 lines) that serves as the main styling foundation for the Matrix Application. It integrates with the theme system (light, dark, creative) and provides extensive component styles, animations, and responsive design patterns.

## Core Architecture

### Level 1: CSS Structure
- **CSS Variables**: Theme-aware custom properties
- **Component Styles**: Modular component styling
- **Layout Systems**: Flexbox and Grid implementations
- **Animation Framework**: Transitions and keyframes
- **Responsive Design**: Mobile-first approach

### Level 2: Base Styles

#### Root Configuration
```css
:root {
  font-family: System fonts stack
  font-size: 16px
  line-height: 1.5
  color: var(--text-color)
}
```

#### Reset Styles
- Box-sizing: border-box
- Margin/padding reset
- Consistent baseline

### Level 3: Typography System

#### Heading Hierarchy
```css
h1: 2rem
h2: 1.75rem
h3: 1.5rem
h4: 1.25rem
h5: 1.125rem
h6: 1rem
```

#### Text Styles
- System font stack
- Variable font sizes
- Line height optimization
- Theme-aware colors

### Level 4: Layout Components

#### Main Container
```css
.matrix-app {
  display: flex
  flex-direction: column
  max-width: 1600px
  margin: 0 auto
  padding: var(--model-spacing-md)
}
```

#### Card System
- Background: var(--card-background)
- Border-radius: var(--model-border-radius-md)
- Shadow: var(--model-shadow-sm)
- Hover effects with transform

### Level 5: Component Library

#### Major Components
1. **Cards**: Container components with headers
2. **Tooltips**: Hoverable information displays
3. **Tabs**: Navigation component
4. **Forms**: Input and control styles
5. **Tables**: Data display grids
6. **Buttons**: Action triggers
7. **Modals**: Overlay dialogs

### Level 6: Tab System

#### React Tabs Integration
```css
.react-tabs__tab {
  - Custom styling for tab items
  - Active state indicators
  - Hover effects
  - Accessibility focus states
}
```

### Level 7: Form Controls

#### Input Styling
- Consistent padding/margins
- Theme-aware backgrounds
- Focus states with outlines
- Error/success states

#### Button Variants
- Primary buttons
- Secondary buttons
- Danger buttons
- Ghost buttons
- Icon buttons

### Level 8: Animation System

#### Transitions
```css
Standard: var(--model-transition-fast) /* 0.15s */
Medium: var(--model-transition-medium) /* 0.3s */
Slow: var(--model-transition-slow) /* 0.5s */
```

#### Hover Effects
- Transform: translateY(-2px)
- Shadow depth changes
- Color transitions
- Scale animations

### Level 9: Responsive Framework

#### Breakpoints
```css
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
Wide: > 1600px
```

#### Responsive Patterns
- Flexible grids
- Collapsible navigation
- Adaptive spacing
- Touch-friendly targets

### Level 10: Utility Classes

#### Spacing Utilities
```css
.m-{size}: margin
.p-{size}: padding
.mt-{size}: margin-top
.mb-{size}: margin-bottom
```

#### Display Utilities
```css
.d-none: display none
.d-block: display block
.d-flex: display flex
.d-grid: display grid
```

### Level 11: Theme Integration

#### Variable Usage
- --text-color
- --background-color
- --card-background
- --border-color
- --primary-color
- --shadow-dark/light

#### Theme-Aware Components
- Automatic color switching
- Contrast maintenance
- Shadow adjustments
- Border adaptations

### Level 12: Special Components

#### Matrix Grid
- Complex grid layouts
- Cell styling
- Header/row formatting
- Interactive states

#### Extended Scaling
- Drag-and-drop styles
- Visual feedback
- Connection lines
- Group indicators

### Level 13: State Styles

#### Interactive States
```css
:hover - Hover effects
:focus - Focus indicators
:active - Active states
:disabled - Disabled styling
.selected - Selection state
.error - Error state
.success - Success state
```

### Level 14: Z-Index Management
```css
Base: 0
Dropdowns: 10
Tooltips: 100
Modals: 1000
Notifications: 2000
```

### Level 15: Performance Optimizations

#### CSS Techniques
- GPU-accelerated transforms
- Will-change hints
- Efficient selectors
- Minimal specificity

## Key Features

### Design Consistency
1. **Theme Variables**: Consistent color usage
2. **Spacing System**: Predictable margins/padding
3. **Typography Scale**: Harmonious text sizes
4. **Shadow System**: Depth hierarchy

### Accessibility
1. **Focus Indicators**: Visible keyboard navigation
2. **Color Contrast**: WCAG compliance
3. **Interactive Sizing**: Touch-friendly targets
4. **Screen Reader**: Hidden helper text

### Maintainability
1. **BEM Naming**: Block__element--modifier
2. **Component Isolation**: Scoped styles
3. **Variable Usage**: Easy theme changes
4. **Documentation**: Inline comments

## Usage Patterns
```css
/* Component usage */
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-content">Content</div>
</div>

/* Utility usage */
<div class="d-flex mt-md mb-lg">
  Flexible container with spacing
</div>
```

This comprehensive stylesheet provides a robust foundation for the entire Matrix Application UI with theme support and extensive component coverage.