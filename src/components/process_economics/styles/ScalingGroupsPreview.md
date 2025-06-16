# ScalingGroupsPreview.css Documentation

## Overview
This stylesheet defines the visual design for a scaling groups preview component, featuring a tabbed navigation system with panels for displaying grouped scaling operations. The design emphasizes clarity and ease of navigation through scaling configurations.

## Visual Design System

### Color Palette
The component uses a minimalist gray-scale color scheme:

```css
/* Background Colors */
background-color: #f9fafb;  /* Light gray container background */
background-color: #ffffff;  /* White for active areas */
background-color: #f3f4f6;  /* Medium-light gray for interactive elements */
background-color: #e5e7eb;  /* Medium gray for selected states */

/* Text Colors */
color: #1f2937;  /* Dark gray for primary text */
color: #374151;  /* Medium-dark gray for labels */
color: #4b5563;  /* Medium gray for secondary text */
color: #6b7280;  /* Light gray for tertiary text */

/* Border Color */
border: 1px solid #e5e7eb;  /* Consistent border treatment */
```

## Layout Patterns

### Main Container Structure
```css
.scaling-groups-preview {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 1rem 0;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #f9fafb;
}
```
- Full-width flexible container
- Rounded corners with hidden overflow for clean edges
- Vertical layout for navigation and content separation

### Navigation Layout
```css
.scaling-groups-navigation {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}
```
- Horizontal navigation bar
- White background for contrast with content area
- Bottom border creates visual separation

### Tab System
```css
.scaling-groups-tabs {
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
  flex-grow: 1;
  margin: 0 0.5rem;
}
```
- Horizontally scrollable tab container
- Thin scrollbar for minimal visual intrusion
- Flexible growth to fill available space

## Component-Specific Styles

### Navigation Buttons
```css
.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 0.25rem;
  background-color: #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-button:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```
- Square buttons with centered icons
- Hover state with darker background
- Disabled state with reduced opacity

### Tab Styling
```css
.scaling-group-tab {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  background-color: transparent;
  color: #4b5563;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s, color 0.2s;
}

.scaling-group-tab-selected {
  background-color: #e5e7eb;
  color: #1f2937;
}
```
- Rounded tab buttons with horizontal padding
- No text wrapping for consistent height
- Selected state with darker background and text

### Content Panels
```css
.scaling-groups-panels {
  padding: 1rem;
}

.scaling-group-panel {
  animation: fadeIn 0.3s ease-in-out;
}
```
- Consistent padding for content areas
- Fade-in animation for smooth transitions

### Scaling Items
```css
.scaling-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
}
```
- Card-like design for individual items
- Space-between layout for label and operation
- White background for contrast

### Operation Display
```css
.item-operation {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.operation-name {
  font-style: italic;
}

.operation-factor {
  font-weight: 600;
  color: #4b5563;
}
```
- Smaller font size for secondary information
- Italic styling for operation names
- Bold weight for numerical factors

## Responsive Design Approaches

The component is inherently responsive through:

1. **Flexible Widths**: Using 100% width allows adaptation to container
2. **Scrollable Tabs**: Horizontal scrolling prevents layout breaking
3. **Flexible Content**: Items stack naturally in their containers

## Animation and Transitions

### Fade-In Animation
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```
- Simple opacity transition
- 0.3s duration for smooth but quick appearance

### Interactive Transitions
```css
transition: background-color 0.2s;
transition: background-color 0.2s, color 0.2s;
```
- Quick transitions for responsive feel
- Multiple properties transitioned simultaneously

## CSS Variables and Theming

While this stylesheet doesn't use CSS custom properties, it maintains consistency through:
- Repeated color values that could be extracted to variables
- Consistent spacing units (0.25rem, 0.5rem, 1rem)
- Uniform border treatments

## Key Class Hierarchies

### Component Structure
```
.scaling-groups-preview
  ├── .scaling-groups-navigation
  │   ├── .nav-button (prev)
  │   ├── .scaling-groups-tabs
  │   │   └── .scaling-group-tab
  │   └── .nav-button (next)
  ├── .scaling-groups-panels
  │   └── .scaling-group-panel
  │       └── .scaling-group-details
  │           ├── .scaling-group-name
  │           └── .scaling-group-items
  │               └── .items-list
  │                   └── .scaling-item
  │                       ├── .item-label
  │                       └── .item-operation
  └── .scaling-groups-indicator
```

### State Classes
- `.scaling-group-tab-selected`: Active tab state
- `:disabled`: Disabled navigation buttons
- `:hover`: Interactive hover states

## Special Features

### Empty States
```css
.no-items {
  color: #6b7280;
  font-style: italic;
}

.no-scaling-groups {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}
```
- Italic text for empty state messages
- Centered layout with generous padding
- Subdued color for de-emphasis

### Progress Indicator
```css
.scaling-groups-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  background-color: #f3f4f6;
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #6b7280;
}

.current-group {
  font-weight: 600;
  color: #4b5563;
}
```
- Footer area showing current position
- Emphasized current group number
- Subtle background differentiation

## Design Principles

### Visual Hierarchy
1. **Navigation**: Most prominent with white background
2. **Content**: Secondary with light gray background
3. **Items**: Tertiary with bordered cards

### Interaction Patterns
1. **Hover States**: Darker backgrounds for clickable elements
2. **Selected States**: Clear visual distinction
3. **Disabled States**: Reduced opacity and cursor change

### Spacing System
- **0.25rem**: Tight spacing for related elements
- **0.5rem**: Standard spacing for components
- **1rem**: Generous spacing for sections
- **2rem**: Extra spacing for empty states

## Best Practices

1. **Consistent Border Radius**: 0.25rem for small elements, 0.5rem for containers
2. **Color Progression**: Darker colors for more important/active elements
3. **Transition Timing**: 0.2s for quick interactions, 0.3s for content changes
4. **Semantic Styling**: Font styles (italic, bold) convey meaning
5. **Accessibility**: Disabled states clearly indicated through opacity and cursor

## Potential Improvements

1. **CSS Variables**: Extract colors to custom properties for easier theming
2. **Focus States**: Add keyboard navigation indicators
3. **Mobile Optimization**: Specific touch-friendly adjustments
4. **Dark Mode**: Alternative color scheme support
5. **Loading States**: Skeleton screens or spinners for async content