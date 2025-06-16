# PathwayComparisonChart Component Documentation

## Component Overview
The PathwayComparisonChart component renders a horizontal bar chart for comparing decarbonization pathways across various metrics. It provides visual comparison with automatic scaling, category indicators, and special handling for hard-to-decarbonize pathways.

### Core Functionality
- **Data extraction**: Navigate nested object properties using dot notation
- **Automatic scaling**: Normalize values to percentage widths
- **Bidirectional display**: Support for ascending/descending value preferences
- **Category visualization**: Visual indicators for pathway categories
- **Special case handling**: Highlight hard-to-decarbonize pathways

### Dependencies
- React

## Architecture Summary

### Level 1: Component Entry and Props
```
PathwayComparisonChart({ pathways, dataKey, format, ascending, color })
├─ Horizontal bar chart visualization
├─ Dynamic data extraction via dataKey
└─ Configurable display options
```

### Level 2: Data Processing Pipeline
```
Processing Flow:
├─ Data Extraction
│  ├─ Map pathways to data objects
│  ├─ Extract values using getNestedValue()
│  └─ Filter out null/undefined values
├─ Sorting
│  └─ Sort by value (ascending/descending)
├─ Normalization
│  ├─ Find min/max values
│  ├─ Calculate percentage widths
│  └─ Store normalized data
└─ Rendering
   └─ Generate bar elements
```

### Level 3: Functional Architecture
```
Helper Functions:
└─ getNestedValue(obj, path)
   ├─ Split path by dots
   ├─ Navigate nested properties
   └─ Return value or undefined

Main Component Logic:
├─ Data Transformation
│  ├─ Extract relevant fields
│  ├─ Apply value filtering
│  └─ Maintain pathway metadata
├─ Value Normalization
│  ├─ Calculate range (min-max)
│  ├─ Normalize to 0-100 scale
│  └─ Handle edge cases
└─ Visual Mapping
   ├─ Width calculation
   ├─ Color assignment
   └─ Category indicators
```

## Key Features

### 1. Nested Property Access
Flexible data extraction using dot notation:
```javascript
const getNestedValue = (obj, path) => {
  const parts = path.split('.');
  let value = obj;
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  return value;
};
```

### 2. Bidirectional Bar Display
Support for metrics where lower or higher values are preferable:
```javascript
width: `${ascending ? 100 - item.width : item.width}%`
```

### 3. Data Normalization
Automatic scaling to fit all values within 0-100% range:
```javascript
width: ((item.value - minValue) / (maxValue - minValue || 1)) * 100
```

### 4. Category Indicators
Visual category representation:
```jsx
<span className={`category-indicator ${item.category}`}></span>
```

### 5. Hard-to-Decarbonize Highlighting
Special styling for challenging pathways:
```javascript
className={`chart-bar ${item.isHardToDecarbonize ? 'hard-to-decarbonize' : ''}`}
backgroundColor: item.isHardToDecarbonize ? '#e74c3c' : color
```

## Technical Implementation Details

### Data Structure Expected
```javascript
pathway = {
  id: 'unique-id',
  name: 'Pathway Name',
  category: 'industrial',
  isHardToDecarbonize: true,
  // nested properties accessible via dataKey
  economics: {
    cost: 1000
  }
}
```

### Sorting Logic
```javascript
data.sort((a, b) => ascending ? a.value - b.value : b.value - a.value);
```

### Width Calculation
For ascending order (lower is better):
- Best value gets 100% width
- Worst value gets 0% width

For descending order (higher is better):
- Best value gets 100% width
- Worst value gets 0% width

## Usage Examples

### Basic Usage
```jsx
<PathwayComparisonChart 
  pathways={decarbonizationPathways}
  dataKey="economics.cost"
  format={(value) => `$${value}M`}
  ascending={true}
  color="#4682b4"
/>
```

### Advanced Usage with Nested Properties
```jsx
<PathwayComparisonChart 
  pathways={pathways}
  dataKey="emissions.reduction.percentage"
  format={(value) => `${value}%`}
  ascending={false}
  color="#27ae60"
/>
```

## CSS Classes and Structure
```
.pathway-comparison-chart
├─ .chart-bar-container (for each pathway)
│  ├─ .chart-bar-label
│  │  ├─ .category-indicator.{category}
│  │  └─ {pathway name text}
│  └─ .chart-bar-wrapper
│     ├─ .chart-bar[.hard-to-decarbonize]
│     └─ .chart-bar-value
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| pathways | Array | [] | Array of pathway objects to compare |
| dataKey | String | required | Dot-notation path to the value to compare |
| format | Function | (value) => value | Function to format displayed values |
| ascending | Boolean | true | Whether lower values should appear as longer bars |
| color | String | '#4682b4' | Base color for normal pathway bars |

## Edge Cases Handled
- Empty pathways array (returns null)
- Missing nested properties (filtered out)
- Null/undefined values (filtered out)
- Zero range (division by zero protection)
- Single pathway (still displays correctly)

## Performance Considerations
- Efficient single-pass data extraction
- Minimal re-calculations
- No external dependencies for calculations
- Linear time complexity O(n) for n pathways