# ConflictResolutionPanel.js - Efficacy Period Conflict Resolution Component

## Overview

`ConflictResolutionPanel.js` is a specialized component designed to help users resolve conflicts where the degree of freedom constraint is violated. This occurs when multiple values exist for the same parameter-scaling group combination in the same year. The component provides three resolution methods: selection, automatic adjustment, and custom adjustment.

## Architecture

### Core Purpose
The component addresses the fundamental constraint in the ModEcon Matrix System where each parameter-scaling group-year combination must have exactly one value. When multiple efficacy periods overlap for a given year, this component provides an interface to resolve the conflict.

### State Management
```javascript
const [selectedResolution, setSelectedResolution] = useState(null);
const [customStartYear, setCustomStartYear] = useState(year);
const [customEndYear, setCustomEndYear] = useState(year);
const [resolutionMethod, setResolutionMethod] = useState('adjust');
const [isSubmitting, setIsSubmitting] = useState(false);
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `paramId` | String | The parameter ID with a conflict |
| `scalingGroupId` | Number | The scaling group ID with a conflict |
| `year` | Number | The specific year where the conflict occurs |
| `conflictingPeriods` | Array | Array of efficacy periods that overlap |
| `onResolve` | Function | Callback when conflict is resolved |
| `onCancel` | Function | Callback when resolution is cancelled |

## Conflict Resolution Methods

### 1. Select Method
Users can choose one period to keep while removing all others.

```javascript
{
  type: 'select',
  keepPeriodIndex: selectedResolution,
  paramId,
  scalingGroupId,
  year
}
```

**Use Case**: When one period contains the correct value and others should be discarded.

### 2. Automatic Adjustment Method
The system automatically adjusts period boundaries to eliminate overlaps.

```javascript
{
  type: 'adjust',
  adjustments: [
    // Adjusted period objects
  ],
  paramId,
  scalingGroupId,
  year
}
```

**Adjustment Logic**:
- **First Period**: If conflict is at start year, adjust end year to `year - 1`
- **Last Period**: If conflict is at end year, adjust start year to `year + 1`
- **Middle Period**: Split the period at the conflict year

### 3. Custom Adjustment Method
Users manually specify new boundaries for the conflicting period.

```javascript
{
  type: 'custom',
  customStart: customStartYear,
  customEnd: customEndYear,
  paramId,
  scalingGroupId,
  year
}
```

**Use Case**: When automatic adjustments don't meet specific requirements.

## Conflicting Period Structure

```javascript
{
  start: 1,        // Start year of the period
  end: 10,         // End year of the period
  value: 100,      // Value for this period (optional)
  // Additional metadata
}
```

## UI Components

### 1. Conflict Information Display
```javascript
<div className="conflict-info">
  <p><strong>Parameter:</strong> {paramId}</p>
  <p><strong>Scaling Group:</strong> {scalingGroupId}</p>
  <p><strong>Year:</strong> {year}</p>
  <p><strong>Conflict:</strong> {conflictingPeriods.length} efficacy periods overlap</p>
</div>
```

### 2. Method Selector
```javascript
<div className="method-selector">
  <label>
    <input
      type="radio"
      name="resolution-method"
      value="select"
      checked={resolutionMethod === 'select'}
      onChange={() => handleMethodChange('select')}
    />
    Select one period to keep
  </label>
  {/* Additional method options */}
</div>
```

### 3. Select Method UI
```javascript
<div className="period-list">
  {conflictingPeriods.map((period, index) => (
    <div 
      className={`period-item ${selectedResolution === index ? 'selected' : ''}`}
      onClick={() => setSelectedResolution(index)}
    >
      <div className="period-range">Years {period.start} - {period.end}</div>
      {period.value && <div className="period-value">Value: {period.value}</div>}
    </div>
  ))}
</div>
```

### 4. Adjustment Preview
```javascript
<div className="adjustment-preview">
  <h5>Preview of Adjustments:</h5>
  <ul>
    {conflictingPeriods.map((period, index) => (
      <li>
        Period {index + 1}: {getAdjustmentText(period, index)}
      </li>
    ))}
  </ul>
</div>
```

### 5. Custom Input Controls
```javascript
<div className="custom-inputs">
  <div className="input-group">
    <label>Start Year:</label>
    <input
      type="number"
      min="1"
      max={getMaxYear()}
      value={customStartYear}
      onChange={(e) => setCustomStartYear(parseInt(e.target.value))}
    />
  </div>
  {/* End year input */}
</div>
```

## Key Functions

### 1. Initialize Selection
```javascript
useEffect(() => {
  if (conflictingPeriods.length > 0) {
    setSelectedResolution(0); // Default to first period
  }
}, [conflictingPeriods]);
```

### 2. Get Maximum Year
```javascript
const getMaxYear = () => {
  if (!conflictingPeriods || conflictingPeriods.length === 0) return year;
  return Math.max(...conflictingPeriods.map(period => period.end || 0));
};
```

### 3. Handle Method Change
```javascript
const handleMethodChange = (method) => {
  setResolutionMethod(method);
  
  // Reset custom years when switching to 'adjust'
  if (method === 'adjust') {
    setCustomStartYear(year);
    setCustomEndYear(year);
  }
};
```

### 4. Submit Resolution
```javascript
const handleSubmit = () => {
  setIsSubmitting(true);
  
  try {
    let resolution;
    
    // Build resolution object based on method
    switch(resolutionMethod) {
      case 'select':
        resolution = buildSelectResolution();
        break;
      case 'adjust':
        resolution = buildAdjustResolution();
        break;
      case 'custom':
        resolution = buildCustomResolution();
        break;
    }
    
    onResolve(resolution);
  } catch (error) {
    console.error('Error resolving conflict:', error);
  } finally {
    setIsSubmitting(false);
  }
};
```

## CSS Classes

### Container Classes
- `.conflict-resolution-panel`: Main container
- `.conflict-info`: Conflict information section
- `.resolution-methods`: Method selection area
- `.resolution-actions`: Action buttons

### Method-Specific Classes
- `.method-selector`: Radio button group
- `.select-method`: Selection method container
- `.adjust-method`: Adjustment method container
- `.custom-method`: Custom method container

### UI Element Classes
- `.period-list`: List of conflicting periods
- `.period-item`: Individual period display
- `.selected`: Selected period highlight
- `.adjustment-preview`: Preview of adjustments
- `.custom-inputs`: Custom input fields

### Button Classes
- `.cancel-button`: Cancel action
- `.resolve-button`: Apply resolution
- `.input-group`: Form input grouping

## Edge Cases

1. **No Conflicts**: Display message when no conflicting periods exist
2. **Single Period**: Handle cases with only one period
3. **Invalid Years**: Validate custom year inputs
4. **Boundary Limits**: Ensure adjustments stay within valid ranges

## Best Practices

1. **Validation**
   - Ensure custom years are within valid ranges
   - Validate that start year ≤ end year
   - Check for new conflicts after adjustment

2. **User Experience**
   - Provide clear preview of changes
   - Show loading state during submission
   - Disable controls during processing

3. **Error Handling**
   - Catch and log resolution errors
   - Provide user feedback on failures
   - Allow retry on error

## Integration Example

```javascript
<ConflictResolutionPanel
  paramId="plantLifetimeAmount10"
  scalingGroupId={1}
  year={5}
  conflictingPeriods={[
    { start: 1, end: 10, value: 20 },
    { start: 5, end: 15, value: 25 }
  ]}
  onResolve={(resolution) => {
    // Handle the resolution
    applyConflictResolution(resolution);
  }}
  onCancel={() => {
    // Close the panel
    setShowConflictPanel(false);
  }}
/>
```

This component provides a user-friendly interface for resolving complex efficacy period conflicts, ensuring data integrity while maintaining flexibility in how conflicts are resolved.