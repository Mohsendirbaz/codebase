# CoordinateComponent CSS Documentation

## Overview
The CoordinateComponent stylesheet defines the visual design for a coordinate-based asset management system. It implements a form-driven interface for managing location-based assets with support for hard-to-decarbonize asset identification and status toggling.

## Core Design System

### Container Structure
- **Main Container** (`.coordinate-container`)
  - Vertical flex layout with 1.5rem gaps
  - Modular component organization
  
- **Component Wrapper** (`.coordinate-component`)
  - Light gray background (#f9fafb)
  - Bordered card design with rounded corners
  - Soft shadow for depth perception
  - Generous padding (1.5rem) and top margin

### Header Design
- **Header Layout** (`.coordinate-header`)
  - Flex layout with space-between alignment
  - Bottom border separator (#e5e7eb)
  - Title and zone info split design
  
- **Typography**
  - Main title: 1.25rem, bold weight (#1f2937)
  - Zone info: 0.875rem, subdued gray (#6b7280)
  - Right-aligned metadata display

## Form System

### Input Grid Layout
- **Two-Column Grid** (`.coordinate-inputs`)
  - Equal columns (1fr 1fr) with 1rem gap
  - Responsive collapse on mobile
  - Consistent spacing throughout

### Input Styling
- **Input Groups** (`.coordinate-input-group`)
  - Vertical flex layout
  - Label above input pattern
  - 0.875rem labels in medium gray (#4b5563)
  
- **Input Fields**
  - Standard padding (0.5rem)
  - Light border (#d1d5db)
  - Rounded corners (0.375rem)
  - Consistent font sizing

### Error States
- **Error Indication**
  - Red border color (#ef4444)
  - Error message below input
  - Small font size (0.75rem) for messages
  - Important flag for style precedence

## Asset Management Interface

### Add Asset Form
- **Container** (`.coordinate-add-asset-form`)
  - White background on gray
  - Bordered box with rounded corners
  - Internal padding (1rem)
  - Hidden overflow for clean edges

### Form Controls
- **Header Bar** (`.coordinate-form-header`)
  - Flex layout with close button
  - Title left, controls right
  - Small title font (0.875rem)
  
- **Close Button**
  - Borderless design
  - Large icon size (1.25rem)
  - Gray color with pointer cursor
  - No padding for precise alignment

### Form Layout
- **Input Grid** (`.coordinate-form-inputs`)
  - Two-column layout
  - Compact gaps (0.75rem)
  - Responsive behavior

- **Form Groups** (`.coordinate-form-group`)
  - Consistent vertical spacing
  - Small labels (0.75rem)
  - Unified input/select styling

### Interactive Elements
- **Focus States**
  - Blue border (#3b82f6)
  - Blue shadow spread (2px)
  - Clear visual feedback

- **Checkbox Styling**
  - Standard size (1rem × 1rem)
  - Right margin for label spacing
  - Pointer cursor on label

## Asset Display

### Asset List
- **Container** (`.coordinate-assets-list`)
  - Vertical flex with 0.75rem gaps
  - Clean spacing between items

### Asset Items
- **Base Item** (`.coordinate-asset-item`)
  - White background with border
  - Horizontal flex layout
  - Space-between alignment
  - Rounded corners (0.375rem)

- **Hard-to-Decarbonize Indicator**
  - 4px amber left border (#f59e0b)
  - Visual prominence for special assets

### Asset Information
- **Info Layout** (`.coordinate-asset-info`)
  - Vertical flex for stacked data
  - Name, type, and carbon display
  - Hierarchical typography

- **Typography Hierarchy**
  - Name: Medium weight (#1f2937)
  - Type: Small size, gray, capitalized
  - Carbon: Small, green (#10b981), medium weight

## Status Toggle System

### Custom Toggle Switch
- **Container** (`.coordinate-status-toggle`)
  - 2.5rem × 1.25rem dimensions
  - Inline-block display
  - Relative positioning

- **Slider Design** (`.coordinate-status-slider`)
  - Gray background (#d1d5db)
  - Smooth transition (0.4s)
  - Fully rounded (1.25rem radius)
  - Amber when checked (#f59e0b)

- **Toggle Button**
  - Circular white button
  - Transform animation on check
  - Positioned with precise offsets
  - Focus shadow for accessibility

## Action Buttons

### Button Hierarchy
1. **Primary Actions** (`.coordinate-add-button`)
   - Green background (#10b981)
   - White text for contrast
   - Hover darkening effect
   - Disabled state with gray

2. **Form Actions**
   - Submit: Blue theme (#3b82f6)
   - Cancel: Gray theme (#f3f4f6)
   - Consistent padding and sizing

3. **Destructive Actions** (`.coordinate-asset-remove`)
   - Gray background with red text
   - Hover state with red background
   - Small size for de-emphasis

### Button States
- **Hover Effects**
  - Darker shade transitions
  - Smooth color changes (0.2s)
  
- **Disabled State**
  - Gray background (#d1d5db)
  - Not-allowed cursor
  - Reduced visual prominence

## Empty States

### No Assets Display
- **Design** (`.coordinate-no-assets`)
  - Dashed border pattern
  - Centered text alignment
  - Muted gray color (#6b7280)
  - Generous padding (1.5rem)

## Responsive Design

### Mobile Breakpoint (≤768px)

#### Layout Changes
1. **Input Grids**: Single column layout
2. **Header**: Vertical stack with left alignment
3. **Asset Items**: Column layout with full-width actions
4. **Zone Info**: Left-aligned instead of right

#### Mobile Optimizations
- Full-width form inputs
- Stacked asset information
- Justified action buttons
- Maintained touch targets

## Climate-Specific Features

### Visual Indicators
- **Amber Theme**: Hard-to-decarbonize assets
- **Green Accents**: Carbon values and positive actions
- **Status Toggles**: Clear on/off states

### Information Architecture
- Location data prominently displayed
- Asset categorization system
- Carbon tracking integration
- Zone-based organization

## Accessibility Considerations
- Clear focus indicators on all inputs
- Proper label associations
- Sufficient color contrast
- Keyboard navigation support

## Performance Optimizations
- Efficient flexbox layouts
- Minimal CSS specificity
- Smooth transitions without layout shifts
- Optimized for frequent updates