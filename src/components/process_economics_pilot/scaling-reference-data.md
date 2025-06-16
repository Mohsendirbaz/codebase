# Scaling Reference Data Module

## Overview
A comprehensive reference module providing industry-standard scaling factors, exponents, and templates for process equipment cost estimation. Based on established methodologies like the six-tenths rule and industry cost indices.

## Architecture

### Module Structure
- **Type**: JavaScript data module with utility functions
- **Size**: 587 lines
- **Purpose**: Equipment cost scaling reference
- **Pattern**: Hierarchical data organization with templates

### Data Categories
1. **Scaling Exponents**: Equipment-specific scaling factors
2. **Material Factors**: Cost adjustments by material
3. **Pressure/Temperature Factors**: Operating condition adjustments
4. **Installation Factors**: Total installed cost multipliers
5. **Cost Indices**: Historical cost adjustment data
6. **Equipment Templates**: Pre-configured scaling models

## Core Data Structures

### 1. Scaling Exponents
Organized by equipment category following the six-tenths rule variations:

```javascript
scalingExponents = {
  heatExchangers: {
    shellAndTube: 0.6,
    plateAndFrame: 0.58,
    airCooled: 0.62,
    // ...
  },
  vessels: {
    storageTanks: 0.57,
    pressureVessels: 0.62,
    reactors: {
      cstr: 0.54,
      tubular: 0.56,
      // ...
    }
  }
  // ...
}
```

### 2. Material Factors
Cost multipliers relative to carbon steel (1.0):

| Material | Factor |
|----------|--------|
| Carbon Steel | 1.0 |
| SS 304 | 1.8 |
| SS 316 | 2.1 |
| Hastelloy C | 3.5 |
| Titanium | 5.0 |
| PVC | 0.7 |

### 3. Pressure Factors
Dynamic functions based on operating pressure:

```javascript
pressureVessels: (pressureBar) => {
  if (pressureBar <= 5) return 1.0;
  else if (pressureBar <= 10) return 1.2;
  // Progressive scaling...
}
```

### 4. Temperature Factors
Similar structure for temperature adjustments:
- Heat exchangers: 1.0-2.0+ range
- Pressure vessels: 1.0-1.7+ range

## Cost Indices

### Available Indices
1. **CEPCI** (Chemical Engineering Plant Cost Index)
2. **Marshall & Swift** Equipment Cost Index
3. **ENR** Construction Cost Index

### Years Covered
- Historical: 2010-2024
- Recent years include approximate values

### Usage Function
```javascript
adjustCostForInflation(baseCost, referenceYear, currentYear, indexType)
```

## Equipment Templates

### Template Structure
Each template includes:
1. **Metadata**: Name, category, description, tags
2. **Scaling Groups**: Organized calculation steps
3. **Base Parameters**: Reference values
4. **Calculation Function**: Dynamic factor generation

### Available Templates

#### 1. Shell & Tube Heat Exchanger
```javascript
{
  name: "Shell & Tube Heat Exchanger",
  scalingGroups: [
    'Default Scaling',
    'Area Scaling',
    'Pressure Adjustment',
    'Material Adjustment'
  ],
  baseParameters: {
    heatTransferArea: 10, // m²
    designPressure: 10, // bar
    materialType: 'carbonSteel'
  }
}
```

#### 2. Centrifugal Pump
```javascript
{
  name: "Centrifugal Pump",
  scalingGroups: [
    'Default Scaling',
    'Flow Scaling',
    'Head/Pressure Adjustment',
    'Material Adjustment',
    'Motor/Drive Adjustment'
  ],
  baseParameters: {
    flowRate: 50, // m³/h
    head: 30, // m
    materialType: 'carbonSteel',
    motorPower: 5 // kW
  }
}
```

#### 3. Storage Tank
```javascript
{
  name: "Storage Tank",
  scalingGroups: [
    'Default Scaling',
    'Volume Scaling',
    'Material Adjustment',
    'Accessories Adjustment'
  ],
  baseParameters: {
    volume: 100, // m³
    materialType: 'carbonSteel',
    accessories: 'basic'
  }
}
```

## Calculation Methods

### Scaling Factor Calculation
```javascript
calculateScalingFactors: (parameters) => {
  // Extract parameters
  const { param1, param2 } = parameters;
  
  // Apply scaling exponent
  const scalingFactor = Math.pow(param1 / baseValue, exponent);
  
  // Apply adjustment factors
  const adjustedFactor = scalingFactor * materialFactor * pressureFactor;
  
  // Return structured factors
  return {
    'scaling-group-id': {
      'factor-id': calculatedValue
    }
  };
}
```

## Installation Factors

Typical multipliers for total installed cost:
- Heat Exchangers: 2.5
- Pressure Vessels: 3.0
- Columns: 4.0
- Reactors: 3.5
- Pumps: 2.3
- Compressors: 2.8

## Usage Patterns

### Basic Scaling
```javascript
const exponent = scalingExponents.heatExchangers.shellAndTube;
const scaledCost = baseCost * Math.pow(newSize / baseSize, exponent);
```

### Material Adjustment
```javascript
const materialCost = baseCost * materialFactors.stainlessSteel316;
```

### Inflation Adjustment
```javascript
const currentCost = adjustCostForInflation(
  historicalCost, 
  2015, 
  2024, 
  'CEPCI'
);
```

### Template Usage
```javascript
const template = equipmentTemplates.centrifugalPump;
const factors = template.calculateScalingFactors({
  flowRate: 100,
  head: 45,
  materialType: 'stainlessSteel304',
  motorPower: 10
});
```

## Best Practices

### Accuracy Considerations
- Scaling exponents are approximations
- Valid within ±50% of base size typically
- Material factors vary by equipment type
- Installation factors are location-dependent

### Cost Estimation Steps
1. Select appropriate equipment template
2. Define operating parameters
3. Calculate scaling factors
4. Apply material/pressure/temperature adjustments
5. Apply installation factor
6. Adjust for inflation if needed

## Data Sources
- Six-tenths rule and variations
- Industry standard references
- Chemical engineering handbooks
- Cost index publications
- Equipment vendor data