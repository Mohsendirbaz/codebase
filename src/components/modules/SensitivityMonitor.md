# SensitivityMonitor Component Documentation

## Overview
The `SensitivityMonitor` component is a comprehensive sensitivity analysis configuration interface that allows users to manage sensitivity parameters, configure analysis modes, set comparison relationships, and monitor capacity usage. It features a collapsible panel design with advanced filtering, search capabilities, and real-time parameter editing.

## Component Architecture

### Core Features
1. **Parameter Management**: Enable/disable and configure sensitivity parameters
2. **Multiple Analysis Modes**: Percentage, direct value, absolute departure, Monte Carlo
3. **Comparison System**: Compare parameters with various relationship types
4. **Capacity Tracking**: Monitor usage against system limits
5. **Advanced Filtering**: Search and categorize parameters
6. **Modal Editing**: Detailed parameter configuration interface
7. **Visual Feedback**: Mode-specific color coding and plot indicators

### Props Interface
```javascript
{
  S: Object,              // Sensitivity parameters state object
  setS: Function,         // Function to update sensitivity parameters
  version: string,        // Current version number
  activeTab: string       // Currently active application tab
}
```

## State Management

### Component State
```javascript
const [isExpanded, setIsExpanded] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [filterMode, setFilterMode] = useState('all');
const [selectedParameter, setSelectedParameter] = useState(null);
const [parameterDetails, setParameterDetails] = useState(null);
const [usagePercentage, setUsagePercentage] = useState(0);
```

### Sensitivity Parameter Structure
```javascript
{
  S10: {
    mode: 'percentage' | 'directvalue' | 'absolutedeparture' | 'monteCarlo',
    values: number[],
    compareToKey: string,        // e.g., 'S13'
    comparisonType: string,      // 'primary', 'ratio', 'difference', 'product'
    waterfall: boolean,          // Plot type flags
    bar: boolean,
    point: boolean,
    enabled: boolean
  },
  // ... S11 through S84
}
```

## Analysis Modes

### Available Modes
```javascript
const sensitivityModes = [
  { id: 'percentage', label: 'Percentage Change' },
  { id: 'directvalue', label: 'Direct Values - used directly for calculation and visualization'},
  { id: 'absolutedeparture', label: 'Absolute Departure - added to and subtracted from base values' },
  { id: 'monteCarlo', label: 'Monte Carlo - Coming Soon!' }
];
```

### Mode Color Mapping
Each mode has a distinct visual color:
```javascript
const modeColorMap = {
  percentage: 'mode-percentage',
  directvalue: 'mode-directvalue',
  absolutedeparture: 'mode-absolutedeparture',
  monteCarlo: 'mode-montecarlo'
};
```

## Comparison System

### Comparison Types
```javascript
const comparisonTypes = [
  { id: 'primary', label: 'As primary (x axis)' },
  { id: 'As primary (y axis)', label: 'As primary (y axis)' },
  { id: 'none', label: 'No Comparison' },
  { id: 'ratio', label: 'Ratio (A:B)' },
  { id: 'difference', label: 'Difference (A-B)' },
  { id: 'product', label: 'Product (A×B)' }
];
```

## Parameter Filtering

### Filter Categories
```javascript
filterMode options:
- 'all': All parameters
- 'enabled': Only enabled parameters
- 'disabled': Only disabled parameters
- 'project': Project settings (S10-S19)
- 'loan': Loan settings (S20-S29)
- 'rates': Rate settings (S30-S39)
- 'quantities': Process quantities (S40-S49)
- 'costs': Process costs (S50-S59)
```

### Advanced Search
Supports comma-separated parameter search:
```javascript
// Single parameter search
"S10" or "10"

// Multiple parameter search
"S10,S15,S20" or "10,15,20"
```

## Capacity Tracking

### Integration with CapacityTrackingService
```javascript
import capacityTracker from '../../services/CapacityTrackingService';

// Update usage percentage
useEffect(() => {
  const percentage = capacityTracker.updateSensitivityUsage(S);
  setUsagePercentage(percentage);
}, [S]);
```

### Usage Display
Visual capacity indicator with color coding:
- Green: < 70% usage
- Orange: 70-90% usage
- Red: > 90% usage

## Parameter Configuration

### Modal Editor
Comprehensive parameter editing interface:

```javascript
// Parameter details structure
{
  mode: string,
  values: number[],
  compareToKey: string,
  comparisonType: string,
  waterfall: boolean,
  bar: boolean,
  point: boolean
}
```

### Value Management
- Add/remove parameter values
- Edit individual values
- Real-time updates reflected in main display

## External Access

### Action Reference
Provides external access to component methods:

```javascript
const sensitivityActionRef = { current: null };

useEffect(() => {
  sensitivityActionRef.current = {
    toggleParameterEnabled,
    openParameterDetails
  };
}, [toggleParameterEnabled, openParameterDetails]);

export { SensitivityMonitor as default, sensitivityActionRef };
```

## Component Visibility

### Tab-Based Visibility
Component only renders on specific tabs:

```javascript
const isVisible = useMemo(() => {
  return ['Input', 'Case1', 'Case2', 'Case3', 'Scaling'].includes(activeTab);
}, [activeTab]);

if (!isVisible) return null;
```

## Key Functions

### Parameter Management
```javascript
// Toggle parameter enabled state
toggleParameterEnabled = (key) => {
  setS(prevS => ({
    ...prevS,
    [key]: {
      ...prevS[key],
      enabled: !prevS[key].enabled
    }
  }));
};

// Reset individual parameter
resetParameter = (key) => {
  setS(prevS => ({
    ...prevS,
    [key]: {
      mode: null,
      values: [],
      compareToKey: '',
      comparisonType: null,
      waterfall: false,
      bar: false,
      point: false,
      enabled: false
    }
  }));
};

// Reset all parameters
resetAllParameters = () => {
  // Resets S10 through S84 to initial state
};
```

### Value Manipulation
```javascript
// Add value to parameter
addParameterValue = () => {
  const newValues = [...parameterDetails.values, 0];
  // Update both local and global state
};

// Remove value from parameter
removeParameterValue = (index) => {
  const newValues = parameterDetails.values.filter((_, i) => i !== index);
  // Update both local and global state
};

// Update specific value
updateParameterValue = (index, value) => {
  const newValue = parseFloat(value);
  if (isNaN(newValue)) return;
  // Update value at index
};
```

## UI Components

### Collapsible Panel
- Expanded: Full interface with all controls
- Collapsed: Vertical tab on the side

### Parameter List Item
Each parameter displays:
- Parameter key (e.g., S10)
- Parameter name from form values
- Enable/disable toggle
- Configure button
- Reset button
- Summary of current settings

### Modal Configuration
Detailed parameter editor with:
- Mode selection
- Plot type checkboxes
- Value list management
- Comparison parameter selection
- Comparison type selection

## CSS Classes

### Container Classes
- `.sensitivity-monitor-s`: Main container
- `.expanded`: Expanded state
- `.collapsed`: Collapsed state

### UI Element Classes
- `.monitor-header-s`: Header section
- `.monitor-content-s`: Content area
- `.monitor-toolbar-s`: Search and filter controls
- `.parameters-container-s`: Parameter list container

### Parameter Classes
- `.parameter-item-s`: Individual parameter row
- `.parameter-header-s`: Parameter header section
- `.parameter-summary-s`: Parameter details summary
- `.enabled`: Enabled parameter state
- `.disabled`: Disabled parameter state

### Modal Classes
- `.parameter-modal`: Modal overlay
- `.modal-content`: Modal container
- `.modal-header`: Modal title section
- `.modal-body`: Modal form section
- `.modal-footer`: Modal action buttons

## Integration Points

### With Form Values
Uses `useMatrixFormValues` hook to get parameter labels:

```javascript
const { formMatrix: formValues } = useMatrixFormValues();

// Map parameter keys to display names
getParameterName = (key) => {
  // Look up label in formValues
};
```

### With Capacity Service
Real-time capacity monitoring and enforcement:

```javascript
// Check capacity before enabling
// Update usage percentage
// Display warnings when near limit
```

## Usage Example

```javascript
import SensitivityMonitor from './components/modules/SensitivityMonitor';

function AnalysisPanel({ S, setS, version, activeTab }) {
  return (
    <SensitivityMonitor
      S={S}
      setS={setS}
      version={version}
      activeTab={activeTab}
    />
  );
}
```

## Performance Optimizations

### Memoized Computations
```javascript
// Filtered parameters cached
const filteredParameters = useMemo(() => {
  // Filtering logic
}, [S, searchTerm, filterMode]);

// Visibility check cached
const isVisible = useMemo(() => {
  // Tab check logic
}, [activeTab]);
```

### Callback Optimization
All functions wrapped in useCallback to prevent unnecessary re-renders

## Accessibility Features

### ARIA Labels
- Toggle switches have proper labels
- Modal controls are keyboard accessible
- Close buttons have aria-label attributes

### Keyboard Navigation
- Tab navigation through controls
- Enter/Space to activate buttons
- Escape to close modal

## Future Enhancement Possibilities

1. **Batch Operations**: Apply settings to multiple parameters
2. **Import/Export**: Save and load configurations
3. **Templates**: Predefined sensitivity configurations
4. **Validation**: Parameter value validation rules
5. **Visualization Preview**: Mini plot previews in the panel
6. **Dependency Tracking**: Show parameter relationships
7. **History**: Undo/redo for parameter changes
8. **Grouping**: Custom parameter groups
9. **Annotations**: Add notes to parameters
10. **Advanced Modes**: Additional analysis methods