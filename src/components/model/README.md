# Model Zone Integration with Sensitivity and Price Efficacy Features

This document explains the integration between the ModelZone component, Sensitivity Analysis, and Price Efficacy features.

## Overview

The integration allows users to:

1. View price data for each model variant
2. Calculate and visualize efficacy metrics based on sensitivity analysis
3. See how parameter changes affect pricing
4. Make informed decisions based on sensitivity and efficacy metrics

## Key Components

### 1. Data Processing Utilities

The `dataProcessing.js` utility provides:

- `fetchPriceData`: Extracts price information from Economic_Summary CSV files
- `loadSensitivityData`: Loads sensitivity data from Multipoint derivatives
- `calculateEfficacyMetrics`: Calculates efficacy metrics based on sensitivity and price data
- `calculatePriceChange`: Calculates price change percentage
- `formatPrice`: Formats price values as currency

### 2. New UI Components

- `PriceDisplay`: Shows price information with comparisons to the base model
- `EfficacyIndicator`: Displays efficacy metrics with visual indicators for impact level

### 3. Integration Points

#### ModelCard Integration
- Displays price information for each model variant
- Shows efficacy indicators when sensitivity analysis has been run
- Links sensitivity button to efficacy metrics

#### ModelZone Integration
- Provides base model settings to variant model cards
- Handles sensitivity data loading and distribution
- Uses event-driven approach to share price data across components

#### SensitivityEngine Integration
- Displays efficacy summary based on sensitivity and price data
- Shows parameter-specific elasticity values
- Provides price impact visualization

## Data Flow

```
┌─────────────────┐       ┌─────────────────┐
│   ModelZone     │◄──────┤  ModelCard      │
│                 │       │                 │
└────────┬────────┘       └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│ Economic_Summary │       │  PriceDisplay   │
│      CSV         │       │                 │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │                         │
         │        ┌────────────────┼─────────────┐
         │        │                │             │
         ▼        ▼                ▼             │
┌─────────────────┐       ┌─────────────────┐    │
│ SensitivityData │──────►│ EfficacyMetrics │◄───┘
│                 │       │                 │
└────────┬────────┘       └────────┬────────┘
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│SensitivityEngine│       │EfficacyIndicator│
└─────────────────┘       └─────────────────┘
```

## How to Use

1. **View Price Data**: 
   - Price information is automatically displayed in each model card
   - Comparisons between variant models and base model are shown
   
2. **Run Sensitivity Analysis**:
   - Click the "Sensitivity" button on any model card
   - Configure parameters and run the analysis
   - Efficacy metrics will be calculated and displayed
   
3. **Interpret Efficacy Metrics**:
   - Overall Efficacy Score: Higher values indicate greater price impact
   - Parameter Elasticity: Shows which parameters have the biggest effect on price
   - Color coding indicates impact level (high/medium/low)

4. **Make Informed Decisions**:
   - Use efficacy insights to optimize your sensitivity parameters
   - Focus on high-impact parameters for more efficient analysis
   - Compare efficacy across different model variants

## Implementation Details

### Event-Driven Communication

The integration uses a custom event system to share data between components:

```javascript
// In PriceDisplay.js - Broadcasting price data
const event = new CustomEvent('priceDataLoaded', {
  detail: {
    version,
    extension,
    priceData: data
  }
});
window.dispatchEvent(event);

// In other components - Listening for price data
window.addEventListener('priceDataLoaded', handlePriceDataLoaded);
```

### Efficacy Calculation

Efficacy metrics are calculated using:

1. Price data from Economic_Summary files
2. Sensitivity data with parameter impacts
3. Calculation algorithms that measure:
   - Price elasticity for each parameter
   - Overall price efficacy score
   - Parameter-specific impact values

## Future Enhancements

Potential improvements for the integration:

1. Real-time efficacy calculations during parameter adjustments
2. Historical efficacy tracking across multiple analyses
3. AI-powered recommendations based on efficacy metrics
4. Export capabilities for efficacy reports

## Troubleshooting

- If price data isn't displaying, check Economic_Summary CSV file format
- If efficacy metrics aren't calculating, ensure sensitivity analysis has been run
- If parameter impacts seem incorrect, verify departure values in model settings
