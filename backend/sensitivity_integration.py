"""
Integration module for sensitivity analysis.

This module provides a high-level interface for integrating the new sensitivity
workflow with the existing system, making it easier for the frontend to use.
"""

import os
import json
import logging
import time
from calculations_sensitivity_adapter import SensitivityAdapter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    filename=os.path.join(os.path.dirname(__file__), 'Logs', 'sensitivity_integration.log'),
    filemode='a'
)

class SensitivityIntegration:
    """
    Integration class for sensitivity analysis.
    
    This class provides a high-level interface for the frontend to use,
    ensuring that the sensitivity workflow is followed correctly.
    """
    
    def __init__(self, api_base_url="http://localhost:25007"):
        """
        Initialize the integration with the API base URL.
        
        Args:
            api_base_url (str): Base URL of the Flask API
        """
        self.adapter = SensitivityAdapter(api_base_url)
        self.logger = logging.getLogger(__name__)
        self.config_status_path = os.path.join(
            os.path.dirname(__file__), 
            'Logs', 
            'sensitivity_config_status.json'
        )
        
    def is_configured(self):
        """
        Check if sensitivity configurations have been generated and saved.
        
        Returns:
            bool: True if configurations exist, False otherwise
        """
        if not os.path.exists(self.config_status_path):
            return False
            
        try:
            with open(self.config_status_path, 'r') as f:
                status = json.load(f)
                return status.get('configured', False)
        except Exception as e:
            self.logger.error(f"Error checking configuration status: {str(e)}")
            return False
            
    def process_sensitivity_request(self, request_data):
        """
        Process a sensitivity analysis request from the frontend.
        
        This method ensures that the proper workflow is followed:
        1. If configurations don't exist, generate them
        2. Run sensitivity calculations
        3. Return the results
        
        Args:
            request_data (dict): Request data from the frontend
            
        Returns:
            dict: Results of the sensitivity analysis
        """
        self.logger.info("Processing sensitivity request")
        
        # Check if configurations exist
        if not self.is_configured():
            self.logger.info("Configurations don't exist, generating them first")
            config_result = self.adapter.generate_configurations(request_data)
            
            if not config_result.get('status') == 'success':
                self.logger.error(f"Failed to generate configurations: {config_result.get('error', 'Unknown error')}")
                return {
                    "status": "error",
                    "error": "Failed to generate configurations",
                    "details": config_result
                }
                
            self.logger.info("Configurations generated successfully")
            time.sleep(1)  # Small delay to ensure configurations are saved
        else:
            self.logger.info("Using existing configurations")
            
        # Run sensitivity calculations
        self.logger.info("Running sensitivity calculations")
        calc_result = self.adapter.run_calculations()
        
        if not calc_result.get('status') == 'success':
            self.logger.error(f"Failed to run calculations: {calc_result.get('error', 'Unknown error')}")
            return {
                "status": "error",
                "error": "Failed to run calculations",
                "details": calc_result
            }
            
        self.logger.info("Calculations completed successfully")
        
        # Return the results
        return {
            "status": "success",
            "message": "Sensitivity analysis completed successfully",
            "calculations": calc_result
        }
        
    def get_visualization_data(self):
        """
        Get visualization data for sensitivity results.
        
        Returns:
            dict: Visualization data
        """
        self.logger.info("Getting visualization data")
        
        # Check if configurations exist
        if not self.is_configured():
            self.logger.error("Cannot get visualization data: configurations don't exist")
            return {
                "status": "error",
                "error": "Sensitivity configurations must be generated first",
                "message": "Please generate sensitivity configurations before visualizing results"
            }
            
        # Get visualization data
        vis_result = self.adapter.visualize_results()
        
        if 'error' in vis_result:
            self.logger.error(f"Failed to get visualization data: {vis_result.get('error', 'Unknown error')}")
            return {
                "status": "error",
                "error": "Failed to get visualization data",
                "details": vis_result
            }
            
        self.logger.info("Visualization data retrieved successfully")
        return vis_result
        
    def reset_configuration(self):
        """
        Reset sensitivity configuration status.
        
        This method is useful for testing or when you want to force
        regeneration of configurations.
        
        Returns:
            bool: True if reset was successful, False otherwise
        """
        self.logger.info("Resetting sensitivity configuration status")
        
        try:
            if os.path.exists(self.config_status_path):
                with open(self.config_status_path, 'w') as f:
                    json.dump({
                        'configured': False,
                        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                        'message': "Configuration status reset manually"
                    }, f, indent=2)
                    
            self.logger.info("Configuration status reset successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Error resetting configuration status: {str(e)}")
            return False

# Example usage
if __name__ == "__main__":
    # Example request data
    example_request = {
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
    
    # Create integration and process request
    integration = SensitivityIntegration()
    
    # Optional: Reset configuration status for testing
    # integration.reset_configuration()
    
    # Process request
    result = integration.process_sensitivity_request(example_request)
    
    print(json.dumps(result, indent=2))
    
    # Get visualization data
    vis_data = integration.get_visualization_data()
    
    print("Visualization data available:", "plots" in vis_data)
