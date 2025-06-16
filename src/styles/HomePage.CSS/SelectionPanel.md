# SelectionPanel.css Documentation

## Overview

The SelectionPanel.css file implements a comprehensive styling system for a version selection interface. This stylesheet creates a sophisticated panel component with search functionality, bulk selection controls, and an interactive list of selectable items with tag-based selection display.

## Architectural Structure

### 1. **Container Layout System**

#### Main Panel Container
```css
.selection-panel
```
- **Layout Strategy**: Vertical flex container with consistent gap spacing
- **Height Management**: 
  - Full height utilization (`height: 100%`)
  - Minimum height constraint (`min-height: 400px`)
  - Ensures panel maintains usable size
- **Spacing**: Uses model-specific spacing variable `--model-spacing-md`

### 2. **Header Component Architecture**

#### Header Container
```css
.selection-panel__header
```
- **Structure**: Column-based flex layout
- **Purpose**: Houses search and control elements
- **Gap Management**: Small spacing between child elements

#### Search Implementation
```css
.selection-panel__search
.search-input
```
- **Design Features**:
  - Full-width search with icon accommodation
  - Left padding calculation for search icon space
  - Multi-layer border and shadow system
  - Sophisticated focus states with color transitions
  - Primary color highlight ring on focus

#### Control Button System
```css
.selection-panel__controls
.control-button
```
- **Button Design**:
  - Consistent padding and border radius
  - Hover states with background transitions
  - Disabled state handling with reduced opacity
  - Cursor management for user feedback

### 3. **Summary Information Display**

```css
.selection-panel__summary
.summary-text
.filter-text
```
- **Layout Pattern**: Space-between flexbox for edge alignment
- **Typography**: 
  - Small font size for secondary information
  - Font weight differentiation (500 for summary, italic for filters)
  - Light text color for de-emphasis

### 4. **Version List Architecture**

#### List Container
```css
.selection-panel__list
.version-list
```
- **Scrolling Behavior**: 
  - Vertical overflow with flex-based height
  - Border-enclosed scrollable area
  - Alternative background for visual separation

#### Version Item Styling
```css
.version-item
.version-item.selected
```
- **Interactive Design**:
  - Padding-based hit areas
  - Hover background transitions
  - Selected state with primary color background
  - Smooth transition effects

#### Checkbox and Label System
```css
.version-item__label
.version-item__checkbox
.version-item__text
```
- **Component Structure**:
  - Flex-based label layout with gap spacing
  - Custom checkbox dimensions (18x18px)
  - Border-based checkbox styling
  - Cursor pointer for entire label area

### 5. **Empty State Handling**

```css
.version-list__empty
```
- **User Experience Design**:
  - Centered content with fixed height
  - Italic text for differentiation
  - Light color for reduced emphasis
  - Clear messaging for empty states

### 6. **Footer and Selected Items Display**

#### Footer Container
```css
.selection-panel__footer
```
- **Visual Separation**: Top border for clear delineation
- **Spacing**: Generous top padding for breathing room

#### Selected Version Tags
```css
.selected-versions__tags
.version-tag
.version-tag__remove
```
- **Tag Design Pattern**:
  - Flex-wrap for responsive tag layout
  - Individual tags with remove buttons
  - Primary color background with hover states
  - Smooth transitions for all interactions
  - Remove button with opacity-based hover feedback

### 7. **Dark Mode Support**

```css
@media (prefers-color-scheme: dark)
```
- **Comprehensive Theme Adaptation**:
  - Background color inversions
  - Border color adjustments
  - Selected state color modifications
  - Maintains contrast ratios in dark environments

### 8. **Accessibility Features**

#### Focus Management
```css
.version-item__checkbox:focus-visible
.control-button:focus-visible
```
- **Keyboard Navigation**:
  - Clear focus indicators with primary color
  - Box-shadow based focus rings
  - No outline removal, replaced with better visuals

#### Motion Preferences
```css
@media (prefers-reduced-motion: reduce)
```
- **Animation Control**:
  - Removes all transitions for users with motion sensitivity
  - Maintains functionality without animation

### 9. **Responsive Design Implementation**

```css
@media (max-width: 768px)
```
- **Mobile Adaptations**:
  - Header layout switches to column
  - Control buttons become full-width
  - Equal flex distribution for buttons
  - Increased padding for touch targets

## Visual Design Patterns

### Color System
- **Primary Colors**: 
  - Interactive elements: `var(--model-color-primary)`
  - Light variants: `var(--model-color-primary-light)`
  - Dark variants: `var(--model-color-primary-dark)`
- **Text Colors**:
  - Primary text: `var(--model-color-text)`
  - Secondary text: `var(--model-color-text-light)`
- **Background Colors**:
  - Main background: `var(--model-color-background)`
  - Alternative background: `var(--model-color-background-alt)`
  - Hover states: `var(--model-color-background-hover)`

### Border and Shadow System
- **Borders**: Consistent use of `var(--model-color-border)`
- **Border Radius**: 
  - Small: `var(--model-border-radius-sm)`
  - Medium: `var(--model-border-radius-md)`
- **Focus Shadows**: Multi-layer shadow system for depth

### Spacing Architecture
- **Systematic Spacing**:
  - Extra small: `var(--model-spacing-xs)`
  - Small: `var(--model-spacing-sm)`
  - Medium: `var(--model-spacing-md)`
  - Large: `var(--model-spacing-lg)`

### Typography Scale
- **Font Sizes**:
  - Small: `var(--model-font-size-sm)`
  - Medium: `var(--model-font-size-md)`
  - Large: `var(--model-font-size-lg)`

## Component Interaction Patterns

### Selection Behavior
- Visual feedback for hover states
- Clear selected state indication
- Multi-select capability with checkboxes
- Tag-based selection summary

### Search Functionality
- Real-time search with visual feedback
- Focus states for active searching
- Placeholder text for guidance

### Bulk Operations
- Select/Deselect all functionality
- Clear visual state for disabled buttons
- Consistent button styling across operations

## Performance Optimizations

- CSS-only hover and focus states
- Efficient flexbox layouts
- Minimal DOM manipulation through CSS
- Hardware-accelerated transitions
- Optimized reflow through transform properties

## Theme Integration

The stylesheet is built with complete theme awareness:
- CSS custom properties for all colors
- Media query based dark mode support
- Consistent design tokens
- Easy theme switching capability

## User Experience Enhancements

### Visual Hierarchy
- Clear primary, secondary, and tertiary information levels
- Consistent spacing creates visual rhythm
- Color coding for different states

### Feedback Mechanisms
- Immediate hover feedback
- Clear selection states
- Smooth transitions for all interactions
- Disabled state communication

### Touch-Friendly Design
- Adequate tap targets for mobile
- Increased padding in responsive mode
- Full-width elements on small screens