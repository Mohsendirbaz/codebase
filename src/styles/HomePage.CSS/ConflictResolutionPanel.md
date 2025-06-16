# ConflictResolutionPanel.css - Conflict Resolution Panel Styles

## Overview

`ConflictResolutionPanel.css` provides styling for the efficacy period conflict resolution interface. It features a modal-like panel design with clear visual indicators, method selection options, and action controls for resolving parameter conflicts.

## Architecture

### Layout Design
- **Fixed Maximum Width**: 600px with centered alignment
- **Neumorphic Styling**: Elevated card appearance with shadows
- **Responsive Width**: 100% width with max-width constraint
- **Clear Sections**: Distinct areas for conflict info, methods, and actions

## Core Components

### Main Panel Container
```css
.conflict-resolution-panel {
  background-color: var(--card-background);
  border-radius: var(--neu-border-radius-lg);
  box-shadow: var(--neu-shadow-lg);
  padding: 24px;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  position: relative;
}
```

**Features**:
- Centered modal-style layout
- Large shadow for elevation
- Generous padding for content

### Typography Hierarchy
```css
.conflict-resolution-panel h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--text-color);
  font-size: var(--model-font-size-lg);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}
```

Three heading levels (h3, h4, h5) establish clear visual hierarchy.

## Conflict Information Display

### Conflict Info Box
```css
.conflict-info {
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: var(--neu-border-radius-md);
  padding: 12px;
  margin-bottom: 16px;
  border-left: 4px solid #f44336;
}
```

**Design Features**:
- Light red background for warning context
- Strong left border for emphasis
- Clear separation from other content

## Resolution Methods Section

### Method Selector
```css
.method-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--neu-background);
  border-radius: var(--neu-border-radius-md);
}
```

### Interactive Labels
```css
.method-selector label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--neu-border-radius-sm);
  transition: background-color 0.2s ease;
}

.method-selector label:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
```

## Method-Specific Styles

### Select Method
```css
.select-method {
  padding: 16px;
  background-color: var(--neu-background);
  border-radius: var(--neu-border-radius-md);
  margin-top: 8px;
}
```

### Period List
```css
.period-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
```

### Period Items
Period items likely include styling for:
- Selection state highlighting
- Radio button alignment
- Value display formatting
- Interactive hover states

## Visual Design Patterns

### 1. Warning Context
- Red color scheme for conflict indicators
- Subtle background tints
- Strong border accents

### 2. Nested Containers
- Background differentiation with `var(--neu-background)`
- Consistent border radius usage
- Clear visual grouping

### 3. Interactive Feedback
- Hover states on selectable items
- Smooth transitions
- Cursor changes for clickable elements

## Color Palette

### Semantic Colors
- **Conflict/Warning**: `#f44336` (Material Red)
- **Conflict Background**: `rgba(244, 67, 54, 0.1)`
- **Hover State**: `rgba(0, 0, 0, 0.05)`

### Theme Variables
- `--card-background`: Main panel background
- `--text-color`: Text colors
- `--border-color`: Divider lines
- `--neu-background`: Nested container backgrounds

## Spacing System

### Consistent Gaps
- **Section Spacing**: 24px bottom margin
- **Element Gaps**: 8px between items
- **Content Padding**: 12-16px for containers
- **Header Margins**: 16px bottom for h3

## CSS Variables

### Border Radius
- `--neu-border-radius-lg`: Main panel corners
- `--neu-border-radius-md`: Container corners
- `--neu-border-radius-sm`: Interactive elements

### Typography
- `--model-font-size-lg`: Main headings
- `--model-font-size-md`: Subheadings
- `--model-font-size-sm`: Body text

### Effects
- `--neu-shadow-lg`: Panel elevation

## Responsive Behavior

- **Maximum Width**: 600px prevents overly wide layouts
- **Flexible Width**: 100% width for mobile compatibility
- **Centered Alignment**: Auto margins for centering

## Accessibility Considerations

- Clear heading hierarchy
- Interactive elements with hover feedback
- Sufficient color contrast
- Logical tab order support

## Integration Notes

This stylesheet is designed to work with:
- `ConflictResolutionPanel.js` component
- Modal overlay systems
- Theme switching functionality

## Best Practices

1. **Maintain Visual Hierarchy**: Use consistent heading styles
2. **Clear State Indicators**: Show selected/active states clearly
3. **Responsive Design**: Test on various screen sizes
4. **Color Accessibility**: Ensure sufficient contrast ratios

The conflict resolution panel provides a clear, user-friendly interface for resolving complex parameter conflicts with visual clarity and intuitive interaction patterns.