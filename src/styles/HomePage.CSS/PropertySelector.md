# PropertySelector.css Documentation

## Overview
The PropertySelector.css stylesheet defines a sophisticated form control component designed for property selection with support for both single and multiple selection modes. It features neumorphic design principles, smooth interactions, and responsive behavior.

## Architectural Structure

### 1. Container Layout System

#### Base Container
```css
.property-selector-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  position: relative;
  flex: 1 1 45%;
  min-width: 300px;
}
```

**Layout Properties:**
- **Flexbox**: Column-oriented with start alignment
- **Flexibility**: Grows and shrinks with 45% basis
- **Constraints**: Minimum width ensures usability
- **Positioning**: Relative for potential absolute children

### 2. Visual Design System

#### Neumorphic Design Implementation
The component uses neumorphic (soft UI) design principles:
- **Backgrounds**: `var(--neu-background)` for depth
- **Shadows**: `var(--neu-shadow-sm)` and `var(--neu-shadow-md)`
- **Border Radius**: `var(--neu-border-radius-md)` for soft edges

#### Label Styling
```css
.property-selector-container label {
  display: block;
  font-weight: 500;
  margin-bottom: var(--model-spacing-sm);
  font-size: var(--model-font-size-md);
  color: var(--text-color);
  padding-left: var(--model-spacing-sm);
}
```
- **Typography**: Medium weight for clarity
- **Spacing**: Consistent bottom margin and left padding
- **Color**: Theme-aware text color

### 3. Select Element Architecture

#### Core Select Styling
```css
.property-selector-container select {
  width: 100%;
  min-height: calc(var(--model-spacing-md) * 4);
  padding: var(--model-spacing-sm) var(--model-spacing-md);
  border: 2px solid transparent;
  appearance: none;
}
```

**Design Decisions:**
- **Full Width**: Maximizes click target
- **Dynamic Height**: Calculated based on spacing system
- **Custom Appearance**: Removes native styling for consistency
- **Transparent Border**: Enables focus state without layout shift

### 4. Multi-Select Enhancement

#### Extended Height for Multiple Selection
```css
.property-selector-container select[multiple] {
  min-height: calc(var(--model-spacing-md) * 12.5);
  padding-right: calc(var(--model-spacing-md) * 1.5);
}
```
- **Increased Height**: 12.5x base spacing for visibility
- **Extra Padding**: Accommodates scrollbar

#### Selected Option Styling
```css
.property-selector-container select[multiple] option:checked {
  background-color: var(--primary-color);
  color: white;
}
```
- **High Contrast**: Primary color background
- **Clear Selection**: White text on colored background

### 5. Interactive States

#### Hover Effect
```css
.property-selector-container select:hover {
  transform: translateY(-2px);
  box-shadow: var(--neu-shadow-md);
}
```
- **Elevation**: Subtle upward movement
- **Shadow Enhancement**: Increased depth perception
- **Smooth Transition**: Via CSS transition property

#### Focus State
```css
.property-selector-container select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: var(--neu-pressed-shadow);
}
```
- **Custom Outline**: Border color change instead of native outline
- **Pressed Effect**: Neumorphic pressed shadow state

### 6. Option Styling

#### Individual Options
```css
.property-selector-container select option {
  padding: calc(var(--model-spacing-sm) * 1.5) var(--model-spacing-sm);
  min-height: calc(var(--model-spacing-md) * 2.25);
  font-size: var(--model-font-size-md);
  background-color: var(--card-background);
  color: var(--text-color);
}
```
- **Generous Padding**: 1.5x vertical for touch targets
- **Minimum Height**: Ensures clickability
- **Theme Integration**: Card background for consistency

### 7. Custom Scrollbar Design

#### Scrollbar Components
```css
/* Track */
.property-selector-container select::-webkit-scrollbar {
  width: calc(var(--model-spacing-sm) * 0.75);
}

/* Track Background */
.property-selector-container select::-webkit-scrollbar-track {
  background: var(--neu-background);
  border-radius: var(--neu-border-radius-sm);
}

/* Thumb */
.property-selector-container select::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: var(--neu-border-radius-sm);
}
```

**Design Features:**
- **Narrow Width**: 75% of small spacing for subtlety
- **Themed Colors**: Matches overall design system
- **Rounded Edges**: Consistent with neumorphic style
- **Hover State**: Secondary color on thumb hover

### 8. Responsive Design

#### Mobile Breakpoint (≤768px)
```css
@media (max-width: 768px) {
  .property-selector-container {
    width: 100%;
  }
  
  .property-selector-container select {
    min-height: calc(var(--model-spacing-md) * 3);
  }
}
```
- **Full Width**: Removes flex basis for mobile
- **Reduced Height**: 3x spacing for mobile efficiency

## Design Patterns

### Spacing System
The component uses a mathematical spacing system:
- Base unit: `var(--model-spacing-sm)`
- Calculations: Heights and paddings as multiples
- Consistency: All measurements derive from base units

### Color Architecture
- **Primary Actions**: `var(--primary-color)`
- **Secondary States**: `var(--secondary-color)`
- **Backgrounds**: Layered with `var(--neu-background)` and `var(--card-background)`
- **Text**: Theme-aware `var(--text-color)`

### Animation Strategy
- **Transitions**: Medium duration for smooth interactions
- **Transforms**: Hardware-accelerated for performance
- **State Changes**: Color and shadow transitions

## Accessibility Considerations

### Keyboard Navigation
- Native select keyboard support preserved
- Custom focus indicators for visibility
- No interference with screen readers

### Visual Accessibility
- High contrast selection states
- Clear focus indicators
- Sufficient padding for touch targets

## Usage Guidelines

### Single Select Implementation
- Default behavior with standard height
- Hover elevation for affordance
- Clear focus state

### Multiple Select Implementation
- Increased height for option visibility
- Scroll support with custom styling
- Clear selection indicators

### Integration Requirements
- Theme variables must be defined
- Spacing system variables required
- Color system integration necessary

## Performance Optimization

1. **CSS Variables**: Runtime theming without recompilation
2. **Transform Animations**: GPU-accelerated movements
3. **Minimal Repaints**: Strategic property changes
4. **Native Controls**: Leverages browser optimizations

## Best Practices

1. **Maintain Spacing Ratios**: Use multiplication of base units
2. **Preserve Neumorphic Consistency**: Shadow and radius coordination
3. **Test Across Browsers**: Webkit scrollbar fallbacks
4. **Verify Touch Targets**: Minimum 44px recommendation
5. **Theme Variable Usage**: Always use CSS custom properties