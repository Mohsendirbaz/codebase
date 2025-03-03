"""
Test script to verify that the price for variation_percentages is getting stored in the correct folder.

This script will:
1. Generate a sensitivity configuration
2. Run the calculations
3. Check if the calculated_price.json file is created in the correct folder structure
"""

import os
import sys
import json
import time
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

def test_sensitivity_storage():
    """
    Test that the price for variation_percentages is getting stored in the correct folder.
    """
    logger.info("Starting sensitivity storage test")
    
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
    
    # Step 2: Run the calculations
    logger.info("Step 2: Running sensitivity calculations")
    
    try:
        response = requests.post(
            f"{BASE_URL}/enhanced/runs",
            headers={"Content-Type": "application/json"}
        )
        
        response.raise_for_status()
        run_result = response.json()
        
        logger.info(f"Calculations completed successfully: {run_result['message']}")
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error running calculations: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response: {e.response.text}")
        return False
    
    # Step 3: Check if the calculated_price.json file is created in the correct folder structure
    logger.info("Step 3: Checking if calculated_price.json is created in the correct folder structure")
    
    # Wait a moment for files to be written
    time.sleep(2)
    
    # Define the expected folder structure
    results_folder = os.path.join(ORIGINAL_DIR, "Batch(1)", "Results(1)")
    sensitivity_dir = os.path.join(results_folder, "Sensitivity")
    
    # For symmetrical mode with value 20, we expect +10.00 and -10.00 variations
    expected_paths = [
        os.path.join(sensitivity_dir, "S34", "symmetrical", "+10.00", "calculated_price.json"),
        os.path.join(sensitivity_dir, "S34", "symmetrical", "-10.00", "calculated_price.json")
    ]
    
    # Check if the expected files exist
    missing_files = []
    for path in expected_paths:
        if not os.path.exists(path):
            missing_files.append(path)
            logger.error(f"Missing file: {path}")
        else:
            logger.info(f"Found file: {path}")
            
            # Check the content of the file
            try:
                with open(path, 'r') as f:
                    price_data = json.load(f)
                    
                logger.info(f"Price data: {json.dumps(price_data, indent=2)}")
                
                # Verify that the price data contains the expected fields
                expected_fields = ["parameter_id", "mode", "variation", "price"]
                missing_fields = [field for field in expected_fields if field not in price_data]
                
                if missing_fields:
                    logger.error(f"Missing fields in price data: {missing_fields}")
                else:
                    logger.info("Price data contains all expected fields")
                    
            except Exception as e:
                logger.error(f"Error reading price data: {str(e)}")
    
    if missing_files:
        logger.error(f"Test failed: {len(missing_files)} files are missing")
        return False
    else:
        logger.info("Test passed: All expected files exist")
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
    success = test_sensitivity_storage()
    
    if success:
        logger.info("All tests passed!")
        sys.exit(0)
    else:
        logger.error("Tests failed!")
        sys.exit(1)
