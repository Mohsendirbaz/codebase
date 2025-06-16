# scalingUtils.js

## Overview

The `scalingUtils.js` module provides core mathematical and data processing utilities for the scaling system. It handles the actual calculations for scaling operations, manages cumulative propagation through scaling groups, and processes imported configurations to ensure data integrity.

## Architecture

### High-Level Architecture
```
scalingUtils.js
├── Mathematical Operations
│   └── calculateScaledValue()
├── Data Propagation
│   └── propagateChanges()
├── Data Processing
│   ├── determineInsertionIndex()
│   └── processImportedConfiguration()
└── Error Handling
    ├── Division by Zero
    ├── Logarithm Domain
    └── Infinity Checks
```

### Module Dependencies
- `mathjs`: Mathematical operations library for precise calculations

## Core Functions

### 1. calculateScaledValue(baseValue, operation, factor)

Calculates a scaled value based on the specified operation and factor.

#### Parameters:
- `baseValue` (number) - The base value to scale
- `operation` (string) - The operation to apply
- `factor` (number) - The scaling factor

#### Returns:
- (number) - The calculated scaled value

#### Throws:
- Error if operation results in invalid value
- Error for division by zero
- Error for logarithm of negative number
- Error if result is not finite

#### Operation Implementations:

```javascript
// Multiply: result = baseValue × factor
case 'multiply':
    result = math.multiply(baseValue, factor);
    break;

// Power: result = baseValue^factor
case 'power':
    result = math.pow(baseValue, factor);
    break;

// Divide: result = baseValue ÷ factor
case 'divide':
    result = math.divide(baseValue, factor);
    break;

// Logarithmic: result = ln(baseValue) × factor
case 'log':
    result = math.multiply(math.log(baseValue), factor);
    break;

// Exponential: result = e^(ln(baseValue) × factor)
case 'exponential':
    result = math.exp(math.multiply(math.log(baseValue), factor));
    break;

// Add: result = baseValue + factor
case 'add':
    result = math.add(baseValue, factor);
    break;

// Subtract: result = baseValue - factor
case 'subtract':
    result = math.subtract(baseValue, factor);
    break;
```

#### Example Usage:
```javascript
const scaled = calculateScaledValue(100, 'multiply', 1.5); // Returns 150
const powered = calculateScaledValue(2, 'power', 3); // Returns 8
const logged = calculateScaledValue(100, 'log', 2); // Returns ~9.21
```

### 2. propagateChanges(groups, startIndex)

Propagates scaling changes through subsequent groups in a cumulative fashion.

#### Parameters:
- `groups` (Array) - Array of scaling groups
- `startIndex` (number) - Index of the group where changes originated

#### Returns:
- (Array) - Updated array of scaling groups with propagated changes

#### How It Works:
1. Starts from the group after `startIndex`
2. Uses scaled values from previous group as base values for next group
3. Recalculates scaled values for each item based on new base values
4. Preserves original base values for reference

#### Data Flow:
```
Group 1: baseValue=100 → scaledValue=150 (×1.5)
    ↓
Group 2: baseValue=150 → scaledValue=300 (×2.0)
    ↓
Group 3: baseValue=300 → scaledValue=450 (×1.5)
```

#### Example:
```javascript
const groups = [
  {
    name: 'Scaling Group 1',
    items: [
      { id: 'item1', baseValue: 100, scaledValue: 150, enabled: true }
    ]
  },
  {
    name: 'Scaling Group 2',
    items: [
      { id: 'item1', baseValue: 100, scaledValue: 200, enabled: true }
    ]
  }
];

const updated = propagateChanges(groups, 0);
// Group 2's item1 baseValue becomes 150 (from Group 1's scaledValue)
```

### 3. determineInsertionIndex(groupNumber, groups)

Determines the correct position to insert a new scaling group based on its number.

#### Parameters:
- `groupNumber` (number) - The number of the new group
- `groups` (Array) - Existing array of scaling groups

#### Returns:
- (number) - The index where the new group should be inserted

#### Logic:
- Parses group names to extract numbers
- Finds first group with higher number
- Returns that position or end of array

#### Example:
```javascript
const groups = [
  { name: 'Scaling Group 1' },
  { name: 'Scaling Group 3' },
  { name: 'Scaling Group 5' }
];

const index = determineInsertionIndex(2, groups); // Returns 1
const index2 = determineInsertionIndex(4, groups); // Returns 2
const index3 = determineInsertionIndex(6, groups); // Returns 3
```

### 4. processImportedConfiguration(groups, filterKeyword)

Processes and validates imported scaling group configurations, ensuring data integrity and proper cumulative calculations.

#### Parameters:
- `groups` (Array) - Imported groups configuration
- `filterKeyword` (string) - Current scaling type filter (optional)

#### Returns:
- (Array) - Processed and validated groups

#### Processing Steps:

1. **Validation & Structure**
   - Ensures all required properties exist
   - Generates missing IDs
   - Preserves scaling type information

2. **Item Processing**
   - Validates all item properties
   - Calculates missing scaled values
   - Preserves original base values

3. **Cumulative Recalculation**
   - Ensures first group uses original values
   - Propagates results through subsequent groups
   - Maintains mathematical consistency

#### Data Structure Enforcement:
```javascript
// Group structure
{
  id: string,
  name: string,
  isProtected: boolean,
  _scalingType: string,
  items: Array
}

// Item structure
{
  id: string,
  label: string,
  originalBaseValue: number,
  baseValue: number,
  scalingFactor: number,
  operation: string,
  enabled: boolean,
  notes: string,
  vKey: string|null,
  rKey: string|null,
  scaledValue: number
}
```

#### Example:
```javascript
const imported = [
  {
    name: 'Group 1',
    items: [
      { label: 'Item A', baseValue: 100 }
    ]
  }
];

const processed = processImportedConfiguration(imported, 'financial');
// Returns fully validated and calculated configuration
```

## Error Handling

### calculateScaledValue Errors

| Condition | Error Message |
|-----------|--------------|
| `baseValue === 0 && operation === 'divide'` | "Division by zero" |
| `baseValue < 0 && operation === 'log'` | "Logarithm of negative number" |
| `!isFinite(result)` | "Result is not a finite number" |

### processImportedConfiguration Errors

| Condition | Error Message |
|-----------|--------------|
| `!Array.isArray(groups)` | "Invalid or empty groups array" |
| `groups.length === 0` | "Invalid or empty groups array" |

## Usage Patterns

### Basic Scaling Calculation
```javascript
import { calculateScaledValue } from './scalingUtils';

// Simple scaling
const scaled = calculateScaledValue(100, 'multiply', 1.5); // 150

// Complex scaling with error handling
try {
  const result = calculateScaledValue(baseValue, operation, factor);
  console.log(`Scaled value: ${result}`);
} catch (error) {
  console.error(`Scaling error: ${error.message}`);
}
```

### Cumulative Scaling Workflow
```javascript
import { propagateChanges, calculateScaledValue } from './scalingUtils';

// Update a single item
groups[0].items[0].scalingFactor = 2.0;
groups[0].items[0].scaledValue = calculateScaledValue(
  groups[0].items[0].baseValue,
  groups[0].items[0].operation,
  2.0
);

// Propagate changes through all groups
const updatedGroups = propagateChanges(groups, 0);
```

### Import/Export Workflow
```javascript
import { processImportedConfiguration } from './scalingUtils';

// Import configuration
const importedData = JSON.parse(fileContent);
const processedGroups = processImportedConfiguration(
  importedData.groups,
  currentFilterType
);

// Validate and use
if (processedGroups.length > 0) {
  setScalingGroups(processedGroups);
}
```

## Best Practices

1. **Error Handling**
   - Always wrap calculations in try-catch blocks
   - Validate inputs before calculation
   - Provide user-friendly error messages

2. **Performance**
   - Minimize propagation calls (batch updates)
   - Use memoization for repeated calculations
   - Avoid unnecessary recalculations

3. **Data Integrity**
   - Preserve original values
   - Maintain immutability
   - Validate imported configurations

4. **Precision**
   - Use mathjs for accurate calculations
   - Handle floating-point precision issues
   - Round display values appropriately

## Integration with Components

### ExtendedScaling Component
```javascript
// Calculate scaled value on change
const handleScalingFactorChange = (value) => {
  const scaledValue = calculateScaledValue(
    item.baseValue,
    item.operation,
    value
  );
  updateItem({ ...item, scalingFactor: value, scaledValue });
  
  // Propagate if cumulative mode
  if (isCumulative) {
    const updated = propagateChanges(groups, groupIndex);
    setGroups(updated);
  }
};
```

### Import Functionality
```javascript
const handleImport = (config) => {
  try {
    const processed = processImportedConfiguration(
      config.groups,
      filterKeyword
    );
    setGroups(processed);
    message.success('Configuration imported successfully');
  } catch (error) {
    message.error(`Import failed: ${error.message}`);
  }
};
```

## Performance Optimization

1. **Batch Operations**
   ```javascript
   // Instead of multiple propagations
   const batchUpdate = (updates) => {
     updates.forEach(update => {
       groups[update.groupIndex].items[update.itemIndex] = update.item;
     });
     return propagateChanges(groups, 0);
   };
   ```

2. **Memoization**
   ```javascript
   const memoizedCalculate = useMemo(
     () => calculateScaledValue(baseValue, operation, factor),
     [baseValue, operation, factor]
   );
   ```

3. **Lazy Evaluation**
   ```javascript
   // Only calculate when needed
   const getScaledValue = () => {
     if (needsRecalculation) {
       return calculateScaledValue(baseValue, operation, factor);
     }
     return cachedValue;
   };
   ```

## Testing Considerations

1. **Edge Cases**
   - Zero values
   - Negative values
   - Very large/small numbers
   - Invalid operations

2. **Propagation Tests**
   - Single group changes
   - Multiple group chains
   - Disabled items
   - Empty groups

3. **Import Validation**
   - Missing properties
   - Invalid data types
   - Circular dependencies
   - Data consistency

## Future Enhancements

1. **Advanced Operations** - Support for custom mathematical functions
2. **Undo/Redo** - State management for scaling operations
3. **Validation Rules** - Configurable validation constraints
4. **Async Calculations** - Web worker support for large datasets
5. **Formula Editor** - Allow custom scaling formulas