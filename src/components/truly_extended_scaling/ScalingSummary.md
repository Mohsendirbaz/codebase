# ScalingSummary Component Documentation

## Overview
The `ScalingSummary` component is an advanced data visualization table that displays scaling operations across multiple items and tabs. It provides comprehensive tracking of value transformations, supports V/R state management, and includes filtering capabilities for large datasets.

## Key Features

### 1. **Cumulative Calculation Tracking**
- Shows original values and transformations through each scaling tab
- Displays step-by-step calculation breakdowns
- Tracks intermediate results and final values

### 2. **V/R State Integration**
- Direct manipulation of V/R checkboxes within the summary
- Visual indicators for V/R associations
- Real-time state synchronization

### 3. **Advanced Filtering**
- Filter by V items, R items, or other items
- Search functionality across labels and keys
- Persistent filter state

### 4. **Interactive UI**
- Expandable rows showing calculation steps
- Animated value transitions
- Expression input for custom formulas

## Component Props

```typescript
interface ScalingSummaryProps {
  items: SummaryItem[];                    // Items to display
  tabConfigs: TabConfig[];                 // Tab configuration
  onExpressionChange?: (id, expr) => void; // Expression change callback
  V?: Object;                              // V state object
  R?: Object;                              // R state object
  toggleV?: (key: string) => void;        // V toggle function
  toggleR?: (key: string) => void;        // R toggle function
}
```

## Data Types

### SummaryItem
```typescript
interface SummaryItem {
  id: string;                              // Unique identifier
  label: string;                           // Display label
  originalValue: number;                   // Initial value
  vKey?: string;                          // V reference key
  rKey?: string;                          // R reference key
  scaledValues: Record<string, number>;    // Scaled values by tab ID
  finalResult?: number;                    // Final calculated result
}
```

### TabConfig
```typescript
interface TabConfig {
  id: string;                              // Unique identifier
  label: string;                           // Display label
  isParenthesis?: boolean;                // Parenthesis indicator
}
```

## State Management

### Internal State
```javascript
{
  itemExpressions: {},        // Custom expressions per item
  intermediateResults: {},    // Calculated intermediate values
  lastUpdated: null,         // Timestamp for animations
  expandedRows: {},          // Expanded row states
  filterOptions: {           // Current filter settings
    showVItems: true,
    showRItems: true,
    showOtherItems: true,
    searchTerm: ''
  }
}
```

### Intermediate Results Structure
```javascript
{
  [itemId]: {
    baseValue: number,       // Original value
    currentValue: number,    // Final cumulative value
    steps: [{               // Calculation steps
      tabId: string,
      tabName: string,
      inputValue: number,
      scaledValue: number,
      resultValue: number
    }]
  }
}
```

## Key Functions

### `toggleRowExpansion(itemId)`
Toggles the expanded state of a row to show/hide calculation steps.

### `handleExpressionChange(itemId, expression)`
Updates the expression for an item and notifies parent component.

### `handleFilterChange(filterName, value)`
Updates filter options for dynamic data filtering.

### `isInParenthesis(tabId)`
Checks if a column should be styled as within parentheses.

## Calculation Process

The component processes scaling operations cumulatively:

1. **Initialization**: Start with original value
2. **Sequential Processing**: Apply each tab's scaling in order
3. **Step Recording**: Track input/output for each transformation
4. **Final Result**: Store cumulative result

Example calculation flow:
```
Original: 100
→ Tab1: 100 → 120 (scaled)
→ Tab2: 120 → 144 (scaled from Tab1 result)
→ Tab3: 144 → 172.8 (scaled from Tab2 result)
Final: 172.8
```

## UI Components

### Table Structure
- **Item Column**: Display label
- **V/R Column**: Checkboxes and labels
- **Original Column**: Base value
- **Tab Columns**: Scaled values per tab
- **Expression Column**: Custom formula input
- **Final Result Column**: Cumulative result

### Expandable Details
When a row is expanded, it shows:
- Step-by-step calculations
- Input and output values for each tab
- Visual flow indicators

### Filter Controls
- Checkbox filters for V/R/Other items
- Search input with real-time filtering
- Result count indicator

## Styling

### CSS Classes
```css
.scaling-summary                    /* Main container */
.scaling-summary-table             /* Table element */
.scaling-summary-row               /* Table row */
.scaling-summary-row-expanded      /* Expanded row state */
.scaling-summary-cell              /* Table cell */
.scaling-summary-cell-right        /* Right-aligned cell */
.scaling-summary-parenthesis       /* Parenthesis column */
.scaling-summary-result            /* Result column */
.scaling-summary-vr-cell           /* V/R checkbox cell */
.scaling-summary-steps-row         /* Calculation steps row */
```

### Visual Features
- Animated value transitions using Framer Motion
- Hover effects on expandable rows
- Color-coded V/R indicators
- Highlighted result column

## Usage Example

```javascript
<ScalingSummary
  items={[
    {
      id: 'item1',
      label: 'Equipment Cost',
      originalValue: 1000,
      vKey: 'V1',
      scaledValues: {
        'tab1': 1200,
        'tab2': 1440,
        'tab3': 1728
      }
    }
  ]}
  tabConfigs={[
    { id: 'tab1', label: 'Location' },
    { id: 'tab2', label: 'Size', isParenthesis: true },
    { id: 'tab3', label: 'Technology' }
  ]}
  onExpressionChange={(id, expr) => console.log(id, expr)}
  V={vState}
  R={rState}
  toggleV={toggleVFunction}
  toggleR={toggleRFunction}
/>
```

## Performance Optimizations

- Memoized filtering with `useMemo`
- Efficient callbacks with `useCallback`
- Minimal re-renders through proper state management
- Animation keys based on timestamps

## Integration Points

### With Scaling System
- Receives scaled values from parent scaling components
- Provides expression input for custom calculations
- Syncs with V/R state management

### With Data Flow
- Displays cumulative scaling results
- Tracks value transformations
- Supports export of final results

## Accessibility Features

- Semantic table structure
- Keyboard navigation support
- Clear visual hierarchy
- Screen reader friendly labels

## Future Enhancements

- Export functionality for results
- Batch operations on filtered items
- Advanced expression parser
- Graphical representation of calculations
- Collaborative editing support