"""
Sensitivity Configuration Base Module

This module provides functionality to copy configuration modules for sensitivity analysis.
It is designed to work independently from the main calculation orchestration.

Key features:
1. Copies all existing configuration modules (1-100)
2. Implements a 2-minute pause before execution
3. Organized configuration copying for each sensitivity parameter
4. Complete logging and error handling
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
import logging
import json
import time
import sys
import shutil
import pickle

# =====================================
# Configuration Constants
# =====================================

# Define base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_DIR = os.path.join(BASE_DIR, 'backend')
LOGS_DIR = os.path.join(SCRIPT_DIR, 'Logs')
ORIGINAL_BASE_DIR = os.path.join(BASE_DIR, 'Original')

# Create logs directory if it doesn't exist
os.makedirs(LOGS_DIR, exist_ok=True)

LOG_FILE_PATH = os.path.join(LOGS_DIR, "CONFIG_COPY.log")
SENSITIVITY_LOG_PATH = os.path.join(LOGS_DIR, "SENSITIVITY.log")

# Sensitivity configuration status file
SENSITIVITY_CONFIG_STATUS_PATH = os.path.join(LOGS_DIR, "sensitivity_config_status.json")
SENSITIVITY_CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "sensitivity_config_data.pkl")

# =====================================
# Logging Configuration
# =====================================

def setup_logging():
    # Create logs directory if it doesn't exist
    os.makedirs(LOGS_DIR, exist_ok=True)
    
    # Configure main application logger
    main_handler = logging.FileHandler(LOG_FILE_PATH)
    main_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    
    main_logger = logging.getLogger()
    main_logger.setLevel(logging.DEBUG)
    main_logger.addHandler(main_handler)
    
    # Configure sensitivity logger as a separate logger
    sensitivity_logger = logging.getLogger('sensitivity')
    sensitivity_logger.setLevel(logging.DEBUG)
    sensitivity_logger.propagate = False  # Prevent propagation to root logger
    
    sensitivity_handler = logging.FileHandler(SENSITIVITY_LOG_PATH)
    sensitivity_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    sensitivity_logger.addHandler(sensitivity_handler)
    
    logging.info("Logging configured correctly - Config copy logs going to: " + LOG_FILE_PATH)
    sensitivity_logger.info("Sensitivity logging configured correctly - Logs going to: " + SENSITIVITY_LOG_PATH)

# =====================================
# Configuration Copy Functions
# =====================================

def copy_all_config_modules(version, SenParameters):
    """
    Copy all existing configuration modules (1-100) to variation directories.
    Includes a 2-minute pause before execution.
    
    Args:
        version (int): Version number
        SenParameters (dict): Dictionary containing sensitivity parameters
        
    Returns:
        dict: Summary of copied modules and their status
    """
    sensitivity_logger = logging.getLogger('sensitivity')
    copy_summary = {
        'total_found': 0,
        'total_copied': 0,
        'errors': [],
        'copied_modules': {}
    }
    
    sensitivity_logger.info(f"Starting config module copy operation with 2-minute pause...")
    time.sleep(120)  # 2-minute pause
    sensitivity_logger.info(f"Resuming after pause, searching for config modules...")
    
    try:
        # Source directory in ORIGINAL_BASE_DIR (root level)
        source_dir = os.path.join(ORIGINAL_BASE_DIR, f'Batch({version})', f'Results({version})')
        
        # Target directory in backend/Original
        target_base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(target_base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')
        
        # Process each parameter's variation directory
        for param_id, param_config in SenParameters.items():
            if not param_config.get('enabled'):
                continue
                
            # Get mode and values
            mode = param_config.get('mode', 'symmetrical')
            values = param_config.get('values', [])
            
            if not values:
                continue
                
            # Determine variation list based on mode
            if mode.lower() == 'symmetrical':
                base_variation = values[0]
                variation_list = [base_variation, -base_variation]
            else:  # 'multipoint' mode
                variation_list = values
                
            # Search for all config modules (1-100) for each variation
            for variation in variation_list:
                var_str = f"{variation:+.2f}"
                var_dir = os.path.join(sensitivity_dir, param_id, mode, var_str)
                
                # Create directory if it doesn't exist
                os.makedirs(var_dir, exist_ok=True)
                
                # Check for all possible module files (1-100)
                for module_num in range(1, 101):
                    config_module_path = os.path.join(source_dir, f"{version}_config_module_{module_num}.json")
                    
                    # Add to summary if found
                    if os.path.exists(config_module_path):
                        copy_summary['total_found'] += 1
                        param_key = f"{param_id}_{var_str}"
                        
                        if param_key not in copy_summary['copied_modules']:
                            copy_summary['copied_modules'][param_key] = []
                        
                        try:
                            # Load the config module
                            with open(config_module_path, 'r') as f:
                                config_module = json.load(f)
                            
                            # Save a copy in the variation directory
                            var_config_path = os.path.join(var_dir, f"{version}_config_module_{module_num}.json")
                            with open(var_config_path, 'w') as f:
                                json.dump(config_module, f, indent=4)
                                
                            copy_summary['total_copied'] += 1
                            copy_summary['copied_modules'][param_key].append(module_num)
                            sensitivity_logger.info(f"Copied config module {module_num} to {param_id}, variation {var_str}")
                        except Exception as e:
                            error_msg = f"Failed to copy config module {module_num} for {param_id}, variation {var_str}: {str(e)}"
                            sensitivity_logger.error(error_msg)
                            copy_summary['errors'].append(error_msg)
        
        sensitivity_logger.info(f"Config module copy operation completed: found {copy_summary['total_found']}, copied {copy_summary['total_copied']}")
        if copy_summary['errors']:
            sensitivity_logger.warning(f"Encountered {len(copy_summary['errors'])} errors during copy")
        
        return copy_summary
        
    except Exception as e:
        error_msg = f"Error in config module copy operation: {str(e)}"
        sensitivity_logger.exception(error_msg)
        copy_summary['errors'].append(error_msg)
        return copy_summary

def check_sensitivity_config_status():
    """
    Check if sensitivity configurations have been generated and saved.
    
    Returns:
        tuple: (is_configured, config_data) - Boolean indicating if configurations are ready and the configuration data
    """
    if not os.path.exists(SENSITIVITY_CONFIG_STATUS_PATH):
        return False, None
        
    try:
        with open(SENSITIVITY_CONFIG_STATUS_PATH, 'r') as f:
            status = json.load(f)
            
        if not status.get('configured', False):
            return False, None
            
        if os.path.exists(SENSITIVITY_CONFIG_DATA_PATH):
            with open(SENSITIVITY_CONFIG_DATA_PATH, 'rb') as f:
                config_data = pickle.load(f)
            return True, config_data
            
        return True, None
        
    except Exception as e:
        logging.error(f"Error checking sensitivity configuration status: {str(e)}")
        return False, None

# =====================================
# Flask Application Initialization
# =====================================

def initialize_app():
    app = Flask(__name__)
    CORS(app)
    setup_logging()
    return app

app = initialize_app()

# =====================================
# Route Handlers
# =====================================

@app.route('/copy-config-modules', methods=['POST'])
def trigger_config_copy():
    """Independent endpoint to copy all configuration modules."""
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")
    
    try:
        # Check if sensitivity configurations exist
        is_configured, saved_config = check_sensitivity_config_status()
        
        if not is_configured:
            return jsonify({
                "error": "Sensitivity configurations must be generated first",
                "nextStep": "Call /sensitivity/configure endpoint first"
            }), 400
            
        version = saved_config['versions'][0]
        
        # Execute the independent copy operation
        copy_summary = copy_all_config_modules(
            version,
            saved_config['SenParameters']
        )
        
        return jsonify({
            "status": "success",
            "message": "Config module copy operation completed",
            "runId": run_id,
            "summary": copy_summary
        })
        
    except Exception as e:
        error_msg = f"Error during config module copy: {str(e)}"
        sensitivity_logger.error(error_msg)
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for server detection.
    Returns a 200 OK response with basic server information.
    """
    return jsonify({
        "status": "ok",
        "server": "sensitivity-config-base-server",
        "version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

# =====================================
# Application Entry Point
# =====================================

if __name__ == '__main__':
    app.run(debug=True, port=2600)