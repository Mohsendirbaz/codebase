# ConfigurationMonitor.js - Financial Configuration Monitoring Component

## Overview

`ConfigurationMonitor.js` is a comprehensive monitoring component that displays and manages configuration values from the U_configurations backend. It provides advanced searching, filtering, and management capabilities for both baseline and time-segmented (customized) parameters.

## Architecture

### Core Features
- Real-time configuration parameter monitoring
- Baseline and customized parameter display
- Advanced search and filtering
- Time-range filtering for customized values
- Parameter categorization and grouping
- Collapsible/expandable interface
- Delete functionality for parameters
- Automatic refresh capabilities

### State Management
```javascript
const [isExpanded, setIsExpanded] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const [filterByGroup, setFilterByGroup] = useState('all');
const [configData, setConfigData] = useState([]);         // Baseline parameters
const [customizedData, setCustomizedData] = useState([]); // Customized parameters
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [currentVersion, setCurrentVersion] = useState(version);
const [expandedParams, setExpandedParams] = useState({});
const [customSearchTerm, setCustomSearchTerm] = useState('');
const [timeRangeFilter, setTimeRangeFilter] = useState({ start: '', end: '' });
const [paramSortOrders, setParamSortOrders] = useState({});
const [isDeleting, setIsDeleting] = useState(false);
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `version` | String/Number | Current configuration version to monitor |

## Parameter Categorization

### Category Groups
The component categorizes parameters based on their ID patterns:

```javascript
const categorizeParam = (id) => {
  // Custom prefixes
  if (id.startsWith('CustomParam_')) return 'Custom Parameters';
  if (id.startsWith('TimeSeg_')) return 'Time-Segmented';
  if (id.startsWith('UserDefined_')) return 'User-Defined';
  
  // Legacy numeric suffixes
  const amountNumber = parseInt(match[1], 10);
  if (amountNumber >= 10 && amountNumber <= 19) return 'Project Settings';
  if (amountNumber >= 20 && amountNumber <= 29) return 'Loan Settings';
  if (amountNumber >= 30 && amountNumber <= 39) return 'Rate Settings';
  if (amountNumber >= 40 && amountNumber <= 49) return 'Process Quantities';
  if (amountNumber >= 50 && amountNumber <= 59) return 'Process Costs';
  // Additional categories...
};
```

### Parameter Ranges
- **S10-S19**: Project Settings
- **S20-S29**: Loan Settings
- **S30-S39**: Rate Settings
- **S40-S49**: Process Quantities
- **S50-S59**: Process Costs
- **S60-S69**: Revenue Quantities
- **S70-S79**: Revenue Prices
- **S80-S89**: Tax Rates
- **Custom Prefixes**: User-defined parameters

## Data Structure

### Baseline Parameter Format
```javascript
{
  id: "plantLifetimeAmount10",
  value: 20,
  unit: "years",
  remarks: "Facility operational lifetime"
}
```

### Customized Parameter Format
```javascript
{
  id: "plantLifetimeAmount10",
  start_year: 0,
  end_year: 10,
  value: 20,
  unit: "years",
  remarks: "Phase 1 operational period"
}
```

## Key Functions

### 1. Data Fetching
```javascript
const fetchConfigData = useCallback(async () => {
  setIsLoading(true);
  try {
    // Fetch baseline parameters
    const baselineResponse = await fetch(
      `http://localhost:5001/parameters/${version}`
    );
    const baselineData = await baselineResponse.json();
    
    // Fetch customized parameters
    const customizedResponse = await fetch(
      `http://localhost:5001/parameters_customized/${version}`
    );
    const customData = await customizedResponse.json();
    
    setConfigData(baselineData.parameters);
    setCustomizedData(customData.customized_parameters);
  } catch (error) {
    setError('Failed to fetch configuration data');
  } finally {
    setIsLoading(false);
  }
}, [version]);
```

### 2. Parameter Combination
```javascript
const allParameters = useMemo(() => {
  const combined = [...configData];
  
  customizedData.forEach(customParam => {
    const baselineIndex = combined.findIndex(bp => bp.id === customParam.id);
    
    if (baselineIndex !== -1) {
      // Add to existing baseline parameter
      combined[baselineIndex] = {
        ...combined[baselineIndex],
        hasCustomized: true,
        customized: [...(combined[baselineIndex].customized || []), customParam]
      };
    } else {
      // Add as new parameter
      combined.push({
        ...customParam,
        hasCustomized: true,
        customized: [customParam]
      });
    }
  });
  
  return combined;
}, [configData, customizedData]);
```

### 3. Display Name Resolution
```javascript
const getDisplayName = (id) => {
  // Check property mapping first
  if (propertyMapping[id]) {
    return propertyMapping[id];
  }
  
  // Handle custom parameter formats
  if (id.startsWith('CustomParam_')) {
    return id.replace('CustomParam_', '')
      .replace(/_/g, ' ')
      .replace(/(^|\s)\S/g, t => t.toUpperCase());
  }
  
  // Generate from legacy ID format
  const [baseName] = id.split(/Amount\d+/i);
  return baseName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim();
};
```

### 4. Customized Value Filtering
```javascript
const filterCustomizedValues = (customizedValues, paramId) => {
  const filteredValues = customizedValues.filter(custom => {
    // Search filter
    const matchesSearch = !customSearchTerm || 
      custom.remarks?.toLowerCase().includes(customSearchTerm.toLowerCase());
    
    // Time range filter
    const matchesTimeRange = 
      (!timeRangeFilter.start || custom.start_year >= timeRangeFilter.start) &&
      (!timeRangeFilter.end || custom.end_year <= timeRangeFilter.end);
    
    return matchesSearch && matchesTimeRange;
  });
  
  // Sort based on user preference
  return sortCustomizedValues(filteredValues, paramId);
};
```

### 5. Delete Functionality
```javascript
const handleDeleteParameter = async (paramId) => {
  if (window.confirm(`Delete parameter "${paramId}"?`)) {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `http://localhost:5001/delete_parameter/${version}/${paramId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        fetchConfigData(); // Refresh data
      }
    } catch (error) {
      setError(`Failed to delete: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  }
};
```

## UI Components

### 1. Header Section
```javascript
<div className="config-header-c">
  {isExpanded ? (
    <>
      <h3>Financial Configuration</h3>
      <button className="toggle-button" onClick={() => setIsExpanded(false)}>
        ◀
      </button>
    </>
  ) : (
    <button className="expand-button" onClick={() => setIsExpanded(true)}>
      <span className="vertical-text"></span>
    </button>
  )}
</div>
```

### 2. Search and Filters
```javascript
<div className="search-filters-c">
  <input
    type="text"
    placeholder="Search parameters..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  
  <select value={filterByGroup} onChange={(e) => setFilterByGroup(e.target.value)}>
    <option value="all">All Parameter Groups</option>
    {/* Category options */}
  </select>
</div>
```

### 3. Custom Search Section
```javascript
<div className="custom-search-filters">
  <input
    placeholder="Search in customized values..."
    value={customSearchTerm}
    onChange={(e) => setCustomSearchTerm(e.target.value)}
  />
  
  <div className="time-range-filters">
    <input
      type="number"
      placeholder="Min start time"
      value={timeRangeFilter.start}
      onChange={(e) => setTimeRangeFilter(prev => ({ ...prev, start: e.target.value }))}
    />
  </div>
</div>
```

### 4. Parameter Display
```javascript
<div className="param-row">
  <div className="param-header">
    <span className="param-name">{getDisplayName(param.id)}</span>
    <span className="param-id">{param.id}</span>
  </div>
  
  <div className="param-values">
    <div className="baseline-value">
      <span className="value">{formatValue(param.value)}</span>
      <span className="unit">{param.unit}</span>
    </div>
    
    {param.hasCustomized && (
      <button onClick={() => toggleExpandParam(param.id)}>
        {expandedParams[param.id] ? '▼' : '▶'} Customized ({param.customized.length})
      </button>
    )}
  </div>
</div>
```

## CSS Classes

### Container Classes
- `.config-monitor-c`: Main container
- `.expanded`/`.collapsed`: State modifiers
- `.config-header-c`: Header section
- `.config-content-c`: Content area

### Search and Filter Classes
- `.search-filters-c`: Search bar container
- `.custom-search-filters`: Custom search section
- `.time-range-filters`: Time filter inputs

### Parameter Display Classes
- `.param-group`: Parameter group container
- `.param-row`: Individual parameter row
- `.param-header`: Parameter name and ID
- `.param-values`: Value display area
- `.customized-values`: Expanded custom values

### State Classes
- `.has-customized`: Parameters with custom values
- `.loading`: Loading state indicator
- `.error`: Error message display

## Best Practices

1. **Performance Optimization**
   - Use memoization for expensive computations
   - Implement virtual scrolling for large parameter lists
   - Debounce search inputs

2. **User Experience**
   - Clear visual hierarchy
   - Responsive collapse/expand functionality
   - Intuitive filtering options

3. **Error Handling**
   - Display user-friendly error messages
   - Implement retry mechanisms
   - Provide fallback states

4. **Data Management**
   - Validate parameter values before display
   - Handle missing or null values gracefully
   - Maintain consistency between baseline and custom values

## Integration Example

```javascript
<ConfigurationMonitor 
  version="1.0.0"
/>
```

This component provides comprehensive configuration monitoring capabilities, enabling users to view, search, filter, and manage both baseline and time-segmented parameter values with an intuitive, collapsible interface.