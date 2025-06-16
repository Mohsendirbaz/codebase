# HomePage5.css Documentation

## Overview
HomePage5.css provides comprehensive styling for data visualization components including tables, images, scaling controls, and editable lists. This stylesheet emphasizes interactive data management interfaces with hover effects and responsive design patterns.

## Architecture Summary

### Component Hierarchy
```
Data Visualization Components
├── .customizable-table
│   ├── th (headers)
│   ├── td (cells)
│   └── tr (rows with hover states)
├── .customizable-image
├── .scaling-controls
│   └── .scaling-group
│       ├── .scaling-group-header
│       │   ├── .scaling-group-title
│       │   └── .scaling-group-controls
│       └── .scaling-input
└── .editable-list
    └── .editable-item
        ├── input (flex: 1)
        └── button (.edit/.delete)
```

## Visual Design Patterns

### Table Component System

#### Structure and Layout
```css
.customizable-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    background-color: var(--sidebar-background);
    border-radius: 8px;
    overflow: hidden;
}
```
- **Width**: Full container width for responsive tables
- **Border Model**: Collapsed for clean cell borders
- **Design**: Rounded corners with overflow hidden for edge styling
- **Background**: Theme-aware sidebar background

#### Cell Styling
```css
.customizable-table th,
.customizable-table td {
    padding: 12px;
    text-align: left;
    border: 1px solid var(--border-color);
    color: var(--text-color);
}
```
- **Padding**: Generous 12px for readability
- **Alignment**: Left-aligned for consistency
- **Borders**: 1px solid with theme border color
- **Typography**: Theme-aware text color

#### Visual Hierarchy
1. **Headers**: 
   - Primary color background
   - White text for contrast
   - Font-weight: 600 for emphasis

2. **Row Alternation**:
   - Even rows: App background color
   - Creates zebra striping for easier scanning

3. **Interactive States**:
   - Hover: Semi-transparent black overlay (5% opacity)
   - Smooth transition effect

### Image Component

#### Hover Interaction
```css
.customizable-image {
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
}

.customizable-image:hover {
    transform: scale(1.02);
}
```
- **Design**: Rounded corners with subtle shadow
- **Interaction**: 2% scale increase on hover
- **Animation**: 0.2s smooth transition
- **Effect**: Creates "lift" interaction feedback

### Scaling Controls Interface

#### Container Design
```css
.scaling-controls {
    margin-top: 20px;
    padding: 15px;
    background-color: var(--sidebar-background);
    border-radius: 8px;
    border: 1px solid var(--border-color);
}
```
- Consistent container styling across components
- Clear visual boundaries with border
- Theme-integrated background

#### Group Organization
```css
.scaling-group {
    margin-bottom: 15px;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
}
```
- **Nesting**: Visual hierarchy through borders
- **Spacing**: 15px between groups
- **Padding**: 10px internal spacing

#### Header Layout
```css
.scaling-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}
```
- **Pattern**: Title on left, controls on right
- **Alignment**: Centered vertically
- **Spacing**: 10px gap in controls section

#### Input Styling
```css
.scaling-input {
    width: 80px;
    padding: 5px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--sidebar-background);
    color: var(--text-color);
}
```
- **Width**: Fixed 80px for numeric inputs
- **Consistency**: Matches overall theme styling
- **Padding**: Compact 5px for space efficiency

### Editable List System

#### List Item Architecture
```css
.editable-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    margin-bottom: 5px;
    background-color: var(--sidebar-background);
}
```
- **Layout**: Flexible horizontal arrangement
- **Spacing**: 10px gap between elements
- **Design**: Consistent with other containers

#### Input Field Behavior
```css
.editable-item input {
    flex: 1;
    padding: 5px;
    /* Inherits border and styling */
}
```
- **Flexibility**: Expands to fill available space
- **Integration**: Seamless visual connection

#### Action Buttons
```css
.editable-item button {
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}
```

##### Button Variants
1. **Edit Button**:
   - Background: Primary theme color
   - Text: White for contrast
   - Purpose: Modify functionality

2. **Delete Button**:
   - Background: #ef4444 (danger red)
   - Text: White for visibility
   - Purpose: Destructive action

## Design Principles

### Visual Consistency
- **Border Radius**: 8px for major containers, 4px for nested elements
- **Padding**: 12px for table cells, 15px for containers, 5-10px for inputs
- **Colors**: Theme variables throughout for consistency

### Interactive Feedback
- **Hover States**: All interactive elements have hover effects
- **Transitions**: 0.2s standard for smooth interactions
- **Visual Hierarchy**: Clear distinction between levels

### Spacing System
- **Vertical Rhythm**: 20px for major sections, 15px for subsections
- **Internal Spacing**: 10px standard gap, 5px for tight layouts
- **Margins**: Bottom margins for sequential elements

## Responsive Considerations
- **Tables**: Full width with horizontal scroll potential
- **Inputs**: Fixed widths may need adjustment on mobile
- **Flex Layouts**: Naturally responsive with wrapping

## Performance Features
- **Transform Animations**: Hardware-accelerated scaling
- **Efficient Selectors**: Direct class targeting
- **Minimal Repaints**: Color/transform-based interactions

## Accessibility Notes
- **Color Contrast**: Theme variables ensure proper contrast
- **Interactive Areas**: Adequate padding for touch targets
- **Visual Feedback**: Clear hover and active states
- **Semantic Structure**: Proper use of table elements

## Theme Integration
All components fully integrate with the theme system through CSS variables:
- `--sidebar-background`: Base backgrounds
- `--border-color`: Consistent borders
- `--text-color`: Typography
- `--primary-color`: Action elements
- `--app-background`: Alternating rows