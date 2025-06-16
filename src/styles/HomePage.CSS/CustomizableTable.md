# CustomizableTable.css Documentation

## Overview
The CustomizableTable CSS provides comprehensive styling for data tables with theme support, special column highlighting, value formatting, and interactive tooltips. This design emphasizes data readability and visual hierarchy while maintaining consistency across different themes.

## Core Design Patterns

### Table Structure
```css
.custom-table {
  border-collapse: separate;
  border-spacing: 0;
  border-radius: var(--neu-border-radius-md);
  overflow: hidden;
  box-shadow: var(--neu-shadow-sm);
  background-color: var(--card-background);
}
```
- Separate borders for rounded corner support
- Hidden overflow for clean edge rendering
- Neumorphic shadow for subtle elevation
- Theme-aware background colors

## Visual Design Elements

### Header Styling
```css
.custom-table th {
  background: var(--neu-gradient-basic);
  position: sticky;
  top: 0;
  z-index: 10;
}
```
- Sticky positioning for fixed headers during scroll
- Gradient background for visual distinction
- Hover effects transitioning to primary color
- Rounded corners on first/last headers

### Year Column Specialization
```css
.custom-table th.year-column {
  background: var(--primary-color);
  color: white;
}

.custom-table th.year-column::after {
  content: "";
  position: absolute;
  right: 0;
  width: 3px;
  background-color: var(--secondary-color);
}
```
- Distinct primary color background
- Vertical separator line using pseudo-element
- Complementary hover state with secondary color
- Coordinated cell background tinting

## Component-Specific Styling

### Row Interactions
```css
.custom-table tr:hover td {
  background-color: rgba(var(--primary-color-rgb), 0.1);
}

.custom-table tr:nth-child(even) {
  background-color: rgba(var(--border-color-rgb), 0.2);
}
```
- Row hover with transparent primary color overlay
- Alternating row colors for improved readability
- Preserved special column styling on hover

### Value Formatting
```css
.custom-table td span {
  font-family: 'Consolas', 'Monaco', monospace;
  padding: 2px 4px;
  border-radius: 3px;
  min-width: 60px;
}
```
- Monospace font for numerical alignment
- Inline-block display for consistent formatting
- Minimum width for column alignment
- Subtle padding and border radius

### Special Value Highlighting
```css
/* Negative Values */
.custom-table td span[style*="color: red"] {
  color: var(--danger-color) !important;
  background-color: rgba(var(--danger-color-rgb), 0.1);
}

/* Large Values */
.custom-table td span[style*="font-weight: bold"] {
  color: var(--primary-color);
  background-color: rgba(var(--primary-color-rgb), 0.1);
}
```
- Negative values with danger color and tinted background
- Large values with primary color emphasis
- Important flag to override inline styles
- Consistent background tinting approach

## Interactive Elements

### Tooltip System
```css
.tooltip2 {
  visibility: hidden;
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  transition: visibility 0.2s, opacity 0.2s;
  opacity: 0;
}

th:hover .tooltip2 {
  visibility: visible;
  opacity: 1;
}
```
- Absolute positioning above trigger element
- Centered alignment with transform
- Smooth fade-in transition
- Theme-aware styling with borders and shadows

## Container Design
```css
.table-container {
  border-radius: var(--neu-border-radius-md);
  background-color: var(--card-background);
  box-shadow: var(--neu-shadow-sm);
  padding: 1rem;
}
```
- Consistent border radius with table
- Neumorphic shadow for depth
- Adequate padding for breathing room
- Theme-responsive background

## Theme Variations

### Dark Theme
```css
:root.dark-theme .custom-table td.year-column {
  background-color: rgba(var(--primary-color-rgb), 0.15);
}
```
- Increased opacity for better contrast
- Enhanced hover states
- Preserved color relationships

### Light Theme
```css
:root.light-theme .custom-table td.year-column {
  background-color: rgba(var(--primary-color-rgb), 0.08);
}
```
- Subtle background tinting
- Lower opacity for light backgrounds
- Maintained visual hierarchy

### Creative Theme
```css
:root.creative-theme .custom-table td.year-column {
  background-color: rgba(var(--primary-color-rgb), 0.1);
}
```
- Balanced opacity for creative palette
- Distinctive hover states
- Consistent with theme aesthetics

## Design Principles

### Visual Hierarchy
1. **Sticky headers** maintain context during scroll
2. **Year columns** provide temporal reference
3. **Value formatting** ensures data clarity
4. **Row interactions** guide user focus

### Color Usage
- **Primary color**: Headers and emphasis
- **Secondary color**: Separators and accents
- **Danger color**: Negative values
- **Transparent overlays**: Subtle interactions

### Typography
- **Headers**: 600 weight for prominence
- **Data cells**: Regular weight for readability
- **Monospace**: Numerical alignment
- **Consistent sizing**: Maintains hierarchy

## Accessibility Features
- High contrast header text
- Clear hover states for interactivity
- Adequate padding for touch targets
- Theme-aware color adjustments

## Performance Considerations
- CSS transitions limited to essential properties
- Efficient pseudo-element usage
- Minimal repaints with hover states
- Optimized z-index stacking