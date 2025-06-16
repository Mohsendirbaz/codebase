# PathwayComparisonChart Component Documentation

## Overview
The `PathwayComparisonChart` component is a specialized horizontal bar chart designed for comparing multiple decarbonization pathways across various metrics. It provides a visual representation of pathway performance with support for different categories and special highlighting for hard-to-decarbonize sectors.

## Key Features

### 1. **Flexible Data Visualization**
- Horizontal bar chart layout for easy comparison
- Support for nested data access using dot notation
- Customizable value formatting
- Ascending or descending value representation

### 2. **Category Support**
- Visual category indicators for different pathway types
- Special styling for hard-to-decarbonize sectors
- Color-coded bars based on pathway characteristics

### 3. **Responsive Design**
- Percentage-based bar widths for responsive layouts
- Normalized data scaling for consistent visualization
- Clean, modern styling with smooth transitions

## Component Props

```javascript
{
  pathways: Array,        // Array of pathway objects to compare
  dataKey: String,        // Path to data value in pathway object (supports dot notation)
  format: Function,       // Function to format display values
  ascending: Boolean,     // Whether lower values are better (true) or higher (false)
  color: String          // Base color for regular pathways
}
```

## Pathway Object Structure

```javascript
{
  id: String,                    // Unique identifier
  name: String,                  // Display name
  category: String,              // Pathway category
  isHardToDecarbonize: Boolean,  // Special sector flag
  // ... nested data accessed via dataKey
}
```

## Key Functions

### `getNestedValue(obj, path)`
Utility function that safely extracts nested values from objects using dot notation paths:
```javascript
// Example: getNestedValue(pathway, "economics.cost")
// Retrieves pathway.economics.cost
```

### Data Processing
1. Extracts values using the provided `dataKey`
2. Filters out null/undefined values
3. Sorts data based on `ascending` prop
4. Normalizes values to percentages for consistent bar widths

## Styling Classes

### Core Classes
- `.pathway-comparison-chart`: Main container
- `.chart-bar-container`: Individual bar wrapper
- `.chart-bar-label`: Pathway name and category indicator
- `.chart-bar-wrapper`: Bar and value container
- `.chart-bar`: Actual bar element
- `.chart-bar-value`: Formatted value display

### Special Styling
- `.category-indicator`: Small colored indicator for pathway category
- `.hard-to-decarbonize`: Special styling for difficult sectors (red color)

## Usage Examples

### Basic Usage
```javascript
<PathwayComparisonChart
  pathways={decarbonizationPathways}
  dataKey="totalCost"
  format={(value) => `$${value.toFixed(2)}M`}
  ascending={true}
  color="#4682b4"
/>
```

### Comparing Nested Values
```javascript
<PathwayComparisonChart
  pathways={pathways}
  dataKey="emissions.reduction"
  format={(value) => `${value}%`}
  ascending={false}  // Higher reduction is better
  color="#27ae60"
/>
```

### With Custom Formatting
```javascript
<PathwayComparisonChart
  pathways={pathways}
  dataKey="waterUsage.annual"
  format={(value) => {
    if (value > 1000) return `${(value/1000).toFixed(1)}K L`;
    return `${value} L`;
  }}
  ascending={true}
  color="#3498db"
/>
```

## Visual Behavior

### Bar Width Calculation
- Minimum value maps to 0% width (or 100% for ascending=true)
- Maximum value maps to 100% width (or 0% for ascending=true)
- Linear interpolation between min and max

### Color Coding
- Regular pathways use the provided `color` prop
- Hard-to-decarbonize sectors always use red (#e74c3c)
- Category indicators have their own color scheme

## Integration with Extended Scaling

This component is specifically designed for the truly_extended_scaling module where it:
- Compares different decarbonization strategies
- Highlights cost-effectiveness of various approaches
- Identifies challenging sectors requiring special attention
- Provides visual feedback for decision-making

## Performance Considerations

- Efficient data extraction with early filtering
- Single-pass sorting and normalization
- Minimal re-renders through prop comparison
- CSS transitions for smooth visual updates

## Accessibility Features

- Semantic HTML structure
- Clear visual hierarchy
- High contrast between bars and values
- Readable text sizing

## Future Enhancements

Potential improvements could include:
- Interactive tooltips with detailed information
- Clickable bars for drill-down analysis
- Export functionality for chart data
- Animation options for data updates
- Additional chart types (stacked, grouped)