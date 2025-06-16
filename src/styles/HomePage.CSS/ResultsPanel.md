# ResultsPanel.css Documentation

## Overview
The ResultsPanel.css stylesheet defines a sophisticated data presentation component featuring a fixed-header table with sticky columns, interactive cell inspection, and responsive design. This component excels at displaying tabular results with advanced interaction patterns and detailed data exploration capabilities.

## Architectural Structure

### 1. Container Architecture

#### Main Panel Layout
```css
.results-panel {
  display: flex;
  flex-direction: column;
  gap: var(--model-spacing-md);
  height: 100%;
  min-height: 400px;
  max-width: none;
}
```

**Design Principles:**
- **Flexible Layout**: Column-based with consistent spacing
- **Height Management**: Full height with minimum constraint
- **Width Freedom**: No maximum width restriction

### 2. Header Component System

#### Header Structure
```css
.results-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--model-spacing-sm);
  border-bottom: 1px solid var(--model-color-border);
}
```

**Components:**
- **Title Section**: Left-aligned heading
- **Actions Section**: Right-aligned controls
- **Visual Separator**: Bottom border delineation

#### Action Buttons
```css
.action-button-rs {
  padding: var(--model-spacing-sm) var(--model-spacing-md);
  background: var(--model-color-primary);
  color: white;
  border: none;
  border-radius: var(--model-border-radius-sm);
  transition: background var(--model-transition-fast) ease;
}
```
- **Primary Styling**: Uses primary color scheme
- **Smooth Interactions**: Fast background transitions
- **Hover Enhancement**: Darker shade on hover

### 3. Advanced Table Architecture

#### Table Container System
```css
.results-panel__content {
  flex: 1;
  border: 1px solid var(--model-color-border);
  border-radius: var(--model-border-radius-md);
}
```
- **Flexible Growth**: Expands to fill available space
- **Visual Boundary**: Border with rounded corners

#### Fixed Layout Table
```css
.results-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: var(--model-font-size-sm);
}
```
- **Performance**: Fixed layout for consistent rendering
- **Border Model**: Collapsed for clean lines
- **Typography**: Small font size for data density

### 4. Sticky Header Implementation

#### Header Positioning
```css
.table-header {
  position: sticky;
  top: 0;
  background: var(--model-color-background);
  padding: var(--model-spacing-sm) var(--model-spacing-md);
  text-align: left;
  font-weight: 500;
  border-bottom: 2px solid var(--model-color-border);
  z-index: 1;
}
```

**Sticky Behavior:**
- **Vertical Sticky**: Remains at top during scroll
- **Background Fill**: Prevents content show-through
- **Z-index Layering**: Above regular cells

#### Corner Cell Special Handling
```css
.table-header.year {
  left: 0;
  z-index: 2;
}
```
- **Dual Sticky**: Both horizontal and vertical
- **Higher Z-index**: Above other headers

### 5. Cell Styling System

#### Base Cell Design
```css
.table-cell {
  padding: var(--model-spacing-sm) var(--model-spacing-md);
  border-bottom: 1px solid var(--model-color-border);
}
```

#### Sticky Year Column
```css
.table-cell.year {
  position: sticky;
  left: 0;
  background: var(--model-color-background);
  font-weight: 500;
  z-index: 1;
}
```
- **Horizontal Sticky**: Fixed during horizontal scroll
- **Visual Emphasis**: Bold font weight
- **Background Fill**: Maintains readability

#### Interactive Cells
```css
.table-cell.trackable {
  position: relative;
  cursor: pointer;
  transition: background var(--model-transition-fast) ease;
}

.table-cell.trackable:hover {
  background: var(--model-color-background-hover);
}
```
- **Hover Feedback**: Background color change
- **Cursor Indication**: Pointer for interactivity
- **Smooth Transition**: Fast color animation

### 6. Cell Inspector Overlay

#### Inspector Container
```css
.cell-inspector {
  position: fixed;
  z-index: 1000;
  min-width: 300px;
  max-width: 400px;
  background: var(--model-color-background);
  border-radius: var(--model-border-radius-md);
  box-shadow: var(--model-shadow-lg);
  animation: fadeIn var(--model-transition-fast) ease;
}
```

**Design Features:**
- **Fixed Positioning**: Floats above content
- **Size Constraints**: Min/max width for readability
- **Elevation**: Large shadow for depth
- **Entry Animation**: Fade-in effect

#### Inspector Structure
1. **Header Section**
   - Title and close button
   - Border separation
   
2. **Content Section**
   - Summary information
   - Source data list
   
3. **Footer Section**
   - Action buttons
   - Border separation

#### Source List Display
```css
.sources-list {
  display: flex;
  flex-direction: column;
  gap: var(--model-spacing-sm);
  max-height: 200px;
  overflow-y: auto;
}
```
- **Scrollable**: Height constraint with scroll
- **Item Separation**: Consistent gap spacing
- **Vertical Layout**: Column-based display

### 7. Dark Mode Support

#### Background Adaptations
```css
@media (prefers-color-scheme: dark) {
  .table-header,
  .table-cell.year {
    background: var(--model-color-background-dark);
  }
  
  .cell-inspector {
    background: var(--model-color-background-dark);
  }
}
```
- **Sticky Elements**: Dark backgrounds maintained
- **Inspector**: Consistent theming
- **Contrast Preservation**: Readability in dark mode

### 8. Animation Definitions

#### Fade In Animation
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```
- **Simple Opacity**: Smooth appearance
- **Quick Duration**: Matches transition speed

### 9. Accessibility Features

#### Focus Management
```css
.table-cell.trackable:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--model-color-primary);
}
```
- **Custom Focus**: Inset box shadow
- **High Visibility**: Primary color indication
- **No Outline**: Replaced with box shadow

#### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .cell-inspector {
    animation: none;
  }
}
```
- **Animation Removal**: Instant appearance
- **Respects Preferences**: User motion settings

### 10. Responsive Design

#### Mobile Adaptations (≤768px)
```css
@media (max-width: 768px) {
  .results-panel__header {
    flex-direction: column;
    gap: var(--model-spacing-sm);
    align-items: stretch;
  }
  
  .cell-inspector {
    position: fixed;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%);
    width: 90%;
  }
}
```

**Mobile Optimizations:**
- **Header Stacking**: Vertical layout
- **Inspector Centering**: Modal-style positioning
- **Width Adjustment**: 90% viewport width

## Design Patterns

### Layering System
- **Z-index 0**: Regular cells
- **Z-index 1**: Sticky headers and columns
- **Z-index 2**: Corner cell (dual sticky)
- **Z-index 1000**: Inspector overlay

### Color Architecture
- **Backgrounds**: Theme-aware with dark mode
- **Borders**: Consistent color variables
- **Interactive States**: Hover and focus colors
- **Status Colors**: Primary, success, danger

### Spacing Consistency
- **Cell Padding**: Uniform spacing
- **Gap Spacing**: Consistent flex gaps
- **Border Widths**: 1px standard, 2px emphasis

## Performance Optimizations

1. **Fixed Table Layout**: Predictable rendering
2. **CSS Containment**: Implicit with sticky positioning
3. **Transform Animations**: GPU acceleration
4. **Minimal Repaints**: Strategic property changes

## Integration Requirements

### Required CSS Variables
- `--model-color-*`: Complete color system
- `--model-spacing-*`: Spacing scale
- `--model-border-radius-*`: Border radius scale
- `--model-shadow-*`: Shadow definitions
- `--model-transition-*`: Animation timings

### Expected Functionality
- Dynamic cell content population
- Inspector positioning calculation
- Scroll event handling for sticky headers
- Click event management for cells

## Best Practices

1. **Maintain Sticky Performance**: Minimize sticky element count
2. **Optimize Table Rendering**: Use fixed layout for large datasets
3. **Manage Z-index Carefully**: Avoid conflicts with other components
4. **Test Scroll Performance**: Verify smooth scrolling with data
5. **Ensure Touch Targets**: Adequate cell padding for mobile
6. **Preserve Accessibility**: Keyboard navigation support
7. **Handle Edge Cases**: Empty states, long content, many columns