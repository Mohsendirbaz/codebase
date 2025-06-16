# ResultsPanel.js - Architectural Summary

## Overview
A React component (223 lines) that displays consolidated CFA results in a tabular format with interactive cell inspection capabilities. It provides detailed breakdowns of trackable financial metrics like Revenue and Operating Expenses.

## Core Architecture

### Level 1: Component Purpose
- **Results Display**: Tabular view of consolidated CFA data
- **Cell Inspection**: Detailed breakdown of trackable cells
- **Data Validation**: Ensures data integrity before rendering
- **Interactive Features**: Click-to-inspect functionality

### Level 2: Props Interface
```javascript
{
  data: {
    columns: Array<string>,   // Column headers
    years: Array<number>,     // Year values
    values: Array<Array>      // 2D data matrix
  },
  selectedCell: object|null,  // Currently selected cell
  inspectorVisible: boolean,  // Inspector visibility
  inspectorPosition: {x, y},  // Inspector coordinates
  cellDetails: object|null,   // Detailed cell data
  onCellClick: Function,      // Cell click handler
  onCloseInspector: Function  // Inspector close handler
}
```

### Level 3: Data Validation

#### Validated Data Structure
```javascript
validatedData = useMemo(() => {
  Validates:
  - data exists
  - data.columns exists
  - data.years exists
  - data.values exists
  Returns: validated data or null
})
```

### Level 4: Render Methods

#### renderTableHeader()
- Memoized for performance
- Year column + dynamic columns
- Responsive header styling

#### renderTableBody()
- Row-based rendering
- Cell-level interactivity
- Conditional formatting
- Number formatting with locale

#### renderCellInspector()
- Floating inspector panel
- Source data breakdown
- Loading states
- Positioned near selected cell

### Level 5: Cell Classification

#### Trackable Cells
- Revenue columns
- Operating Expenses columns
- Visual indicator (ℹ️)
- Click handlers attached

#### Non-Trackable Cells
- All other financial metrics
- No click interaction
- Standard display only

#### Empty Cells
- Null, undefined, or 0 values
- Display as dash (-)
- Special CSS class

### Level 6: Inspector Features

#### Inspector Content
```javascript
Cell Inspector Structure:
├── Header
│   ├── Title (Column Name)
│   └── Close Button
├── Content
│   ├── Selected Year
│   ├── Total Value
│   └── Source Breakdown
│       ├── Version ID
│       └── Contribution Value
└── Loading State (when applicable)
```

#### Source Data Display
- Version-by-version breakdown
- Percentage contribution
- Formatted values
- Visual hierarchy

### Level 7: Formatting and Display

#### Number Formatting
```javascript
value.toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})
```

#### CSS Classes
```css
.results-panel
.results-panel__header
.results-panel__title
.results-panel__content
.results-panel__table
.table-header
.table-header.year
.table-cell
.table-cell.year
.table-cell.trackable
.table-cell.empty
.cell-indicator
.cell-inspector
.cell-inspector__header
.cell-inspector__content
.cell-inspector__loading
.source-breakdown
.source-item
```

### Level 8: Performance Optimizations

#### Memoization
- validatedData with useMemo
- Render methods with useCallback
- Dependency arrays optimized

#### Conditional Rendering
- Early return for invalid data
- Inspector only when visible
- Minimal DOM updates

### Level 9: Interaction Patterns

#### Cell Click Flow
1. User clicks trackable cell
2. onCellClick called with cell data
3. Parent updates selectedCell
4. Inspector positioned and shown
5. Cell details fetched/displayed

#### Inspector Behavior
- Positioned near clicked cell
- Stays within viewport bounds
- Close button or outside click
- Loading state while fetching

### Level 10: Error Handling

#### Data Validation Errors
- Graceful fallback UI
- Clear error messaging
- No crashes on bad data

#### Empty State Handling
- Dash display for empty values
- CSS styling for clarity
- Maintains table structure

## Key Features
1. **Consolidated View**: All CFA versions merged
2. **Interactive Inspection**: Click for details
3. **Performance**: Optimized rendering
4. **Data Integrity**: Validation before display
5. **Responsive**: Adapts to content

## Usage Pattern
```javascript
<ResultsPanel
  data={consolidatedData}
  selectedCell={selectedCell}
  inspectorVisible={showInspector}
  inspectorPosition={position}
  cellDetails={details}
  onCellClick={handleCellClick}
  onCloseInspector={handleCloseInspector}
/>
```

This component provides a comprehensive view of consolidated CFA results with advanced inspection capabilities for financial analysis.