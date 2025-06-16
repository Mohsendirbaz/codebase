# FactualPrecedence.css - Factual Precedence Styling Module

## Overview

`FactualPrecedence.css` provides comprehensive styling for the factual precedence popup system. It includes styles for the main popup, data tables, filters, recommendations, and feedback interfaces with theme-aware color variables.

## Architecture

### CSS Organization
1. **Base Popup Styles**: Core container and positioning
2. **Header Styles**: Title bar and controls
3. **Content Areas**: Main content sections
4. **Interactive Elements**: Tables, buttons, filters
5. **Theme Integration**: CSS variables for dynamic theming
6. **Specialized Sections**: Evolution insights, feedback panels

## Core Components

### Popup Container
```css
.factual-precedence-popup {
  position: absolute;
  z-index: 1000;
  width: 550px;
  max-height: 80vh;
  overflow-y: auto;
}
```
- Fixed width for consistent display
- Maximum height with scrolling
- High z-index for overlay behavior
- Theme-aware background and borders

### Header Section
```css
.factual-precedence-header {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background-color: var(--header-background);
}
```
- Flexbox layout for title and close button
- Consistent padding and styling
- Theme-based colors

## Data Display

### Reference Table
```css
.reference-table {
  width: 100%;
  border-collapse: collapse;
}
```
Features:
- Full-width responsive table
- Hover effects for rows
- Selected row highlighting
- Theme-aware borders and backgrounds

### Table Interactions
- **Hover State**: Background color change on row hover
- **Selected State**: Highlighted background for selected values
- **Apply Buttons**: Inline buttons for value application

## Recommendation Display

### Recommendation Box
```css
.recommendation-box {
  background-color: var(--recommendation-background);
  border: 1px solid var(--recommendation-border);
  display: flex;
  justify-content: space-between;
}
```
- Distinct visual treatment
- Flexbox for value and button alignment
- Success-oriented color scheme

## Filter Interface

### Filter Panel
```css
.filter-panel {
  background-color: var(--filter-background);
  padding: 15px;
  margin-bottom: 20px;
}
```

### Filter Options
```css
.filter-checkbox {
  display: flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 12px;
}
```
- Pill-shaped checkbox containers
- Flexible wrap layout
- Clear visual grouping

## Theme Integration

### CSS Variables Used
- `--popup-background`: Main background color
- `--primary-color`: Header backgrounds
- `--text-color`: Primary text
- `--text-secondary`: Secondary text
- `--accent-color`: Interactive elements
- `--border-color`: Borders and dividers
- `--card-background`: Content area backgrounds
- `--button-background`: Button colors
- `--table-hover`: Table hover states

### Theme-Aware Sections
1. **Headers**: Primary color backgrounds
2. **Buttons**: Accent colors with hover states
3. **Tables**: Alternating row colors
4. **Text**: Contrast-aware color choices

## Special Sections

### Evolution Insights
```css
.evolution-header {
  background-color: var(--primary-color);
  color: white;
  padding: 12px 16px;
}

.example-card {
  background-color: rgba(var(--primary-color-rgb), 0.05);
  border-left: 3px solid var(--accent-color);
}
```
- Card-based layout for examples
- Accent border for visual interest
- Semi-transparent backgrounds

### Feedback Interface
```css
.feedback-content {
  padding: 20px;
  background-color: var(--card-background);
}

.feedback-success {
  display: flex;
  align-items: center;
  color: var(--success-color);
}
```
- Clear feedback states
- Success messaging
- Form styling consistency

## Interactive States

### Button States
```css
.apply-value-button:hover {
  background-color: var(--button-hover);
}

.apply-value-button:disabled {
  background-color: var(--button-disabled);
  cursor: not-allowed;
}
```
- Hover effects for all buttons
- Disabled state styling
- Cursor changes for feedback

### Loading and Empty States
```css
.loading-state,
.no-data-message {
  padding: 30px 20px;
  text-align: center;
  color: var(--info-text);
}
```
- Centered messaging
- Consistent padding
- Subtle text colors

## Responsive Considerations

1. **Fixed Width**: 550px optimal for content display
2. **Scrollable Height**: Max 80vh prevents overflow
3. **Flexible Content**: Tables and filters adapt to content
4. **Text Wrapping**: Proper line heights and padding

## Accessibility Features

1. **Color Contrast**: High contrast between text and backgrounds
2. **Interactive Feedback**: Hover and focus states
3. **Button Sizing**: Adequate touch targets
4. **Clear Visual Hierarchy**: Headers, content, actions

## Best Practices

1. **Use Theme Variables**: Always use CSS variables for colors
2. **Consistent Spacing**: Follow established padding patterns
3. **Clear States**: Provide visual feedback for all interactions
4. **Semantic Classes**: Use descriptive class names

## Browser Compatibility

- Flexbox layouts for modern browsers
- CSS variables with fallbacks
- Standard box model properties
- No experimental features

This stylesheet provides a complete visual system for the factual precedence interface, ensuring consistent, accessible, and theme-aware styling throughout the application.