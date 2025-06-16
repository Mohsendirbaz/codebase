# TimeParameterMatrix.css Documentation

## Overview

The TimeParameterMatrix.css file provides styling for a complex time-based parameter visualization component. This matrix-style interface allows users to view and interact with parameters across different time periods, with support for active/inactive states and conflict detection.

## Architecture Summary

### Component Structure
```
.time-parameter-matrix (Root Container)
├── .matrix-controls (Control Panel)
│   ├── .view-toggle-button
│   └── .legend
│       └── .legend-item
│           ├── .legend-color (.inactive/.active/.conflict)
│           └── Text Label
├── .matrix-description
├── .matrix-container (Grid Container)
│   ├── .matrix-header
│   │   ├── .corner-cell
│   │   └── .year-header (multiple)
│   └── .matrix-body
│       └── .matrix-row (multiple)
│           ├── .param-label / .scaling-group-label
│           └── .cell (multiple)
│               └── .cell-tooltip (on hover)
├── .conflicts-summary
└── .matrix-footer
    └── .degree-of-freedom-note
```

## Visual Design Patterns

### Color Scheme & States

The component uses a three-state color system for cells:

1. **Inactive State** (`#f5f5f5`)
   - Light gray background
   - Border: 1px solid #ddd
   - Indicates unused/available slots

2. **Active State** (`#4caf50`)
   - Green background
   - Indicates selected/active parameters

3. **Conflict State** (`#ff4d4d`)
   - Red background
   - Highlights conflicting selections

4. **Hover State**
   - Blue inset shadow (#2196f3)
   - Visual feedback for interactive cells

### Layout System

#### Grid Structure
- **Flexible Grid Layout**: Uses CSS flexbox for rows and columns
- **Fixed Cell Dimensions**: 30px × 30px cells for consistent appearance
- **Responsive Container**: Horizontal scrolling for overflow content
- **Column Widths**:
  - Parameter labels: 120px minimum
  - Year headers: 30px minimum
  - Maintains square aspect ratio for cells

#### Spacing & Padding
- **Container Padding**: None (content edge-to-edge)
- **Cell Padding**: 10px for headers and labels
- **Component Margins**: 15px between major sections
- **Grid Gaps**: 1px borders create visual separation

### Typography

The component uses a simple, readable typography system:

- **Font Family**: Arial, sans-serif (system default)
- **Font Weights**:
  - Bold (labels, headers)
  - Normal (descriptions, content)
- **Font Sizes**:
  - Headers: 14px
  - Tooltips: 12px
  - Default: Inherited

### Interactive Elements

#### View Toggle Button
```css
- Padding: 8px 12px
- Background: #4caf50 (green)
- Hover: #45a049 (darker green)
- Border-radius: 4px
- Transition: Background color
```

#### Cell Interactions
```css
- Cursor: pointer
- Hover: Inset shadow effect
- Active states modify background
- Tooltips appear on hover
```

## Component-Specific Styling

### Matrix Controls
The control section provides UI for view toggling and legend display:
- **Flexbox layout** for horizontal alignment
- **Space-between** justification for edge placement
- **15px bottom margin** for separation

### Legend System
Visual guide for understanding cell states:
- **Horizontal flex layout** with 20px gaps
- **15px × 15px color squares** with 2px border radius
- **Aligned text labels** with 5px spacing

### Tooltip System
Advanced tooltip implementation for cell information:
```css
.cell-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 250px;
  z-index: 100;
}
```
- **Positioned above cells** with transform centering
- **Dark background** (#333) with white text
- **8px padding** and 4px border radius
- **Box shadow** for depth perception

### Special Sections

#### Conflicts Summary
Alert section for conflict notifications:
- **Yellow background** (#fff9c4) for attention
- **Orange header text** (#e65100)
- **10px padding** with rounded corners

#### Matrix Footer
Information section with degree of freedom notes:
- **Light green background** (#e8f5e9)
- **Environmental context** for the matrix
- **Standard padding and border radius**

### Responsive Behavior

The component implements horizontal scrolling:
```css
.matrix-container {
  overflow-x: auto;
  max-width: 100%;
}
```
- **Maintains minimum widths** for cells and labels
- **Allows horizontal scrolling** on smaller screens
- **Preserves cell aspect ratios** during scroll

## Visual Hierarchy

1. **Primary**: Active cells (green) and conflicts (red)
2. **Secondary**: Headers and labels (bold text)
3. **Tertiary**: Inactive cells and descriptions
4. **Quaternary**: Tooltips and supplementary information

## Accessibility Considerations

- **Color alone not used** for critical information (tooltips provide text)
- **Sufficient color contrast** between states
- **Interactive elements** have cursor feedback
- **Tooltips provide** detailed information for each cell

## Performance Optimizations

- **Minimal use of shadows** (only on hover/tooltip)
- **Simple color fills** instead of gradients
- **Efficient flexbox layouts** for rendering
- **Limited animation** (only basic transitions)

## Integration Notes

This component integrates with:
- **State management** for active/inactive/conflict states
- **Tooltip system** for detailed information display
- **Theme variables** through CSS custom properties
- **Responsive grid system** for various screen sizes