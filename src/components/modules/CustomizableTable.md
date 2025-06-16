# CustomizableTable Component Documentation

## Overview
`CustomizableTable` is a sophisticated React component that renders data tables with advanced formatting, customization options, and intelligent column handling. It provides special formatting for financial data, year columns highlighting, and property mapping integration.

## Purpose
This component addresses complex table rendering requirements:
- Dynamic column ordering based on data type
- Special formatting for financial values
- Year column highlighting for construction periods
- Property mapping for ID translations
- Responsive number formatting with visual indicators

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | array | Required | Array of objects containing table data |
| `fileName` | string | Required | Name of the file/table being displayed |
| `columns` | array | null | Custom column order (uses data keys if null) |
| `renderCell` | function | null | Custom cell rendering function |
| `tableClassName` | string | '' | CSS class for the table element |
| `headerClassName` | string | '' | CSS class for header cells |
| `rowClassName` | string | '' | CSS class for table rows |
| `cellClassName` | string | '' | CSS class for table cells |
| `numberFormatOptions` | object | `{ minimumFractionDigits: 2, maximumFractionDigits: 2 }` | Number formatting options |
| `yearColumnsToHighlight` | number | 0 | Number of year columns to highlight |
| `version` | string | '1' | Version identifier for the table |

## Key Features

### 1. Intelligent Column Ordering
The component automatically reorders columns based on the file type:

#### CFA Tables
```javascript
const desiredHeaderOrderCFA7 = [
  'Year', 'Revenue', 'Operating Expenses', 'Loan',
  'Federal Taxes', 'State Taxes', 'Depreciation',
  'After-Tax Cash Flow', 'Discounted Cash Flow',
  'Cumulative Cash Flow'
];
```

#### Filtered Value Intervals
```javascript
const desiredHeaderOrderFilteredValueIntervals = [
  'ID', 'Start', 'End', 'Value', 'Remarks'
];
```

### 2. Advanced Number Formatting

#### Conditional Formatting Rules
- **Negative values**: Displayed in red
- **Values < 1**: Three decimal places
- **Large values** (≥ 1 billion): Bold and italic
- **Standard values**: Two decimal places

```javascript
const formatNumber = (value) => {
  // Special handling for different value ranges
  if (value >= 0 && value < 1) {
    // Use 3 decimal places
  }
  if (value < 0) {
    // Display in red
  }
  if (value >= 1_000_000_000) {
    // Bold and italic
  }
};
```

### 3. Year Column Highlighting
- Automatically detects year columns by pattern
- Highlights specified number of construction years
- Supports multiple year formats:
  - 'year', 'Year 1', 'Y1', '2020', etc.

### 4. Property Mapping Integration
- Integrates with `useMatrixFormValues` hook
- Maps IDs to readable names for Filtered_Value_Intervals
- Preserves original values for other tables

## Component Structure

### State Management
```javascript
const tableRef = useRef(null);
const { propertyMapping } = useMatrixFormValues();
```

### Rendering Logic
1. **Data Validation**: Checks for empty data
2. **Header Determination**: Based on fileName or columns prop
3. **Column Ordering**: Applies predefined order for specific file types
4. **Cell Rendering**: Custom or default formatting
5. **Year Column Styling**: Post-render DOM manipulation

## Usage Examples

### Basic Usage
```javascript
<CustomizableTable 
  data={tableData}
  fileName="Financial Report"
/>
```

### With Year Highlighting
```javascript
<CustomizableTable 
  data={cfaData}
  fileName="CFA_Analysis"
  yearColumnsToHighlight={3}
/>
```

### Custom Formatting
```javascript
<CustomizableTable 
  data={customData}
  fileName="Custom Report"
  renderCell={(value, header, row) => {
    if (header === 'Status') {
      return <span className={`status-${value}`}>{value}</span>;
    }
    return value;
  }}
  numberFormatOptions={{ minimumFractionDigits: 4 }}
/>
```

## Styling

### CSS Classes
- `.table-container`: Wrapper div
- `.table-title`: Table heading
- `.year-info`: Construction years indicator
- `.custom-table`: Main table element
- `.custom-header`: Header cells
- `.custom-row`: Table rows
- `.custom-cell`: Data cells
- `.year-column`: Highlighted year columns

### Inline Styles
```javascript
// Header cells
{ width: '200px', textAlign: 'center' }

// Data cells
{ padding: '8px !important', textAlign: 'left', paddingLeft: '10px' }
```

## Special Features

### Tooltip Support
Each header includes a tooltip element:
```javascript
<span className="tooltip2">hi</span>
```

### Year Detection Patterns
The component recognizes year columns through:
1. Text containing 'year'
2. Pattern `Y[number]` (Y1, Y2)
3. Pattern `Year [number]`
4. Four-digit years (1900-2099)

### Property Mapping
For Filtered_Value_Intervals tables:
```javascript
header === 'ID' && fileName.startsWith('Filtered_Value_Intervals')
  ? propertyMapping[row[header]] || row[header]
  : renderCell ? renderCell(...) : formatNumber(...)
```

## Performance Considerations

### DOM Manipulation
- Year column styling applied after render
- Efficient querySelector usage
- Cleanup of existing classes before reapplication

### Dependencies Array
```javascript
useEffect(() => {
  // Year column styling logic
}, [yearColumnsToHighlight, data, fileName]);
```

## Integration Points

### useMatrixFormValues Hook
- Provides property mapping data
- Must be available in component tree
- Imported from Consolidated2

### Data Format
Expected data structure:
```javascript
[
  { Year: 1, Revenue: 1000, ... },
  { Year: 2, Revenue: 1500, ... }
]
```

## PropTypes Validation
```javascript
CustomizableTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  fileName: PropTypes.string.isRequired,
  // ... other prop validations
};
```

## Best Practices

1. **Data Preparation**: Ensure consistent data structure
2. **Column Names**: Use standard naming for automatic ordering
3. **Performance**: Limit data size for large tables
4. **Accessibility**: Provide meaningful file names
5. **Number Formats**: Choose appropriate decimal places

## Common Use Cases

1. **Financial Reports**: CFA analysis with year highlighting
2. **Interval Data**: Value ranges with ID mapping
3. **Statistical Tables**: Custom number formatting
4. **Time Series Data**: Year column emphasis
5. **Configuration Tables**: Property name translations

## Limitations

1. Fixed header cell width (200px)
2. Tooltip content is static ("hi")
3. Year detection is pattern-based
4. No built-in sorting or filtering
5. No pagination for large datasets

## Future Enhancements

- Dynamic tooltip content
- Sortable columns
- Filter functionality
- Export capabilities
- Responsive column widths
- Virtual scrolling for performance