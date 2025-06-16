# CalculationMonitor.js - Architectural Summary

## Overview
A real-time monitoring component (443 lines) that displays live updates during price optimization and sensitivity analysis calculations. It supports matrix-based formulations and provides visual feedback for multi-version, multi-zone calculations.

## Core Architecture

### Level 1: Component Purpose
- **Real-time Monitoring**: Displays calculation progress via EventSource (SSE)
- **Multi-Version Support**: Handles multiple concurrent calculations
- **Matrix Integration**: Works with version/zone matrix structure
- **Visual Feedback**: Progress bars, status updates, and completion tracking

### Level 2: Props Interface
```javascript
{
  selectedVersions: Array,      // Versions being processed
  updatePrice: Function,        // Price update callback
  isActive: Boolean,           // Monitor visibility state
  versionsInfo: Object,        // Matrix version metadata
  zonesInfo: Object,           // Matrix zone metadata
  currentVersion: String,      // Current active version
  isSensitivity: Boolean,      // Calculation type flag
  onComplete: Function         // Completion callback
}
```

### Level 3: State Management

#### Monitor Data Structure
```javascript
monitorData = {
  [version]: {
    label: string,             // Version display name
    iteration: number,         // Current iteration
    maxIterations: number,     // Total iterations
    price: number,            // Current price
    npv: number,              // Net present value
    status: string,           // Current status
    messages: Array,          // Status messages
    startTime: timestamp,     // Calculation start
    duration: number,         // Elapsed time
    progress: number,         // Progress percentage
    convergence: object,      // Convergence metrics
    sensitivity: object       // Sensitivity results
  }
}
```

#### Matrix Information State
```javascript
matrixInfo = {
  activeVersions: Array,      // Currently processing versions
  activeZones: Array,        // Active zones
  parameterUpdates: Object   // Parameter change tracking
}
```

### Level 4: EventSource Integration

#### Connection Management
- **Multi-Port Support**: Port 5007 for price, 2500 for sensitivity
- **Dynamic Endpoints**: `/stream_price/` or `/stream_sensitivity/`
- **Version ID Handling**: Supports both numeric and matrix IDs (v1, v2)
- **Connection Lifecycle**: Automatic setup and cleanup

#### Event Handlers
1. **onopen**: Connection established
2. **onmessage**: Process calculation updates
3. **onerror**: Handle connection errors
4. **cleanup**: Close connections on unmount

### Level 5: Real-time Update Processing

#### Message Types
- **Iteration Updates**: Progress tracking
- **Price Updates**: Current optimization values
- **NPV Updates**: Financial metrics
- **Status Messages**: Calculation state
- **Completion Events**: Final results
- **Error Events**: Failure handling

#### Data Flow
1. EventSource receives SSE messages
2. Parse JSON data from event
3. Update monitorData state
4. Trigger UI re-render
5. Execute callbacks on completion

### Level 6: UI Components

#### Progress Display
- Version-specific progress bars
- Percentage calculations
- Time elapsed tracking
- Iteration counters

#### Status Indicators
- Color-coded status (running, complete, error)
- Real-time message display
- Convergence visualization
- Matrix parameter updates

#### Results Section
- Final price display
- NPV calculations
- Sensitivity analysis results
- Export capabilities

### Level 7: Matrix Version Support

#### Version ID Resolution
```javascript
// Handle different version formats
- Numeric: 1, 2, 3
- Matrix: v1, v2, v3
- Conversion logic for API compatibility
```

#### Version Metadata Integration
- Extract labels from versionsInfo
- Display user-friendly names
- Track version relationships
- Support version branching

### Level 8: Performance Features

#### Connection Pooling
- Reuse EventSource connections
- Efficient cleanup on unmount
- Connection state management
- Automatic reconnection logic

#### State Updates
- Batched state updates
- Debounced progress updates
- Memory-efficient message storage
- Selective re-rendering

### Level 9: Error Handling

#### Connection Errors
- Retry logic with backoff
- Fallback to polling
- User notification
- Error state display

#### Calculation Errors
- Error message parsing
- Stack trace display (dev mode)
- Recovery suggestions
- Error logging

### Level 10: Advanced Features

#### Multi-Zone Support
- Zone-specific calculations
- Cross-zone comparisons
- Zone result aggregation
- Zone-based visualizations

#### Sensitivity Analysis Mode
- Parameter sweep visualization
- Tornado chart data collection
- Scenario comparison
- Real-time sensitivity updates

#### Export Functionality
- CSV export for results
- JSON export for full data
- Chart image export
- Report generation hooks

## Component Lifecycle

### Initialization
1. Check if monitor is active
2. Determine versions to monitor
3. Extract version metadata
4. Setup EventSource connections

### Runtime
1. Receive SSE updates
2. Parse and validate data
3. Update component state
4. Render progress UI
5. Track completion status

### Cleanup
1. Close all EventSource connections
2. Clear timeouts and intervals
3. Save final results
4. Execute completion callbacks

## Integration Points
- Parent component callbacks
- Matrix state management
- Backend calculation services
- Export utilities
- Visualization components

## Security Considerations
- Validate incoming SSE data
- Sanitize display messages
- Secure connection handling
- Rate limiting awareness