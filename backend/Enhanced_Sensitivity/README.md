# Enhanced Sensitivity Analysis

This module provides enhanced sensitivity analysis functionality for the CFA application.

## Overview

The enhanced sensitivity analysis allows users to:

1. Configure sensitivity parameters with their applied variations
2. Run sensitivity calculations for all variations
3. View sensitivity results and visualizations

## Architecture

The enhanced sensitivity analysis consists of the following components:

- **Flask Server**: Provides API endpoints for configuring, running, and getting results
- **Directory Builder**: Creates sensitivity directories and modifies parameter values
- **Executor**: Runs calculations and generates summary reports
- **File Operations**: Utility functions for file operations

## API Endpoints

### Configuration

- `POST /enhanced/sensitivity/configure`: Generate and save sensitivity configurations with their applied variations

### Execution

- `POST /enhanced/runs`: Run sensitivity calculations for all variations

### Results

- `GET /enhanced/sensitivity/results`: Get sensitivity results for all variations
- `GET /enhanced/prices/<version>`: Get calculated prices for a specific version
- `GET /enhanced/stream_prices/<version>`: Stream calculated prices for a specific version

### Visualization

- `POST /enhanced/sensitivity/visualize`: Generate visualizations for sensitivity analysis results
- `GET /enhanced/sensitivity/visualization/<param_id>/<plot_type>`: Get a specific sensitivity visualization

### Health Check

- `GET /enhanced/health`: Health check endpoint for server detection

## Usage

1. Start the enhanced sensitivity server:

```bash
python start_enhanced_sensitivity_server.py
```

2. Configure sensitivity parameters:

```bash
curl -X POST http://localhost:25007/enhanced/sensitivity/configure \
  -H "Content-Type: application/json" \
  -d '{
    "selectedVersions": [1],
    "selectedV": {"V1": "on", "V2": "off"},
    "selectedF": {"F1": "on", "F2": "off"},
    "selectedCalculationOption": "freeFlowNPV",
    "targetRow": 20,
    "SenParameters": {
      "S1": {
        "enabled": true,
        "file": "config.json",
        "path": "parameters.interest_rate",
        "baseValue": 0.05,
        "step": 10,
        "stepsUp": 2,
        "stepsDown": 2,
        "point": true,
        "bar": true,
        "waterfall": true
      }
    }
  }'
```

3. Run sensitivity calculations:

```bash
curl -X POST http://localhost:25007/enhanced/runs
```

4. Get sensitivity results:

```bash
curl -X GET http://localhost:25007/enhanced/sensitivity/results
```

5. Generate visualizations:

```bash
curl -X POST http://localhost:25007/enhanced/sensitivity/visualize
```

## Important Notes

- Sensitivity configurations must be generated and saved first with their applied variations before running sensitivity calculations.
- The enhanced sensitivity analysis uses the existing calculation engine from the API_endpoints_and_controllers/Calculations_and_Sensitivity.py module.
- Visualizations are generated using matplotlib and saved as PNG files.

## Integration with Main Application

To integrate the enhanced sensitivity analysis with the main application:

1. Add the enhanced sensitivity server to the start_servers.py script:

```python
# Start enhanced sensitivity server
subprocess.Popen([
    "python",
    os.path.join(BASE_DIR, "Enhanced_Sensitivity", "start_enhanced_sensitivity_server.py")
])
```

2. Update the frontend to use the enhanced sensitivity API endpoints.

## File Structure

```
Enhanced_Sensitivity/
├── enhanced_sensitivity_flask_server.py   # Flask server with API endpoints
├── enhanced_sensitivity_directory_builder.py  # Directory builder for sensitivity analysis
├── enhanced_sensitivity_executor.py       # Executor for sensitivity calculations
├── enhanced_sensitivity_file_operations.py  # Utility functions for file operations
├── start_enhanced_sensitivity_server.py   # Script to start the server
└── README.md                             # Documentation
```

## Development

To add new features to the enhanced sensitivity analysis:

1. Update the API endpoints in enhanced_sensitivity_flask_server.py
2. Add new functionality to the appropriate module
3. Update the documentation in README.md
