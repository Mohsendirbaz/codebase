# multi-zone-selector-css.css Documentation

## Overview
The multi-zone-selector-css.css stylesheet implements a comprehensive spatial zone management interface with map integration, form controls, and data visualization components. This is a complex, feature-rich stylesheet designed for geographic/spatial applications with extensive interactive capabilities.

## Architecture Overview

### Component Hierarchy
```
.multi-zone-selector
├── .multi-zone-tabs (Navigation)
├── .multi-zone-content
│   ├── .multi-zone-map-container (Main Map Area)
│   └── .multi-zone-sidebar
│       ├── .multi-zone-options-panel
│       ├── .multi-zone-overview
│       ├── .multi-zone-boundary-selection
│       └── .multi-zone-boundary-download
└── .multi-zone-selected-area-info (Footer Info)
```

### Design System Foundation
- **Color Palette**: 
  - Primary: #4caf50 (Green)
  - Secondary: #2196f3 (Blue)
  - Neutral: #f5f5f5, #f9f9f9, #ddd
  - Text: #333, #555, #666
- **Spacing**: 4px base unit, scaling to 8px, 12px, 16px
- **Border System**: 1px solid borders with #ddd default
- **Shadow System**: Subtle elevation with box-shadow

## Major Component Systems

### 1. Main Container Structure

#### Root Container
```css
.multi-zone-selector {
  display: flex;
  flex-direction: column;
  height: 600px;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
}
```
- **Layout**: Vertical flex container with fixed height
- **Visual**: Rounded corners with border containment
- **Purpose**: Houses entire zone selection interface

### 2. Navigation System

#### Tab Navigation
```css
.multi-zone-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #ddd;
}

.multi-zone-tab {
  padding: 12px 16px;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.multi-zone-tab.active {
  border-bottom-color: #4caf50;
  color: #4caf50;
}
```
- **Interaction**: Smooth transitions on hover/active states
- **Visual Feedback**: Active tab indicated by green bottom border
- **Accessibility**: Clear visual hierarchy

### 3. Content Layout System

#### Split Layout Design
```css
.multi-zone-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.multi-zone-map-container {
  flex: 3;
  position: relative;
  overflow: hidden;
  height: 100%;
}

.multi-zone-sidebar {
  flex: 1;
  min-width: 280px;
  max-width: 350px;
  padding: 16px;
  background-color: #fff;
  border-left: 1px solid #ddd;
  overflow-y: auto;
}
```
- **Ratio**: 3:1 map to sidebar ratio
- **Constraints**: Sidebar width limits for optimal readability
- **Scrolling**: Independent scroll for sidebar content

### 4. Form Control Systems

#### Input Styling
```css
.multi-zone-option-group input,
.multi-zone-option-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
```

#### Specialized Controls
- **Checkbox Groups**: Inline flex layout with proper spacing
- **Unit Labels**: Secondary text color (#666) for units
- **Help Text**: Small font size (12px) for additional context

### 5. Interactive Elements

#### Primary Action Button
```css
.multi-zone-generate-button {
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.multi-zone-generate-button:hover {
  background-color: #388e3c;
}

.multi-zone-generate-button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}
```
- **States**: Normal, hover, disabled
- **Feedback**: Color transitions and cursor changes

### 6. Data Display Components

#### Zone Summary System
```css
.multi-zone-summary {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
}

.multi-zone-summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
```
- **Layout**: Key-value pair display
- **Visual**: Subtle background differentiation

#### Zone List Display
```css
.multi-zone-list {
  max-height: 300px;
  overflow-y: auto;
}

.multi-zone-list-item {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
}
```
- **Scrolling**: Contained height with scroll
- **Cards**: Individual zone information cards

### 7. Advanced UI Components

#### Tooltip System
```css
.multi-zone-tooltip {
  position: absolute;
  z-index: 999;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  min-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```
- **Positioning**: Absolute with high z-index
- **Shadow**: Enhanced depth perception
- **Content**: Structured with heading and details

#### Boundary Selection Interface
```css
.multi-zone-boundary-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s ease;
}

.multi-zone-boundary-item.selected {
  background-color: #e8f5e9;
  color: #2e7d32;
  font-weight: 500;
}
```
- **Interaction**: Hover and selection states
- **Visual Feedback**: Color and weight changes

### 8. Download Interface

#### Download Options Panel
```css
.multi-zone-boundary-download {
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-top: 16px;
}

.multi-zone-download-button {
  padding: 8px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
```
- **Layout**: Grid system for format options
- **Actions**: Blue-themed download buttons
- **Organization**: Clear section separation

### 9. Form Management

#### Asset Addition Form
```css
.multi-zone-add-asset-form {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
}

.multi-zone-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
```
- **Structure**: Header, inputs, actions
- **Validation**: Error state styling
- **Actions**: Cancel/submit button pair

### 10. State Management Styles

#### Loading States
```css
.multi-zone-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #666;
  font-style: italic;
}
```

#### Empty States
```css
.multi-zone-no-zones,
.multi-zone-no-boundaries,
.multi-zone-no-area {
  padding: 16px;
  text-align: center;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 4px;
}
```

#### Error States
```css
.multi-zone-input-error {
  border-color: #f44336 !important;
}

.multi-zone-error {
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
}
```

## Responsive Design System

### Mobile Breakpoint (768px)
```css
@media (max-width: 768px) {
  .multi-zone-content {
    flex-direction: column;
  }
  
  .multi-zone-map-container,
  .multi-zone-sidebar {
    flex: 1;
    max-width: 100%;
    width: 100%;
  }
  
  .multi-zone-sidebar {
    border-left: none;
    border-top: 1px solid #ddd;
  }
  
  .multi-zone-area-details-grid {
    grid-template-columns: 1fr;
  }
}
```
- **Layout**: Stacked vertical on mobile
- **Borders**: Adjusted for vertical layout
- **Grid**: Single column for details

## Visual Design Patterns

### Color Usage
1. **Primary Actions**: Green (#4caf50)
2. **Secondary Actions**: Blue (#2196f3)
3. **Neutral Backgrounds**: Gray scale (#f5f5f5, #f9f9f9)
4. **Text Hierarchy**: #333 (primary), #555 (secondary), #666 (tertiary)
5. **Error States**: Red (#f44336)
6. **Success States**: Light green (#e8f5e9)

### Typography System
- **Headings**: 16px (h4), 15px (h5)
- **Body Text**: 14px default, 13px small, 12px helper
- **Font Weights**: 600 (headings), 500 (emphasis), 400 (normal)

### Spacing Rhythm
- **Micro**: 4px
- **Small**: 8px
- **Medium**: 12px
- **Large**: 16px
- **Section**: 16px margins

## Performance Considerations

### Optimization Strategies
1. **Transitions**: Limited to essential properties
2. **Shadows**: Minimal use for performance
3. **Overflow**: Hidden on containers to prevent reflow
4. **Z-index**: Logical layering system

### Browser Support
- **Flexbox**: Full modern browser support
- **Grid**: Used sparingly for compatibility
- **CSS Custom Properties**: Not used for broader support
- **Transitions**: Standard properties only

## Integration Guidelines

### Map Library Support
```css
.leaflet-draw-toolbar a {
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
```
- Styled to match interface design
- Maintains library functionality

### Component Usage
1. Initialize with proper HTML structure
2. Ensure map container has defined dimensions
3. Handle responsive behavior with JavaScript
4. Manage state classes dynamically

## Accessibility Features

### Focus Management
- Clear focus indicators on interactive elements
- Logical tab order through form controls
- Keyboard navigation support

### Visual Accessibility
- Sufficient color contrast ratios
- Clear visual hierarchy
- Alternative text for icons (via HTML)
- Status messages for screen readers

## Best Practices

### Implementation
1. Use semantic HTML with appropriate ARIA labels
2. Manage component state with JavaScript
3. Lazy load map tiles for performance
4. Implement proper error handling
5. Cache zone data when appropriate

### Maintenance
1. Keep color variables consistent
2. Test responsive behavior regularly
3. Monitor performance on mobile devices
4. Update map library styles as needed
5. Document custom modifications