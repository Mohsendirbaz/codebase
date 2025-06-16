# Capacity Map Panel Implementation

## Overview

This document outlines the implementation of the CapacityMapPanel component, which provides a comprehensive visualization and configuration interface for application capacity usage.

## Components Implemented

1. **CapacityMapPanel.js**: The main React component that displays capacity usage metrics and allows configuration of capacity limits.
2. **CapacityMapPanel.css**: Styling for the CapacityMapPanel component.

## Features

The CapacityMapPanel component provides the following features:

1. **Global Capacity Visualization**: Shows overall system capacity utilization with a dashboard-style progress indicator.
2. **Category Utilization**: Breaks down capacity usage into configuration and temporal categories.
3. **Detailed Metrics**: Displays detailed capacity metrics for each component (parameters, scaling groups, sensitivity variations, versions, years).
4. **Configuration Controls**: Allows adjustment of capacity limits for each component.
5. **Weight Configuration**: Enables customization of how different components affect the overall capacity calculation.
6. **Capacity Impact Calculator**: Shows the theoretical maximum capacity based on current settings.

## Implementation Details

### Dependencies

The CapacityMapPanel component requires the following dependencies:

1. **antd**: Ant Design component library for React
2. **@ant-design/icons**: Icon components for Ant Design

These dependencies need to be installed in the project:

```bash
npm install antd @ant-design/icons
```

### File Locations

- **Component**: `src/components/modules/CapacityMapPanel.js`
- **Styling**: `src/styles/HomePage.CSS/CapacityMapPanel.css`

### Usage

To use the CapacityMapPanel component, import it and include it in your React component:

```jsx
import CapacityMapPanel from './components/modules/CapacityMapPanel';
import './styles/HomePage.CSS/CapacityMapPanel.css';

// Example usage
const MyComponent = () => {
  const currentState = {
    usedParameters: 50,
    scalingGroupsPerParameter: {
      // Example data structure - in a real app, this would be populated with actual data
      'S10': 3,
      'S11': 4,
      'S12': 2,
      // ... and so on for all used parameters
    },
    variationsPerParameterScalingGroup: {
      // Example data structure - in a real app, this would be populated with actual data
      'S10_1': 4,
      'S10_2': 5,
      'S10_3': 3,
      'S11_1': 4,
      // ... and so on for all parameter-scaling group combinations
    },
    usedVersions: 8,
    yearsConfigured: 15
  };

  const handleCapacityConfigChange = (newConfig) => {
    console.log('Capacity configuration updated:', newConfig);
    // In a real app, save this configuration to your state management or backend
  };

  return (
    <div style={{ padding: 20 }}>
      <CapacityMapPanel 
        currentState={currentState}
        onCapacityConfigChange={handleCapacityConfigChange}
      />
    </div>
  );
};
```

## Key Concepts

### Degree of Freedom Constraint

The component emphasizes the degree of freedom constraint: only one value per parameter per time unit (year) per scaling group is possible. This creates a multiplicative effect on capacity:

```
Parameters × Scaling Groups × Sensitivity Variations × Years × Versions
```

### Capacity Calculation

The component calculates capacity usage based on:

1. **Parameters**: Number of parameters used (S10-S84)
2. **Scaling Groups**: Number of scaling groups per parameter
3. **Sensitivity Variations**: Number of sensitivity variations per parameter-scaling group combination
4. **Versions**: Number of configurable versions
5. **Years**: Plant lifetime in years

### Weighted Metrics

The component uses weighted averages to calculate category and global capacity usage, allowing different components to have different impacts on the overall capacity calculation.

## Next Steps

1. Install the required dependencies (antd and @ant-design/icons)
2. Import the CapacityMapPanel component in the appropriate location in the application
3. Provide the necessary props (currentState and onCapacityConfigChange)
4. Test the component to ensure it works as expected