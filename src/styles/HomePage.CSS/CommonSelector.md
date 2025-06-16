# CommonSelector.css Documentation

## Overview
This stylesheet defines a sophisticated container system for common selectors, featuring neumorphic design principles with layered visual effects, CSS custom properties for theming, and responsive behavior.

## Design Philosophy
The CommonSelector implements a modern neumorphic (soft UI) design pattern with:
- Layered depth through shadows and gradients
- Smooth transitions for state changes
- Responsive layout adaptations
- Z-index management for proper layering

## CSS Variables Used
The component leverages CSS custom properties for consistent theming:
- `--model-spacing-md`: Standard spacing unit
- `--neu-background`: Neumorphic background color
- `--neu-border-radius-lg`: Large border radius
- `--neu-shadow-sm`: Small neumorphic shadow
- `--model-transition-medium`: Standard transition timing
- `--neu-gradient-highlight`: Gradient overlay effect
- `--model-font-size-lg`: Large font size
- `--text-color`: Primary text color

## Core Container

### Main Selector Container
```css
.selectors-container
```
- **Layout**:
  - Flexbox column layout (default mobile)
  - Full width with aligned flex-start
  - Gap spacing using spacing multiplier
  - Vertical margins for section separation
- **Visual Design**:
  - Neumorphic background color
  - Padding: 1.2x standard spacing for emphasis
  - Large border radius for soft appearance
  - Small shadow for subtle elevation
- **Transition**: Medium timing for smooth state changes
- **Positioning**: Relative for pseudo-element positioning

### Gradient Overlay Effect
```css
.selectors-container::before
```
- **Technique**: Pseudo-element overlay
- **Properties**:
  - Absolute positioning covering full container
  - Gradient highlight background
  - 40% opacity for subtle effect
  - Pointer-events none to maintain interactivity
  - Z-index 1 for proper layering
- **Purpose**: Creates depth and visual interest

### Container Heading
```css
.selectors-container h3
```
- **Typography**:
  - Large font size from CSS variable
  - 500 font weight for emphasis
  - Text color from theme
- **Spacing**: Medium bottom margin
- **Z-index**: 2 to appear above gradient overlay
- **Positioning**: Relative for z-index context

## Responsive Behavior

### Desktop Breakpoint (≥768px)
```css
@media (min-width: 768px)
```
- **Layout Changes**:
  - Switches to row direction
  - Enables flex wrapping
  - Space-between justification
  - Increased gap (1.5x standard spacing)
- **Purpose**: Optimizes for wider screens

## State Management

### Loading State
```css
.selectors-container.loading
```
- **Visual Feedback**:
  - Reduced opacity (0.7)
  - Downward translation (10px)
- **Purpose**: Indicates pending data or processing

### Loaded State
```css
.selectors-container.loaded
```
- **Animation**:
  - Full opacity (1)
  - Reset translation (0)
- **Effect**: Smooth appearance animation

## Child Element Management

### Section Containers
```css
.selectors-container > div
```
- **Positioning**: Relative for proper context
- **Z-index**: 2 to appear above gradient
- **Purpose**: Ensures content visibility over effects

## Visual Hierarchy & Z-Index Stack
1. **Level 0**: Base container
2. **Level 1**: Gradient overlay (::before)
3. **Level 2**: Content elements (h3, > div)

## Implementation Notes

### Usage Example
```jsx
<div className="selectors-container loaded">
  <h3>Selection Options</h3>
  <div>
    {/* Selector component */}
  </div>
  <div>
    {/* Another selector */}
  </div>
</div>
```

### State Management
```javascript
// Apply loading state during data fetch
container.classList.add('loading');

// Transition to loaded state
container.classList.remove('loading');
container.classList.add('loaded');
```

## Design Patterns

### Neumorphic Effects
- Soft shadows for depth
- Gradient overlays for richness
- Smooth border radius for organic feel
- Subtle transitions for fluidity

### Spacing Rhythm
- Base unit: var(--model-spacing-md)
- Padding: 1.2x base for emphasis
- Desktop gap: 1.5x base for clarity
- Consistent vertical rhythm

## Performance Optimization
- GPU-accelerated transforms for animations
- Efficient pseudo-element for overlay
- Single repaint for state transitions
- No complex calculations or filters

## Accessibility Considerations
- Maintains content readability over effects
- Clear visual states for loading/loaded
- Proper heading hierarchy
- No essential information in decorative elements

## Browser Compatibility
- Flexbox: Wide support
- CSS Custom Properties: Modern browsers
- Pseudo-elements: Universal support
- Media queries: Standard feature
- Transforms: Hardware accelerated

## Best Practices
1. Always include both loading and loaded states
2. Ensure child content has proper z-index
3. Test gradient overlay opacity on different backgrounds
4. Verify responsive behavior at breakpoint
5. Maintain consistent use of CSS variables

## Customization Options
- Adjust `--neu-gradient-highlight` for different overlay effects
- Modify opacity value for stronger/weaker overlay
- Change transition timing for different feel
- Customize spacing multipliers for density

## Common Issues & Solutions
1. **Content appearing under overlay**: Ensure z-index: 2 on content
2. **Harsh loading transition**: Verify transition property is set
3. **Responsive layout issues**: Check flex-wrap is enabled
4. **Gradient too strong**: Reduce opacity below 0.4