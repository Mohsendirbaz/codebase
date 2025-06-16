# Build Workflow Panel CSS

## Overview
Comprehensive stylesheet for the BuildWorkflowPanel component, implementing a professional sidebar panel with collapsible functionality, tabbed interface, and responsive design. Features modern UI patterns with smooth transitions and accessible color schemes.

## Architecture

### Layout System
1. **Panel Structure**
   - Fixed width: 300px (expanded) / 50px (collapsed)
   - Flexbox column layout
   - Full height integration
   - Box shadow for depth

2. **Content Areas**
   - Header: Fixed top section
   - Content: Scrollable flex area
   - Footer: Optional file info

## Core Components

### Panel Container
```css
.build-workflow-panel {
  width: 300px;
  transition: width 0.3s ease;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.05);
}
```
- Smooth width transitions
- Subtle shadow for depth
- Overflow hidden for clean edges

### Header Styling
- **Background**: #e9ecef (light gray)
- **Padding**: 12px 16px
- **Border**: Bottom separator
- **Layout**: Space-between flex

### Tab System
- **Active Indicator**: Blue underline
- **Hover State**: Darker text
- **Transition**: 0.2s all properties
- **Border**: 2px transparent/blue

## Status Indicators

### Color Coding
- **Success**: #28a745 (green)
- **Warning**: #ffc107 (amber)
- **Error**: #dc3545 (red)
- **Idle**: #6c757d (gray)
- **Building**: #007bff (blue)

### Visual Hierarchy
- Icon + text combination
- Font weight differentiation
- Size variations for importance

## Interactive Elements

### Action Buttons
1. **Grid Layout**
   - 2-column grid (1-column mobile)
   - 12px gap spacing
   - Equal button sizing

2. **Button States**
   - Default: White background
   - Hover: Light gray (#f1f3f5)
   - Disabled: 0.6 opacity
   - Primary: Blue (#007bff)

### Form Controls
- **Select Dropdowns**: Native styling enhanced
- **Checkboxes**: Aligned with labels
- **Spacing**: Consistent 16px gaps

## Specialized Sections

### Logs Display
```css
.logs-section {
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
}
```
- Scrollable container
- Monospace font for logs
- Alternating row borders

### Config Panel
- Vertical form layout
- Clear label hierarchy
- Grouped checkbox items
- Native control enhancement

## Transitions & Animations

### Panel Collapse
- Width transition: 0.3s ease
- Smooth content hiding
- No layout jumps

### Interactive Feedback
- Button hover: 0.2s
- Tab switches: Instant
- Color changes: Smooth

## Responsive Design

### Mobile Breakpoint (768px)
1. **Layout Changes**
   - Full width panel
   - Top border instead of left
   - Single column actions

2. **Collapsed State**
   - Maintains full width
   - Reduces to 50px height
   - Horizontal layout

## Typography

### Font Hierarchy
- **Headers**: 600 weight
- **Labels**: 500 weight
- **Body**: Normal weight
- **Logs**: Monospace family

### Size Scale
- **Standard**: 1rem
- **Small**: 0.85rem
- **Large**: 1.2rem (icons)

## Spacing System

### Consistent Gaps
- **Section**: 16px
- **Element**: 12px
- **Inline**: 8px
- **Tight**: 4px

### Padding Values
- **Panel**: 16px
- **Header**: 12px 16px
- **Buttons**: 12px
- **Logs**: 8px 12px

## Color Palette

### Primary Colors
- **Blue**: #007bff (primary actions)
- **Gray**: #6c757d (muted text)
- **Dark Gray**: #495057 (headers)

### Background Colors
- **Panel**: #f8f9fa
- **Header**: #e9ecef
- **White**: #ffffff
- **Hover**: #f1f3f5

### Border Colors
- **Default**: #dee2e6
- **Hover**: #ced4da
- **Light**: #f1f3f5

## Accessibility Features
- Clear focus indicators
- Sufficient color contrast
- Disabled state styling
- Hover feedback
- Semantic structure