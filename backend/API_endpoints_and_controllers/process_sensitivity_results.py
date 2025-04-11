#!/usr/bin/env python
"""
Process Sensitivity Results

This script runs independently after the main sensitivity calculation flow:
1. Waits for configuration modifications to complete
2. Executes CFA_Sensitivity.py on each modified configuration
3. Extracts actual prices and metrics from economic summaries
4. Constructs a standardized result data structure
5. Stores results in the expected location using SensitivityFileManager

Usage:
    python process_sensitivity_results.py <version> [wait_time_minutes]

Arguments:
    version: The calculation version number
    wait_time_minutes: Optional waiting time in minutes before processing (default: 3)
"""
import os
import sys
import json
import time
import logging
import subprocess
import pandas as pd
from datetime import datetime
import glob

# Add parent directory to path to allow importing modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Sensitivity_File_Manager import SensitivityFileManager

# Base directories setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_DIR = os.path.join(BASE_DIR, 'backend')
LOGS_DIR = os.path.join(SCRIPT_DIR, 'Logs')
ORIGINAL_BASE_DIR = os.path.join(BASE_DIR, 'backend', 'Original')
SENSITIVITY_CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "sensitivity_config_data.pkl")

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOGS_DIR, "SENSITIVITY_RESULTS.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('sensitivity_results')



def extract_price_from_summary(version, param_id, variation):
    """
    Extract price value from economic summary for a specific parameter variation.
    
    Args:
        version (int): Version number
        param_id (str): Parameter ID (e.g., "S35")
        variation (float): Variation value
        
    Returns:
        float: Extracted price value or None if not found
    """
    try:
        # Format variation string for directory name
        var_str = f"{variation:+.2f}"
        
        # First, find the correct Economic_Summary file for this variation
        # Check in the parameter variation directory
        search_paths = [
            # Main directory search pattern
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity',
                f'{param_id}',
                '*',
                f'{var_str}',
                f'Economic_Summary*.csv'
            ),
            # Secondary locations based on directory structure
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity',
                'Multipoint',
                'Configuration',
                f'{param_id}_{var_str}',
                f'Economic_Summary*.csv'
            ),
            os.path.join(
                ORIGINAL_BASE_DIR,
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity',
                'Symmetrical',
                'Configuration',
                f'{param_id}_{var_str}',
                f'Economic_Summary*.csv'
            )
        ]
        
        summary_file = None
        for pattern in search_paths:
            matches = glob.glob(pattern)
            if matches:
                summary_file = matches[0]
                logger.info(f"Found economic summary for {param_id} variation {var_str}: {summary_file}")
                break
        
        if not summary_file:
            logger.warning(f"No economic summary found for {param_id} variation {var_str}")
            return None
            
        # Read the economic summary and extract price
        economic_df = pd.read_csv(summary_file)
        price_row = economic_df[economic_df['Metric'] == 'Average Selling Price (Project Life Cycle)']
        
        if price_row.empty:
            logger.warning(f"Price metric not found in economic summary for {param_id} variation {var_str}")
            return None
            
        price_value = float(price_row.iloc[0, 1])  # Assuming value is in second column
        logger.info(f"Extracted price value for {param_id} variation {var_str}: {price_value}")
        return price_value
        
    except Exception as e:
        logger.error(f"Error extracting price for {param_id} variation {var_str}: {str(e)}")
        return None

def load_sensitivity_config(version):
    """
    Load sensitivity configuration data from pickle file.
    
    Args:
        version (int): Version number
        
    Returns:
        dict: Sensitivity configuration data
    """
    import pickle
    
    try:
        if not os.path.exists(SENSITIVITY_CONFIG_DATA_PATH):
            logger.error(f"Configuration data file not found: {SENSITIVITY_CONFIG_DATA_PATH}")
            return None
            
        with open(SENSITIVITY_CONFIG_DATA_PATH, 'rb') as f:
            config_data = pickle.load(f)
        
        # Verify that config data has necessary structure
        if not config_data or not isinstance(config_data, dict):
            logger.error("Invalid configuration data format")
            return None
            
        # If version is explicitly in the versions list, use it
        if 'versions' in config_data and isinstance(config_data['versions'], list) and version in config_data['versions']:
            logger.info(f"Loaded configuration data for version {version}")
            return config_data
            
        # If versions is not a list or doesn't contain our version, add it
        if 'versions' in config_data:
            if not isinstance(config_data['versions'], list):
                config_data['versions'] = [version]
            elif version not in config_data['versions']:
                config_data['versions'].append(version)
                
            # Save the updated config back to file
            with open(SENSITIVITY_CONFIG_DATA_PATH, 'wb') as f:
                pickle.dump(config_data, f)
                
            logger.info(f"Updated configuration data with version {version}")
            return config_data
        else:
            logger.warning(f"Configuration data has no versions field")
            # Try to add versions field and save back
            config_data['versions'] = [version]
            with open(SENSITIVITY_CONFIG_DATA_PATH, 'wb') as f:
                pickle.dump(config_data, f)
            logger.info(f"Added versions field with version {version} to configuration data")
            return config_data
            
    except Exception as e:
        logger.error(f"Error loading sensitivity configuration: {str(e)}")
        return None



def store_results(version, param_id, result_data):
    """
    Store result data in the expected location using SensitivityFileManager.
    
    Args:
        version (int): Version number
        param_id (str): Parameter ID
        result_data (dict): Result data structure
        
    Returns:
        dict: Result info with storage status
    """
    try:
        # Initialize file manager
        file_manager = SensitivityFileManager(ORIGINAL_BASE_DIR)
        
        # Store calculation results
        result_info = file_manager.store_calculation_result(
            version=version,
            param_id=param_id,
            result_data=result_data,
            mode=result_data.get('mode', 'multiple'),
            compare_to_key=result_data.get('compare_to_key', 'S13')
        )
        
        logger.info(f"Stored result data for {param_id} at {result_info['path']}")
        return result_info
        
    except Exception as e:
        error_msg = f"Error storing result data for {param_id}: {str(e)}"
        logger.error(error_msg)
        return {'status': 'error', 'error': error_msg}

def check_configuration_readiness(version, param_id, mode, variations):
    """
    Check if configurations are ready for processing.
    
    Returns:
        bool: True if all configuration files are ready, False otherwise
    """
    all_ready = True
    
    for variation in variations:
        var_str = f"{variation:+.2f}"
        mode_dir = 'symmetrical' if mode.lower() == 'symmetrical' else 'multiple'
        
        # Check if the parameter variation directory exists and has config files
        var_dir = os.path.join(
            ORIGINAL_BASE_DIR,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity',
            param_id,
            mode_dir,
            var_str
        )
        
        if not os.path.exists(var_dir):
            logger.info(f"Variation directory not found: {var_dir}")
            all_ready = False
            continue
            
        # Check for configuration files
        config_files = glob.glob(os.path.join(var_dir, f"{version}_config_module_*.json"))
        
        if not config_files:
            logger.info(f"No configuration files found in {var_dir}")
            all_ready = False
        else:
            logger.info(f"Found {len(config_files)} configuration files for {param_id} variation {var_str}")
    
    return all_ready

def main():
    # Parse command line arguments
    if len(sys.argv) < 2:
        print("Usage: python process_sensitivity_results.py <version> [max_wait_minutes]")
        sys.exit(1)
    
    version = int(sys.argv[1])
    max_wait_time = 30  # Default maximum wait time in minutes
    
    if len(sys.argv) >= 3:
        max_wait_time = float(sys.argv[2])
    
    # Log start information
    logger.info(f"=== Starting Sensitivity Results Processing ===")
    logger.info(f"Version: {version}")
    logger.info(f"Maximum wait time: {max_wait_time} minutes")
    
    # Load sensitivity configuration
    config_data = load_sensitivity_config(version)
    
    if not config_data:
        logger.error("Failed to load sensitivity configuration, exiting")
        sys.exit(1)
    
    # Get sensitivity parameters
    sen_parameters = config_data.get('SenParameters', {})
    
    if not sen_parameters:
        logger.warning("No sensitivity parameters found in configuration")
        sys.exit(1)
    
    # Wait for configurations to be ready
    start_time = time.time()
    configs_ready = False
    
    while not configs_ready:
        # Check if all parameter variations have configurations
        configs_ready = True
        
        for param_id, param_config in sen_parameters.items():
            if not param_config.get('enabled'):
                continue
                
            mode = param_config.get('mode', 'symmetrical')
            values = param_config.get('values', [])
            
            # Determine variations based on mode
            if mode.lower() == 'symmetrical':
                base_variation = values[0]
                variations = [base_variation, -base_variation]
            else:
                variations = values
            
            # Check if configurations for this parameter are ready
            param_ready = check_configuration_readiness(version, param_id, mode, variations)
            
            if not param_ready:
                configs_ready = False
                logger.info(f"Configurations for {param_id} not ready yet")
        
        # Check if we've exceeded the maximum wait time
        elapsed_minutes = (time.time() - start_time) / 60
        if elapsed_minutes >= max_wait_time:
            logger.warning(f"Maximum wait time of {max_wait_time} minutes exceeded, proceeding anyway")
            break
            
        if not configs_ready:
            logger.info(f"Waiting 30 seconds before checking again...")
            time.sleep(30)
    
    # Load sensitivity configuration
    config_data = load_sensitivity_config(version)
    
    if not config_data:
        logger.error("Failed to load sensitivity configuration, exiting")
        sys.exit(1)
    
    # Get sensitivity parameters
    sen_parameters = config_data.get('SenParameters', {})
    
    if not sen_parameters:
        logger.warning("No sensitivity parameters found in configuration")
        sys.exit(1)
    
    # Process each parameter
    for param_id, param_config in sen_parameters.items():
        if not param_config.get('enabled'):
            continue
        
        logger.info(f"=== Processing Parameter: {param_id} ===")
        
        # Process variations and get result data
        result_data = process_parameter_variations(version, param_id, param_config)
        
        if not result_data:
            logger.warning(f"No result data generated for {param_id}")
            continue
        
        # Store results
        store_result = store_results(version, param_id, result_data)
        
        if store_result.get('status') == 'error':
            logger.error(f"Failed to store results for {param_id}: {store_result.get('error')}")
        else:
            logger.info(f"Successfully processed and stored results for {param_id}")
    
    logger.info(f"=== Sensitivity Results Processing Completed ===")

if __name__ == "__main__":
    main()
