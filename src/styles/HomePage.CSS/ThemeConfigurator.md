# ThemeConfigurator.css Documentation

## Overview
The ThemeConfigurator CSS file defines a comprehensive theme customization interface with color pickers, gradient editors, and CSS code management. This is one of the most feature-rich stylesheets in the system, implementing a full modal-based configuration panel with multiple tabs and interactive controls.

## Architectural Structure

### 1. Modal Container System

#### Primary Modal `.theme-configurator`
```css
.theme-configurator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  width: 80%;
  max-height: 80vh;
  overflow-y: auto;
}
```
- **Positioning**: Fixed center positioning with transform
- **Sizing**: Responsive 80% width with viewport height constraints
- **Layering**: High z-index (9999) for overlay priority
- **Scrolling**: Vertical scroll for long content
- **Styling**: Neumorphic design with shadow and rounded corners

### 2. Header Architecture

#### Modal Header `.theme-configurator-header`
- **Layout**: Flexbox with space-between alignment
- **Design**: Bottom border separator
- **Components**:
  - Title (h2) with 1.5rem font size
  - Close button with hover effects

#### Close Button System
```css
.close-button:hover {
  color: var(--primary-color);
  transform: scale(1.1);
}
```
- Icon-based (24px font size)
- Smooth transitions
- Scale transform on hover

### 3. Tab Navigation System

#### Tab Container `.tab-buttons`
- **Layout**: Flexbox with 10px gap
- **Purpose**: Section navigation

#### Tab Button States
```css
.tab-button {
  /* Default state */
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
}

.tab-button.active {
  /* Active state */
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-button:hover:not(.active) {
  /* Hover state */
  background-color: var(--model-color-background-hover);
}
```

### 4. Color Configuration System

#### Color Picker Architecture
1. **Row Layout** `.color-picker-row`
   - Flexbox with wrap
   - 20px gap between items
   - Responsive minimum width (160px)

2. **Color Input Group** `.color-input-group`
   ```css
   .color-input-group {
     display: flex;
     align-items: center;
     gap: 10px;
   }
   ```
   - Color swatch preview
   - Hidden native input
   - Text input for hex values
   - Reset button

3. **Color Swatch Design**
   - 30x30px clickable area
   - Rounded corners
   - Border for definition
   - Cursor pointer for interaction

### 5. Gradient Editor System

#### Gradient Preview Component
- Centered content display
- Overflow hidden for clean edges
- Interactive code display

#### Gradient Controls Grid
```css
.gradient-controls {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}
```
- Responsive grid layout
- Auto-filling columns
- Consistent spacing

#### Gradient Manipulation
1. **Angle Slider**: 0-360 degree rotation
2. **Position Slider**: Color stop positioning
3. **Color Pickers**: Start/end color selection
4. **Extra Colors**: Additional gradient stops

### 6. CSS Code Management

#### Available Variables Display
```css
.css-available-variables code:hover {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}
```
- Expandable details element
- Clickable variable chips
- Hover state for selection

#### File Selection List
```css
.css-files-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  max-height: 150px;
  overflow-y: auto;
}
```
- Grid-based checkbox layout
- Scrollable container
- Responsive columns

#### Code Editor
- Monospace font family
- Resizable textarea
- Full-width layout

### 7. Animation System

#### Copy Tooltip Animation
```css
@keyframes fadeInOut {
  0% { opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { opacity: 0; }
}
```
- Smooth fade in/out
- 2-second duration
- Used for copy confirmations

### 8. Action Button System

#### Button Hierarchy
1. **Primary Actions**: Apply buttons with primary color
2. **Secondary Actions**: Reset buttons with border styling
3. **State Feedback**: Disabled states with opacity

#### Button Interactions
```css
.apply-theme-button:hover {
  background-color: var(--primary-color-dark);
  transform: translateY(-1px);
}

.reset-theme-button:hover {
  background-color: var(--danger-color);
  color: white;
  border-color: var(--danger-color);
}
```

### 9. Status Feedback System

#### Save Status Messages
```css
.save-status.success { background-color: var(--success-color); }
.save-status.warning { background-color: var(--warning-color); }
.save-status.error { background-color: var(--danger-color); }
```
- Color-coded feedback
- Rounded corners
- Centered text
- Contextual colors

### 10. Responsive Design Strategy

#### Mobile Breakpoint (768px)
```css
@media (max-width: 768px) {
  .theme-configurator {
    width: 95%;
    max-height: 90vh;
  }
  
  .color-picker-row { flex-direction: column; }
  .gradient-controls { grid-template-columns: 1fr; }
  .theme-actions { flex-direction: column; gap: 10px; }
}
```

**Adaptations:**
- Increased modal size for mobile
- Vertical stacking of elements
- Single column layouts
- Stacked action buttons

## Component Hierarchy

```
.theme-configurator
├── .theme-configurator-header
│   ├── h2 (title)
│   └── .close-button
├── .tab-buttons
│   └── .tab-button (multiple)
├── .color-pickers-container
│   └── .color-picker-row
│       └── .color-picker-item
│           └── .color-input-group
├── .gradients-container
│   ├── .gradient-preview
│   └── .gradient-controls
├── .css-registry-container
│   ├── .css-available-variables
│   ├── .css-files-list
│   └── .css-code-textarea
├── .theme-actions
│   ├── .apply-theme-button
│   └── .reset-theme-button
└── .save-status
```

## Visual Design System

### Color Usage
- **Backgrounds**: Light gray (#e9ecef) for modal
- **Borders**: Theme-aware border colors
- **Text**: Contrast-based text colors
- **States**: Success (green), Warning (yellow), Error (red), Info (blue)

### Spacing System
- **Large**: 20px (sections, modal padding)
- **Medium**: 15px (subsections, grid gaps)
- **Small**: 10px (element gaps)
- **Extra Small**: 5px (inline elements)

### Typography
- **Headers**: 1.5rem for main title, 1.2rem for sections
- **Body**: 1rem default, 14px for labels
- **Code**: Monospace family, 12-14px

## Interactive Features

### 1. Color Picking
- Click swatch to open native picker
- Manual hex input with validation
- Reset to default functionality

### 2. Gradient Building
- Real-time preview updates
- Angle and position controls
- Multiple color stops

### 3. CSS Code Management
- Variable insertion helpers
- File selection for application
- Syntax-aware text area

### 4. Tab Navigation
- Section-based organization
- Active state management
- Smooth transitions

## Performance Optimizations

1. **Grid Layouts**: Efficient responsive design
2. **Transform Animations**: Hardware acceleration
3. **Scroll Containers**: Limited height prevents overflow
4. **Event Delegation**: Minimal event listeners needed

## Accessibility Considerations

1. **Keyboard Navigation**: Tab-friendly interface
2. **Color Contrast**: High contrast for readability
3. **Focus States**: Clear focus indicators
4. **Screen Reader**: Semantic HTML with labels

## Best Practices

1. **Theme Integration**: Consistent use of CSS variables
2. **State Management**: Clear visual feedback
3. **Error Handling**: Status messages for all actions
4. **Mobile First**: Responsive from the ground up

This CSS file represents a sophisticated implementation of a configuration interface, demonstrating advanced CSS techniques including Grid, Flexbox, animations, and comprehensive theming support.