# Library Integration Module

## Overview
A wrapper component that integrates the Process Economics Library with the CentralScalingTab, providing configuration import/export capabilities and library access for scaling configurations.

## Architecture

### Component Structure
- **Type**: React Functional Component
- **Purpose**: Library and scaling integration
- **Pattern**: Modal overlay with state management

### Key Dependencies
- ProcessEconomicsLibrary
- CentralScalingTab
- HCSS styles

## Core Features

### 1. Library Modal Management
- Toggle library visibility
- Modal overlay implementation
- Configuration preparation

### 2. Configuration Export
- Current state capture
- Metadata generation
- Scaling group filtering

### 3. Configuration Import
- Library selection handling
- Group integration
- Type preservation

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `formValues` | object | Form data values |
| `V, R` | object | Toggle states |
| `toggleV, toggleR` | function | Toggle handlers |
| `scalingBaseCosts` | object | Base cost data |
| `setScalingBaseCosts` | function | Cost setter |
| `scalingGroups` | array | Scaling configurations |
| `onScalingGroupsChange` | function | Group update handler |
| `onScaledValuesChange` | function | Value change handler |
| `filterKeyword` | string | Active category filter |
| `initialScalingGroups` | array | Initial configurations |
| `activeGroupIndex` | number | Selected group index |
| `onActiveGroupChange` | function | Group selection handler |
| `onFinalResultsGenerated` | function | Results callback |

## State Management

### Local State
```javascript
const [showLibrary, setShowLibrary] = useState(false);
const [currentConfiguration, setCurrentConfiguration] = useState(null);
const [activeScalingGroups, setActiveScalingGroups] = useState({
    Amount4: 0,
    Amount5: 0,
    Amount6: 0,
    Amount7: 0
});
```

### Configuration Structure
```javascript
{
    version: "1.2.0",
    metadata: {
        exportDate: ISO string,
        exportedBy: "ScalingModule",
        description: Category description,
        scalingType: filterKeyword
    },
    currentState: {
        selectedGroupIndex: number,
        scalingGroups: array,
        protectedTabs: array,
        tabConfigs: array,
        itemExpressions: object
    }
}
```

## Key Functions

### prepareCurrentConfiguration()
1. Filters groups by scaling type
2. Generates tab configurations
3. Creates metadata
4. Returns complete configuration

### handleImportConfiguration()
1. Extracts imported groups
2. Preserves other types
3. Updates scaling groups
4. Selects first imported group

### handleActiveGroupChange()
- Updates active group by category
- Maintains separate indices per type

## UI Components

### Library Button
- SVG icon (book with heart)
- Opens library modal
- Styled action button

### CentralScalingTab Integration
- Pass-through props
- Active group management
- Normal scaling interface

### Library Modal
- Overlay presentation
- ProcessEconomicsLibrary component
- Close and import handlers

## CSS Classes

### Component Classes
- `.library-integration`: Root container
- `.library-button-container`: Button wrapper
- `.open-library-button`: Action button
- `.library-icon`: SVG icon styling
- `.library-modal-overlay`: Modal backdrop

## Integration Flow

### Export Flow
1. User clicks library button
2. Current configuration prepared
3. Library modal opens
4. Configuration available for save

### Import Flow
1. User selects library item
2. Configuration imported
3. Groups updated with type preservation
4. First group auto-selected
5. Library closes

## Type Management

### Scaling Type Preservation
```javascript
...importedGroups.map(group => ({
    ...group,
    _scalingType: filterKeyword
}))
```
- Ensures imported groups match current context
- Prevents type mixing
- Maintains data integrity

## Best Practices

### Configuration Management
- Clear version tracking
- Comprehensive metadata
- Type-safe operations

### State Synchronization
- Proper callback usage
- Clean state updates
- Consistent type handling

### User Experience
- Clear visual indicators
- Smooth modal transitions
- Intuitive import/export