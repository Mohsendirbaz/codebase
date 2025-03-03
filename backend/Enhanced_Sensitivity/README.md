# Enhanced Sensitivity Analysis

This package provides an enhanced implementation of sensitivity analysis for the CFA application. It addresses the requirements to generate and save sensitivity configurations first, before running sensitivity calculations.

## Features

- Simplified directory structure for sensitivity analysis
- Proper sequencing of configuration generation and calculation execution
- Extraction and storage of calculated prices
- REST API endpoints for configuring, running, and retrieving results
- Comprehensive logging and error handling

## Directory Structure

The enhanced sensitivity analysis creates a simplified directory structure:

```
Sensitivity/
├── Reports/
│   └── sensitivity_summary.json
├── S34/
│   └── symmetrical/
│       ├── +10.00/
│       │   ├── calculated_price.json
│       │   ├── 1_config_module_3.json (modified)
│       │   └── ... (other config files)
│       └── -10.00/
│           ├── calculated_price.json
│           ├── 1_config_module_3.json (modified)
│           └── ... (other config files)
└── S35/
    └── ...
```

This structure organizes the sensitivity analysis by:
1. Parameter ID (e.g., S34)
2. Mode (symmetrical or multipoint)
3. Variation percentage (e.g., +10.00%)

## API Endpoints

The enhanced sensitivity analysis provides the following API endpoints:

- `POST /enhanced/sensitivity/configure`: Generate and save sensitivity configurations
- `POST /enhanced/runs`: Run sensitivity calculations
- `GET /enhanced/sensitivity/results`: Get sensitivity results
- `GET /enhanced/prices/:version`: Get calculated prices for a specific version
- `GET /enhanced/stream_prices/:version`: Stream calculated prices for a specific version
- `GET /enhanced/health`: Health check endpoint

## Usage

### Starting the Server

The enhanced sensitivity server runs on port 27890. You can start it using:

```bash
python backend/Enhanced_Sensitivity/start_enhanced_sensitivity_server.py
```

Or use the updated `start_servers.py` script which includes the enhanced sensitivity server.

### API Usage

1. **Generate Configurations**

```javascript
const configResponse = await fetch('http://127.0.0.1:27890/enhanced/sensitivity/configure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        selectedVersions: [1],
        selectedV: { V1: "on", V2: "off" },
        selectedF: { F1: "on", F2: "on", F3: "on", F4: "on", F5: "on" },
        selectedCalculationOption: "calculateForPrice",
        targetRow: 20,
        SenParameters: {
            S34: {
                mode: "symmetrical",
                values: [20],
                enabled: true,
                compareToKey: "S13",
                comparisonType: "primary",
                waterfall: true,
                bar: true,
                point: true
            }
        }
    })
});
```

2. **Run Calculations**

```javascript
const response = await fetch('http://127.0.0.1:27890/enhanced/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
});
```

3. **Get Results**

```javascript
const resultsResponse = await fetch('http://127.0.0.1:27890/enhanced/sensitivity/results');
const results = await resultsResponse.json();
```

## Implementation Details

The enhanced sensitivity analysis is implemented using the following components:

1. **Directory Builder**: Creates the directory structure and copies configuration files
2. **Executor**: Runs the calculations and extracts the results
3. **Flask Server**: Provides the API endpoints
4. **File Operations**: Utility functions for file operations
5. **Data Structures**: Data models and validation functions

## Key Improvements

1. **Proper Sequencing**: Ensures that configurations are generated and saved before running calculations
2. **Simplified Directory Structure**: Organizes the sensitivity analysis in a more logical way
3. **Comprehensive Logging**: Provides detailed logs for debugging and monitoring
4. **Error Handling**: Robust error handling and reporting
5. **Data Validation**: Validates input data to prevent errors
6. **Symmetrical Variations**: For symmetrical mode, uses 50% of the specified value for variations (e.g., ±10% for a value of 20%)
