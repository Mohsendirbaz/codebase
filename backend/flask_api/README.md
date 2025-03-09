# Flask API Backend for ModelZone

This backend provides API endpoints to support the ModelZone component, sensitivity analysis, and price efficacy features in the frontend application.

## Overview

The backend serves several key functions:
1. **File Access**: Provides endpoints for accessing files from the server
2. **Sensitivity Analysis**: Performs parameter sensitivity analysis and Monte Carlo simulations
3. **Price Data**: Fetches and processes price information from economic summary files
4. **Efficacy Metrics**: Calculates price efficacy metrics based on sensitivity and price data

## Installation

1. Install Python 3.8+ if not already installed
2. Install the required dependencies:

```bash
cd backend/flask_api
pip install -r requirements.txt
```

## Running the Server

To run the server:

```bash
cd backend/flask_api
python app.py
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### File API

- **GET /api/file**: Get a file from the server
  - Query params: `path` (required) - Path to the file
  - Returns: File content

- **GET /api/file/list**: List files in a directory
  - Query params: 
    - `path` (required) - Path to the directory
    - `recursive` (optional) - Whether to list files recursively
  - Returns: JSON array of files

- **GET /api/file/exists**: Check if a file exists
  - Query params: `path` (required) - Path to check
  - Returns: JSON with existence info

### Sensitivity API

- **POST /api/sensitivity/analyze**: Run sensitivity analysis
  - Body: JSON with parameters configuration
  - Returns: Sensitivity analysis results

- **POST /api/sensitivity/monte-carlo**: Run Monte Carlo simulation
  - Body: JSON with parameters configuration
  - Returns: Monte Carlo simulation results

- **GET /api/sensitivity/derivatives/{parameter}**: Get derivatives data for a parameter
  - Path params: `parameter` (required) - Parameter name
  - Query params:
    - `version` (required) - Model version
    - `extension` (optional) - Model extension
  - Returns: Derivatives data

- **POST /api/sensitivity/efficacy**: Calculate efficacy metrics
  - Body: JSON with sensitivity data and price data
  - Returns: Efficacy metrics

### Price API

- **GET /api/price/data**: Get price data for a model version
  - Query params:
    - `version` (required) - Model version
    - `extension` (optional) - Model extension
  - Returns: Price data with average selling price

- **POST /api/price/comparison**: Compare prices between variants
  - Body: JSON with base version and variants
  - Returns: Price comparison data

- **POST /api/price/impact**: Calculate price impact of parameter changes
  - Body: JSON with base price and parameters
  - Returns: Price impact analysis

## Integrating with the Frontend

The frontend should use the following base URL for API requests:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

Example usage in a service file:
```javascript
async function fetchPriceData(version, extension) {
  const url = `${API_BASE_URL}/price/data?version=${version}${extension ? `&extension=${extension}` : ''}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch price data');
  }
  
  return await response.json();
}

async function runSensitivityAnalysis(parameters) {
  const url = `${API_BASE_URL}/sensitivity/analyze`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parameters })
  });
  
  if (!response.ok) {
    throw new Error('Sensitivity analysis failed');
  }
  
  return await response.json();
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Success
- 400: Bad request (invalid parameters)
- 404: Not found
- 500: Server error

Error responses include a JSON object with an "error" property:
```json
{
  "error": "Error message"
}
```

## Logging

The backend logs all API requests and errors to:
- Console output
- `backend/flask_api/api.log` file

## Security Notes

- The file API includes basic protection against path traversal attacks
- In a production environment, additional security measures should be implemented
- CORS is configured to allow requests from any origin for development
