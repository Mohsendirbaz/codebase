# dynamic-subplot-css.css Documentation

## Overview
The DynamicSubplotComponent CSS provides styling for a comprehensive subplot visualization interface featuring a selection panel and visualization display area. The design emphasizes flexibility, responsive layouts, and comprehensive theme support including dark mode.

## Core Design Patterns

### Container Layout
```css
.dynamic-subplot-container {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

@media (max-width: 1024px) {
  .dynamic-subplot-container {
    flex-direction: column;
  }
}
```
- Flexible row layout for desktop
- Responsive column stacking for tablets/mobile
- Consistent spacing with gap property
- Breakpoint at 1024px for layout change

## Visual Design Elements

### Panel Architecture
```css
.subplot-selection-panel {
  flex: 1;
  min-width: 300px;
  max-width: 400px;
  background-color: var(--panel-bg-color, #f5f5f5);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
```
- Flexible sizing with min/max constraints
- Subtle shadow for depth perception
- CSS variables with fallback values
- Rounded corners for modern appearance

### Color System
The component uses an extensive CSS variable system with fallbacks:
```css
:root {
  --panel-bg-color: #f5f5f5;
  --heading-color: #333;
  --border-color: #ddd;
  --text-color-primary: #333;
  --text-color-secondary: #666;
  --accent-color: #1976d2;
}
```

## Component-Specific Styling

### Selection Controls
```css
.selection-controls {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.selection-button {
  flex: 1;
  transition: background-color 0.2s ease;
}
```
- Equal width buttons using flex
- Smooth hover transitions
- Distinct styling for select-all and deselect-all actions

### Subplot Options List
```css
.subplot-options {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}
```
- Scrollable container for long lists
- Consistent border styling
- Clear visual boundaries

### Option Items
```css
.subplot-option {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s ease;
}

.subplot-option.selected {
  background-color: var(--option-selected-bg-color);
}
```
- Clear selection states
- Hover feedback for interactivity
- Separators between items

## Interactive Elements

### Checkboxes and Labels
```css
.option-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-checkbox label {
  font-weight: 500;
  cursor: pointer;
}
```
- Aligned checkbox and label
- Pointer cursor for clickability
- Consistent spacing

### Abbreviation Tags
```css
.option-description .abbreviation {
  font-weight: 600;
  color: var(--accent-color);
  background-color: var(--tag-bg-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
```
- Distinct visual treatment for abbreviations
- Small, rounded tag design
- Accent color for emphasis

### Action Buttons
```css
.action-button.generate {
  background-color: var(--primary-action-bg-color);
  color: var(--primary-action-text-color);
  min-width: 200px;
}

.action-button:disabled {
  cursor: not-allowed;
  box-shadow: none;
}
```
- Primary action with distinct styling
- Minimum width for consistent sizing
- Clear disabled state

## Visualization Panel

### Panel Structure
```css
.subplot-visualization-panel {
  flex: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
```
- Twice the width of selection panel
- Flexible column layout
- Min-width: 0 for proper flexbox shrinking

### Visualization Content
```css
.visualization-content {
  flex: 1;
  min-height: 500px;
  position: relative;
  overflow: hidden;
  background-color: white;
}
```
- Flexible height with minimum
- Relative positioning for overlays
- Clean white background for content

### Loading States
```css
.loading-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
}
```
- Full overlay with semi-transparent background
- Centered loading message
- Prevents interaction during loading

## Special Features

### Error Messages
```css
.error-message {
  background-color: var(--error-bg-color);
  color: var(--error-text-color);
  border-left: 4px solid var(--error-border-color);
}
```
- Strong visual indicator with left border
- Distinct background color
- Clear error communication

### Information Panels
```css
.selection-info {
  background-color: var(--info-bg-color);
  border-radius: 4px;
  padding: 12px;
}
```
- Subtle background for information display
- Consistent padding and rounding
- Secondary text color for less emphasis

## Dark Theme Support
```css
.dark-theme .dynamic-subplot-container {
  --panel-bg-color: #2a2a2a;
  --heading-color: #e0e0e0;
  --text-color-primary: #e0e0e0;
  --accent-color: #64b5f6;
}
```
- Complete variable overrides for dark theme
- Maintained contrast ratios
- Adjusted accent colors for dark backgrounds
- Preserved visual hierarchy

## Responsive Design Features

### Mobile Adaptations
1. **Layout change** from row to column at 1024px
2. **Panel constraints** removed on mobile
3. **Flexible content** areas adapt to viewport
4. **Touch-friendly** button sizes maintained

### Flexible Sizing
- Selection panel: 1x flex with min/max constraints
- Visualization panel: 2x flex for emphasis
- Content areas expand to available space
- Minimum heights prevent collapse

## Design Principles

### Visual Hierarchy
1. **Headers** with borders create sections
2. **Action buttons** use color and size for prominence
3. **Selected states** have distinct backgrounds
4. **Secondary information** uses smaller, lighter text

### Consistency Elements
- 4px and 8px border radius system
- 2px, 6px shadow depths
- Consistent padding (8px, 12px, 16px, 20px)
- Unified transition timing (0.2s)

### User Experience
- Clear selection feedback
- Loading states prevent confusion
- Error messages are prominent
- Responsive layout maintains usability

## Accessibility Considerations
- Sufficient color contrast in all themes
- Focus states implicit through hover styles
- Clickable areas include labels
- Semantic HTML structure supported by CSS