"""
Test Enhanced Sensitivity Storage

This script tests the enhanced sensitivity storage functionality.
"""

import os
import sys
import json
import requests
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Server URL
SERVER_URL = "http://localhost:25007"

def test_health():
    """Test the health endpoint."""
    try:
        response = requests.get(f"{SERVER_URL}/enhanced/health")
        if response.status_code == 200:
            logger.info("Health check successful")
            logger.info(f"Response: {response.json()}")
            return True
        else:
            logger.error(f"Health check failed with status code {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error during health check: {str(e)}")
        return False

def test_configure():
    """Test the configure endpoint."""
    try:
        # Sample configuration
        config = {
            "selectedVersions": [1],
            "selectedV": {"V1": "on", "V2": "off"},
            "selectedF": {"F1": "on", "F2": "off"},
            "selectedCalculationOption": "freeFlowNPV",
            "targetRow": 20,
            "SenParameters": {
                "S1": {
                    "enabled": True,
                    "file": "config.json",
                    "path": "parameters.interest_rate",
                    "baseValue": 0.05,
                    "step": 10,
                    "stepsUp": 2,
                    "stepsDown": 2,
                    "point": True,
                    "bar": True,
                    "waterfall": True
                }
            }
        }
        
        response = requests.post(
            f"{SERVER_URL}/enhanced/sensitivity/configure",
            json=config
        )
        
        if response.status_code == 200:
            logger.info("Configuration successful")
            logger.info(f"Response: {response.json()}")
            return True
        else:
            logger.error(f"Configuration failed with status code {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error during configuration: {str(e)}")
        return False

def test_runs():
    """Test the runs endpoint."""
    try:
        response = requests.post(f"{SERVER_URL}/enhanced/runs")
        
        if response.status_code == 200:
            logger.info("Runs successful")
            logger.info(f"Response: {response.json()}")
            return True
        else:
            logger.error(f"Runs failed with status code {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error during runs: {str(e)}")
        return False

def test_results():
    """Test the results endpoint."""
    try:
        response = requests.get(f"{SERVER_URL}/enhanced/sensitivity/results")
        
        if response.status_code == 200:
            logger.info("Results successful")
            logger.info(f"Response: {response.json()}")
            return True
        elif response.status_code == 400:
            # This is expected if no calculations have been run yet
            logger.info("Results not available yet (expected)")
            logger.info(f"Response: {response.json()}")
            return True
        else:
            logger.error(f"Results failed with status code {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error during results: {str(e)}")
        return False

def test_visualize():
    """Test the visualize endpoint."""
    try:
        response = requests.post(f"{SERVER_URL}/enhanced/sensitivity/visualize")
        
        if response.status_code == 200:
            logger.info("Visualization successful")
            logger.info(f"Response: {response.json()}")
            return True
        elif response.status_code == 400:
            # This is expected if no calculations have been run yet
            logger.info("Visualization not available yet (expected)")
            logger.info(f"Response: {response.json()}")
            return True
        else:
            logger.error(f"Visualization failed with status code {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error during visualization: {str(e)}")
        return False

def main():
    """Main function."""
    logger.info("Testing enhanced sensitivity storage")
    
    # Test health
    if not test_health():
        logger.error("Health check failed. Make sure the server is running.")
        return
        
    # Test configure
    if not test_configure():
        logger.error("Configuration failed. Check the server logs for details.")
        return
        
    # Test runs
    if not test_runs():
        logger.error("Runs failed. Check the server logs for details.")
        return
        
    # Test results
    if not test_results():
        logger.error("Results failed. Check the server logs for details.")
        return
        
    # Test visualize
    if not test_visualize():
        logger.error("Visualization failed. Check the server logs for details.")
        return
        
    logger.info("All tests completed successfully")

if __name__ == "__main__":
    main()
