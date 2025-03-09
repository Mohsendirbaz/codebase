# Neumorphic Design System

A comprehensive design system for creating depth perception through shadow effects, subtle gradients, and smooth transitions.

## Overview

The Neumorphic Design System provides a set of CSS files, variables, and utility classes that create a cohesive visual language with a modern "soft UI" appearance. This design style simulates physical objects with a soft, extruded appearance.

## Files

- **neumorphic-core.css**: Core variables and base components
- **neumorphic-utils.css**: Utility classes and browser compatibility helpers
- **neumorphic-tabs.css**: Tab component styles
- **neumorphic-index.css**: Main entry point that imports all files

## Browser Compatibility

This design system is built with cross-browser compatibility in mind, including:

- **Safari Support**: All backdrop-filter properties include -webkit-backdrop-filter prefixes
- **CSS Variables**: Modern browsers with appropriate fallbacks
- **Gradients**: Standard syntax supported across modern browsers

## Key Design Elements

### 1. Shadow Techniques

The core of neumorphic design is the shadow technique that creates a 3D raised effect:

```css
.raised-element {
  box-shadow: var(--neuro-distance-md) var(--neuro-distance-md) var(--neuro-blur-md) var(--neuro-shadow-dark),
              calc(-1 * var(--neuro-distance-md)) calc(-1 * var(--neuro-distance-md)) var(--neuro-blur-md) var(--neuro-shadow-light);
}
```

This creates light shadows in one direction and dark shadows in the opposite direction.

### 2. Inset Shadows

For "pressed" or "active" states, we use inset shadows:

```css
.pressed-element {
  box-shadow: inset 4px 4px 8px var(--neuro-shadow-dark),
              inset -4px -4px 8px var(--neuro-shadow-light);
}
```

### 3. Gradients

Subtle gradients enhance the 3D effect:

```css
.gradient-element {
  background: var(--neuro-gradient-basic); /* linear-gradient(145deg, #fafafa, #e6e6e6) */
}
```

### 4. Transitions

Smooth transitions make all interactions feel natural:

```css
.interactive-element {
  transition: all var(--neuro-transition-medium) ease;
}
```

## Available Components

### Cards

```html
<div class="neuro-card">
  <h3>Card Title</h3>
  <p>Content goes here...</p>
</div>
```

### Buttons

```html
<button class="neuro-button">Regular Button</button>
<button class="neuro-button neuro-button-primary">Primary Button</button>
<button class="neuro-button neuro-button-circle">+</button>
```

### Form Controls

```html
<div class="neuro-form-group">
  <label>Name</label>
  <input type="text" class="neuro-input">
</div>

<div class="neuro-form-group">
  <label>Options</label>
  <select class="neuro-select">
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>

<div class="neuro-form-group">
  <label>
    <input type="checkbox" class="neuro-checkbox">
    I agree to terms
  </label>
</div>
```

### Containers

```html
<div class="neuro-container">
  <!-- Large container with raised effect -->
</div>

<div class="neuro-container-inset">
  <!-- Inset container -->
</div>
```

### Badges

```html
<span class="neuro-badge neuro-badge-primary">New</span>
<span class="neuro-badge neuro-badge-success">Completed</span>
<span class="neuro-badge neuro-badge-warning">Warning</span>
<span class="neuro-badge neuro-badge-danger">Error</span>
```

## Custom Variables

You can customize the design system by overriding variables:

```css
:root {
  --neuro-background: #f0f0f0; /* Base background color */
  --neuro-text: #333333; /* Text color */
  --neuro-primary: #3b82f6; /* Primary accent color */
  
  /* Shadow distances */
  --neuro-distance-sm: 5px;
  --neuro-distance-md: 8px;
  --neuro-distance-lg: 12px;
  
  /* Other variables available in neumorphic-core.css */
}
```

## Utility Classes

### Layouts

```html
<div class="neuro-grid">
  <!-- Auto-responsive grid -->
</div>

<div class="neuro-flex neuro-justify-between neuro-items-center">
  <!-- Flexbox with space between and centered items -->
</div>
```

### Spacing

```html
<div class="neuro-p-md">
  <!-- Element with medium padding -->
</div>

<div class="neuro-my-lg">
  <!-- Element with large vertical margin -->
</div>
```

### Effects

```html
<div class="neuro-hover-lift">
  <!-- Element that lifts on hover -->
</div>

<div class="glass-effect">
  <!-- Element with glass effect (backdrop-filter) -->
</div>
```

## Dark Mode

The design system automatically adjusts for dark mode preferences:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --neuro-background: #2d3748;
    --neuro-text: #e2e8f0;
    /* Other dark mode adjustments */
  }
}
```

## Integration with Existing Components

To apply this design system to existing components:

1. Import the main stylesheet:
```html
<link rel="stylesheet" href="src/styles/neumorphic-index.css">
```

2. Add appropriate classes to your elements or use the CSS variables in your existing styles.

## Accessibility Considerations

- Maintain sufficient color contrast (at least 4.5:1 for normal text)
- Ensure hover/focus states are clearly visible
- Use appropriate HTML semantics with the design system classes
