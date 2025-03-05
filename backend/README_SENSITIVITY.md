# Sensitivity Analysis System

This document provides an overview of the Sensitivity Analysis System, its components, and how to use it.

## Overview

The Sensitivity Analysis System is a comprehensive solution for performing sensitivity analysis on economic models. It allows users to analyze how changes in input parameters affect key output metrics like NPV (Net Present Value) and IRR (Internal Rate of Return).

The system integrates with the existing calculation pipeline and provides a unified interface for generating, managing, and visualizing sensitivity analysis results.

## Components

The system consists of the following components:

### 1. Sensitivity Analysis Manager (`sensitivity_analysis_manager.py`)

The core component that centralizes all sensitivity analysis operations. It provides methods for:

- Managing directory structures for sensitivity analysis
- Retrieving parameter information and mappings
- Loading and modifying configuration modules
- Applying sensitivity variations to parameters
- Generating sensitivity configurations
- Storing calculation results
- Generating plots
- Organizing sensitivity results

### 2. Plot Organizer (`sensitivity_plot_organizer.py`)

Organizes plot files related to sensitivity analysis into standardized album directories for easier frontend consumption. It:

- Scans for sensitivity plot files in the results directories
- Organizes them into albums based on mode (Symmetrical/Multipoint) and plot type (waterfall/bar/point)
- Creates metadata files for each album
- Provides statistics on the organization process

### 3. HTML Organizer (`sensitivity_html_organizer.py`)

Similar to the plot organizer, but focuses on HTML files. It:

- Scans for sensitivity HTML files in the results directories
- Organizes them into albums based on mode (Symmetrical/Multipoint)
- Creates metadata files for each album
- Provides statistics on the organization process

### 4. Integration Module (`sensitivity_integration.py`)

Serves as the central coordinator for all sensitivity-related operations, integrating the sensitivity analysis manager with the calculation pipeline. It provides:

- Methods for processing complete sensitivity analysis requests
- Integration with the calculation pipeline
- Coordination of output organization

### 5. Updated Routes (`updated_sensitivity_routes.py`)

Provides enhanced Flask Blueprint routes for sensitivity analysis that use the new sensitivity manager and integration components. It includes:

- A standalone endpoint for running sensitivity analysis
- Enhanced endpoints for symmetrical and multipoint sensitivity analysis
- Endpoints for retrieving sensitivity albums, plots, and HTML files
- An endpoint for consolidated sensitivity results
- Endpoints for serving individual plot files and visualization data

### 6. Centralized Logging Configuration (`sensitivity_logging.py`)

Provides a centralized logging configuration for all sensitivity analysis components. It includes:

- A SensitivityLoggingManager class that manages loggers for different components
- Methods for getting loggers for specific components
- A consolidated log handler for capturing logs from all components
- Convenience functions for getting loggers for different components

### 7. Calculations Sensitivity Adapter (`calculations_sensitivity_adapter.py`)

Provides an adapter for integrating with the Calculations.py module. It includes:

- A CalculationsSensitivityAdapter class that serves as a bridge between the price calculation functionality in Calculations.py and the sensitivity analysis system
- Methods for running price calculations, running sensitivity analysis, and processing sensitivity parameters
- Proper error handling and logging using the centralized logging configuration

### 8. Frontend Styling (`SensitivityVisualization.css`)

Provides comprehensive styling for sensitivity visualization components in the frontend, including:

- Styles for parameter selection
- Styles for analysis configuration
- Styles for results visualization
- Responsive design for different screen sizes

## Logging Strategy

The system uses a centralized logging configuration defined in the `sensitivity_logging.py` module. This provides consistent logging across all components of the system.

The logging configuration creates the following log files:

- `SENSITIVITY.log` - Main sensitivity log
- `SENSITIVITY_MANAGER.log` - Logs from the sensitivity manager
- `SENSITIVITY_PLOTS.log` - Logs from the plot organizer
- `SENSITIVITY_HTML.log` - Logs from the HTML organizer
- `SENSITIVITY_API.log` - Logs from the API endpoints
- `SENSITIVITY_WORKFLOW.log` - Consolidated logs from all components

Example usage of the logging system:

```python
from sensitivity_logging import get_manager_logger

# Get a logger for the sensitivity manager
logger = get_manager_logger()

# Log messages
logger.info("Starting sensitivity analysis")
logger.warning("Parameter not found in mapping")
logger.error("Error generating sensitivity configurations")
```

## Adapter Pattern

The system uses the adapter pattern to integrate with the Calculations.py module. The adapter is defined in the `calculations_sensitivity_adapter.py` module.

The adapter provides the following methods:

- `run_price_calculation` - Run a price calculation using the Calculations module
- `run_sensitivity_analysis` - Run sensitivity analysis based on a calculated price
- `process_sensitivity_parameter` - Process a single sensitivity parameter from end to end

Example usage of the adapter:

```python
from calculations_sensitivity_adapter import calculation_adapter

# Run a price calculation
success, price, error = calculation_adapter.run_price_calculation(
    version='1',
    selected_v={'V10': 100, 'V11': 200},
    selected_f={'F10': 300, 'F11': 400},
    target_row=20,
    tolerance_lower=-1000,
    tolerance_upper=1000,
    increase_rate=1.02,
    decrease_rate=0.985
)

if success:
    # Run sensitivity analysis
    success, results, error = calculation_adapter.run_sensitivity_analysis(
        version='1',
        price=price,
        param_id='S10',
        mode='symmetrical',
        variations=[10],
        compare_to_key='NPV',
        comparison_type='primary'
    )
```

## Directory Structure

The system creates and maintains the following directory structure for sensitivity analysis:

```
public/Original/Batch(X)/Results(X)/Sensitivity/
├── Symmetrical/
│   ├── waterfall/
│   ├── bar/
│   └── point/
├── Multipoint/
│   ├── waterfall/
│   ├── bar/
│   └── point/
├── Reports/
├── Configuration/
└── Cache/

public/Original/Batch(X)/Results(X)/SensitivityPlots/
├── Sensitivity_Symmetrical_waterfall/
├── Sensitivity_Symmetrical_bar/
├── Sensitivity_Symmetrical_point/
├── Sensitivity_Multipoint_waterfall/
├── Sensitivity_Multipoint_bar/
└── Sensitivity_Multipoint_point/

public/Original/Batch(X)/Results(X)/SensitivityHTML/
├── HTML_Sensitivity_Symmetrical/
└── HTML_Sensitivity_Multipoint/
```

## API Usage

### Running Sensitivity Analysis

To run a standalone sensitivity analysis:

```javascript
// Frontend code
const response = await fetch('/sensitivity/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    version: 1,
    senParameters: {
      'S10': {
        enabled: true,
        mode: 'symmetrical',
        values: [10],
        compareToKey: 'S13',
        comparisonType: 'primary',
        waterfall: true,
        bar: true,
        point: true
      }
    }
  }),
});

const result = await response.json();
```

### Running Symmetrical Analysis

For symmetrical sensitivity analysis:

```javascript
// Frontend code
const response = await fetch('/sensitivity/symmetrical', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    version: 1,
    param_id: 'S10',
    values: [10],
    compareToKey: 'S13',
    comparisonType: 'primary',
    waterfall: true,
    bar: true,
    point: true
  }),
});

const result = await response.json();
```

### Getting Sensitivity Albums

To retrieve all sensitivity albums for a version:

```javascript
// Frontend code
const response = await fetch(`/sensitivity/albums/${version}`);
const albums = await response.json();
```

### Getting Sensitivity Plots

To retrieve all plots in a specific album:

```javascript
// Frontend code
const response = await fetch(`/sensitivity/plots/${version}/${albumName}`);
const plots = await response.json();
```

### Getting Sensitivity Results

To retrieve consolidated results of all sensitivity analyses for a version:

```javascript
// Frontend code
const response = await fetch(`/sensitivity/results/${version}`);
const results = await response.json();
```

## Integration with Calculation Pipeline

The system integrates with the existing calculation pipeline through the `run_calculation_with_sensitivity` method in the `sensitivity_integration.py` file. This method:

1. Runs the baseline calculation
2. Processes sensitivity parameters if provided
3. Organizes the results

To use this integration, modify the `/run` route in `Calculations.py` to use the `sensitivity_integration` instance:

```python
from sensitivity_integration import sensitivity_integration

@app.route('/run', methods=['POST'])
def run_scripts():
    # ... existing code ...
    
    # Process each version
    for version in selected_versions:
        # ... existing code ...
        
        success, error = sensitivity_integration.run_calculation_with_sensitivity(
            version,
            calculation_script,
            selected_v,
            selected_f,
            target_row,
            selected_calculation_option,
            version_tolerance_lower,
            version_tolerance_upper,
            version_increase_rate,
            version_decrease_rate,
            sen_parameters
        )
        
        if not success:
            return jsonify({"error": error}), 500
    
    # ... existing code ...
```

## Parameter Mapping

The system uses a parameter mapping system to map parameter IDs (like S10, S11) to their corresponding attributes in the configuration module. The mapping is defined in the `get_parameter_info` method of the `SensitivityAnalysisManager` class.

Current mappings include:

- S10: initialSellingPriceAmount13
- S11: variable_costsAmount4
- S13: bECAmount11
- S34: rawmaterialAmount34
- S35: laborAmount35
- S36: utilityAmount36
- S37: maintenanceAmount37
- S38: insuranceAmount38

## Frontend Integration

To integrate the sensitivity visualization in the frontend:

1. Import the CSS file:

```javascript
import './SensitivityVisualization.css';
```

2. Create a component that uses the API endpoints to fetch and display sensitivity results.

3. Use the provided CSS classes to style the component.

## Conclusion

The Sensitivity Analysis System provides a comprehensive solution for performing sensitivity analysis on economic models. It integrates with the existing calculation pipeline and provides a unified interface for generating, managing, and visualizing sensitivity analysis results.

By following the instructions in this document, you can effectively use the system to analyze how changes in input parameters affect key output metrics.