# ModelZone Integration with Price & Sensitivity Data

## Overview

This document outlines the implementation strategy for integrating price data and sensitivity derivatives into the ModelZone component. The integration focuses on:

1. Displaying price data extracted from Economic_Summary CSV files
2. Providing detailed price analysis and comparison capabilities
3. Visualizing sensitivity derivatives and their impact on pricing
4. Enabling seamless navigation between model selection and data analysis

## Directory Structure

```
src/Refined_Integration_Plan/
├── components/
│   ├── ModelZone.js            # Main container component for model cards
│   ├── ModelZone.css           # Styles for the ModelZone component
│   ├── ModelCard.js            # Individual model card with price display
│   ├── ModelCard.css           # Styles for the ModelCard component
│   ├── PriceDisplay.js         # Compact price display for ModelCard
│   ├── PriceDisplay.css        # Styles for the PriceDisplay component
│   ├── PriceDataPanel.js       # Detailed price analysis panel
│   ├── PriceDataPanel.css      # Styles for the PriceDataPanel component
│   ├── DerivativesPanel.js     # Sensitivity derivatives visualization
│   └── DerivativesPanel.css    # Styles for the DerivativesPanel component
├── services/
│   ├── priceDataService.js     # Service for fetching and processing price data
│   └── derivativesService.js   # Service for fetching and processing derivatives data
└── utils/
    └── csvParser.js            # Utility for parsing CSV data
```

## Implementation Strategy

### 1. Data Access Layer

The implementation provides a robust data access layer through service modules:

- **priceDataService.js**: Handles fetching and processing price data from Economic_Summary CSV files
- **derivativesService.js**: Manages access to sensitivity derivatives data and calculates price impact metrics
- **csvParser.js**: Provides utilities for parsing CSV data and extracting specific values

These services handle path construction for both standard versions and version extensions, ensuring proper data access regardless of the version type.

### 2. UI Components

The UI components follow a hierarchical structure:

- **ModelZone**: The main container component that manages model filtering, sorting, and selection
- **ModelCard**: Individual cards displaying model information with integrated price data
- **PriceDisplay**: Compact price information displayed within ModelCard
- **PriceDataPanel**: Detailed price analysis panel for in-depth price information
- **DerivativesPanel**: Visualization of sensitivity derivatives and their price impact

### 3. Integration Points

To integrate this solution with the existing application, follow these steps:

1. **Copy Component Files**: Copy all files from the `src/Refined_Integration_Plan` directory to their respective locations in the main project structure.

2. **Import ModelZone Component**: Import and use the ModelZone component in the appropriate location in your application:

```jsx
import ModelZone from './components/ModelZone';

// In your render method:
<ModelZone 
  models={yourModelsArray} 
  onModelSelect={handleModelSelection} 
/>
```

3. **Prepare Model Data**: Ensure your models array includes the necessary properties:

```javascript
const models = [
  {
    version: "1",
    extension: null,  // null for standard versions
    createdAt: "2025-01-01T00:00:00Z",
    type: "Standard",
    paramCount: 42,
    calculation: "Complete",
    status: "ready"  // Other options: "calculating", "error"
  },
  {
    version: "1",
    extension: "13",  // For version extensions
    createdAt: "2025-02-01T00:00:00Z",
    type: "Extension",
    paramCount: 42,
    calculation: "Complete",
    status: "ready"
  }
];
```

4. **API Backend**: Ensure your backend provides the following API endpoints:

   - `/api/file?path=...` - For accessing CSV and JSON files
   - Access to the directory structure in `Original/Batch(version)/Results(version)/...`

### 4. File Structure Requirements

The implementation expects the following file structure for accessing price and derivatives data:

For standard versions:
```
Original/Batch(version)/Results(version)/Economic_Summary(version).csv
```

For version extensions:
```
Original/Batch(version.extension)/Results(version)/Economic_Summary(version).csv
```

For sensitivity derivatives:
```
Original/Batch(version)/Results(version)/Sensitivity/Multipoint/[paramId]_derivatives.json
Original/Batch(version.extension)/Results(version)/Sensitivity/Multipoint/[paramId]_derivatives.json
```

## CSS Variables

The components use CSS variables for theming. The following variables should be defined in your application's CSS:

```css
:root {
  /* Light mode variables */
  --model-color-background: #ffffff;
  --model-color-background-alt: #f8fafc;
  --model-color-background-hover: #f7fafc;
  --model-color-text: #1a202c;
  --model-color-text-light: #718096;
  --model-color-text-lighter: #a0aec0;
  --model-color-border: #e2e8f0;
  --model-color-primary: #3b82f6;
  --model-color-primary-dark: #2563eb;
  --model-color-primary-light: #93c5fd;
  --model-color-success: #38a169;
  --model-color-success-light: #c6f6d5;
  --model-color-warning: #d69e2e;
  --model-color-warning-light: #feebc8;
  --model-color-danger: #e53e3e;
  --model-color-danger-light: #feb2b2;
  --model-color-danger-dark: #c53030;

  /* Dark mode variables */
  --model-color-background-dark: #1a202c;
  --model-color-background-alt-dark: #2d3748;
  --model-color-background-hover-dark: #2d3748;
  --model-color-text-dark: #f7fafc;
  --model-color-text-light-dark: #a0aec0;
  --model-color-border-dark: #4a5568;
}
```

## Key Features

1. **Price Data Integration**
   - Automatic extraction of Average Selling Price from Economic_Summary CSV files
   - Display of price data within model cards for quick reference
   - Detailed price analysis with comparison capabilities

2. **Sensitivity Analysis**
   - Visualization of parameter sensitivity derivatives
   - Calculation of price impact metrics for each parameter
   - Interactive parameter selection and data exploration

3. **Model Management**
   - Filtering and sorting capabilities for model selection
   - Support for both standard versions and version extensions
   - Multi-model selection for comparison

4. **Responsive Design**
   - Mobile-friendly layout with responsive adjustments
   - Dark mode support through CSS variables
   - Accessible UI with keyboard navigation

## Conclusion

This integration plan provides a comprehensive solution for incorporating price data and sensitivity derivatives into the ModelZone component. The modular design allows for easy integration with the existing application while providing a rich, interactive user experience for exploring model data.

By implementing this solution, users will be able to:
- Quickly view price data for all models
- Compare prices between different versions and extensions
- Analyze the impact of parameter changes on pricing
- Make informed decisions based on sensitivity analysis

The next steps would involve implementing backend API endpoints for accessing the required data files and integrating the ModelZone component into the application's main interface.
