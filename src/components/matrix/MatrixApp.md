# Matrix App Component

## Overview
A comprehensive integrated component that combines all matrix-based functionality in a single interface. Provides tabbed navigation for input configuration and results visualization, handling form submission, scaling groups, and matrix-based processing for the ModEcon system.

## Architecture

### Component Structure
- **Type**: React Functional Component
- **Size**: 409 lines
- **Pattern**: Tabbed interface with sub-components
- **Dependencies**: MatrixSubmissionService, ExtendedScaling, GeneralFormConfig

### State Management
1. **Tab Navigation**
   - `activeTab`: Main tab selection (input/results)
   - `activeSubTab`: Sub-tab within input configuration

2. **Scaling States**
   - `activeScalingGroups`: Active group per amount category
   - `scalingBaseCosts`: Base cost structure for scaling

## Core Features

### 1. Matrix-Based Processing
- **Dynamic Value Extraction**:
  ```javascript
  paramValue = value.matrix?.[activeVersion]?.[activeZone] || 0
  ```
- **Category Mapping**: Amount1-7 categories
- **Sorted Entry Processing**: Numeric suffix ordering

### 2. Tabbed Interface
#### Main Tabs
- Input Configuration
- Results & Visualization

#### Sub-Tabs (Input Configuration)
1. Project Configuration (Amount1)
2. Loan Configuration (Amount2)
3. Rates & Fixed Costs (Amount3)
4. Process Quantities (Amount4)
5. Process Costs (Amount5)
6. Additional Revenue Quantities (Amount6)
7. Additional Revenue Prices (Amount7)
8. + Scaling
9. Fixed Revenue Components

### 3. Version/Zone Management
- **Dynamic Selectors**: Version and zone dropdowns
- **Creation Actions**: Add new versions/zones
- **Metadata Display**: User-friendly labels

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `formValues` | object | Matrix-based form data |
| `handleInputChange` | function | Input change handler |
| `version` | string | Current version (default: "1") |
| `S, F, V, R, RF` | object | Toggle state objects |
| `setS, toggleF/V/R/RF` | function | State setters |
| `subDynamicPlots` | object | Dynamic plot states |
| `scalingGroups` | array | Scaling group configurations |
| `finalResults` | object | Processed results |

## Data Processing

### Scaling Base Costs Generation
1. **Category Extraction**: Filters by Amount type
2. **Entry Sorting**: Numeric suffix ordering
3. **Value Mapping**:
   ```javascript
   {
     id: key,
     label: value.label,
     value: parseFloat(paramValue),
     baseValue: parseFloat(paramValue),
     vKey: dynamicAppendix?.itemState?.vKey,
     rKey: dynamicAppendix?.itemState?.rKey
   }
   ```

### Form Submission Flow
1. Extract active version
2. Parse numeric version
3. Submit via MatrixSubmissionService
4. Handle response/errors

## UI Components

### Matrix Selectors
- Version dropdown with metadata
- Zone dropdown with metadata
- "New" buttons for creation
- Conditional rendering based on formValues

### Sub-Tab Content
- **GeneralFormConfig Integration**:
  - Filter by keyword (Amount1-7)
  - Pass appropriate toggles (V, R, F, RF)
  - Include summary items

- **ExtendedScaling Integration**:
  - Base costs from scalingBaseCosts
  - Filtered scaling groups
  - Active group management
  - Final results generation

### Action Buttons
- Submit Complete Set
- Sync with Backend

## Service Integration

### MatrixSubmissionService
```javascript
const submissionResult = await matrixService.submitMatrixFormValues(
  formValues,
  numericVersion
);
```

### Event Handlers
- `handleActiveGroupChange`: Updates active scaling group
- `handleFinalResultsGenerated`: Stores summary items
- `handleSubmitCompleteSet`: Form submission workflow

## CSS Classes

### Layout Classes
- `.matrix-app`: Root container
- `.main-tabs`: Primary tab navigation
- `.input-panel`: Input configuration area
- `.results-panel`: Results display area

### Navigation Classes
- `.sub-tab-buttons`: Sub-tab container
- `.sub-tab-button`: Individual sub-tab
- `.active`: Active tab indicator

### Control Classes
- `.matrix-selectors`: Version/zone area
- `.version-selector`: Version controls
- `.zone-selector`: Zone controls
- `.form-actions`: Button container

## Performance Optimizations
- `useMemo` for service instantiation
- Filtered scaling group processing
- Conditional rendering for matrix features
- Efficient state updates

## Integration Patterns

### Component Communication
- Props drilling for state management
- Callback propagation for updates
- Service layer for backend ops

### Scaling Group Management
```javascript
const updatedGroups = newGroups.map(g => ({
  ...g, 
  _scalingType: 'Amount4'
}));
```

## Future Enhancements
- Results visualization implementation
- Chart integration
- Export functionality
- Real-time sync indicators
- Validation feedback