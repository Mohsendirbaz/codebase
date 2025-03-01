import json
import logging
import requests
from pathlib import Path

from sensitivity_logging import get_integration_logger

logger = get_integration_logger()

class CalculationsSensitivityAdapter:
    """
    Adapter to integrate sensitivity analysis with the Calculations module.
    This class serves as a bridge between the price calculation functionality
    in Calculations.py and the sensitivity analysis system.
    """
    
    def __init__(self, calculations_url="http://127.0.0.1:5007", sensitivity_url="http://127.0.0.1:25007"):
        self.calculations_url = calculations_url
        self.sensitivity_url = sensitivity_url
    
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
        try:
            logger.info(f"Running price calculation for version {version}")
            
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
            
            # Call the Calculations module
            response = requests.post(
                f"{self.calculations_url}/run",
                json=payload
            )
            
            if response.status_code != 200:
                error_msg = f"Price calculation failed with status {response.status_code}"
                if response.text:
                    try:
                        error_data = response.json()
                        if "error" in error_data:
                            error_msg = f"Price calculation failed: {error_data['error']}"
                    except:
                        error_msg = f"Price calculation failed: {response.text}"
                
                logger.error(error_msg)
                return False, None, error_msg
            
            # Get the calculated price
            price_response = requests.get(f"{self.calculations_url}/price/{version}")
            
            if price_response.status_code != 200:
                error_msg = f"Failed to retrieve price with status {price_response.status_code}"
                logger.error(error_msg)
                return False, None, error_msg
            
            price_data = price_response.json()
            price = price_data.get("price")
            
            logger.info(f"Successfully calculated price for version {version}: {price}")
            return True, price, None
            
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
        try:
            logger.info(f"Running sensitivity analysis for parameter {param_id} vs {compare_to_key}")
            
            if plot_types is None:
                plot_types = ["waterfall", "bar", "point"]
            
            # Prepare the payload for the sensitivity analysis
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
            endpoint = f"{self.sensitivity_url}/sensitivity/{mode}"
            
            # Call the sensitivity analysis module
            response = requests.post(endpoint, json=payload)
            
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
                return False, None, error_msg
            
            results = response.json()
            logger.info(f"Successfully ran sensitivity analysis for {param_id}")
            return True, results, None
            
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
        try:
            logger.info(f"Processing sensitivity parameter {param_id} for version {version}")
            
            # First, run the base price calculation
            success, price, error = self.run_price_calculation(
                version, selected_v, selected_f, target_row,
                tolerance_lower, tolerance_upper, increase_rate, decrease_rate
            )
            
            if not success:
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

# Create a singleton instance
calculation_adapter = CalculationsSensitivityAdapter()