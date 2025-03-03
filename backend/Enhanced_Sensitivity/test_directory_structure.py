"""
Test script to verify that the sensitivity directories are created correctly.

This script will:
1. Generate a sensitivity configuration
2. Check if the directories are created with the correct structure
"""

import os
import sys
import json
import requests
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Base URL for the enhanced sensitivity API
BASE_URL = "http://127.0.0.1:27890"

# Base directory for the sensitivity analysis
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINAL_DIR = os.path.join(BASE_DIR, "Original")

def test_directory_structure():
    """
    Test that the sensitivity directories are created correctly.
    """
    logger.info("Starting directory structure test")
    
    # Step 1: Generate a sensitivity configuration
    logger.info("Step 1: Generating sensitivity configuration")
    
    # Prepare request payload
    config_payload = {
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
            }
        }
    }
    
    # Call the enhanced sensitivity configure endpoint
    try:
        response = requests.post(
            f"{BASE_URL}/enhanced/sensitivity/configure",
            json=config_payload,
            headers={"Content-Type": "application/json"}
        )
        
        response.raise_for_status()
        config_result = response.json()
        
        logger.info(f"Configuration generated successfully: {config_result['message']}")
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error generating configuration: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response: {e.response.text}")
        return False
    
    # Step 2: Check if the directories are created with the correct structure
    logger.info("Step 2: Checking directory structure")
    
    # Define the expected directory structure
    results_folder = os.path.join(ORIGINAL_DIR, "Batch(1)", "Results(1)")
    sensitivity_dir = os.path.join(results_folder, "Sensitivity")
    
    # Expected directories
    expected_dirs = [
        os.path.join(sensitivity_dir, "Reports"),
        os.path.join(sensitivity_dir, "S34", "symmetrical", "+10.00"),
        os.path.join(sensitivity_dir, "S34", "symmetrical", "-10.00")
    ]
    
    # Check if the expected directories exist
    missing_dirs = []
    for dir_path in expected_dirs:
        if not os.path.exists(dir_path):
            missing_dirs.append(dir_path)
            logger.error(f"Missing directory: {dir_path}")
        else:
            logger.info(f"Found directory: {dir_path}")
    
    # Check if the config files are copied to the variation directories
    config_file = "1_config_module_3.json"
    missing_files = []
    
    for variation_dir in [
        os.path.join(sensitivity_dir, "S34", "symmetrical", "+10.00"),
        os.path.join(sensitivity_dir, "S34", "symmetrical", "-10.00")
    ]:
        config_path = os.path.join(variation_dir, config_file)
        if not os.path.exists(config_path):
            missing_files.append(config_path)
            logger.error(f"Missing config file: {config_path}")
        else:
            logger.info(f"Found config file: {config_path}")
            
            # Check if the parameter value is modified correctly
            try:
                with open(config_path, 'r') as f:
                    config_data = json.load(f)
                
                # Check if rawmaterialAmount34 is modified
                if "rawmaterialAmount34" in config_data:
                    logger.info(f"rawmaterialAmount34 value: {config_data['rawmaterialAmount34']}")
                    
                    # For +10.00 variation, the value should be increased by 10%
                    if "+10.00" in variation_dir and config_data["rawmaterialAmount34"] > 10000:
                        logger.info(f"Value is correctly increased for +10.00 variation")
                    # For -10.00 variation, the value should be decreased by 10%
                    elif "-10.00" in variation_dir and config_data["rawmaterialAmount34"] < 10000:
                        logger.info(f"Value is correctly decreased for -10.00 variation")
                    else:
                        logger.error(f"Value is not correctly modified for variation")
                else:
                    logger.error(f"rawmaterialAmount34 not found in config file")
            except Exception as e:
                logger.error(f"Error reading config file: {str(e)}")
    
    if missing_dirs or missing_files:
        logger.error(f"Test failed: {len(missing_dirs)} directories and {len(missing_files)} files are missing")
        return False
    else:
        logger.info("Test passed: All expected directories and files exist")
        return True

if __name__ == "__main__":
    # Check if the server is running
    try:
        response = requests.get(f"{BASE_URL}/enhanced/health")
        if response.status_code != 200:
            logger.error(f"Server is not running or not healthy: {response.status_code}")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        logger.error(f"Cannot connect to server at {BASE_URL}")
        logger.error("Please start the server using 'python backend/Enhanced_Sensitivity/start_enhanced_sensitivity_server.py'")
        sys.exit(1)
    
    # Run the test
    success = test_directory_structure()
    
    if success:
        logger.info("All tests passed!")
        sys.exit(0)
    else:
        logger.error("Tests failed!")
        sys.exit(1)
