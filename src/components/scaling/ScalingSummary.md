# Scaling Summary Component

## Overview
A comprehensive table component that displays scaling values with cumulative calculations, filtering capabilities, and expandable detail views. Provides visual feedback through animations and interactive controls for the ModEcon scaling system.

## Architecture

### Component Structure
- **Type**: React Functional Component
- **Size**: 372 lines
- **Libraries**: framer-motion for animations
- **Pattern**: Controlled component with complex state

### State Management
1. **Expression Tracking**
   - `itemExpressions`: Formula storage
   - `intermediateResults`: Calculation steps
   - `lastUpdated`: Update timestamp

2. **UI State**
   - `expandedRows`: Row expansion tracking
   - `filterOptions`: Display filters

## Core Features

### 1. Cumulative Calculations
- **Sequential Processing**: Tab-by-tab value transformation
- **Step Tracking**: Detailed calculation history
- **Result Propagation**: Each tab uses previous result

### 2. Filtering System
- **Category Filters**:
  - V Items (process values)
  - R Items (revenue values)
  - Other Items
- **Search Functionality**: Real-time text filtering
- **Combined Filtering**: Multiple criteria support

### 3. Interactive Elements
- **Expandable Rows**: Click to show calculation steps
- **Inline Checkboxes**: V/R toggle controls
- **Expression Input**: Formula entry fields
- **Animated Transitions**: Smooth visual updates

## Component Props

| Prop | Type | Description |
|------|------|-------------|
| `items` | array | Scaling items with values |
| `tabConfigs` | array | Tab configuration data |
| `onExpressionChange` | function | Expression update callback |
| `V` | object | V toggle states |
| `R` | object | R toggle states |
| `toggleV` | function | V toggle handler |
| `toggleR` | function | R toggle handler |

## Data Processing

### Cumulative Calculation Flow
```javascript
// Track running value
let cumulativeValue = item.originalValue;

tabIds.forEach(tabId => {
    const scaledValue = item.scaledValues[tabId];
    
    // Record step
    steps.push({
        tabId,
        tabName: tabConfig.label,
        inputValue: cumulativeValue,
        scaledValue,
        resultValue: scaledValue
    });
    
    // Update for next iteration
    cumulativeValue = scaledValue;
});
```

### Filter Logic
1. **Category Filtering**: Based on V/R key presence
2. **Text Search**: Matches label, vKey, rKey
3. **Combined Results**: AND operation between filters

## UI Components

### Table Structure
1. **Header Row**
   - Item name
   - V/R controls
   - Original value
   - Tab columns (dynamic)
   - Expression input
   - Final result

2. **Data Rows**
   - Clickable for expansion
   - Animated value updates
   - Checkbox controls
   - Formula inputs

3. **Expanded Details**
   - Calculation step display
   - Input → Output flow
   - Tab-by-tab progression

### Visual Features
- **Animations**:
  - Row entry/exit: Fade + slide
  - Value updates: Fade transition
  - Result emphasis: Scale effect

- **Styling Classes**:
  - `.scaling-summary-parenthesis`: Special column formatting
  - `.scaling-summary-row-expanded`: Expanded state
  - `.scaling-summary-result`: Result emphasis

## Interactive Behaviors

### Row Click Handling
```javascript
onClick={() => toggleRowExpansion(item.id)}
```
- Toggles expanded view
- Shows calculation steps
- Maintains other interactions

### Checkbox Interactions
- Event propagation prevention
- Independent state management
- Visual feedback

### Expression Input
- Prevents row toggle on click
- Real-time value binding
- Callback propagation

## Performance Optimizations

### Memoization
- `filteredItems`: Cached filter results
- Callback functions: `useCallback` wrapped
- Conditional rendering

### Animation Performance
- `AnimatePresence` for exit animations
- Keyed animations for updates
- Minimal layout recalculations

## CSS Architecture

### Component Classes
- `.scaling-summary`: Root container
- `.scaling-summary-table`: Table element
- `.scaling-summary-header`: Header row
- `.scaling-summary-cell`: Table cells
- `.scaling-summary-filters`: Filter controls

### State Classes
- `.scaling-summary-row-expanded`: Expanded rows
- `.scaling-summary-parenthesis`: Special columns
- `.scaling-summary-result`: Result emphasis

### Layout Classes
- `.scaling-summary-container`: Table wrapper
- `.scaling-summary-footer`: Footer information
- `.scaling-summary-steps`: Detail view

## Footer Information
- Base value inheritance note
- Interaction instructions
- Column explanation

## Best Practices
- Clear visual hierarchy
- Responsive animations
- Accessible controls
- Intuitive interactions
- Performance-conscious updates