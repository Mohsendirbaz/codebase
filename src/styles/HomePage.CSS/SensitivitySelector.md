# SensitivitySelector.css Documentation

## Overview

The SensitivitySelector.css file implements styling for a modal dialog interface designed for sensitivity parameter configuration. This stylesheet showcases neumorphic design principles with sophisticated form controls, multi-mode selection, and comprehensive input styling. The component serves as a parameter configuration interface with various input modes and visualization options.

## Architectural Structure

### 1. **Modal Overlay System**

#### Overlay Container
```css
.sensitivity-overlay
```
- **Implementation Pattern**: Full-screen modal overlay
- **Design Features**:
  - Fixed positioning covering entire viewport
  - Semi-transparent black background (30% opacity)
  - Flexbox centering for dialog placement
  - High z-index (1000) for proper layering
  - Click-outside-to-close functionality support

### 2. **Dialog Container Architecture**

#### Main Dialog
```css
.sensitivity-dialog
```
- **Neumorphic Design Implementation**:
  - Multi-layer shadow system for depth
  - Rounded corners with large border radius
  - Theme-aware background colors
  - Maximum dimensions with viewport constraints (90vh max-height)
  - Smooth transitions for open/close animations

#### Dialog States
```css
.sensitivity-dialog.closing
```
- **Animation System**:
  - Opacity fade-out during close
  - Upward transform translation (-10px)
  - Coordinated timing with overlay

#### Inner Container
```css
.sensitivity-dialog-inner
```
- **Layout Management**:
  - Flexible column layout
  - Scrollable content area
  - Full width utilization
  - Flex-grow for dynamic height

### 3. **Header Design System**

#### Header Container
```css
.sensitivity-selector-header
```
- **Visual Hierarchy**:
  - Bottom border for section separation
  - Flexbox layout with space-between alignment
  - Consistent padding using spacing variables
  - Clear visual break from content

#### Title System
```css
.sensitivity-title
.parameter-key
.parameter-name
```
- **Multi-Level Information Display**:
  - Primary title with large font size
  - Secondary parameter key in gray
  - Tertiary parameter name in primary color
  - Italic styling for parameter names
  - Proper visual hierarchy through size and color

#### Close Button
```css
.close-button
```
- **Minimalist Design**:
  - Borderless, background-free design
  - Large clickable area (20px font)
  - Cursor pointer for interactivity
  - Standard close icon implementation

### 4. **Mode Selection Interface**

#### Mode Container
```css
.mode-selection
```
- **Layout Structure**:
  - Vertical flex column
  - Generous top margin for visual separation
  - Contains multiple selectable mode boxes

#### Mode Box Design
```css
.mode-box
.mode-box:hover
.mode-box.selected
```
- **Interactive Card Pattern**:
  - Neumorphic box design with shadows
  - Border-based visual definition
  - Hover state with elevation effect
  - Selected state with:
    - Inset shadow for pressed appearance
    - Primary color background tint
    - Border color change
  - Smooth transitions for all state changes

### 5. **Input System Architecture**

#### Points Grid
```css
.points-grid
.point-inputs
```
- **Grid Layout Implementation**:
  - Two-column grid for input pairs
  - Consistent gap spacing
  - Responsive to content

#### Value Input Fields
```css
.value-input
.value-input:focus
```
- **Neumorphic Input Design**:
  - Thick 3px border for emphasis
  - Inset shadow for depth effect
  - Bold, centered text
  - Focus states with:
    - Enhanced shadow depth
    - Border color intensification
    - Upward transform for tactile feedback
    - Focus ring with color spread

### 6. **Additional Settings Section**

#### Settings Container
```css
.additional-settings
.settings-row
```
- **Form Layout Pattern**:
  - Vertical stack with consistent gaps
  - Section-based organization
  - Clear visual grouping

#### Compare Section
```css
.compare-section
.compare-select
```
- **Specialized Select Styling**:
  - Success color theme (green borders)
  - Neumorphic styling matching inputs
  - Custom focus states with green shadow

#### Axis Selection
```css
.axis-section
.axis-radio
```
- **Radio Button Group**:
  - Border-enclosed options
  - Padding for touch targets
  - Rounded corners for consistency

#### Plot Selection
```css
.plot-section
.plot-checkbox
```
- **Checkbox Layout**:
  - Flexible layout with gaps
  - Border definition for each option
  - Aligned checkbox and label pairs

### 7. **Footer Action System**

#### Footer Container
```css
.sensitivity-footer
```
- **Button Layout**:
  - Vertical column layout
  - Centered alignment
  - Consistent gap spacing
  - Clear separation from content

#### Button Styling
```css
.reset-button
.cancel-button
.save-button
```
- **Action Button Design**:
  - Full-width buttons for mobile-friendliness
  - Color-coded by function:
    - Reset: Danger/red theme
    - Cancel: Neutral gray theme
    - Save: Success/green theme
  - Neumorphic shadow effects
  - Hover states with elevation
  - 2px borders for definition
  - Smooth transition effects

## Visual Design Patterns

### Neumorphic Design System
- **Shadow Layers**:
  - Light source simulation with dual shadows
  - `var(--shadow-dark)` and `var(--shadow-light)`
  - Inset shadows for pressed states
  - Elevation changes on interaction

### Color Theming
- **Semantic Color Variables**:
  - Primary: `var(--primary-color)` - Blue tones
  - Success: `var(--success-color)` - Green tones
  - Danger: `var(--danger-color)` - Red tones
  - Text variations for hierarchy
  - Background variations for depth

### Border System
- **Consistent Border Strategy**:
  - 2px borders for buttons and dialog
  - 3px borders for input emphasis
  - 1px borders for subtle separation
  - Border radius variables for consistency

### Spacing Architecture
- **Systematic Spacing**:
  - Small: 5px gaps
  - Medium: 10-15px spacing
  - Large: 20px margins
  - Consistent application throughout

## Interactive Patterns

### State Management
- **Visual State Indicators**:
  - Hover effects with transform
  - Selected states with background changes
  - Focus states with shadow rings
  - Disabled states (implicit in design)

### Transition Effects
- **Smooth Animations**:
  - 0.3s timing for most transitions
  - Ease timing function for natural motion
  - Transform-based animations for performance
  - Opacity transitions for modal states

### Form Interactions
- **Input Feedback**:
  - Clear focus indicators
  - Transform effects on focus
  - Color-coded input types
  - Visual grouping of related inputs

## Component-Specific Features

### Multi-Mode Selection
- Radio-button-like behavior with custom styling
- Visual feedback for selected mode
- Expandable content areas per mode

### Dynamic Input Grids
- Flexible grid system for value inputs
- Responsive column layout
- Consistent spacing between inputs

### Hierarchical Information Display
- Three-level title system
- Color and size-based hierarchy
- Clear parameter identification

## Accessibility Considerations

### Focus Management
- Clear focus indicators on all interactive elements
- Logical tab order through form elements
- High contrast focus states

### Color Contrast
- Sufficient contrast ratios for text
- Color not sole indicator of state
- Clear borders for element definition

### Interactive Areas
- Large click targets for touch devices
- Full-width buttons on mobile
- Adequate padding on all interactive elements

## Responsive Design

### Mobile Considerations
- Full-width buttons for easy tapping
- Scrollable dialog for small screens
- Maximum height constraints
- Flexible grid layouts

### Desktop Optimization
- Maximum width constraint (600px)
- Centered dialog presentation
- Optimal reading line length
- Balanced white space

## Performance Features

- CSS-only interactions reduce JavaScript dependency
- Transform-based animations for GPU acceleration
- Efficient selector usage
- Minimal layout thrashing through careful positioning

## Theme Integration

The stylesheet supports comprehensive theming through:
- CSS custom properties for all colors
- Fallback values for each variable
- Consistent semantic naming
- Easy theme switching capability
- Dark mode compatibility through variable system