# SensitivityMonitor.css Documentation

## Overview

The SensitivityMonitor.css file implements an extensive styling system for a complex sensitivity monitoring component. This sophisticated interface includes collapsible panels, parameter management, modal dialogs, and interactive controls with multiple visualization modes. The stylesheet demonstrates advanced CSS techniques including neumorphic design, complex state management, and comprehensive theming support.

## Architectural Structure

### 1. **Main Container and Layout System**

#### Primary Container
```css
.sensitivity-monitor-s
```
- **Design Philosophy**: Neumorphic design with sophisticated shadow effects
- **Layout Features**:
  - Fixed width (660px) with collapsible states
  - Smooth transitions for height, width, and opacity
  - Border-right for visual separation
  - Rounded corners with large border radius
  - Box-shadow for depth perception

#### Collapsed/Expanded States
```css
.sensitivity-monitor-s.collapsed
.sensitivity-monitor-s.expanded
```
- **State Management**:
  - Collapsed: 50px width with reduced opacity (0.8)
  - Expanded: Full 660px width with full opacity
  - Smooth transitions between states

### 2. **Header Architecture**

#### Header Container
```css
.monitor-header-s
.header-content
```
- **Layout Design**:
  - Flexbox with space-between alignment
  - Gradient background using CSS variables
  - Bottom border for section separation
  - Theme-aware text color

#### Collapse/Expand Controls
```css
.collapse-button
.expand-button
```
- **Interactive Elements**:
  - Transparent background for minimalist design
  - Absolute positioning for consistent placement
  - Scale transform on hover for feedback
  - Icon-based interface (18px font size)

#### Vertical Text Display
```css
.vertical-text
```
- **Unique Feature**:
  - Writing mode transformation for vertical orientation
  - 180-degree rotation for proper reading direction
  - Sticky positioning at top
  - Special handling in collapsed state

### 3. **Usage Indicator System**

```css
.usage-indicator
.usage-bar
.usage-fill
.usage-details
```
- **Visual Progress Indicator**:
  - Bar-based visualization of usage
  - Smooth width and color transitions
  - Detailed text information below
  - Flexible color system for different usage levels

### 4. **Toolbar and Controls**

#### Search and Filter Controls
```css
.monitor-toolbar-s
.search-input
.filter-select
```
- **Design Features**:
  - Flexbox layout with wrapping capability
  - Neumorphic input styling with shadows
  - Focus states with pressed shadow effects
  - Primary color border on focus

#### Action Buttons
```css
.reset-button
.refresh-button
.restart-button
```
- **Button System**:
  - Color-coded for different actions (danger, primary)
  - Ripple effect implementation for reset button
  - Disabled state handling
  - Hover state transformations

### 5. **Parameter List Architecture**

#### Container and List Structure
```css
.parameters-container-s
.parameters-list
.parameter-item-s
```
- **List Design**:
  - Scrollable container with rounded borders
  - Individual parameter items with hover states
  - Border separation between items
  - Enabled state highlighting

#### Parameter Information Display
```css
.parameter-header-s
.parameter-info-s
.parameter-key
.parameter-name
```
- **Information Hierarchy**:
  - Two-level text display (key and name)
  - Font weight differentiation
  - Color coding for primary/secondary information

### 6. **Toggle Switch Implementation**

```css
.toggle-label
.toggle-checkbox
.toggle-slider
```
- **Custom Toggle Design**:
  - Hidden checkbox with visual slider
  - Smooth sliding animation
  - Color change on checked state
  - Focus-visible outline for accessibility
  - Responsive width adjustments

### 7. **Parameter Summary Display**

```css
.parameter-summary-s
.parameter-mode
.parameter-values
.parameter-comparison
.parameter-plots
```
- **Summary Information**:
  - Background differentiation for summary sections
  - Mode-specific color coding
  - Values display with monospace font
  - Label/value pair formatting

### 8. **Mode-Specific Color System**

#### Color Classes for Different Modes
```css
.value.mode-range
.value.mode-discrete
.value.mode-percentage
.value.mode-montecarlo
.value.mode-directvalue
.value.mode-absolutedeparture
```
- **Color Assignments**:
  - Range: Blue (#2196f3)
  - Discrete: Purple (#9c27b0)
  - Percentage: Orange (#ff9800)
  - Monte Carlo: Green (#4caf50)
  - Direct Value: Blue (#2196f3)
  - Absolute Departure: Purple (#9c27b0)

### 9. **Modal Dialog System**

#### Modal Container
```css
.parameter-modal
.modal-content
```
- **Modal Implementation**:
  - Fixed positioning with full viewport coverage
  - Semi-transparent backdrop
  - Centered content with max-width constraint
  - Neumorphic shadow effects

#### Modal Sections
```css
.modal-header
.modal-body
.modal-footer
```
- **Section Design**:
  - Header with gradient background
  - Scrollable body with max-height
  - Footer with action buttons
  - Clear visual separation between sections

### 10. **Form Controls**

#### Input Fields
```css
.form-control
.value-input
```
- **Input Styling**:
  - Neumorphic design with inset shadows
  - Mode-specific border colors
  - Focus states with shadow expansion
  - Transform effects on focus

#### Value Management
```css
.values-container
.values-list
.value-item
.remove-value-button
.add-value-button
```
- **List Management UI**:
  - Container with background differentiation
  - Individual value items with remove buttons
  - Circular remove buttons with danger color
  - Success-colored add button

### 11. **Plot Controls and Indicators**

#### Plot Selection
```css
.plot-controls
.plot-checkbox-group
```
- **Checkbox Group Design**:
  - Wrapped flexbox layout
  - Grouped toggle controls
  - Background container for visual grouping

#### Plot Visualization
```css
.plot-indicators
.plot-item
.plot-box
.plot-label
```
- **Visual Indicators**:
  - Color-coded plot type boxes
  - Specific colors for waterfall, bar, and point plots
  - Compact display with labels

### 12. **Loading and Empty States**

```css
.loading-indicator
.empty-state
```
- **State Communication**:
  - Centered text display
  - Italic styling for differentiation
  - Secondary text color
  - Consistent padding

### 13. **Responsive Design Implementation**

```css
@media (max-width: 520px)
```
- **Mobile Adaptations**:
  - Column-based toolbar layout
  - Full-width inputs and selects
  - Adjusted parameter header layout
  - Responsive toggle positioning

## Visual Design Patterns

### Neumorphic Design System
- **Shadow Effects**:
  - Multiple shadow layers for depth
  - Pressed states with inset shadows
  - Variable shadow intensity
- **Background Colors**:
  - Subtle gradients for surfaces
  - Theme-aware color variables

### Color Coding System
- **Functional Colors**:
  - Primary: Interactive elements
  - Success: Positive actions
  - Danger: Destructive actions
  - Warning: Caution states
- **Mode-Specific Colors**:
  - Consistent color assignment for data modes
  - High contrast for visibility

### Transition System
- **Animation Timing**:
  - Fast: UI feedback (buttons, hovers)
  - Medium: State changes (expand/collapse)
  - Smooth easing functions throughout

### Typography Hierarchy
- **Size Scale**:
  - Large: Headers and titles
  - Medium: Primary content
  - Small: Secondary information
- **Weight Scale**:
  - 600: Important headings
  - 500: Emphasis
  - Normal: Body text

## Interactive Features

### State Management
- Collapsed/expanded panel states
- Toggle switch interactions
- Modal open/close states
- Button active/disabled states

### User Feedback
- Hover effects on all interactive elements
- Focus indicators for keyboard navigation
- Ripple effects on specific buttons
- Transform-based feedback

### Data Visualization
- Progress bars for usage indication
- Color-coded parameter modes
- Plot type indicators
- Visual parameter summaries

## Performance Optimizations

- Transform-based animations for GPU acceleration
- Efficient selector usage
- Minimal reflows through careful positioning
- CSS-only interactions where possible
- Optimized transition properties

## Accessibility Considerations

- Focus-visible pseudo-class for keyboard users
- Sufficient color contrast ratios
- Clear state indicators
- Proper ARIA-compatible structure
- Responsive design for various devices

## Theme Integration

The stylesheet fully supports theming through:
- CSS custom properties for all colors
- Consistent use of semantic color variables
- Easy switching between light/dark modes
- Customizable spacing and sizing variables

## Advanced CSS Techniques

### Pseudo-Element Usage
- ::before and ::after for decorative elements
- Ripple effect implementation
- Toggle slider creation

### Complex Selectors
- State-based styling with class combinations
- Descendant selectors for contextual styling
- Pseudo-class chaining for specific states

### Layout Techniques
- Flexbox for component layouts
- Grid for complex arrangements
- Absolute positioning for overlays
- Sticky positioning for headers