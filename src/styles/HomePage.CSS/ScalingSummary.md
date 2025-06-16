# ScalingSummary.css Documentation

## Overview

The ScalingSummary.css file provides comprehensive styling for a scaling summary component that displays tabular data with advanced filtering, searching, and expandable row features. This stylesheet implements a sophisticated data visualization interface with responsive design patterns and interactive elements.

## Architectural Structure

### 1. **Container and Layout System**

#### Main Container
```css
.scaling-summary
```
- **Purpose**: Primary container for the entire scaling summary component
- **Design Pattern**: Card-based layout with neumorphic design principles
- **Key Features**:
  - Dynamic background using CSS variables for theme support
  - Rounded corners with `border-radius: var(--spacing-xl)`
  - Subtle elevation with box-shadow
  - Responsive padding and margin

### 2. **Header Architecture**

#### Header Container
```css
.scaling-summary-header-container
```
- **Layout**: Flexbox-based responsive header
- **Design Approach**: 
  - Space-between alignment for optimal content distribution
  - Wrap capability for mobile responsiveness
  - Flexible gap spacing

#### Title Styling
```css
.scaling-summary-title
```
- **Typography**: 1.25rem font size for clear hierarchy
- **Weight**: 600 for emphasis without being overly bold
- **Color**: Theme-aware text color variable

### 3. **Filtering and Search System**

#### Filter Architecture
```css
.scaling-summary-filters
.scaling-summary-filter-group
.scaling-filter-label
```
- **Design Pattern**: Grouped filter controls with visual feedback
- **Interactive Elements**:
  - Hover states with background color transitions
  - Checkbox integration with custom styling
  - Label elements with cursor pointer for better UX

#### Search Implementation
```css
.scaling-summary-search
.scaling-summary-search-input
```
- **Features**:
  - Full-width responsive search input
  - Focus states with primary color border
  - Custom shadow effects for depth perception
  - Smooth transitions for all state changes

### 4. **Table Structure and Styling**

#### Table Layout
```css
.scaling-summary-table
```
- **Design Choices**:
  - Separate border-spacing for clean cell separation
  - Full width utilization
  - Proper margin spacing

#### Header Row Styling
```css
.scaling-summary thead tr
.scaling-summary th
```
- **Visual Design**:
  - Sticky positioning for header persistence during scroll
  - Dark background for contrast (`--model-color-background-dark`)
  - Z-index management for proper layering
  - White text on dark background for readability

#### Data Cell Styling
```css
.scaling-summary td
```
- **Layout Features**:
  - Consistent padding across cells
  - Border-bottom for row separation
  - Transition effects for interactive states
  - Text alignment utilities (`.text-center`, `.text-right`)

### 5. **Interactive Row Features**

#### Hover and Selection States
```css
.scaling-summary tbody tr:hover
.scaling-summary-row-expanded
```
- **Interaction Design**:
  - Subtle background color change on hover
  - Cursor pointer indication
  - Smooth transitions for state changes
  - Expanded state with persistent background

### 6. **Specialized Cell Types**

#### VR (Version/Release) Cell
```css
.scaling-summary-vr-cell
.summary-vr-checkbox
.summary-vr-label
```
- **Component Structure**:
  - Vertical flex layout for stacked content
  - Custom checkbox styling with labels
  - Color-coded labels with background highlights
  - Compact spacing for efficiency

#### Steps Cell
```css
.scaling-summary-steps-cell
.scaling-summary-steps
.scaling-summary-steps-list
```
- **Complex Layout**:
  - Nested structure for detailed step information
  - Grid-based step item layout
  - Header styling for step columns
  - Expression input fields with focus states

### 7. **Footer and Summary Information**

```css
.scaling-summary-footer
.scaling-summary-footer-item
```
- **Design Purpose**:
  - Summary statistics and metadata display
  - Clear visual separation with border-top
  - Flexible column layout
  - Secondary text styling for less emphasis

### 8. **Empty State Handling**

```css
.scaling-summary-no-results
.scaling-summary-no-results-cell
```
- **User Experience**:
  - Clear messaging for empty data states
  - Centered text with italic styling
  - Subtle background differentiation
  - Generous padding for visual breathing room

### 9. **Responsive Design Implementation**

#### Mobile Breakpoint (768px)
```css
@media (max-width: 768px)
```
- **Adaptations**:
  - Header container switches to column layout
  - Filters become full-width with vertical stacking
  - Reduced font sizes for space efficiency
  - Adjusted padding for mobile screens
  - Grid template modifications for step displays

## Visual Design Patterns

### Color Scheme
- **Primary Color**: Used through `var(--primary-color)` for interactive elements
- **Background Variations**: 
  - Card backgrounds: `var(--card-background)`
  - App backgrounds: `var(--app-background)`
  - Model-specific dark backgrounds
- **Border Colors**: Consistent use of `var(--border-color)`
- **Text Hierarchy**: Primary and secondary text colors

### Spacing System
- **Variables Used**:
  - `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`
  - Consistent application across components
  - Responsive adjustments for mobile

### Interactive Feedback
- **Transitions**: Smooth 0.2s-0.3s ease transitions
- **Hover States**: Background color changes with rgba overlays
- **Focus States**: Box-shadow effects with color rings
- **Active States**: Transform effects for tactile feedback

## Component-Specific Features

### Expression Input Fields
- Custom styling for mathematical expression inputs
- Focus states with primary color highlights
- Monospace font considerations for code/formulas

### Plot Integration
- Color-coded plot indicators
- Visual badges for different plot types
- Checkbox controls for plot visibility

### Data Visualization
- Result highlighting with primary color
- Mode-specific coloring for different data types
- Progressive disclosure through expandable rows

## Performance Considerations

- Efficient use of CSS transforms for animations
- Minimal repaints through transform-based transitions
- Sticky positioning for header without JavaScript
- CSS Grid for complex layouts reducing DOM complexity

## Theme Support

The stylesheet is built with comprehensive theme support through CSS custom properties, allowing for:
- Dark/light mode switching
- Custom color schemes
- Variable spacing systems
- Consistent design tokens across themes

## Accessibility Features

- Proper focus indicators for keyboard navigation
- Sufficient color contrast ratios
- Interactive elements with appropriate cursor states
- Clear visual hierarchy for screen readers