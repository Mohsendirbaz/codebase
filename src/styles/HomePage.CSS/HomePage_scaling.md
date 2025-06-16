# HomePage_scaling.css Documentation

## Overview
This CSS file implements a comprehensive scaling interface system with advanced mathematical operations, state management, and visual feedback. The design emphasizes clarity, usability, and professional presentation of scaling configurations across multiple groups and operations.

## Architectural Structure

### 1. Core Layout System

#### Main Container
```css
.scaling-container
```
- **Layout**: Flexbox column with consistent gaps
- **Visual Design**: 
  - Sidebar background for visual separation
  - Rounded corners (var(--spacing-xl))
  - Subtle shadow for depth
- **Z-Index**: Positioned above base content (z-index: 1)
- **Purpose**: Primary container for all scaling operations

#### Header Structure
```css
.scaling-header
```
- **Layout**: Space-between flexbox
- **Purpose**: Contains title and primary actions
- **Spacing**: Large bottom margin for visual hierarchy

### 2. Tab Navigation System

#### Tab List Container
```css
.scaling-tab-list
```
- **Layout**: Horizontal scrollable flexbox
- **Scrollbar**: Hidden for cleaner appearance
- **Background**: App background with border
- **Features**:
  - Overflow scrolling for many tabs
  - Consistent spacing between tabs
  - Border radius for soft edges

#### Individual Tabs
```css
.scaling-tab
```
- **Visual Design**:
  - Padding: Extra large vertical, large horizontal
  - Background: App background color
  - Border: 1px solid with theme color
  - Border radius for rounded appearance
- **States**:
  - Hover: Background color shift, text color change
  - Selected: Primary color background, white text

#### Tab Content and Actions
```css
.scaling-tab-content,
.scaling-tab-actions
```
- **Tab Content**: Flexbox with icon/text alignment
- **Tab Actions**: Hidden by default, visible on hover
- **Interaction**: Smooth opacity transitions

### 3. Scaling Item Components

#### Item Container
```css
.scaling-item
```
- **Visual Design**:
  - App background with border
  - Large border radius
  - Padding for content breathing room
- **Animation**: Scale-in animation on creation
- **States**:
  - Hover: Border color change to primary
  - Disabled: Reduced opacity with overlay

#### Item Content Layout
```css
.scaling-item-content
```
- **Layout**: Horizontal flexbox
- **Spacing**: Large gaps between elements
- **Alignment**: Center-aligned items

#### Item Information
```css
.scaling-item-info,
.scaling-item-label,
.scaling-base-value
```
- **Info Container**: Flexible width
- **Label**: Primary color, bold text
- **Base Value**: Smaller font, primary color

### 4. Form Controls

#### Operation Selector
```css
.scaling-operation-select
```
- **Size**: Minimum 150px width
- **Styling**: 
  - Rounded borders
  - Padding for comfortable clicking
  - Transition effects
- **States**: Disabled state with reduced opacity

#### Factor Input
```css
.scaling-factor-input
```
- **Width**: Fixed 120px for consistency
- **Styling**: Matches operation selector
- **Purpose**: Numerical input for scaling factors

#### Notes Input
```css
.scaling-notes-input
```
- **Width**: Full container width
- **Purpose**: Additional context/documentation
- **Margin**: Top spacing for separation

### 5. Mathematical Result Display

#### Result Container
```css
.scaling-result
```
- **Visual Design**:
  - Semi-transparent background
  - Primary color border (subtle)
  - Rounded corners
- **Purpose**: Display calculated values
- **States**:
  - Valid: Green-tinted border
  - Invalid: Red-tinted border
  - Calculating: Animated pulse effect

#### Result Value
```css
.scaling-result-value
```
- **Typography**: Monospace font for numbers
- **Color**: Primary color for emphasis
- **Weight: Medium for readability

### 6. Summary Table System

#### Summary Container
```css
.scaling-summary
```
- **Structure**: Table-based layout
- **Visual Design**:
  - Sidebar background
  - Border and rounded corners
  - Shadow for elevation

#### Table Structure
```css
.scaling-summary table,
.scaling-summary th,
.scaling-summary td
```
- **Layout**: Separated borders, no collapse
- **Headers**: 
  - Sticky positioning
  - App background
  - Bold text
- **Cells**: 
  - Consistent padding
  - Bottom borders
  - Hover effects on rows

#### Mathematical Elements
```css
.mathematical-result,
.operation-symbol,
.mathematical-input
```
- **Result Display**: 
  - Monospace font
  - Primary color
  - Background highlight
  - Pulse animation on change
- **Operation Symbols**: Centered, secondary color
- **Input Fields**: Full width, focus states

### 7. Interactive Elements

#### Checkboxes
```css
.scaling-checkbox
```
- **Size**: 18x18px
- **Visual**: 
  - 2px border
  - 4px border radius
  - Checkmark on selection
- **States**: Checked, disabled

#### Buttons
```css
.scaling-add-button,
.scaling-save-button,
.scaling-action-button
```
- **Add Button**: Primary color, icon support
- **Save Button**: 
  - Primary color
  - Shadow effects
  - Transform on interaction
- **Action Buttons**: 
  - Icon-based
  - Circular design
  - Hover color changes

### 8. Advanced Features

#### Loading States
```css
.scaling-item.loading
```
- **Effect**: Shimmer animation
- **Implementation**: Gradient overlay
- **Purpose**: Visual feedback during operations

#### Error Handling
```css
.scaling-error,
.scaling-validation-error
```
- **Color**: Error red (#ef4444)
- **Animation**: Pulse effect
- **Positioning**: Below related elements

#### Tooltips
```css
.tooltip,
.tooltip-container
```
- **Positioning**: Above trigger element
- **Visual**: 
  - Background with border
  - Shadow for elevation
  - Fade animation
- **Content**: Centered with arrow

#### Drag and Drop
```css
.scaling-item.dragging
```
- **Visual**: Reduced opacity
- **Cursor**: Grabbing cursor
- **Purpose**: Reordering support

### 9. Mathematical Precision Indicators

#### Precision Display
```css
.scaling-precision-indicator,
.scaling-precision-high/medium/low
```
- **Visual**: Colored dots
- **Colors**: 
  - High: Green (#10B981)
  - Medium: Yellow (#F59E0B)
  - Low: Red (#EF4444)

#### Operation Indicators
```css
.scaling-operation-indicator
```
- **Position**: Top-right corner
- **Visual**: Circular badge
- **Purpose**: Show current operation

### 10. Animations

#### Core Animations
- **scaleIn**: Entry animation for items
- **shimmer**: Loading state effect
- **tooltipFade**: Tooltip appearance
- **resultPulse**: Value change indication
- **errorPulse**: Error state emphasis
- **operationChange**: Operation switching
- **validationAppear**: Error message entry

### 11. Responsive Design

#### Tablet/Mobile (≤768px)
- **Item Layout**: Vertical stacking
- **Inputs**: Full width
- **Results**: Left-aligned
- **Summary**: Horizontal scroll

### 12. Theme Integration

#### CSS Variables
- `--spacing-*`: Consistent spacing system
- `--primary-color`: Brand color
- `--border-color`: UI borders
- `--text-*`: Text color variations
- `--app-background`: Main background
- `--sidebar-background`: Secondary background

### 13. State Management

#### Item States
- **Default**: Normal appearance
- **Hover**: Elevated with border highlight
- **Disabled**: Overlay with reduced opacity
- **Loading**: Shimmer animation
- **Dragging**: Transparency effect

#### Result States
- **Valid**: Green indicators
- **Invalid**: Red indicators
- **Calculating**: Blue pulse
- **Precise**: Monospace formatting
- **Approximate**: Italic text

## Design Philosophy

### Mathematical Clarity
- Monospace fonts for numbers
- Clear operation symbols
- Visual precision indicators
- Animated value changes

### User Experience
- Smooth transitions throughout
- Clear hover states
- Loading indicators
- Error feedback

### Visual Hierarchy
- Primary actions prominent
- Secondary elements subdued
- Clear grouping of related items
- Consistent spacing system

### Professional Appearance
- Subtle shadows and borders
- Muted color palette
- Clean typography
- Polished interactions

## Performance Considerations
- GPU-accelerated animations
- Efficient selectors
- Minimal reflows
- Optimized transitions