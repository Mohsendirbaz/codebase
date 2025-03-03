# Sensitivity Analysis Workflow

This document describes the sensitivity analysis workflow implemented in the application. The workflow ensures that sensitivity configurations are generated and saved before sensitivity runs can be performed.

## Overview

The sensitivity analysis workflow consists of three main steps:

1. **Generate and Save Configurations**: First, sensitivity configurations are generated and saved with their applied variations.
2. **Run Sensitivity Calculations**: Only after configurations are saved, sensitivity runs can be performed.
3. **Visualize Results**: Finally, visualization of sensitivity results can be accessed.

## API Endpoints

The following API endpoints are available for the sensitivity analysis workflow:

### Health Check

#### `/health` (GET)

Returns a 200 OK response with basic server information. This endpoint is used for server detection by the frontend.

**Response:**
```json
{
  "status": "ok",
  "server": "sensitivity-analysis-server",
  "version": "1.0.0",
  "timestamp": "2025-03-03 04:20:00"
}
```

### 1. `/sensitivity/configure` (POST)

Generates and saves sensitivity configurations with their applied variations.

**Request Body:**
```json
{
  "selectedVersions": [1],
  "selectedV": {"V1": "on", "V2": "off", ...},
  "selectedF": {"F1": "on", "F2": "on", ...},
  "selectedCalculationOption": "calculateForPrice",
  "targetRow": 20,
  "SenParameters": {
    "S34": {
      "mode": "symmetrical",
      "values": [20],
      "enabled": true,
      "compareToKey": "S13",
      "comparisonType": "primary",
      "waterfall": true,
      "bar": true,
      "point": true
    },
    ...
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Sensitivity configurations generated and saved successfully",
  "runId": "20250303_123456",
  "configDir": "/path/to/config/dir",
  "sensitivityDir": "/path/to/sensitivity/dir",
  "savedFiles": 5,
  "nextStep": "Visit /runs to execute sensitivity calculations"
}
```

### 2. `/runs` (POST)

Runs sensitivity calculations. This endpoint requires that configurations have been generated and saved first.

**Request Body:**
```json
{
  "selectedVersions": [1],
  "selectedV": {"V1": "on", "V2": "off", ...},
  "selectedF": {"F1": "on", "F2": "on", ...},
  "selectedCalculationOption": "calculateForPrice",
  "targetRow": 20,
  "SenParameters": {
    "S34": {
      "mode": "symmetrical",
      "values": [20],
      "enabled": true,
      "compareToKey": "S13",
      "comparisonType": "primary",
      "waterfall": true,
      "bar": true,
      "point": true
    },
    ...
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Calculations completed successfully",
  "runId": "20250303_123456",
  "timing": {
    "total": "10.25s",
    "configuration": "2.50s",
    "calculations": 6
  }
}
```

### 3. `/sensitivity/visualize` (POST)

Generates visualizations for sensitivity analysis. This endpoint requires that configurations have been generated and calculations have been run.

**Request Body:**
```json
{
  "selectedVersions": [1],
  "selectedV": {"V1": "on", "V2": "off", ...},
  "selectedF": {"F1": "on", "F2": "on", ...},
  "selectedCalculationOption": "calculateForPrice",
  "targetRow": 20,
  "SenParameters": {
    "S34": {
      "mode": "symmetrical",
      "values": [20],
      "enabled": true,
      "compareToKey": "S13",
      "comparisonType": "primary",
      "waterfall": true,
      "bar": true,
      "point": true
    },
    ...
  }
}
```

**Response:**
```json
{
  "parameters": {
    "S34": {
      "id": "S34",
      "mode": "symmetrical",
      "enabled": true,
      "status": {
        "processed": true,
        "error": null,
        "isSpecialCase": true
      }
    },
    ...
  },
  "relationships": [
    {
      "source": "S34",
      "target": "S13",
      "type": "primary",
      "plotTypes": ["waterfall", "bar", "point"]
    },
    ...
  ],
  "plots": {
    "S34": {
      "waterfall": {
        "status": "ready",
        "path": "Batch(1)/Results(1)/Sensitivity/Symmetrical/waterfall_S34_S13_primary.png",
        "error": null
      },
      ...
    },
    ...
  },
  "metadata": {
    "version": "1",
    "runId": "20250303_123456",
    "processingTime": 0.75,
    "plotsGenerated": 15,
    "errors": []
  }
}
```

## Frontend Integration

The frontend has been updated to follow the new workflow. The `handleRuns` function in `L_1_HomePage.js` now follows these steps:

1. First, it calls the `/sensitivity/configure` endpoint to generate and save sensitivity configurations.
2. Then, it calls the `/runs` endpoint to run the sensitivity calculations.
3. Finally, it calls the `/sensitivity/visualize` endpoint to generate visualizations.

## Directory Structure

The sensitivity analysis workflow creates the following directory structure:

```
backend/Original/Batch(1)/Results(1)/Sensitivity/
├── Configuration/
│   ├── sensitivity_config.json
│   ├── S34_config.json
│   └── ...
├── Symmetrical/
│   ├── waterfall/
│   ├── bar/
│   ├── point/
│   └── Configuration/
│       ├── S34_+20.00/
│       └── S34_-20.00/
├── Multipoint/
│   ├── waterfall/
│   ├── bar/
│   ├── point/
│   └── Configuration/
├── Reports/
└── Cache/
```

## Logging

The sensitivity analysis workflow logs information to the following files:

- `backend/Logs/SENSITIVITY.log`: Main sensitivity log file
- `backend/Logs/sensitivity_config_status.json`: Configuration status file
- `backend/Logs/sensitivity_config_data.pkl`: Configuration data file

## Error Handling

The workflow includes error handling at each step:

1. If configurations haven't been generated, the `/runs` endpoint returns an error.
2. If calculations haven't been run, the `/sensitivity/visualize` endpoint may not find all expected plots.

## Supporting Modules

The following modules support the sensitivity analysis workflow:

- `sensitivity_logging.py`: Specialized logging for sensitivity analysis
- `sensitivity_plot_organizer.py`: Organizer for sensitivity plots
- `sensitivity_html_organizer.py`: Generator for HTML reports
- `sensitivity_analysis_manager.py`: Main entry point coordinating all components
- `updated_sensitivity_routes.py`: Updated routes for the Flask application
- `calculations_sensitivity_adapter.py`: Adapter for the new workflow

## Conclusion

The new sensitivity analysis workflow ensures that configurations are generated and saved before sensitivity runs can be performed. This improves the reliability and consistency of the sensitivity analysis process.
