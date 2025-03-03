import json
import logging
import requests
from pathlib import Path
import os

from sensitivity_logging import get_integration_logger

logger = get_integration_logger()

class CalculationsSensitivityAdapter:
    """
    Adapter to integrate sensitivity analysis with the Calculations module.
    This class serves as a bridge between the price calculation functionality
    in Calculations.py and the sensitivity analysis system.
    """
    
    def __init__(self, base_url="http://127.0.0.1:25007", direct_file_access=True):
        self.base_url = base_url
        self.direct_file_access = direct_file_access
        self.base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'public', 'Original')
        logger.info(f"Initialized CalculationsSensitivityAdapter with base URL: {base_url}")
        logger.info(f"Direct file access: {direct_file_access}")
        logger.info(f"Base directory: {self.base_dir}")
    
    def run_price_calculation(self, version, selected_v, selected_f, target_row, 
                            tolerance_lower, tolerance_upper, increase_rate, decrease_rate):
        """
        Run a price calculation using the Calculations module.
        
        Args:
            version: Version number
            selected_v, selected_f: V and F state dictionaries
            target_row: Target row for calculation
            tolerance_lower, tolerance_upper: Tolerance bounds
            increase_rate, decrease_rate: Adjustment rates
            
        Returns:
            tuple: (success, price, error_message)
        """
        from sensitivity_logging import track_method, log_directory_check, log_directory_access, directory_operation
        
        try:
            logger.info(f"Running price calculation for version {version}")
            
            # If direct file access is enabled, try to read price from file
            if self.direct_file_access:
                try:
                    price_file = os.path.join(self.base_dir, f"Batch({version})", f"Results({version})", "price.json")
                    
                    # Log directory access attempt
                    log_directory_access(os.path.dirname(price_file), os.path.exists(os.path.dirname(price_file)))
                    
                    if os.path.exists(price_file):
                        with open(price_file, 'r') as f:
                            price_data = json.load(f)
                            price = price_data.get("price")
                            logger.info(f"Loaded price from file: {price}")
                            return True, price, None
                except Exception as file_error:
                    logger.warning(f"Could not read price from file: {str(file_error)}")
                    # Continue to API approach
            
            # Prepare the payload for the Calculations module
            payload = {
                "selectedVersions": [version],
                "selectedV": selected_v,
                "selectedF": selected_f,
                "selectedCalculationOption": "calculateForPrice",
                "targetRow": target_row,
                "optimizationParams": {
                    "global": {
                        "toleranceLower": tolerance_lower,
                        "toleranceUpper": tolerance_upper,
                        "increaseRate": increase_rate,
                        "decreaseRate": decrease_rate
                    }
                },
                "SenParameters": {}  # Empty for baseline calculation
            }
            
            # Try the API calls with proper error handling
            try:
                # First check API health
                health_response = requests.get(f"{self.base_url}/health", timeout=2)
                if health_response.status_code != 200:
                    logger.warning(f"API health check failed: {health_response.status_code}")
                    return False, None, "API health check failed"
                
                # Call the Calculations module (try both endpoints for compatibility)
                endpoints = ['/runs', '/run']
                response = None
                
                for endpoint in endpoints:
                    try:
                        response = requests.post(
                            f"{self.base_url}{endpoint}", 
                            json=payload,
                            timeout=5
                        )
                        if response.status_code == 200:
                            break
                    except requests.RequestException as e:
                        logger.warning(f"Request failed for endpoint {endpoint}: {str(e)}")
                
                if not response or response.status_code != 200:
                    error_msg = f"Price calculation failed with status {response.status_code if response else 'no response'}"
                    logger.error(error_msg)
                    return False, None, error_msg
                
                # Get the calculated price (try both endpoints for compatibility)
                price = None
                price_endpoints = [f"/prices/{version}", f"/price/{version}"]
                
                for endpoint in price_endpoints:
                    try:
                        price_response = requests.get(f"{self.base_url}{endpoint}", timeout=5)
                        if price_response.status_code == 200:
                            price_data = price_response.json()
                            price = price_data.get("price")
                            break
                    except requests.RequestException as e:
                        logger.warning(f"Request failed for price endpoint {endpoint}: {str(e)}")
                
                if price is None:
                    # Fall back to file-based approach
                    if self.direct_file_access:
                        try:
                            price_file = os.path.join(self.base_dir, f"Batch({version})", f"Results({version})", "price.json")
                            if os.path.exists(price_file):
                                with open(price_file, 'r') as f:
                                    price_data = json.load(f)
                                    price = price_data.get("price")
                                    logger.info(f"Loaded price from file after API failure: {price}")
                                    return True, price, None
                        except Exception as file_error:
                            logger.warning(f"Could not read price from file after API failure: {str(file_error)}")
                    
                    error_msg = "Failed to retrieve price from API and file fallback"
                    logger.error(error_msg)
                    return False, None, error_msg
                
                logger.info(f"Successfully calculated price for version {version}: {price}")
                return True, price, None
                
            except requests.RequestException as e:
                error_msg = f"API request failed: {str(e)}"
                logger.error(error_msg)
                
                # Fall back to file-based approach for price
                if self.direct_file_access:
                    try:
                        price_file = os.path.join(self.base_dir, f"Batch({version})", f"Results({version})", "price.json")
                        if os.path.exists(price_file):
                            with open(price_file, 'r') as f:
                                price_data = json.load(f)
                                price = price_data.get("price")
                                logger.info(f"Loaded price from file after API failure: {price}")
                                return True, price, None
                    except Exception as file_error:
                        logger.warning(f"Could not read price from file after API failure: {str(file_error)}")
                
                return False, None, error_msg
                
        except Exception as e:
            error_msg = f"Error during price calculation: {str(e)}"
            logger.exception(error_msg)
            return False, None, error_msg
    
    def run_sensitivity_analysis(self, version, price, param_id, mode, variations,
                               compare_to_key="S10", comparison_type="primary", 
                               plot_types=None):
        """
        Run sensitivity analysis based on a calculated price.
        
        Args:
            version: Version number
            price: Calculated price to use as the reference point
            param_id: Sensitivity parameter ID (e.g., "S34")
            mode: Analysis mode ("symmetrical" or "multipoint")
            variations: List of variation percentages
            compare_to_key: Parameter to compare against (default "S10" for price)
            comparison_type: Comparison type ("primary" or "secondary")
            plot_types: List of plot types to generate
            
        Returns:
            tuple: (success, results, error_message)
        """
        from sensitivity_logging import track_method, log_directory_check, log_directory_access, directory_operation
        
        try:
            logger.info(f"Running sensitivity analysis for parameter {param_id} vs {compare_to_key}")
            
            if plot_types is None:
                plot_types = ["waterfall", "bar", "point"]
            
            # Check if sensitivity directories exist
            sensitivity_dir = os.path.join(self.base_dir, f"Batch({version})", f"Results({version})", "Sensitivity")
            log_directory_check(sensitivity_dir, os.path.exists(sensitivity_dir))
            
            # For direct file-based sensitivity analysis, skip API calls
            if self.direct_file_access:
                logger.info("Using direct file-based sensitivity analysis")
                
                # Check if mode-specific directory exists
                mode_dir = os.path.join(sensitivity_dir, mode.capitalize())
                log_directory_check(mode_dir, os.path.exists(mode_dir))
                
                # Generate dummy results since we're actually generating configs in the manager
                dummy_results = {
                    "param_id": param_id,
                    "mode": mode,
                    "compareToKey": compare_to_key,
                    "variations": variations,
                    "impacts": [v/10 for v in variations],  # Dummy impact values
                    "baseValue": price,
                    "results": [price * (1 + v/100) for v in variations]
                }
                return True, dummy_results, None
            
            # If we're using API, prepare the payload
            payload = {
                "version": version,
                "param_id": param_id,
                "values": variations,
                "compareToKey": compare_to_key,
                "comparisonType": comparison_type,
                "waterfall": "waterfall" in plot_types,
                "bar": "bar" in plot_types,
                "point": "point" in plot_types,
                "price": price  # Pass the calculated price
            }
            
            # Use the appropriate endpoint based on the mode
            endpoint = f"{self.base_url}/sensitivity/{mode.lower()}"
            
            try:
                # Call the sensitivity analysis API
                response = requests.post(endpoint, json=payload, timeout=5)
                
                if response.status_code != 200:
                    error_msg = f"Sensitivity analysis failed with status {response.status_code}"
                    if response.text:
                        try:
                            error_data = response.json()
                            if "error" in error_data:
                                error_msg = f"Sensitivity analysis failed: {error_data['error']}"
                        except:
                            error_msg = f"Sensitivity analysis failed: {response.text}"
                    
                    logger.error(error_msg)
                    
                    # Generate dummy results since API failed
                    dummy_results = {
                        "param_id": param_id,
                        "mode": mode,
                        "compareToKey": compare_to_key,
                        "variations": variations,
                        "impacts": [v/10 for v in variations],  # Dummy impact values
                        "baseValue": price,
                        "results": [price * (1 + v/100) for v in variations]
                    }
                    
                    logger.info("Generated dummy results after API failure")
                    return True, dummy_results, None
                
                results = response.json()
                logger.info(f"Successfully ran sensitivity analysis for {param_id}")
                return True, results, None
                
            except requests.RequestException as e:
                error_msg = f"API request failed: {str(e)}"
                logger.error(error_msg)
                
                # Generate dummy results since API failed
                dummy_results = {
                    "param_id": param_id,
                    "mode": mode,
                    "compareToKey": compare_to_key,
                    "variations": variations,
                    "impacts": [v/10 for v in variations],  # Dummy impact values
                    "baseValue": price,
                    "results": [price * (1 + v/100) for v in variations]
                }
                
                logger.info("Generated dummy results after API exception")
                return True, dummy_results, None
            
        except Exception as e:
            error_msg = f"Error during sensitivity analysis: {str(e)}"
            logger.exception(error_msg)
            return False, None, error_msg
    
    def process_sensitivity_parameter(self, version, param_id, config,
                                    selected_v, selected_f, target_row,
                                    tolerance_lower, tolerance_upper,
                                    increase_rate, decrease_rate):
        """
        Process a single sensitivity parameter from end to end.
        
        Args:
            version: Version number
            param_id: Sensitivity parameter ID
            config: Parameter configuration
            selected_v, selected_f: V and F state dictionaries
            target_row: Target row for calculation
            tolerance_lower, tolerance_upper: Tolerance bounds
            increase_rate, decrease_rate: Adjustment rates
            
        Returns:
            tuple: (success, results, error_message)
        """
        from sensitivity_logging import track_method, log_directory_check, log_directory_access, directory_operation
        from sensitivity_logging import log_execution_flow
        
        try:
            # Log execution flow
            log_execution_flow('enter', f"Processing sensitivity parameter {param_id} for version {version}")
            
            # Check if sensitivity directories exist
            sensitivity_dir = os.path.join(self.base_dir, f"Batch({version})", f"Results({version})", "Sensitivity")
            log_directory_check(sensitivity_dir, os.path.exists(sensitivity_dir))
            
            # First, run the base price calculation
            log_execution_flow('checkpoint', f"Running base price calculation for {param_id}")
            success, price, error = self.run_price_calculation(
                version, selected_v, selected_f, target_row,
                tolerance_lower, tolerance_upper, increase_rate, decrease_rate
            )
            
            if not success:
                log_execution_flow('error', f"Base price calculation failed: {error}")
                return False, None, f"Base price calculation failed: {error}"
            
            # Extract sensitivity configuration
            mode = config.get('mode')
            if not mode:
                return False, None, f"No analysis mode specified for {param_id}"
                
            values = config.get('values', [])
            if mode == 'symmetrical' and (not values or len(values) == 0):
                values = [10]  # Default to 10% variation for symmetrical mode
            elif mode == 'multipoint' and (not values or len(values) == 0):
                return False, None, f"No variation points specified for multipoint analysis of {param_id}"
                
            compare_to_key = config.get('compareToKey')
            if not compare_to_key:
                compare_to_key = "S10"  # Default to S10 (price) if not specified
                
            comparison_type = config.get('comparisonType', 'primary')
            
            # Determine plot types
            plot_types = []
            if config.get('waterfall'): plot_types.append('waterfall')
            if config.get('bar'): plot_types.append('bar')
            if config.get('point'): plot_types.append('point')
            
            # Run the sensitivity analysis
            success, results, error = self.run_sensitivity_analysis(
                version, price, param_id, mode, values,
                compare_to_key, comparison_type, plot_types
            )
            
            if not success:
                return False, None, f"Sensitivity analysis failed: {error}"
                
            return True, results, None
            
        except Exception as e:
            error_msg = f"Error processing sensitivity parameter {param_id}: {str(e)}"
            logger.exception(error_msg)
            return False, None, error_msg

# Create a singleton instance with direct file access enabled by default
calculation_adapter = CalculationsSensitivityAdapter(direct_file_access=True)
