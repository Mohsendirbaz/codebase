# Sensitivity Analysis Integration Implementation Plan

This document outlines the steps to integrate the sensitivity analysis system with the existing calculation pipeline.

## Overview

The integration involves:

1. Adding centralized logging for all sensitivity analysis components
2. Creating an adapter to bridge between Calculations.py and the sensitivity analysis system
3. Updating existing components to use the centralized logging and adapter
4. Integrating with the frontend

## Implementation Steps

### Step 1: Update Logging Configuration

1. Deploy the `sensitivity_logging.py` file to the backend directory
2. Create the logs directory structure if it doesn't exist
3. Update the log file paths in the `sensitivity_logging.py` file if necessary

### Step 2: Deploy the Adapter

1. Deploy the `calculations_sensitivity_adapter.py` file to the backend directory
2. Update the server URLs in the adapter if necessary (currently set to localhost:5007 and localhost:25007)

### Step 3: Update Backend Components

1. Deploy the updated versions of:
   - `sensitivity_analysis_manager.py`
   - `sensitivity_plot_organizer.py`
   - `sensitivity_html_organizer.py`
   - `sensitivity_integration.py`
   - `updated_sensitivity_routes.py`

2. Verify that all components are using the centralized logging configuration

### Step 4: Integrate with Calculations.py

1. Modify the `/run` route in `Calculations.py` to use the `sensitivity_integration` instance:

```python
from sensitivity_integration import sensitivity_integration

@app.route('/run', methods=['POST'])
def run_scripts():
    # ... existing code ...
    
    # Process each version
    for version in selected_versions:
        # ... existing code ...
        
        # Add sensitivity analysis integration
        if 'senParameters' in data and data['senParameters']:
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
                data['senParameters']
            )
            
            if not success:
                return jsonify({"error": error}), 500
    
    # ... existing code ...
```

2. Register the updated sensitivity routes blueprint in `Calculations.py`:

```python
from updated_sensitivity_routes import updated_sensitivity_routes

app.register_blueprint(updated_sensitivity_routes)
```

### Step 5: Deploy Frontend Integration

1. Deploy the `SensitivityIntegration.js` file to the `src/components` directory
2. Update the server URLs in the component if necessary
3. Import and use the component in the appropriate frontend pages:

```javascript
import SensitivityIntegration from './components/SensitivityIntegration';

// In your component
<SensitivityIntegration 
  version={selectedVersion} 
  onError={(message) => setError(message)} 
/>
```

### Step 6: Testing

1. Test the integration with Calculations.py:
   - Run a calculation with sensitivity parameters
   - Verify that the sensitivity analysis is executed
   - Check the logs for any errors

2. Test the frontend integration:
   - Verify that the component can connect to the server
   - Test the fallback logic by stopping the main server
   - Verify that all functionality works with both servers

3. Test the album organization:
   - Run a sensitivity analysis that generates plots and HTML files
   - Verify that the files are organized into albums
   - Check that the albums are accessible through the API

## Rollback Plan

If issues are encountered during the integration, follow these steps to rollback:

1. Revert the changes to `Calculations.py`
2. Restore the original versions of the sensitivity analysis components
3. Remove the new files (`sensitivity_logging.py`, `calculations_sensitivity_adapter.py`, `SensitivityIntegration.js`)

## Monitoring

After the integration is complete, monitor the following:

1. The logs in the `logs` directory for any errors
2. The performance of the sensitivity analysis system
3. The frontend integration to ensure it's working correctly

## Conclusion

This implementation plan provides a step-by-step guide for integrating the sensitivity analysis system with the existing calculation pipeline. By following these steps, the integration should be smooth and successful.

If any issues are encountered during the implementation, refer to the `README_SENSITIVITY.md` file for detailed information about the components and their usage.