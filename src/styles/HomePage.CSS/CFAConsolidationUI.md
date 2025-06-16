# CFAConsolidationUI.css - CFA Consolidation Interface Styles

## Overview

`CFAConsolidationUI.css` provides the styling for the Cash Flow Analysis (CFA) Consolidation interface. It implements a two-column grid layout with comprehensive styling for selection panels, processing indicators, and results display.

## Architecture

### Layout Structure
- **Grid-based Layout**: Two-column design with auto-sizing left panel
- **CSS Variables**: Leverages model-specific CSS variables for theming
- **Responsive Components**: Flexible containers that adapt to content
- **Visual Hierarchy**: Clear separation between functional areas

## Core Layout

### Main Container
```css
.cfa-consolidation {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--model-spacing-lg);
  padding: var(--model-spacing-lg);
  background: var(--model-color-background);
  border-radius: var(--model-border-radius-lg);
  box-shadow: var(--model-shadow-md);
  height: 100%;
  overflow: visible;
}
```

**Features**:
- Auto-sizing left column for selection panel
- Flexible right column for results
- Consistent spacing using CSS variables
- Full height utilization

### Column Layout

#### Left Column
```css
.cfa-consolidation__left {
  padding-right: var(--model-spacing-md);
  border-right: 1px solid var(--model-color-border);
  min-width: 300px;
}
```

#### Right Column
```css
.cfa-consolidation__right {
  display: flex;
  flex-direction: column;
  gap: var(--model-spacing-md);
  padding-left: var(--model-spacing-md);
  height: auto;
}
```

## Component Styles

### Results Section
```css
.results-section {
  display: flex;
  flex-direction: column;
  margin-top: var(--model-spacing-md);
  padding: var(--model-spacing-md);
  border: 1px solid var(--model-color-border);
  border-radius: var(--model-border-radius-md);
  background: var(--model-color-background);
}
```

### Results Placeholder
```css
.results-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--model-spacing-lg);
  color: var(--model-color-text);
  font-size: var(--model-font-size-md);
  background: var(--model-color-background-alt);
  border-radius: var(--model-border-radius-md);
  border: 1px dashed var(--model-color-border);
  min-height: 200px;
}
```

**Usage**: Shown when no results are available

### Panel Containers
```css
.results-panel,
.individual-results-panel {
  display: flex;
  flex-direction: column;
  gap: var(--model-spacing-md);
  padding: var(--model-spacing-md);
  background: var(--model-color-background);
  border-radius: var(--model-border-radius-md);
  box-shadow: var(--model-shadow-sm);
  height: auto;
}
```

## Selection Panel Styles

### Header Section
```css
.selection-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--model-spacing-sm);
  border-bottom: 1px solid var(--model-color-border);
}
```

### Search Area
```css
.selection-panel__search {
  flex: 1;
  margin-right: var(--model-spacing-md);
}
```

### Control Buttons
```css
.selection-panel__controls {
  display: flex;
  gap: var(--model-spacing-sm);
}
```

### List Container
```css
.selection-panel__list {
  flex: 1;
  overflow-y: auto;
  padding: var(--model-spacing-sm);
  background: var(--model-color-background-alt);
  border-radius: var(--model-border-radius-sm);
}
```

## Processing Panel

### Base Styles
```css
.processing-panel {
  display: flex;
  flex-direction: column;
  gap: var(--model-spacing-md);
  padding: var(--model-spacing-md);
}
```

**Note**: The file appears to be truncated. Additional processing panel styles likely include:
- Progress indicators
- Status messages
- Processing animations
- Control buttons

## CSS Variables Used

### Spacing Variables
- `--model-spacing-sm`: Small spacing
- `--model-spacing-md`: Medium spacing  
- `--model-spacing-lg`: Large spacing

### Color Variables
- `--model-color-background`: Primary background
- `--model-color-background-alt`: Alternative background
- `--model-color-border`: Border color
- `--model-color-text`: Text color

### Style Variables
- `--model-border-radius-sm`: Small radius
- `--model-border-radius-md`: Medium radius
- `--model-border-radius-lg`: Large radius
- `--model-shadow-sm`: Small shadow
- `--model-shadow-md`: Medium shadow

### Typography Variables
- `--model-font-size-md`: Medium font size

## Design Patterns

### 1. Consistent Spacing
All spacing uses CSS variables for consistency across the interface

### 2. Visual Hierarchy
- Clear separation between panels
- Subtle shadows for depth
- Border usage for delineation

### 3. Flexibility
- Auto-sizing columns
- Flexible height containers
- Scrollable content areas

### 4. Accessibility
- Clear visual boundaries
- Sufficient contrast ratios
- Logical content flow

## Responsive Considerations

### Minimum Widths
- Left column: 300px minimum
- Ensures usability on smaller screens

### Overflow Handling
- Vertical scrolling for lists
- Visible overflow for main container

### Flexible Layouts
- Grid and flexbox for responsive behavior
- Auto-sizing based on content

## Integration

This stylesheet is designed to work with:
- `CFAConsolidationUI.js` component
- `SelectionPanel.js` component
- `ProcessingPanel.js` component
- `ResultsPanel.js` component
- `IndividualResultsPanel.js` component

## Best Practices

1. **Use CSS Variables**: Always use defined variables for consistency
2. **Maintain Hierarchy**: Respect the visual hierarchy established
3. **Test Overflow**: Ensure content handles overflow gracefully
4. **Theme Compatibility**: Styles work with light/dark themes

This stylesheet provides a clean, professional interface for CFA consolidation operations with clear visual organization and responsive behavior.