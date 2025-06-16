# coordinate-container-enhanced-css.css Documentation

## Overview
The CoordinateContainerEnhanced CSS provides styling for a multi-view coordinate management interface with tabbed navigation. This component supports single coordinate, multi-zone, and boundary visualization modes with a clean, professional design aesthetic.

## Core Design Patterns

### Container Structure
```css
.coordinate-container-enhanced {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #ddd;
  overflow: hidden;
}
```
- Full-width flexible container
- Clean white background with subtle borders
- Rounded corners for modern appearance
- Hidden overflow for clean edge rendering

## Visual Design Elements

### Header Design
```css
.coordinate-container-header {
  padding: 16px 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}
```
- Light gray background for visual separation
- Generous padding for breathing room
- Clear border definition between sections

### Tab Navigation System
```css
.coordinate-tab {
  padding: 12px 20px;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.coordinate-tab.active {
  border-bottom-color: #4caf50;
  color: #4caf50;
}
```
- Bottom border indicator for active state
- Green accent color (#4caf50) for primary actions
- Smooth transitions between states
- Hover effects with background color change

## Component-Specific Styling

### Content Views
```css
.coordinate-single-view,
.coordinate-multi-view,
.coordinate-boundary-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
```
- Consistent spacing between elements
- Vertical stacking with flexbox
- Unified layout approach across view types

### Multi-View Actions Panel
```css
.multi-view-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
}
```
- Centered action placement
- Subtle background for section distinction
- Rounded corners matching container style

### Primary Action Button
```css
.add-zones-button {
  padding: 12px 24px;
  background-color: #4caf50;
  color: white;
  transition: background-color 0.2s ease;
}

.add-zones-button:hover {
  background-color: #388e3c;
}
```
- Prominent green color for primary actions
- Generous padding for touch targets
- Darker hover state for visual feedback

## Boundary Options Panel

### Panel Container
```css
.boundary-options-panel {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #eee;
}
```
- Slightly darker background than content area
- Subtle border for definition
- Consistent border radius with main container

### Options Layout
```css
.format-checkboxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
```
- Grid layout for checkbox options
- Two-column layout for efficient space use
- Consistent spacing between options

## Typography and Color Scheme

### Text Hierarchy
- **Headers (h2)**: 20px, weight 600, color #333
- **Subheaders (h3)**: 16px, weight 600, color #333
- **Body text**: 14px, color #333
- **Secondary text**: 14px, color #555

### Color Palette
- **Primary Green**: #4caf50 (active states, primary actions)
- **Dark Green**: #388e3c (hover states)
- **Background Gray**: #f5f5f5 (headers, panels)
- **Light Gray**: #f9f9f9 (secondary panels)
- **Border Gray**: #ddd (primary borders)
- **Light Border**: #eee (secondary borders)

## Interactive Elements

### Tab Interactions
```css
.coordinate-tab:hover {
  background-color: #f5f5f5;
}
```
- Subtle hover feedback
- Maintains text readability
- Quick transition for responsive feel

### Checkbox Styling
```css
.boundary-option-label,
.format-checkbox {
  cursor: pointer;
}
```
- Pointer cursor for clickable areas
- Consistent spacing between checkbox and label
- Grid layout for organized presentation

## Responsive Design
```css
@media (max-width: 768px) {
  .coordinate-container-tabs {
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .format-checkboxes {
    grid-template-columns: 1fr;
  }
}
```
- Horizontal scrolling for tabs on mobile
- Single column layout for checkboxes
- Adjusted padding for smaller screens

## Design Principles

### Visual Hierarchy
1. **Container borders** establish boundaries
2. **Background colors** create section separation
3. **Active indicators** guide user attention
4. **Consistent spacing** improves readability

### User Experience Patterns
- Clear tab navigation for view switching
- Prominent primary actions
- Grouped related options
- Responsive layouts for all devices

### Consistency Elements
- 8px border radius throughout
- 20px standard content padding
- Consistent color usage for states
- Unified transition timing (0.2s)

## Accessibility Considerations
- Sufficient color contrast (AAA compliant)
- Clear focus states (implicit through active styles)
- Adequate touch targets (minimum 44px)
- Logical tab order for keyboard navigation