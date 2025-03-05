"""
Adapter module for sensitivity analysis workflow.

This module provides a simplified interface for the new sensitivity analysis workflow,
ensuring that configurations are generated and saved before running calculations.
"""

import requests
import json
import time
import logging
import os
import sys

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

class SensitivityAdapter:
    """
    Adapter for the sensitivity analysis workflow.
    
    This class ensures that sensitivity configurations are generated and saved
    before running calculations, following the required sequence.
    """
    
    def __init__(self, base_url="http://localhost:25007"):
        """
        Initialize the adapter with the base URL of the Flask API.
        
        Args:
            base_url (str): Base URL of the Flask API
        """
        self.base_url = base_url
        self.logger = logging.getLogger(__name__)
        
    def run_sensitivity_analysis(self, config_data):
        """
        Run the complete sensitivity analysis workflow.
        
        This method ensures the proper sequence:
        1. Generate and save configurations
        2. Run sensitivity calculations
        3. Visualize results (optional)
        
        Args:
            config_data (dict): Configuration data for sensitivity analysis
            
        Returns:
            dict: Results of the sensitivity analysis
        """
        self.logger.info("Starting sensitivity analysis workflow")
        
        # Step 1: Generate and save configurations
        self.logger.info("Step 1: Generating and saving sensitivity configurations")
        config_result = self.generate_configurations(config_data)
        
        if not config_result.get('status') == 'success':
            self.logger.error("Failed to generate configurations: %s", config_result.get('error', 'Unknown error'))
            return config_result
            
        self.logger.info("Configurations generated successfully")
        time.sleep(1)  # Small delay to ensure configurations are saved
        
        # Step 2: Run sensitivity calculations
        self.logger.info("Step 2: Running sensitivity calculations")
        calc_result = self.run_calculations()
        
        if not calc_result.get('status') == 'success':
            self.logger.error("Failed to run calculations: %s", calc_result.get('error', 'Unknown error'))
            return calc_result
            
        self.logger.info("Calculations completed successfully")
        
        # Return the results
        return {
            "status": "success",
            "message": "Sensitivity analysis completed successfully",
            "configuration": config_result,
            "calculations": calc_result
        }
    
    def generate_configurations(self, config_data):
        """
        Generate and save sensitivity configurations.
        
        Args:
            config_data (dict): Configuration data for sensitivity analysis
            
        Returns:
            dict: Result of the configuration generation
        """
        try:
            response = requests.post(
                f"{self.base_url}/sensitivity/configure",
                json=config_data,
                headers={"Content-Type": "application/json"}
            )
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            self.logger.error("Error generating configurations: %s", str(e))
            
            if hasattr(e, 'response') and e.response is not None:
                try:
                    return e.response.json()
                except:
                    pass
                    
            return {
                "status": "error",
                "error": str(e)
            }
    
    def run_calculations(self):
        """
        Run sensitivity calculations.
        
        This method assumes configurations have been generated and saved.
        
        Returns:
            dict: Result of the calculations
        """
        try:
            response = requests.post(
                f"{self.base_url}/runs",
                headers={"Content-Type": "application/json"}
            )
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            self.logger.error("Error running calculations: %s", str(e))
            
            if hasattr(e, 'response') and e.response is not None:
                try:
                    return e.response.json()
                except:
                    pass
                    
            return {
                "status": "error",
                "error": str(e)
            }
    
    def visualize_results(self):
        """
        Visualize sensitivity results.
        
        This method assumes configurations have been generated and calculations have been run.
        
        Returns:
            dict: Visualization data
        """
        try:
            response = requests.post(
                f"{self.base_url}/sensitivity/visualization",
                headers={"Content-Type": "application/json"}
            )
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            self.logger.error("Error visualizing results: %s", str(e))
            
            if hasattr(e, 'response') and e.response is not None:
                try:
                    return e.response.json()
                except:
                    pass
                    
            return {
                "status": "error",
                "error": str(e)
            }

# Example usage
if __name__ == "__main__":
    # Example configuration data
    example_config = {
        "selectedVersions": [1],
        "selectedV": {"V1": "on", "V2": "off"},
        "selectedF": {"F1": "on", "F2": "on", "F3": "on", "F4": "on", "F5": "on"},
        "selectedCalculationOption": "calculateForPrice",
        "targetRow": 20,
        "SenParameters": {
            "S34": {
                "mode": "symmetrical",
                "values": [20],
                "enabled": True,
                "compareToKey": "S13",
                "comparisonType": "primary",
                "waterfall": True,
                "bar": True,
                "point": True
            },
            "S35": {
                "mode": "symmetrical",
                "values": [20],
                "enabled": True,
                "compareToKey": "S13",
                "comparisonType": "primary",
                "waterfall": True,
                "bar": True,
                "point": True
            }
        }
    }
    
    # Create adapter and run analysis
    adapter = SensitivityAdapter()
    result = adapter.run_sensitivity_analysis(example_config)
    
    print(json.dumps(result, indent=2))
