# SensitivityPlotsTabs Component Documentation

## Overview
The `SensitivityPlotsTabs` component is a specialized wrapper around the `PlotsTabs` component designed specifically for sensitivity analysis visualization. It manages sensitivity parameter data, relationships, and provides an interface for viewing sensitivity analysis plots with parameter-specific navigation.

## Component Architecture

### Core Features
1. **Sensitivity Data Management**: Fetches and organizes sensitivity analysis data
2. **Parameter Navigation**: Tab-based parameter selection
3. **Relationship Tracking**: Manages parameter relationships and plot types
4. **PlotsTabs Integration**: Leverages existing plot display functionality
5. **Error Handling**: Comprehensive error states for missing data
6. **Dynamic Plot Type Detection**: Determines available plot types per parameter

### Props Interface
```javascript
{
  version: string,    // Batch version identifier
  S: Object          // Sensitivity parameters configuration object
}
```

## State Management

### Component State
```javascript
const [parameters, setParameters] = useState([]);              // Enabled parameters list
const [relationships, setRelationships] = useState([]);         // Parameter relationships
const [selectedParameter, setSelectedParameter] = useState(null); // Current parameter
const [visualizationData, setVisualizationData] = useState(null); // Full viz data
const [loading, setLoading] = useState(true);                  // Loading state
const [error, setError] = useState(null);                      // Error messages
```

## API Integration

### Sensitivity Data Fetch
```javascript
const fetchSensitivityData = async () => {
  // Extract first enabled parameter from S
  const enabledParams = Object.entries(S)
    .filter(([_, config]) => config.enabled);
  
  if (enabledParams.length > 0) {
    const [paramId, config] = enabledParams[0];
    
    // POST to sensitivity visualization endpoint
    const response = await fetch(`http://localhost:2500/api/sensitivity/visualize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        version: version,
        param_id: paramId,
        mode: config.mode || 'percentage',
        compareToKey: config.compareToKey || 'S13',
        plotTypes: ['waterfall', 'bar', 'point']
      })
    });
  }
};
```

### Response Data Structure
```javascript
{
  parameters: {
    S10: {
      enabled: true,
      mode: 'percentage',
      values: [10, 20, 30],
      status: { error: null }
    },
    // ... more parameters
  },
  relationships: [
    {
      source: 'S10',
      target: 'NPV',
      plotTypes: ['waterfall', 'bar']
    },
    // ... more relationships
  ]
}
```

## Parameter Filtering

### Enabled Parameters Extraction
```javascript
// Extract enabled parameters from response
const enabledParams = Object.entries(data.parameters || {})
  .filter(([_, config]) => config.enabled)
  .map(([id, config]) => ({ 
    id, 
    ...config
  }));
```

## Plot Type Detection

### Dynamic Plot Types
Determines available plot types for selected parameter:

```javascript
const getPlotTypes = () => {
  if (!selectedParameter || !relationships) return [];
  
  const paramRelationships = relationships.filter(
    rel => rel.source === selectedParameter
  );
  
  if (paramRelationships.length === 0) return [];
  
  // Collect all plot types across relationships
  return paramRelationships.reduce((types, rel) => {
    return [...types, ...(rel.plotTypes || [])];
  }, []);
};
```

## Component Structure

### DOM Hierarchy
```html
<div className="sensitivity-plots-container">
  <!-- Loading state -->
  <div className="sensitivity-loading">...</div>
  
  <!-- Error state -->
  <div className="sensitivity-error">...</div>
  
  <!-- Empty state -->
  <div className="sensitivity-empty">...</div>
  
  <!-- Main content -->
  <div className="sensitivity-header">
    <h2>Sensitivity Analysis</h2>
    <div className="parameter-tabs">
      <button className="parameter-tab">...</button>
    </div>
  </div>
  
  <div className="sensitivity-content">
    <div className="parameter-info">
      <h3>Parameter: {selectedParameter}</h3>
      <div className="parameter-details">...</div>
    </div>
    
    <div className="plots-wrapper">
      <PlotsTabs />
    </div>
  </div>
</div>
```

## Error Handling

### Error States
1. **No Version**: Skips fetch when version is empty
2. **No Parameters**: Shows message when no parameters enabled
3. **API Errors**: Displays fetch error messages
4. **Parameter Errors**: Shows parameter-specific errors

### Error Display Logic
```javascript
{loading ? (
  <div className="sensitivity-loading">Loading sensitivity analysis data...</div>
) : error ? (
  <div className="sensitivity-error">{error}</div>
) : parameters.length === 0 ? (
  <div className="sensitivity-empty">No sensitivity parameters enabled</div>
) : (
  // Display content
)}
```

## PlotsTabs Integration

### Props Passed to PlotsTabs
```javascript
<PlotsTabs 
  version={version}           // Batch version
  sensitivity={true}          // Enable sensitivity mode
  parameter={selectedParameter} // Current parameter
  plotTypes={getPlotTypes()}   // Available plot types
/>
```

## Parameter Navigation

### Tab System
Each enabled parameter gets a navigation tab:

```javascript
{parameters.map(param => (
  <button 
    key={param.id}
    className={`parameter-tab ${selectedParameter === param.id ? 'active' : ''}`}
    onClick={() => handleParameterChange(param.id)}
  >
    {param.id} ({param.mode})
  </button>
))}
```

### Parameter Change Handler
```javascript
const handleParameterChange = (paramId) => {
  setSelectedParameter(paramId);
};
```

## Data Flow

### Initialization Sequence
1. Component mounts with version and S props
2. Fetches sensitivity visualization data
3. Extracts enabled parameters and relationships
4. Sets initial selected parameter
5. Renders parameter tabs and plot display

### Update Sequence
1. User selects different parameter tab
2. Component updates selectedParameter
3. PlotsTabs receives new parameter prop
4. PlotsTabs fetches plots for new parameter

## CSS Classes

### Container Classes
- `.sensitivity-plots-container`: Main wrapper
- `.sensitivity-header`: Header section
- `.sensitivity-content`: Content area
- `.plots-wrapper`: PlotsTabs container

### Navigation Classes
- `.parameter-tabs`: Tab container
- `.parameter-tab`: Individual tab button
- `.active`: Active tab state

### Information Classes
- `.parameter-info`: Parameter details section
- `.parameter-details`: Detailed parameter information
- `.parameter-error`: Parameter-specific errors

### State Classes
- `.sensitivity-loading`: Loading message
- `.sensitivity-error`: Error message
- `.sensitivity-empty`: Empty state
- `.no-analysis-data`: No data available message

## Usage Example

```javascript
import SensitivityPlotsTabs from './components/modules/SensitivityPlotsTabs';

function SensitivityAnalysis({ version, sensitivityConfig }) {
  return (
    <SensitivityPlotsTabs 
      version={version}
      S={sensitivityConfig}
    />
  );
}
```

## Integration Points

### With SensitivityMonitor
Works in conjunction with SensitivityMonitor component:
- SensitivityMonitor configures parameters
- SensitivityPlotsTabs visualizes results

### With Backend API
Requires backend endpoints:
- `/api/sensitivity/visualize`: Initial data fetch
- `/api/sensitivity-plots/*`: Plot image endpoints

## Performance Considerations

### Conditional Rendering
- Only renders when data is available
- Skips API calls when version is empty
- Prevents unnecessary re-fetches

### Data Caching
- Visualization data cached in component state
- Relationships computed once and reused
- Plot types calculated on demand

## Error Recovery

### Graceful Degradation
- Shows informative messages for all error states
- Continues to function with partial data
- Provides clear user guidance

### Skip Conditions
```javascript
// Skip if no version
if (!version) {
  console.log('Skipping sensitivity data fetch - version is empty');
  return;
}

// Skip if no enabled parameters
if (!firstParam) {
  console.log('Skipping sensitivity data fetch - no enabled parameters found');
  setLoading(false);
  setError("No enabled sensitivity parameters found. Please enable at least one parameter.");
  return;
}
```

## Future Enhancement Possibilities

1. **Multi-Parameter Comparison**: Compare multiple parameters simultaneously
2. **Interactive Plots**: Click-through to detailed analysis
3. **Export Functionality**: Download sensitivity reports
4. **Real-time Updates**: WebSocket for live sensitivity updates
5. **Parameter Grouping**: Group related parameters
6. **Custom Visualizations**: User-defined plot types
7. **Threshold Indicators**: Visual warnings for critical values
8. **Sensitivity History**: Track changes over time
9. **Automated Insights**: AI-generated sensitivity insights
10. **3D Visualizations**: Multi-dimensional sensitivity surfaces