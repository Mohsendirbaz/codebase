# historyUtils.js Documentation

## Overview

The `historyUtils.js` module provides a complete history management system for handling undo/redo functionality with scaling groups and configuration states. It maintains detailed snapshots of application state changes with metadata tracking.

## Architecture

### Core Components
- **History Stack Management**: Maintains a chronological stack of state changes
- **History Entry System**: Creates detailed metadata for each state change
- **Snapshot System**: Preserves complete state snapshots including scaling groups, protected tabs, and configurations
- **Action Tracking**: Records action types and descriptions for debugging and auditing

## Core Features

### 1. History Entry Management
- Generates unique identifiers for each history entry
- Timestamps all state changes
- Preserves action metadata and payloads
- Creates deep copies of state snapshots

### 2. State Restoration
- Supports undo/redo operations through index manipulation
- Maintains history boundaries to prevent invalid operations
- Returns updated state objects with new index positions

### 3. Snapshot Preservation
- Deep clones scaling groups to prevent mutation
- Converts Sets to Arrays for protected tabs
- Preserves tab configurations at each state

## Function Documentation

### `addToHistory(history, historyIndex, newGroups, historyEntries, protectedTabs, tabConfigs, action, description, payload)`

Adds a new entry to the history stack with comprehensive state snapshots.

**Parameters:**
- `history` (Array): Current history stack of scaling groups
- `historyIndex` (number): Current position in the history stack
- `newGroups` (Array): New scaling groups to add to history
- `historyEntries` (Array): Detailed history entries with metadata
- `protectedTabs` (Set): Set of protected tab identifiers
- `tabConfigs` (Array): Current tab configurations
- `action` (string): Action type identifier
- `description` (string): Human-readable description of the change
- `payload` (Object): Optional additional data related to the action

**Returns:**
```javascript
{
  history: Array,        // Updated history stack
  historyIndex: number,  // New history index
  historyEntries: Array  // Updated detailed entries
}
```

**Implementation Details:**
- Creates unique IDs using timestamp and random string
- Performs deep cloning via JSON stringify/parse
- Truncates forward history when adding from middle of stack
- Maintains parallel arrays for simple and detailed history

### `undo(history, historyIndex)`

Moves backward in the history stack to restore a previous state.

**Parameters:**
- `history` (Array): Current history stack
- `historyIndex` (number): Current position in history

**Returns:**
```javascript
{
  historyIndex: number,      // Updated index (decremented if possible)
  scalingGroups: Array       // Restored scaling groups
}
```

**Edge Cases:**
- Returns current state if already at beginning (index 0)
- Safely handles empty history arrays

### `redo(history, historyIndex)`

Moves forward in the history stack to restore a previously undone state.

**Parameters:**
- `history` (Array): Current history stack
- `historyIndex` (number): Current position in history

**Returns:**
```javascript
{
  historyIndex: number,      // Updated index (incremented if possible)
  scalingGroups: Array       // Restored scaling groups
}
```

**Edge Cases:**
- Returns current state if already at end of history
- Maintains bounds checking to prevent overflow

### `initializeHistory(initialGroups)`

Creates the initial history state with a starting configuration.

**Parameters:**
- `initialGroups` (Array): Initial scaling groups configuration

**Returns:**
```javascript
{
  history: Array,          // History stack with initial entry
  historyIndex: 0,         // Starting at position 0
  historyEntries: Array    // Initial detailed entry
}
```

**Initial Entry Structure:**
- ID format: `history_{timestamp}_initial`
- Action: 'initialize'
- Description: 'Initial scaling configuration'
- Empty protected tabs array

## Data Structures

### History Entry Schema
```javascript
{
  id: string,              // Unique identifier
  timestamp: number,       // Unix timestamp
  action: string,          // Action type
  description: string,     // Human-readable description
  payload: Object,         // Optional action data
  snapshots: {
    scalingGroups: Array,  // Deep copy of groups
    protectedTabs: Array,  // Array from Set
    tabConfigs: Array      // Configuration snapshot
  }
}
```

## Usage Patterns

### Basic Undo/Redo Implementation
```javascript
// Initialize history
const historyState = initializeHistory(initialScalingGroups);

// Add a change
const newHistoryState = addToHistory(
  historyState.history,
  historyState.historyIndex,
  updatedGroups,
  historyState.historyEntries,
  protectedTabs,
  tabConfigs,
  'UPDATE_SCALING',
  'Updated scaling factor for Group A',
  { groupId: 'a', oldValue: 1, newValue: 2 }
);

// Undo the change
const undoState = undo(
  newHistoryState.history,
  newHistoryState.historyIndex
);

// Redo the change
const redoState = redo(
  undoState.history,
  undoState.historyIndex
);
```

### Integration with React State Management
```javascript
const [history, setHistory] = useState(() => 
  initializeHistory(defaultScalingGroups)
);

const handleUndo = () => {
  const result = undo(history.history, history.historyIndex);
  setHistory(prev => ({
    ...prev,
    historyIndex: result.historyIndex,
    scalingGroups: result.scalingGroups
  }));
};
```

## Best Practices

1. **Always Use Deep Copies**: The module uses JSON stringify/parse for deep cloning to prevent state mutations
2. **Maintain Parallel Arrays**: Keep history and historyEntries arrays synchronized
3. **Provide Meaningful Descriptions**: Action descriptions help with debugging and user feedback
4. **Include Relevant Payloads**: Store enough data to understand what changed
5. **Handle Edge Cases**: Check history bounds before undo/redo operations

## Performance Considerations

- Deep cloning via JSON methods may be slow for large state objects
- Consider implementing size limits for history stack
- Monitor memory usage with large history entries
- Consider compression for production deployments