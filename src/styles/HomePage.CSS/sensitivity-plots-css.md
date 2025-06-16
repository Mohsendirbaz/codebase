# sensitivity-plots-css.css Documentation

## Overview

The sensitivity-plots-css.css file provides styling for a sensitivity analysis visualization component. This stylesheet implements a tabbed interface for parameter selection, information display panels, and theme-aware styling. The design focuses on data visualization with clear information hierarchy and responsive layouts.

## Architectural Structure

### 1. **Container and Variable System**

#### Main Container
```css
.sensitivity-plots-container
```
- **CSS Custom Properties Definition**:
  - Local scoping of theme variables
  - Fallback values for each property
  - Complete color system definition
  - Enables runtime theme switching
- **Layout Properties**:
  - Full-width and height utilization
  - Column-based flex layout
  - Hidden overflow for controlled scrolling

#### Variable Definitions
- **Color Variables**:
  - `--primary-color`: Main interactive color
  - `--secondary-color`: Accent color
  - `--border-color`: Consistent borders
  - `--text-color`: Primary text
  - `--background-color`: Base backgrounds
  - `--hover-color`: Interactive states
  - `--shadow-color`: Shadow effects

### 2. **Header Section Architecture**

#### Header Container
```css
.sensitivity-header
```
- **Design Features**:
  - Sticky positioning for persistent navigation
  - Sidebar color background for distinction
  - Bottom border for visual separation
  - High z-index (20) for layering
  - Fixed padding for consistent spacing

#### Header Title
```css
.sensitivity-header h2
```
- **Typography**:
  - Large font size (1.5rem) for prominence
  - No top margin, controlled bottom margin
  - Theme-aware text color
  - Clear hierarchy establishment

### 3. **Tab Navigation System**

#### Tab Container
```css
.parameter-tabs
```
- **Layout Implementation**:
  - Flexbox with wrap capability
  - Minimal gap (4px) for tight grouping
  - Bottom margin for separation from content

#### Individual Tabs
```css
.parameter-tab
.parameter-tab.active
.parameter-tab:hover:not(.active)
```
- **Tab Design Pattern**:
  - Rounded corners for modern appearance
  - Border-based definition
  - State-based styling:
    - Default: Light background
    - Active: Primary color with white text
    - Hover: Subtle background change
  - Font weight change for active state
  - Smooth transitions for all states

### 4. **Content Area Structure**

#### Content Container
```css
.sensitivity-content
```
- **Flexible Layout**:
  - Flex: 1 for remaining space utilization
  - Column direction for vertical stacking
  - Hidden overflow for controlled scrolling

#### Parameter Information Panel
```css
.parameter-info
.parameter-info h3
```
- **Information Display**:
  - Dedicated background color
  - Clear bottom border
  - Consistent padding
  - Sub-header with controlled margins

#### Parameter Details
```css
.parameter-details
.parameter-details p
```
- **Detail Layout**:
  - Flexible wrapping for responsive display
  - Gap-based spacing between items
  - Smaller font size for secondary info
  - No margins on paragraphs

### 5. **State Indicators**

#### Error States
```css
.parameter-error
```
- **Error Visualization**:
  - Red color (#e74c3c) with !important flag
  - High visibility for critical information

#### Loading and Empty States
```css
.sensitivity-loading
.sensitivity-error
.sensitivity-empty
.no-analysis-data
```
- **Consistent State Display**:
  - Centered content alignment
  - Fixed height (200px) for consistency
  - Generous padding (32px)
  - Italic text for differentiation
  - Theme-aware text colors

### 6. **Visualization Components**

#### Plots Wrapper
```css
.plots-wrapper
```
- **Container Properties**:
  - Flex: 1 for space filling
  - Hidden overflow for scroll control
  - Container for plot visualizations

#### Relationship Diagram
```css
.relationship-diagram
.relationship-title
```
- **Diagram Styling**:
  - Card-like appearance with border
  - Rounded corners (8px)
  - Background differentiation
  - Internal padding and margins
  - Title with specific sizing

### 7. **Theme System Implementation**

#### Dark Theme
```css
.dark-theme .sensitivity-plots-container
```
- **Dark Mode Adaptations**:
  - Darker primary color (#4d7ea8)
  - Adjusted secondary color (#689f38)
  - Dark borders (#444)
  - Light text (#eee)
  - Dark backgrounds (#222)
  - Modified hover state (#333)

#### Light Theme
```css
.light-theme .sensitivity-plots-container
```
- **Light Mode Standards**:
  - Bright primary color (#3a7ca5)
  - Vibrant secondary (#8bc34a)
  - Light borders (#ddd)
  - Dark text (#333)
  - White backgrounds
  - Light hover states (#f5f5f5)

#### Creative Theme
```css
.creative-theme .sensitivity-plots-container
```
- **Creative Theme Palette**:
  - Muted primary (#6a8eae)
  - Earthy secondary (#9ccc65)
  - Warm borders (#c4beb9)
  - Brown text (#594a3c)
  - Cream backgrounds (#f5f0e9)
  - Coordinated hover color (#ebe5dc)

### 8. **Responsive Design**

#### Mobile Breakpoint
```css
@media screen and (max-width: 768px)
```
- **Mobile Optimizations**:
  - Reduced tab padding (6px 10px)
  - Smaller font sizes throughout
  - Adjusted header sizes:
    - Main header: 1.3rem
    - Sub-headers: 1.1rem
  - Maintained functionality with compact design

## Visual Design Patterns

### Color Psychology
- **Primary Blue**: Trust, stability, analysis
- **Secondary Green**: Growth, positive outcomes
- **Error Red**: Attention, critical issues
- **Neutral Grays**: Information hierarchy

### Information Hierarchy
1. **Primary Level**: Header titles, active tabs
2. **Secondary Level**: Parameter information, tab labels
3. **Tertiary Level**: Details, metadata
4. **State Level**: Errors, loading, empty states

### Spacing System
- **Consistent Padding**: 16px standard, 32px for emphasis
- **Margins**: 8px between related items, 16px between sections
- **Gaps**: 4px minimal, 16px standard

### Border Strategy
- **Separation Borders**: 1px solid for clear divisions
- **Card Borders**: Rounded with consistent radius
- **Focus Borders**: Enhanced for accessibility

## Interactive Patterns

### Tab Navigation
- Visual feedback on hover
- Clear active state indication
- Smooth transitions between states
- Font weight changes for emphasis

### State Communication
- Loading states with centered messages
- Error states with red coloring
- Empty states with helpful text
- Consistent positioning and styling

### Theme Switching
- CSS variable overrides per theme
- Consistent color relationships
- Maintained contrast ratios
- Smooth theme transitions

## Performance Considerations

- Minimal DOM manipulation through CSS
- Efficient flexbox layouts
- CSS custom properties for runtime changes
- Media queries for responsive behavior
- Transition optimization

## Accessibility Features

### Color Contrast
- Sufficient ratios in all themes
- Error states with high visibility
- Active states clearly distinguished

### Keyboard Navigation
- Tab-based navigation support
- Focus states (inherited from browser)
- Logical tab order

### Screen Reader Support
- Semantic HTML structure assumed
- Clear text hierarchy
- State communication through text

## Use Cases

### Data Visualization
- Parameter analysis displays
- Sensitivity plot containers
- Relationship diagrams
- Multi-parameter comparisons

### User Workflows
1. Parameter selection via tabs
2. Information review in panels
3. Plot visualization in content area
4. Error/state handling

## Integration Notes

This stylesheet integrates with:
- JavaScript-driven tab switching
- Dynamic plot generation
- Data loading states
- Theme switching mechanisms
- Responsive framework compatibility