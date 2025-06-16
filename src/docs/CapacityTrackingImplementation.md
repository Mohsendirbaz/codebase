# Capacity Tracking Implementation

## Overview

This document outlines the implementation of a capacity tracking system for the application. The system allows tracking and reporting of usage percentages for various components, providing users with visibility into how much of the theoretical capacity they are utilizing.

## Current Implementation

### 1. CapacityTrackingService

A new service has been created to handle capacity tracking across different components:

- **File**: `src/services/CapacityTrackingService.js`
- **Purpose**: Provides a centralized way to track capacity utilization for various components
- **Features**:
  - Set and get capacity limits for different components
  - Update and retrieve usage counts
  - Calculate usage percentages
  - Get comprehensive usage statistics

### 2. SensitivityMonitor Integration

The SensitivityMonitor component has been updated to display capacity utilization:

- **File**: `src/components/modules/SensitivityMonitor.js`
- **Changes**:
  - Added usage percentage tracking
  - Added visual indicator showing percentage of capacity used
  - Added color-coded progress bar (green, orange, red) based on usage level

## Identified Components for Capacity Tracking

Based on the codebase analysis, the following components are suitable for capacity tracking:

1. **SensitivityMonitor**
   - **Capacity Metric**: Number of enabled sensitivity variables (S10-S84)
   - **Default Capacity**: 6 variables
   - **Implementation Status**: ✅ Implemented

2. **Scaling Groups**
   - **Capacity Metric**: Number of scaling groups
   - **Default Capacity**: 10 groups
   - **Implementation Status**: ⏳ Service ready, UI integration pending

3. **Other Potential Components**:
   - Process Economics Items
   - Visualization Panels
   - Model Configurations
   - Calculation Engines

## Recommendations for Map Panel Implementation

### 1. Create a Capacity Management Panel

Develop a dedicated panel where users can view and adjust capacity limits:

```jsx
// Example component structure
const CapacityManagementPanel = () => {
  const [capacityLimits, setCapacityLimits] = useState({});
  const [usageStats, setUsageStats] = useState({});
  
  useEffect(() => {
    // Load initial capacity limits
    const limits = {};
    for (const key in capacityTracker.capacityLimits) {
      limits[key] = capacityTracker.getCapacityLimit(key);
    }
    setCapacityLimits(limits);
    
    // Load usage statistics
    setUsageStats(capacityTracker.getAllUsageStats());
  }, []);
  
  const handleLimitChange = (componentKey, newLimit) => {
    capacityTracker.setCapacityLimit(componentKey, newLimit);
    setCapacityLimits({
      ...capacityLimits,
      [componentKey]: newLimit
    });
    setUsageStats(capacityTracker.getAllUsageStats());
  };
  
  return (
    <div className="capacity-management-panel">
      <h2>Capacity Management</h2>
      
      {Object.keys(capacityLimits).map(key => (
        <div key={key} className="capacity-item">
          <h3>{getComponentDisplayName(key)}</h3>
          
          <div className="capacity-controls">
            <label>
              Capacity Limit:
              <input 
                type="number" 
                min="1"
                value={capacityLimits[key]} 
                onChange={(e) => handleLimitChange(key, parseInt(e.target.value))}
              />
            </label>
          </div>
          
          <div className="usage-stats">
            <div className="usage-label">
              Current Usage: {usageStats[key]?.usage || 0} / {capacityLimits[key]} 
              ({usageStats[key]?.percentage || 0}%)
            </div>
            <div className="usage-bar">
              <div 
                className="usage-fill" 
                style={{ 
                  width: `${usageStats[key]?.percentage || 0}%`,
                  backgroundColor: getColorForPercentage(usageStats[key]?.percentage || 0)
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 2. Integration with Application Settings

- Add the capacity management panel to the application settings or admin section
- Ensure settings are persisted (localStorage, database, etc.)
- Add user permission controls if needed

### 3. Real-time Updates

- Implement a subscription mechanism in the CapacityTrackingService
- Allow components to subscribe to capacity changes
- Update UI components when capacity limits change

### 4. User Guidance

- Add tooltips explaining the purpose of capacity limits
- Provide warnings when approaching capacity limits
- Add documentation on best practices for setting limits

### 5. Performance Considerations

- Monitor performance impact of tracking usage
- Consider batch updates for high-frequency changes
- Implement throttling for UI updates

## Implementation Roadmap

1. **Phase 1** ✅
   - Create CapacityTrackingService
   - Implement tracking for SensitivityMonitor

2. **Phase 2**
   - Implement tracking for Scaling Groups
   - Create basic capacity management panel

3. **Phase 3**
   - Add persistence for capacity settings
   - Implement real-time updates

4. **Phase 4**
   - Extend to additional components
   - Add advanced features (analytics, recommendations)

## Conclusion

The capacity tracking system provides valuable insights into application usage patterns and helps users understand the limitations of the system. By implementing a comprehensive map panel for adjusting capacity limits, we can give users more control over their experience while preventing system overload.

The current implementation demonstrates the concept with the SensitivityMonitor component, and the same approach can be extended to other components throughout the application.