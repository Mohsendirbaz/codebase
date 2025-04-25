# runSub API Endpoint Documentation

## Overview
The `runSub` endpoint is a Flask-based API endpoint that processes visualization requests for financial data. It runs on port 5009 and executes Python scripts to generate financial plots based on the provided parameters.

## Module Integration
The `runSub` endpoint is part of the application's visualization module system. It works alongside other components to provide comprehensive financial data visualization capabilities:

- **Frontend Integration**: The endpoint is called from the main HomePage component via the `handleRunSub` function, which sends visualization parameters to generate plots.
- **Visualization Pipeline**: It serves as the backend processor for generating financial plots based on user-selected parameters.
- **Complementary Services**: While other visualization services like the plots API (port 5008) handle plot organization and retrieval, the runSub endpoint specifically handles the generation of new plots based on user configurations.

This endpoint is a standalone service within the backend API endpoints and controllers module, designed to work independently while complementing the overall visualization system.

## Endpoint Details
- **URL**: `/runSub`
- **Method**: POST
- **Port**: 5009
- **Content-Type**: application/json

## Request Parameters
The endpoint accepts a JSON object with the following parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `selectedVersions` | Array of integers | List of version numbers to include in the visualization | `[1]` |
| `selectedProperties` | Array of strings | List of property IDs to display in the visualization | `['initialSellingPriceAmount13']` |
| `remarks` | String | Whether to include remarks in the visualization ("on" or "off") | `"on"` |
| `customizedFeatures` | String | Whether to enable customized features ("on" or "off") | `"off"` |
| `subplotSelection` | Object | Configuration for which visualization plots to generate (SP1-SP8 keys) | `{}` |

### Example Request Body
```json
{
  "selectedVersions": [1, 2, 3],
  "selectedProperties": ["initialSellingPriceAmount13", "iRRAmount30"],
  "remarks": "on",
  "customizedFeatures": "off",
  "subplotSelection": {
    "SP1": "on",
    "SP2": "on",
    "SP3": "off",
    "SP4": "off",
    "SP5": "off",
    "SP6": "off",
    "SP7": "off",
    "SP8": "off"
  }
}
```

## Response
- **Success Response**: Empty response with status code 204 (No Content)
- **Error Response**: Error message with appropriate status code (404, 500)

### Error Codes
- **404**: File not found in the specified directory
- **500**: Error running scripts or unexpected error

## Process Flow
1. The endpoint receives a POST request with JSON data
2. It extracts the parameters from the request (selectedVersions, selectedProperties, remarks, customizedFeatures, and subplotSelection)
3. It changes the working directory to the script directory
4. It formats the selected versions and properties as comma-separated strings
5. It runs the `AggregatedSubPlots.py` script with the provided parameters, including the JSON-encoded subplot selection
6. It attempts to run the HTML album organizer if available
7. It returns a success or error response

## Visualization Types
The `subplotSelection` parameter controls which visualizations to generate:

| Key | Visualization Type |
|-----|-------------------|
| SP1 | Annual Cash Flows |
| SP2 | Annual Revenues |
| SP3 | Annual Operating Expenses |
| SP4 | Loan Repayment Terms |
| SP5 | Depreciation Schedules |
| SP6 | State Taxes |
| SP7 | Federal Taxes |
| SP8 | Cumulative Cash Flows |

## Output
The endpoint generates HTML visualization files in the following locations:
- Individual version folders: `Original/Batch(version)/Results(version)/v{versions_identifier}_{metric_name}_Plot/{metric_name}_Plot.html`
- Cumulative version folders: `Original/Batch(version)/Results(version)/v{versions_identifier}_Cumulative_Plot/{metric_name}_Cumulative_Plot.html`

## Methodology

### Configuration Matrix and Time Interval Management

The AggregatedSubPlots script uses configuration matrices to manage time intervals and associated property values for visualization. There are two types of configuration matrices:

1. **Configuration_Matrix (Legacy)**: 
   - Uses larger time intervals that span multiple years
   - Each row represents a time interval with start and end points
   - Property values apply to all years within an interval
   - Less granular control over year-by-year property values
   - Example structure:
     ```
     start,end,length,filtered_values
     1,2,2,"[{""id"": ""numberOfUnitsAmount12"", ""value"": ""36000""}]"
     2,20,19,"[{""id"": ""numberOfUnitsAmount12"", ""value"": ""36000""}]"
     ```

2. **General_Configuration_Matrix (Improved)**:
   - Treats each year as a separate unit on the x-axis
   - Each row represents exactly one year (interval length = 1)
   - Allows for precise year-by-year customization of property values
   - Higher granularity for time-based visualizations
   - Example structure:
     ```
     start,end,length,filtered_values
     1,1,1,[]
     2,2,1,"[{""id"": ""numberOfUnitsAmount12"", ""value"": ""36000""}]"
     3,3,1,[]
     ...
     20,20,1,[]
     ```

The script processes these matrices to assign property values and hover text to specific time points on the visualization.

### Hover Text Construction Procedure

Hover text in the visualizations is constructed through a multi-step process:

1. **Property Extraction**:
   - Selected properties are extracted from the U_configurations file
   - Property values are formatted based on their type (decimal, integer, etc.)
   - Remarks are included if the `remarks` parameter is set to "on"

2. **Hover Text Generation**:
   - For each time interval in the configuration matrix:
     - Extract filtered values for that interval
     - Convert property IDs to user-friendly names using property_mapping
     - Format values and add remarks if enabled
     - Combine into HTML-formatted hover text with `<br>` separators

3. **Time Interval Assignment**:
   - Hover text is assigned to each year within its respective time interval
   - This process is repeated for each metric (Annual Cash Flows, Annual Revenues, etc.)
   - The result is a comprehensive hover text for each data point in the visualization

4. **Prioritization**:
   - Properties from selected_properties are prioritized over those from filtered_values
   - This ensures that user-selected properties appear first in the hover text
   - Baselines are prioritized over customized configurations when both are available

### Upgrading Hover Information Display

To enhance the hover information display for time intervals:

1. **Switch to General_Configuration_Matrix**:
   - Update the code to use General_Configuration_Matrix instead of Configuration_Matrix
   - This provides year-by-year granularity for property values and hover text

2. **Enhance Filtering Based on User Selection**:
   - Implement more sophisticated filtering of hover text based on user-selected properties
   - Take into account user preferences for including remarks
   - Filter properties after user selection to show only relevant information

3. **Improve Time Interval Binning**:
   - Ensure hover texts are properly distributed into specific bins of time intervals
   - This restores the "lost feature" with higher granularity for version-specific information

4. **Maintain Priority System**:
   - Preserve the priority of baselines over customized configurations
   - For unchecked customized features with checked remarks, gather data from U_configurations

These improvements will enhance the user experience by providing more detailed and relevant hover information while maintaining the system's overall functionality.

## Related HTML Album Content Endpoints

The visualization system includes additional endpoints for retrieving and displaying the HTML content generated by the runSub endpoint. These endpoints are part of the Front_Subtab_HTML.py service running on port 8009.

### Album HTML Content Endpoint

This endpoint retrieves the HTML content for a specific album.

- **URL**: `/api/album_html_content/<album>`
- **Method**: GET
- **Port**: 8009
- **Parameters**:
  - `album` (path parameter): The album identifier (e.g., "HTML_v1_Annual_Cash_Flows")

#### Response
- **Success Response**: JSON object containing the album's HTML content
  ```json
  {
    "album": "HTML_v1_Annual_Cash_Flows",
    "file": "Annual_Cash_Flows_Plot.html",
    "content": "<html>...</html>",
    "path": "C:/path/to/album/Annual_Cash_Flows_Plot.html"
  }
  ```
- **Error Response**: Error message with appropriate status code (400, 404, 500)

#### Error Codes
- **400**: Invalid album format
- **404**: Album not found or no HTML files found in the album
- **500**: Error reading HTML file or processing album

### All Albums HTML Content Endpoint

This endpoint retrieves HTML content for all albums across specified versions.

- **URL**: `/api/album_html_all`
- **Method**: GET
- **Port**: 8009
- **Query Parameters**:
  - `version` (repeated): One or more version numbers (e.g., `?version=1&version=2`)

#### Response
- **Success Response**: JSON array of objects containing HTML content for all albums
  ```json
  [
    {
      "album": "HTML_v1_Annual_Cash_Flows",
      "version": "1",
      "file": "Annual_Cash_Flows_Plot.html",
      "content": "<html>...</html>",
      "path": "C:/path/to/album/Annual_Cash_Flows_Plot.html"
    },
    {
      "album": "HTML_v1_Annual_Revenues",
      "version": "1",
      "file": "Annual_Revenues_Plot.html",
      "content": "<html>...</html>",
      "path": "C:/path/to/album/Annual_Revenues_Plot.html"
    }
  ]
  ```
- **Error Response**: Error message with appropriate status code (400, 404, 500)

#### Error Codes
- **400**: No versions specified
- **404**: No albums found across specified versions
- **500**: Error processing request

### Test Endpoint

A test endpoint is available to verify that the album HTML content endpoints are working correctly.

- **URL**: `/test/album_endpoints`
- **Method**: GET
- **Port**: 8009

#### Response
- **Success Response**: JSON object containing test results
  ```json
  {
    "timestamp": "2023-06-01 12:34:56",
    "tests": [
      {
        "name": "Check BASE_PATH",
        "status": "PASS",
        "message": "BASE_PATH exists at C:/path/to/Original"
      },
      {
        "name": "Test /api/album_html_content/<album> endpoint",
        "status": "PASS",
        "message": "Endpoint returned status code 200",
        "details": {
          "status_code": 200,
          "album": "HTML_v1_Annual_Cash_Flows"
        }
      }
    ]
  }
  ```

## Frontend Integration

The DynamicSubplotComponent in the frontend uses these endpoints to fetch and display the HTML content generated by the runSub endpoint. The component:

1. Fetches available subplot metadata from the `/subplotMetadata` endpoint
2. Allows users to select which subplots to generate
3. Calls the runSub endpoint to generate the selected subplots
4. Fetches the generated HTML content using the `/api/album_html_content/<album>` endpoint
5. Displays the HTML content in an iframe

This integration provides a seamless user experience for generating and viewing dynamic subplots.

## Example Usage
```javascript
// Example using fetch API
fetch('http://localhost:5009/runSub', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    selectedVersions: [1, 2],
    selectedProperties: ['initialSellingPriceAmount13', 'iRRAmount30'],
    remarks: 'on',
    customizedFeatures: 'off',
    subplotSelection: {
      SP1: 'on',
      SP2: 'on'
    }
  }),
})
.then(response => {
  if (response.status === 204) {
    console.log('Visualization generated successfully');

    // After successful generation, fetch the HTML content
    return fetch(`http://localhost:8009/api/album_html_content/HTML_v1_2_Annual_Cash_Flows`);
  } else {
    return response.text().then(text => {
      throw new Error(text);
    });
  }
})
.then(response => response.json())
.then(data => {
  // Display the HTML content
  const iframe = document.createElement('iframe');
  iframe.srcdoc = data.content;
  document.body.appendChild(iframe);
})
.catch(error => {
  console.error('Error:', error);
});
```
