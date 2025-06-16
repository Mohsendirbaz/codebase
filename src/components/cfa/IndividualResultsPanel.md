# IndividualResultsPanel.js - Architectural Summary

## Overview
A React component (340 lines) that displays individual CFA version results with the ability to view each version separately. It integrates with CustomizableTable component and provides detailed inspection capabilities for specific financial metrics.

## Core Architecture

### Level 1: Component Purpose
- **Individual Version Display**: View CFA results per version
- **Version Navigation**: Switch between different CFA versions
- **Cell Inspection**: Detailed breakdown of trackable cells
- **Table Integration**: Uses CustomizableTable for display

### Level 2: Props Interface
```javascript
{
  data: {
    columns: Array<string>,
    years: Array<number>,
    values: Array<Array>
  },
  selectedCell: object|null,
  inspectorVisible: boolean,
  inspectorPosition: {x, y},
  cellDetails: object|null,
  onCellClick: Function,
  onCloseInspector: Function,
  selectedVersions: Array      // List of selected versions
}
```

### Level 3: State Management
```javascript
Local State:
- viewingVersion: string|null    // Currently viewed version
- individualTableData: object    // Data for individual view
- loadingTable: boolean         // Loading state for table data
```

### Level 4: Data Transformation

#### Consolidated Table Data
```javascript
consolidatedTableData = years.map((year, rowIndex) => {
  return {
    Year: year,
    [column1]: value1,
    [column2]: value2,
    ...
  }
})
```
Transforms matrix data into row objects for CustomizableTable

### Level 5: View Modes

#### Consolidated View
- Shows merged data from all versions
- Standard table rendering
- Cell inspection available

#### Individual Version View
- Displays single version data
- Uses CustomizableTable component
- Version-specific insights

### Level 6: Render Methods

#### renderTableHeader()
- Year column plus dynamic columns
- Consistent with consolidated view
- Memoized for performance

#### renderTableBody()
- Trackable cell identification
- Number formatting
- Empty value handling
- Click event management

#### renderCellInspector()
- Floating detail panel
- Source breakdown display
- Loading states
- Close functionality

### Level 7: Version Management

#### Version Selection
- Dropdown or tab interface
- Load individual version data
- Update table display
- Maintain selection state

#### Data Loading
- Async version data fetch
- Loading indicators
- Error handling
- Cache management

### Level 8: Cell Tracking System

#### Trackable Columns
```javascript
isTrackable = column === 'Revenue' || column === 'Operating Expenses'
```

#### Cell Metadata
```javascript
cellData = {
  year: number,
  column: string,
  value: number,
  rowIndex: number,
  colIndex: number
}
```

### Level 9: Integration Features

#### CustomizableTable Usage
- Data format conversion
- Column configuration
- Styling inheritance
- Event propagation

#### Inspector Integration
- Shared inspector component
- Position calculation
- Detail fetching
- UI synchronization

### Level 10: Performance Optimizations

#### Memoization Strategy
- validatedData with useMemo
- consolidatedTableData transformation
- Render method callbacks
- Dependency optimization

#### Conditional Rendering
- Early validation return
- Inspector visibility check
- Loading state management
- Minimal re-renders

## Key Features

### Data Display
1. **Dual View Support**: Consolidated and individual
2. **Interactive Cells**: Click for details
3. **Number Formatting**: Locale-aware display
4. **Empty Handling**: Graceful null display

### Navigation
1. **Version Switching**: Easy navigation
2. **State Preservation**: Maintains selections
3. **Loading Feedback**: Clear indicators
4. **Error Recovery**: Graceful failures

### Inspection
1. **Cell Details**: Comprehensive breakdown
2. **Source Tracking**: Version contributions
3. **Visual Indicators**: Info icons
4. **Responsive Positioning**: Smart placement

## Usage Pattern
```javascript
<IndividualResultsPanel
  data={cfaData}
  selectedCell={currentCell}
  inspectorVisible={showInspector}
  inspectorPosition={position}
  cellDetails={details}
  onCellClick={handleCellSelection}
  onCloseInspector={handleClose}
  selectedVersions={versions}
/>
```

## CSS Architecture
```css
Inherits from ResultsPanel styles:
.results-panel
.results-panel__header
.results-panel__content
.table-cell.trackable
.cell-inspector

Additional styles:
.version-selector
.individual-view
.loading-overlay
```

This component extends ResultsPanel functionality with individual version viewing capabilities while maintaining consistent interaction patterns and visual design.