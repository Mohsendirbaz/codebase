# scalingOperations.js

## Overview

The `scalingOperations.js` module defines the available mathematical operations for the scaling system. It provides a centralized registry of scaling operations with their metadata, symbols, and descriptions.

## Architecture

### Data Structure
```
scalingOperations (Array)
├── Arithmetic Operations
│   ├── Multiply (×)
│   ├── Divide (÷)
│   ├── Add (+)
│   └── Subtract (-)
├── Power Operations
│   └── Power (^)
└── Advanced Operations
    ├── Logarithmic (ln)
    └── Exponential (eˣ)
```

## Core Features

### Operation Registry
The module exports an array of operation objects, each containing:
- Unique identifier
- Display label
- Mathematical symbol
- Human-readable description

## Main Export

### `scalingOperations` (Array)

An array of operation definition objects.

#### Operation Object Structure:
```javascript
{
  id: string,          // Unique identifier for the operation
  label: string,       // Display name for UI
  symbol: string,      // Mathematical symbol
  description: string  // Detailed description of the operation
}
```

## Available Operations

### 1. Multiply (×)
```javascript
{
    id: 'multiply',
    label: 'Multiply',
    symbol: '×',
    description: 'Multiplies the base value by the scaling factor'
}
```
**Formula:** `result = baseValue × scalingFactor`

**Use Cases:**
- Linear scaling
- Percentage increases
- Unit conversions
- Standard growth calculations

**Example:** Base value 100 × scaling factor 1.5 = 150

### 2. Power (^)
```javascript
{
    id: 'power',
    label: 'Power',
    symbol: '^',
    description: 'Raises the base value to the power of the scaling factor'
}
```
**Formula:** `result = baseValue ^ scalingFactor`

**Use Cases:**
- Exponential growth modeling
- Compound interest calculations
- Non-linear scaling relationships
- Scientific calculations

**Example:** Base value 2 ^ scaling factor 3 = 8

### 3. Divide (÷)
```javascript
{
    id: 'divide',
    label: 'Divide',
    symbol: '÷',
    description: 'Divides the base value by the scaling factor'
}
```
**Formula:** `result = baseValue ÷ scalingFactor`

**Use Cases:**
- Inverse scaling
- Rate calculations
- Normalization
- Per-unit calculations

**Example:** Base value 100 ÷ scaling factor 4 = 25

### 4. Logarithmic (ln)
```javascript
{
    id: 'log',
    label: 'Logarithmic',
    symbol: 'ln',
    description: 'Applies logarithmic scaling using the natural log'
}
```
**Formula:** `result = ln(baseValue) × scalingFactor`

**Use Cases:**
- Decibel calculations
- pH scale transformations
- Information theory metrics
- Compressing large value ranges

**Example:** Base value 100, scaling factor 2 → ln(100) × 2 ≈ 9.21

### 5. Exponential (e^x)
```javascript
{
    id: 'exponential',
    label: 'Exponential',
    symbol: 'eˣ',
    description: 'Applies exponential scaling'
}
```
**Formula:** `result = e^(ln(baseValue) × scalingFactor)`

**Use Cases:**
- Growth rate modeling
- Decay calculations
- Population dynamics
- Financial modeling

**Example:** Base value 2, scaling factor 2 → e^(ln(2) × 2) ≈ 4

### 6. Add (+)
```javascript
{
    id: 'add',
    label: 'Add',
    symbol: '+',
    description: 'Adds the scaling factor to the base value'
}
```
**Formula:** `result = baseValue + scalingFactor`

**Use Cases:**
- Fixed increments
- Offset adjustments
- Baseline shifts
- Constant additions

**Example:** Base value 100 + scaling factor 25 = 125

### 7. Subtract (-)
```javascript
{
    id: 'subtract',
    label: 'Subtract',
    symbol: '-',
    description: 'Subtracts the scaling factor from the base value'
}
```
**Formula:** `result = baseValue - scalingFactor`

**Use Cases:**
- Fixed decrements
- Discount calculations
- Threshold adjustments
- Constant reductions

**Example:** Base value 100 - scaling factor 25 = 75

## Usage in Application

### Import and Access
```javascript
import scalingOperations from './scalingOperations';

// Access all operations
const operations = scalingOperations;

// Find specific operation
const multiplyOp = operations.find(op => op.id === 'multiply');
```

### Integration with UI Components
```javascript
// Dropdown menu population
<Select>
  {scalingOperations.map(op => (
    <Option key={op.id} value={op.id}>
      {op.symbol} {op.label}
    </Option>
  ))}
</Select>

// Display operation details
<Tooltip title={operation.description}>
  <span>{operation.symbol}</span>
</Tooltip>
```

### Validation and Constraints

Different operations have different constraints:

| Operation | Base Value Constraint | Scaling Factor Constraint | Result Constraint |
|-----------|----------------------|--------------------------|-------------------|
| Multiply | Any finite number | Any finite number | Finite number |
| Power | Positive numbers | Any finite number | Finite positive |
| Divide | Any finite number | Non-zero | Finite number |
| Log | Positive numbers | Any finite number | Finite number |
| Exponential | Positive numbers | Any finite number | Positive number |
| Add | Any finite number | Any finite number | Finite number |
| Subtract | Any finite number | Any finite number | Finite number |

## Design Patterns

### Operation Selection
```javascript
const getOperationById = (id) => {
  return scalingOperations.find(op => op.id === id);
};

const getOperationSymbol = (id) => {
  const operation = getOperationById(id);
  return operation ? operation.symbol : '?';
};
```

### Operation Grouping
```javascript
// Group by operation type
const arithmeticOps = ['add', 'subtract', 'multiply', 'divide'];
const advancedOps = ['power', 'log', 'exponential'];

const groupedOperations = {
  arithmetic: scalingOperations.filter(op => arithmeticOps.includes(op.id)),
  advanced: scalingOperations.filter(op => advancedOps.includes(op.id))
};
```

## Best Practices

1. **Operation Selection**
   - Choose operations appropriate for the data domain
   - Consider user expertise when exposing operations
   - Provide tooltips with operation descriptions

2. **Error Handling**
   - Validate operation compatibility with values
   - Handle edge cases (division by zero, negative logs)
   - Provide meaningful error messages

3. **UI Integration**
   - Use symbols for compact display
   - Show labels for clarity
   - Include descriptions in help text

4. **Performance**
   - Operations are lightweight calculations
   - No need for memoization at operation level
   - Consider caching results for repeated calculations

## Extension Guidelines

To add new operations:

```javascript
const scalingOperations = [
  // ... existing operations
  {
    id: 'custom_operation',
    label: 'Custom Operation',
    symbol: '⊕',
    description: 'Performs a custom mathematical transformation'
  }
];
```

Ensure corresponding implementation in `scalingUtils.js`:
```javascript
case 'custom_operation':
    result = customFunction(baseValue, factor);
    break;
```

## Related Modules

- **scalingUtils.js** - Implements the mathematical calculations
- **ExtendedScaling.js** - UI component using these operations
- **ScalingSummary.js** - Displays operation results

## Future Enhancements

1. **Operation Categories** - Group operations by mathematical type
2. **Custom Operations** - Allow user-defined operations
3. **Operation Chaining** - Combine multiple operations
4. **Conditional Operations** - Operations based on value ranges
5. **Localization** - Translate labels and descriptions