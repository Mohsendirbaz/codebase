#!/usr/bin/env python
"""
Sensitivity Results Processing Service

This service runs independently on port 2700 to process sensitivity calculation results:
1. Executes CFA.py on each modified configuration file
2. Extracts actual prices and metrics from economic summaries
3. Constructs a standardized result data structure
4. Stores results in the expected location using SensitivityFileManager

The service is designed to work seamlessly with the config copy service on port 2600.
"""
import os
import sys
import json
import time
import logging
import subprocess
import pandas as pd
import glob
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

# Add parent directory to path to allow importing modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Sensitivity_File_Manager import SensitivityFileManager

# Base directories setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_DIR = os.path.join(BASE_DIR, 'backend')
LOGS_DIR = os.path.join(SCRIPT_DIR, 'Logs')
ORIGINAL_BASE_DIR = os.path.join(BASE_DIR, 'backend', 'Original')
SENSITIVITY_CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "sensitivity_config_data.pkl")

# Configure logging
def setup_logging():
    """Configure application logging with separate handlers"""
    # Create logs directory if it doesn't exist
    os.makedirs(LOGS_DIR, exist_ok=True)
    
    # Configure main logger
    main_handler = logging.FileHandler(os.path.join(LOGS_DIR, "SENSITIVITY_RESULTS.log"))
    main_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    
    main_logger = logging.getLogger()
    main_logger.setLevel(logging.INFO)
    main_logger.addHandler(main_handler)
    
    # Also add console output for development and debugging
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    main_logger.addHandler(console_handler)
    
    logging.info("Sensitivity Results Processing Service - Logging configured")


def get_calculation_script(version):
    """Get the appropriate calculation script based on version number"""
    script_name = f'CFA.py'
    script_path = os.path.join(SCRIPT_DIR, "Core_calculation_engines", script_name)
    if os.path.exists(script_path):
        return script_path
    raise Exception(f"Calculation script not found for version {version}")


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
                logging.info(f"Found economic summary for {param_id} variation {var_str}: {summary_file}")
                break
        
        if not summary_file:
            logging.warning(f"No economic summary found for {param_id} variation {var_str}")
            return None
            
        # Read the economic summary and extract price
        economic_df = pd.read_csv(summary_file)
        price_row = economic_df[economic_df['Metric'] == 'Average Selling Price (Project Life Cycle)']
        
        if price_row.empty:
            logging.warning(f"Price metric not found in economic summary for {param_id} variation {var_str}")
            return None
            
        price_value = float(price_row.iloc[0, 1])  # Assuming value is in second column
        logging.info(f"Extracted price value for {param_id} variation {var_str}: {price_value}")
        return price_value
        
    except Exception as e:
        logging.error(f"Error extracting price for {param_id} variation {var_str}: {str(e)}")
        return None


def load_sensitivity_config(version):
    """
    Load sensitivity configuration data from pickle file.
    
    Args:
        version (int): Version number
        
    Returns:
        dict: Sensitivity configuration data
    """
    try:
        if not os.path.exists(SENSITIVITY_CONFIG_DATA_PATH):
            logging.error(f"Configuration data file not found: {SENSITIVITY_CONFIG_DATA_PATH}")
            return None
            
        with open(SENSITIVITY_CONFIG_DATA_PATH, 'rb') as f:
            config_data = pickle.load(f)
        
        # Verify that config data has necessary structure
        if not config_data or not isinstance(config_data, dict):
            logging.error("Invalid configuration data format")
            return None
            
        # If version is explicitly in the versions list, use it
        if 'versions' in config_data and isinstance(config_data['versions'], list) and version in config_data['versions']:
            logging.info(f"Loaded configuration data for version {version}")
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
                
            logging.info(f"Updated configuration data with version {version}")
            return config_data
        else:
            logging.warning(f"Configuration data has no versions field")
            # Try to add versions field and save back
            config_data['versions'] = [version]
            with open(SENSITIVITY_CONFIG_DATA_PATH, 'wb') as f:
                pickle.dump(config_data, f)
            logging.info(f"Added versions field with version {version} to configuration data")
            return config_data
            
    except Exception as e:
        logging.error(f"Error loading sensitivity configuration: {str(e)}")
        return None


def find_modified_configurations(version, param_id, mode, variation):
    """
    Find all modified configuration files for a specific parameter variation.
    
    Args:
        version (int): Version number
        param_id (str): Parameter ID
        mode (str): Analysis mode (symmetrical or multiple)
        variation (float): Variation value
        
    Returns:
        list: Paths to modified configuration files
    """
    var_str = f"{variation:+.2f}"
    
    # Determine the directory containing modified configurations
    mode_dir = 'symmetrical' if mode.lower() == 'symmetrical' else 'multiple'
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
        logging.warning(f"Variation directory not found: {var_dir}")
        return []
    
    # Find all configuration files in this directory
    config_files = glob.glob(os.path.join(var_dir, f"{version}_config_module_*.json"))
    
    if not config_files:
        logging.warning(f"No configuration files found in {var_dir}")
    else:
        logging.info(f"Found {len(config_files)} configuration files for {param_id} variation {var_str}")
    
    return config_files


def run_cfa_for_configs(version, param_id, mode, variation, compare_to_key):
    """
    Run CFA.py for all configuration files of a specific parameter variation.
    
    Args:
        version (int): Version number
        param_id (str): Parameter ID
        mode (str): Analysis mode
        variation (float): Variation value
        compare_to_key (str): Comparison parameter ID
        
    Returns:
        dict: Result data with status
    """
    config_files = find_modified_configurations(version, param_id, mode, variation)
    var_str = f"{variation:+.2f}"
    
    if not config_files:
        return {
            'variation': variation,
            'variation_str': var_str,
            'status': 'error',
            'error': 'No configuration files found'
        }
    
    # Get the calculation script
    calculation_script = get_calculation_script(version)
    
    # Run CFA for each configuration
    success_count = 0
    error_count = 0
    
    for config_file in config_files:
        try:
            # Extract module number for logging
            module_num = os.path.basename(config_file).split('_')[2].replace('.json', '')
            logging.info(f"Processing configuration module {module_num} for {param_id} variation {var_str}")
            
            # Run CFA with the config file
            result = subprocess.run(
                [
                    'python',
                    calculation_script,
                    str(version),
                    '-c', config_file,  # Use the specific config file
                    '--sensitivity',
                    param_id,
                    str(variation),
                    compare_to_key
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                success_count += 1
                logging.info(f"Successfully ran CFA for module {module_num}")
            else:
                error_count += 1
                logging.error(f"Error running CFA for module {module_num}: {result.stderr}")
                
        except Exception as e:
            error_count += 1
            logging.error(f"Exception processing config file {config_file}: {str(e)}")
    
    # Extract price from economic summary
    price_value = extract_price_from_summary(version, param_id, variation)
    
    # Return result data
    if success_count > 0:
        return {
            'variation': variation,
            'variation_str': var_str,
            'status': 'completed',
            'values': {
                'price': price_value,
                'modules_processed': success_count,
                'modules_failed': error_count
            }
        }
    else:
        return {
            'variation': variation,
            'variation_str': var_str,
            'status': 'error',
            'error': f"All {len(config_files)} modules failed processing"
        }


def process_parameter_variations(version, param_id, param_config):
    """
    Process all variations for a specific parameter.
    
    Args:
        version (int): Version number
        param_id (str): Parameter ID
        param_config (dict): Parameter configuration
        
    Returns:
        dict: Result data structure
    """
    # Skip disabled parameters
    if not param_config.get('enabled'):
        logging.info(f"Skipping disabled parameter: {param_id}")
        return None
    
    # Get parameter details
    mode = param_config.get('mode', 'symmetrical')
    values = param_config.get('values', [])
    compare_to_key = param_config.get('compareToKey', 'S13')
    comparison_type = param_config.get('comparisonType', 'primary')
    
    if not values:
        logging.warning(f"No variation values for parameter {param_id}")
        return None
    
    logging.info(f"Processing parameter {param_id} with mode {mode}")
    logging.info(f"Comparison: Against {compare_to_key} as {comparison_type}")
    
    # Determine variations based on mode
    mode_key = mode.lower()
    if mode_key == 'symmetrical':
        base_variation = values[0]
        variations = [base_variation, -base_variation]
    else:  # 'multiple' or 'multipoint'
        variations = values
        mode_key = 'multiple'
    
    # Initialize result data
    result_data = {
        'parameter': param_id,
        'compare_to_key': compare_to_key,
        'comparison_type': comparison_type,
        'mode': mode_key,
        'version': version,
        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
        'variations': []
    }
    
    # Process each variation
    for variation in variations:
        logging.info(f"Processing variation {variation} for parameter {param_id}")
        
        # Run CFA for all configuration files of this variation
        variation_result = run_cfa_for_configs(
            version, param_id, mode_key, variation, compare_to_key
        )
        
        # Normalize the variation result to ensure consistent format
        # This handles different JSON formats from different services (2500/2600)
        normalized_result = normalize_variation_data(variation_result)
        logging.info(f"Normalized variation data to standard format for {param_id}")
        
        # Add normalized result to the data structure
        result_data['variations'].append(normalized_result)
        
        # Give a short pause between variations
        time.sleep(2)
    
    return result_data


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
        
        logging.info(f"Stored result data for {param_id} at {result_info['path']}")
        return result_info
        
    except Exception as e:
        error_msg = f"Error storing result data for {param_id}: {str(e)}"
        logging.error(error_msg)
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
            logging.info(f"Variation directory not found: {var_dir}")
            all_ready = False
            continue
            
        # Check for configuration files
        config_files = glob.glob(os.path.join(var_dir, f"{version}_config_module_*.json"))
        
        if not config_files:
            logging.info(f"No configuration files found in {var_dir}")
            all_ready = False
        else:
            logging.info(f"Found {len(config_files)} configuration files for {param_id} variation {var_str}")
    
    return all_ready


# =====================================
# Flask Application
# =====================================

app = Flask(__name__)
CORS(app)
setup_logging()

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for server detection.
    """
    return jsonify({
        "status": "ok",
        "server": "sensitivity-results-processor",
        "version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })


@app.route('/process-parameter/<version>/<param_id>', methods=['POST'])
def process_single_parameter(version, param_id):
    """
    Process a single parameter's variations.
    
    URL parameters:
        version (int): Version number
        param_id (str): Parameter ID (e.g., S34)
        
    Expected JSON payload:
        {
            "mode": "multiple",
            "values": [10, 20, 30],
            "compareToKey": "S13",
            "comparisonType": "primary"
        }
    """
    run_id = time.strftime("%Y%m%d_%H%M%S")
    logging.info(f"=== Processing Parameter: {param_id} (Run ID: {run_id}) ===")
    
    try:
        version = int(version)
        data = request.json or {}
        
        # Use request data or defaults
        param_config = {
            'enabled': True,
            'mode': data.get('mode', 'multiple'),
            'values': data.get('values', []),
            'compareToKey': data.get('compareToKey', 'S13'),
            'comparisonType': data.get('comparisonType', 'primary')
        }
        
        # Process parameter variations
        result_data = process_parameter_variations(version, param_id, param_config)
        
        if not result_data:
            return jsonify({
                "status": "error",
                "message": f"No result data generated for {param_id}",
                "runId": run_id
            }), 400
        
        # Store results
        store_result = store_results(version, param_id, result_data)
        
        # Return response
        response = {
            "status": "success" if store_result.get('status') != 'error' else "error",
            "runId": run_id,
            "message": f"Results processing completed for {param_id}",
            "parameter": param_id,
            "version": version,
            "resultData": result_data,
            "storage": store_result
        }
        
        if store_result.get('status') == 'error':
            response["error"] = store_result.get('error')
            
        return jsonify(response)
        
    except Exception as e:
        error_msg = f"Error processing parameter {param_id}: {str(e)}"
        logging.error(error_msg)
        return jsonify({
            "status": "error",
            "error": error_msg,
            "runId": run_id,
            "parameter": param_id,
            "version": version
        }), 500


# Helper function to normalize variation data from different services
def normalize_variation_data(variation_data):
    """
    Normalize variation data to ensure consistent format regardless of source
    
    Args:
        variation_data (dict): The variation data to normalize
        
    Returns:
        dict: Normalized variation data with consistent structure
    """
    logging.info(f"Normalizing variation data: {variation_data.get('variation_str', 'Unknown')}")
    
    # Create a copy to avoid modifying the original
    normalized = variation_data.copy()
    
    # Ensure 'values' exists and is a dictionary
    if 'status' in normalized and normalized['status'] == 'completed':
        if 'values' not in normalized or not isinstance(normalized['values'], dict):
            normalized['values'] = {}
            logging.info("Created missing 'values' dictionary")
        
        # If price is at the root level, move it to values
        if 'price' in normalized and 'price' not in normalized['values']:
            logging.info("Moving price from root to values dictionary")
            normalized['values']['price'] = normalized.pop('price')
            
        # If other metrics are at the root, move them to values
        for metric in ['modules_processed', 'modules_failed']:
            if metric in normalized and metric not in normalized['values']:
                normalized['values'][metric] = normalized.pop(metric)
    
    return normalized

@app.route('/process-results/<version>', methods=['POST'])
def process_all_parameters(version):
    """
    Process all sensitivity parameters for a specific version.
    
    URL parameters:
        version (int): Version number
        
    Query parameters:
        max_wait_minutes (float, optional): Maximum wait time in minutes (default: 0.5)
        
    Expected JSON payload (optional):
        {
            "parameters": {
                "S34": {
                    "enabled": true,
                    "mode": "multiple",
                    "values": [10, 20, 30],
                    "compareToKey": "S13"
                },
                "S35": {
                    "enabled": true,
                    "mode": "symmetrical",
                    "values": [15],
                    "compareToKey": "S13"
                }
            }
        }
    """
    run_id = time.strftime("%Y%m%d_%H%M%S")
    logging.info(f"=== Starting Sensitivity Results Processing - Version {version} (Run ID: {run_id}) ===")
    
    try:
        version = int(version)
        max_wait_minutes = float(request.args.get('max_wait_minutes', 0.5))
        data = request.json or {}
        
        logging.info(f"Version: {version}")
        logging.info(f"Maximum wait time: {max_wait_minutes} minutes")
        
        # Load configuration data
        config_data = None
        if 'parameters' in data:
            logging.info("Using parameters from request payload")
            sen_parameters = data['parameters']
            config_data = {'SenParameters': sen_parameters}
        else:
            logging.info("Loading configuration data from saved file")
            config_data = load_sensitivity_config(version)
        
        if not config_data:
            logging.error("Failed to load sensitivity configuration")
            return jsonify({
                "status": "error",
                "error": "Failed to load sensitivity configuration",
                "runId": run_id
            }), 400
        
        # Get sensitivity parameters
        sen_parameters = config_data.get('SenParameters', {})
        
        if not sen_parameters:
            logging.warning("No sensitivity parameters found in configuration")
            return jsonify({
                "status": "error",
                "error": "No sensitivity parameters found in configuration",
                "runId": run_id
            }), 400
        
        # Wait for configurations to be ready
        start_time = time.time()
        configs_ready = False
        
        logging.info("Checking configuration readiness...")
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
                    logging.info(f"Configurations for {param_id} not ready yet")
            
            # Check if we've exceeded the maximum wait time
            elapsed_minutes = (time.time() - start_time) / 60
            if elapsed_minutes >= max_wait_minutes:
                logging.warning(f"Maximum wait time of {max_wait_minutes} minutes exceeded, proceeding anyway")
                break
                
            if not configs_ready:
                logging.info(f"Waiting 10 seconds before checking again...")
                time.sleep(10)
        
        # Process each parameter
        results = {}
        for param_id, param_config in sen_parameters.items():
            if not param_config.get('enabled'):
                continue
            
            logging.info(f"=== Processing Parameter: {param_id} ===")
            
            # Process variations and get result data
            result_data = process_parameter_variations(version, param_id, param_config)
            
            if not result_data:
                logging.warning(f"No result data generated for {param_id}")
                results[param_id] = {
                    "status": "error",
                    "error": "No result data generated"
                }
                continue
            
            # Store results
            store_result = store_results(version, param_id, result_data)
            
            if store_result.get('status') == 'error':
                logging.error(f"Failed to store results for {param_id}: {store_result.get('error')}")
                results[param_id] = {
                    "status": "error",
                    "error": f"Failed to store results: {store_result.get('error')}"
                }
            else:
                logging.info(f"Successfully processed and stored results for {param_id}")
                results[param_id] = {
                    "status": "success",
                    "path": store_result.get('path'),
                    "comparison_path": store_result.get('comparison_path')
                }
        
        # Prepare the response
        response = {
            "status": "success",
            "runId": run_id,
            "message": "Sensitivity results processing completed",
            "version": version,
            "results": results,
            "parametersProcessed": len(results),
            "executionTimeMinutes": round((time.time() - start_time) / 60, 2)
        }
        
        logging.info(f"=== Sensitivity Results Processing Completed - Run ID: {run_id} ===")
        return jsonify(response)
        
    except Exception as e:
        error_msg = f"Error processing sensitivity results: {str(e)}"
        logging.error(error_msg)
        return jsonify({
            "status": "error",
            "error": error_msg,
            "runId": run_id,
            "version": version
        }), 500


# Command line execution
if __name__ == "__main__":
    # Parse command line arguments (port can be specified)
    port = 2700
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number, using default port {port}")
    
    # Start the Flask application
    logging.info(f"Starting Sensitivity Results Processing Service on port {port}")
    app.run(debug=False, host='127.0.0.1', port=port)
