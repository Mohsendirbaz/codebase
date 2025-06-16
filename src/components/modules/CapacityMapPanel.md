# CapacityMapPanel.js - Capacity Usage Visualization Component

## Overview

`CapacityMapPanel.js` is a sophisticated capacity management component that visualizes and manages the application's computational capacity across multiple dimensions. It tracks usage of parameters, scaling groups, sensitivity variations, versions, and temporal configurations, providing insights into system utilization and optimization opportunities.

## Architecture

### Core Features
- Real-time capacity usage calculation
- Multi-dimensional capacity tracking
- Advanced configuration controls
- Usage visualization with progress indicators
- Weighted capacity calculations
- Theoretical maximum computations

### Dependencies
```javascript
import { 
  Card, Typography, Slider, InputNumber, Row, Col, 
  Divider, Progress, Tooltip, Switch, Table, Button, Alert 
} from 'antd';
```

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `currentState` | Object | Current application state with usage data |
| `onCapacityConfigChange` | Function | Callback when capacity configuration changes |
| `onClose` | Function | Callback to close the panel |

## Capacity Configuration

### Default Configuration
```javascript
const defaultCapacityConfig = {
  maxValues: {
    parameters: 75,           // S10-S84
    scalingGroups: 5,         // Per parameter
    sensitivityVariations: 6, // Per parameter-scaling group
    versions: 20,
    years: 20                 // Plant lifetime
  },
  weights: {
    parameters: 4,
    scalingGroups: 5,
    sensitivityVariations: 3,
    versions: 3,
    years: 4
  }
};
```

### Capacity Dimensions

1. **Parameters** (S10-S84)
   - Maximum: 75 parameters
   - Weight: 4
   - Core configuration elements

2. **Scaling Groups**
   - Maximum: 5 per parameter
   - Weight: 5
   - Hierarchical organization

3. **Sensitivity Variations**
   - Maximum: 6 per parameter-scaling group
   - Weight: 3
   - Variation analysis

4. **Versions**
   - Maximum: 20 versions
   - Weight: 3
   - Configuration history

5. **Years**
   - Maximum: 20 years (plant lifetime)
   - Weight: 4
   - Temporal dimension

## Usage Metrics Calculation

### Raw Metrics
```javascript
{
  usedParameters: 50,
  totalScalingGroupsUsed: 150,
  totalVariationsUsed: 600,
  usedVersions: 8,
  yearsConfigured: 15
}
```

### Local Usage Percentages
```javascript
{
  parameterUsage: (usedParameters / maxParameters) * 100,
  scalingGroupUsage: (avgScalingGroups / maxScalingGroups) * 100,
  variationUsage: (avgVariations / maxVariations) * 100,
  versionUsage: (usedVersions / maxVersions) * 100,
  yearUsage: (yearsConfigured / maxYears) * 100
}
```

### Weighted Capacity Calculations

#### Current Weighted Usage
```javascript
currentWeightedUsage = 
  (parameters * parameterWeight) +
  (scalingGroups * scalingGroupWeight) +
  (variations * variationWeight) +
  (versions * versionWeight) +
  (years * yearWeight);
```

#### Maximum Weighted Capacity
```javascript
maxWeightedCapacity = 
  (maxParameters * parameterWeight) +
  (maxScalingGroups * scalingGroupWeight) +
  (maxVariations * variationWeight) +
  (maxVersions * versionWeight) +
  (maxYears * yearWeight);
```

### Category Metrics

1. **Configuration Capacity**
   - Combines parameters, scaling groups, variations
   - Represents structural complexity

2. **Temporal Capacity**
   - Combines versions and years
   - Represents time-based utilization

### Theoretical Maximums
```javascript
{
  theoreticalMaxCapacity: parameters × scalingGroups × variations × versions × years,
  // Example: 75 × 5 × 6 × 20 × 20 = 900,000 configurations
}
```

## UI Components

### 1. Overview Section
```javascript
<Card title="Overall Capacity">
  <Progress
    percent={overallUsagePercent}
    status={getStatusColor(overallUsagePercent)}
    strokeWidth={20}
  />
  <Statistic
    title="Total Configurations"
    value={formatLargeNumber(usedConfigurations)}
  />
</Card>
```

### 2. Category Utilization
- **Configuration Capacity**: Progress bar for structural usage
- **Temporal Capacity**: Progress bar for time-based usage

### 3. Detailed Metrics Table
```javascript
columns = [
  { title: 'Component', dataIndex: 'label' },
  { title: 'Usage', key: 'usage' },
  { title: 'Utilization', key: 'usagePercent' }
]
```

### 4. Configuration Controls

#### Max Value Sliders
```javascript
<Row gutter={16}>
  <Col span={12}>
    <Text>Max Parameters</Text>
    <Slider
      min={10}
      max={100}
      value={capacityConfig.maxValues.parameters}
      onChange={(value) => handleMaxValueChange('parameters', value)}
    />
  </Col>
  <Col span={4}>
    <InputNumber
      min={10}
      max={100}
      value={capacityConfig.maxValues.parameters}
      onChange={(value) => handleMaxValueChange('parameters', value)}
    />
  </Col>
</Row>
```

#### Weight Configuration
- Similar slider/input controls for each weight
- Real-time recalculation on change

## Visual Indicators

### Progress Colors
```javascript
const getStatusColor = (percentage) => {
  if (percentage < 50) return 'success';  // Green
  if (percentage < 80) return 'warning';  // Yellow
  return 'exception';                      // Red
};
```

### Number Formatting
```javascript
const formatLargeNumber = (num) => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};
```

## Efficacy Time Constraint

The system enforces specific constraints:
- One value per parameter per time unit per scaling group
- Each scaling group can be customized for every time unit
- Same sensitivity variations apply across time units

### Alert Display
```javascript
<Alert
  message="Efficacy Time Constraint"
  description="The system enforces one value per parameter per time unit..."
  type="info"
  showIcon
/>
```

## State Management

### Local State
```javascript
const [capacityConfig, setCapacityConfig] = useState(defaultCapacityConfig);
const [usageMetrics, setUsageMetrics] = useState(null);
const [showAdvanced, setShowAdvanced] = useState(false);
const [activeTab, setActiveTab] = useState('overview');
```

### Effect Hook
```javascript
useEffect(() => {
  if (currentState) {
    const metrics = calculateUsageMetrics(currentState, capacityConfig);
    setUsageMetrics(metrics);
  }
}, [currentState, capacityConfig]);
```

## Event Handlers

### Configuration Changes
```javascript
const handleMaxValueChange = (key, value) => {
  const updatedConfig = {
    ...capacityConfig,
    maxValues: { ...capacityConfig.maxValues, [key]: value }
  };
  setCapacityConfig(updatedConfig);
  onCapacityConfigChange?.(updatedConfig);
};
```

### Reset Function
```javascript
const handleReset = () => {
  setCapacityConfig(defaultCapacityConfig);
  onCapacityConfigChange?.(defaultCapacityConfig);
};
```

## CSS Classes

- `.capacity-map-panel`: Main container
- `.overview-section`: Overall metrics display
- `.category-section`: Category utilization
- `.local-usage-section`: Detailed metrics table
- `.capacity-config-section`: Configuration controls
- `.capacity-stats`: Statistics display

## Best Practices

1. **Performance Optimization**
   - Memoize expensive calculations
   - Debounce slider changes
   - Use React.memo for child components

2. **User Experience**
   - Clear visual indicators
   - Tooltips for complex metrics
   - Progressive disclosure (advanced mode)

3. **Data Accuracy**
   - Validate configuration limits
   - Handle edge cases in calculations
   - Provide fallback values

## Integration Example

```javascript
<CapacityMapPanel
  currentState={{
    usedParameters: 50,
    scalingGroupsPerParameter: { /* data */ },
    variationsPerParameterScalingGroup: { /* data */ },
    usedVersions: 8,
    yearsConfigured: 15
  }}
  onCapacityConfigChange={(newConfig) => {
    // Handle configuration updates
  }}
  onClose={() => setShowPanel(false)}
/>
```

This component provides comprehensive capacity tracking and management, enabling users to understand system utilization, identify bottlenecks, and optimize configuration strategies for maximum efficiency.