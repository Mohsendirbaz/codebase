# Model Zone Component Styling Guide

This document outlines the neumorphic design system used across the Model Zone components.

## Design Philosophy

The neumorphic design system creates a soft, modern UI that emphasizes depth and tactility through the careful use of shadows and highlights. The design aims to make complex model analysis tools feel more approachable and intuitive.

## CSS Variables

All components share a common set of CSS variables for consistency:

```css
:root {
  /* Base shadows */
  --shadow-distance: 6px;
  --shadow-blur: 12px;
  --shadow-color-light: rgba(255, 255, 255, 0.8);
  --shadow-color-dark: rgba(0, 0, 0, 0.1);
  
  /* Inner shadows */
  --inner-shadow-distance: 2px;
  --inner-shadow-blur: 4px;
  --inner-shadow-color-light: rgba(255, 255, 255, 0.7);
  --inner-shadow-color-dark: rgba(0, 0, 0, 0.07);
  
  /* Animation */
  --transition-speed: 0.3s;
  
  /* Spacing */
  --model-spacing-xs: 4px;
  --model-spacing-sm: 8px;
  --model-spacing-md: 16px;
  --model-spacing-lg: 24px;
  --model-spacing-xl: 32px;
  
  /* Border radius */
  --model-border-radius-sm: 8px;
  --model-border-radius-md: 12px;
  --model-border-radius-lg: 16px;
  --model-border-radius-full: 50%;
}
```

## Component-Specific Styles

Each component has its own CSS file with neumorphic styling:

- `neumorphic-modelzone.css`: Main container and layout styles
- `neumorphic-modelcard.css`: Model card component styles
- `neumorphic-charts.css`: Analysis chart styles
- `neumorphic-impact.css`: Impact analysis styles
- `neumorphic-optimization.css`: Optimization engine styles
- `neumorphic-sensitivity.css`: Sensitivity analysis styles
- `neumorphic-navigation.css`: Navigation controls styles
- `neumorphic-visualization.css`: Visualization integration styles
- `neumorphic-efficacy.css`: Efficacy indicator styles

## Common Patterns

### Raised Elements
```css
.raised-element {
  box-shadow: 
    var(--shadow-distance) var(--shadow-distance) var(--shadow-blur) var(--shadow-color-dark),
    calc(-1 * var(--shadow-distance)) calc(-1 * var(--shadow-distance)) var(--shadow-blur) var(--shadow-color-light);
}
```

### Pressed Elements
```css
.pressed-element {
  box-shadow: 
    inset var(--inner-shadow-distance) var(--inner-shadow-distance) var(--inner-shadow-blur) var(--inner-shadow-color-dark),
    inset calc(-1 * var(--inner-shadow-distance)) calc(-1 * var(--inner-shadow-distance)) var(--inner-shadow-blur) var(--inner-shadow-color-light);
}
```

### Interactive Elements
```css
.interactive-element {
  transition: all var(--transition-speed) ease;
}

.interactive-element:hover {
  transform: translateY(-2px);
  box-shadow: /* Enhanced raised shadow */
}

.interactive-element:active {
  transform: translateY(1px);
  box-shadow: /* Reduced shadow */
}
```

## Dark Mode Support

All components include dark mode adjustments:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-color-light: rgba(255, 255, 255, 0.05);
    --shadow-color-dark: rgba(0, 0, 0, 0.3);
    --inner-shadow-color-light: rgba(255, 255, 255, 0.03);
    --inner-shadow-color-dark: rgba(0, 0, 0, 0.2);
  }
}
```

## Responsive Design

Components adapt to different screen sizes:

```css
@media (max-width: 768px) {
  /* Reduced spacing */
  /* Simplified layouts */
  /* Adjusted font sizes */
}
```

## Usage Guidelines

1. Always use the provided CSS variables for consistency
2. Maintain the neumorphic effect by using both light and dark shadows
3. Use appropriate transitions for interactive elements
4. Consider dark mode implications when adding new styles
5. Ensure responsive behavior for all new components
6. Keep shadows subtle - the effect should enhance usability without being distracting

## Integration Points

The styling system is designed to work seamlessly with:

- React component lifecycle
- Dynamic data updates
- Interactive visualizations
- Real-time analysis tools
- User input controls

## Accessibility

The neumorphic design maintains accessibility through:

- Sufficient color contrast
- Clear visual hierarchy
- Obvious interactive states
- Readable text sizes
- Keyboard navigation support

## Performance Considerations

- Use CSS transforms for animations when possible
- Limit shadow complexity for better rendering performance
- Optimize transitions for smooth interactions
- Use will-change hints judiciously
- Consider reducing effects on mobile devices
