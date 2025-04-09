"""
Sensitivity Configuration Base Module

This module provides functionality to copy configuration modules for sensitivity analysis.
It is designed to work independently from the main calculation orchestration.

Key features:
1. Applies sensitivity variations to all configuration modules (1-100)
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
import copy
import importlib.util

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
# Import Sen_Config Functions
# =====================================

def import_sensitivity_functions():
    """Import necessary functions from Sen_Config module."""
    sensitivity_logger = logging.getLogger('sensitivity')

    try:
        # Add the Configuration_management directory to the path
        config_mgmt_path = os.path.join(SCRIPT_DIR, "Configuration_management")
        if config_mgmt_path not in sys.path:
            sys.path.append(config_mgmt_path)

        # Try direct import
        try:
            from Sen_Config import apply_sensitivity_variation, find_parameter_by_id
            sensitivity_logger.info("Successfully imported sensitivity functions via direct import")
            return apply_sensitivity_variation, find_parameter_by_id
        except ImportError:
            sensitivity_logger.warning("Direct import failed, attempting spec import...")

        # Try spec import if direct import fails
        sen_config_path = os.path.join(config_mgmt_path, "Sen_Config.py")
        if os.path.exists(sen_config_path):
            spec = importlib.util.spec_from_file_location("Sen_Config", sen_config_path)
            sen_config_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(sen_config_module)

            apply_sensitivity_variation = getattr(sen_config_module, 'apply_sensitivity_variation')
            find_parameter_by_id = getattr(sen_config_module, 'find_parameter_by_id')

            sensitivity_logger.info("Successfully imported sensitivity functions via spec import")
            return apply_sensitivity_variation, find_parameter_by_id
        else:
            raise ImportError(f"Could not find Sen_Config.py at {sen_config_path}")

    except Exception as e:
        sensitivity_logger.error(f"Failed to import sensitivity functions: {str(e)}")
        raise ImportError(f"Failed to import required functions: {str(e)}")

# =====================================
# Configuration Copy Functions
# =====================================

def process_config_modules(version, SenParameters):
    """
    Process all configuration modules (1-100) for all parameter variations.
    Apply sensitivity variations and save modified configurations.

    Args:
        version (int): Version number
        SenParameters (dict): Dictionary containing sensitivity parameters

    Returns:
        dict: Summary of processed modules and their status
    """
    sensitivity_logger = logging.getLogger('sensitivity')
    processing_summary = {
        'total_found': 0,
        'total_modified': 0,
        'errors': [],
        'processed_modules': {},
        'csv_files_copied': 0,
        'py_files_copied': 0
    }

    sensitivity_logger.info("Starting config module processing with 2-minute pause...")
    time.sleep(120)  # 2-minute pause for system stabilization
    sensitivity_logger.info("Resuming after pause, processing config modules...")

    try:
        # Import sensitivity functions from Sen_Config
        apply_sensitivity_variation, find_parameter_by_id = import_sensitivity_functions()

        # Source directory in ORIGINAL_BASE_DIR (root level)
        source_dir = os.path.join(ORIGINAL_BASE_DIR, f'Batch({version})', f'Results({version})')

        # Target directory in backend/Original
        target_base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(target_base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Define the specific CSV files we want to copy
        target_csv_files = [
            f"Configuration_Matrix_{version}.csv",
            f"General_Configuration_Matrix_{version}.csv"
        ]

        # Get the Python configuration file path
        code_files_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "Original")
        config_file = os.path.join(code_files_path, f"Batch({version})", f"ConfigurationPlotSpec({version})", f"configurations({version}).py")

        # Filter to only existing files
        existing_csv_files = [
            f for f in target_csv_files
            if os.path.exists(os.path.join(source_dir, f))
        ]

        py_file_exists = os.path.exists(config_file)

        if len(existing_csv_files) < len(target_csv_files):
            missing_files = set(target_csv_files) - set(existing_csv_files)
            sensitivity_logger.warning(f"Some target CSV files not found: {missing_files}")
        if not py_file_exists:
            sensitivity_logger.warning(f"Python configuration file not found: {config_file}")

        # Process each parameter's variation directory
        for param_id, param_config in SenParameters.items():
            if not param_config.get('enabled'):
                continue

            # Get mode and values
            mode = param_config.get('mode', 'symmetrical')
            values = param_config.get('values', [])

            if not values:
                continue

            sensitivity_logger.info(f"Processing parameter {param_id} with mode {mode}")

            # Determine variation list based on mode
            if mode.lower() == 'symmetrical':
                base_variation = values[0]
                variation_list = [base_variation, -base_variation]
            else:  # 'multipoint' mode
                variation_list = values

            # Process each variation
            for variation in variation_list:
                var_str = f"{variation:+.2f}"
                param_var_dir = os.path.join(sensitivity_dir, param_id, mode.lower(), var_str)

                # Create directory if it doesn't exist
                os.makedirs(param_var_dir, exist_ok=True)
                sensitivity_logger.info(f"Processing variation {var_str} in directory: {param_var_dir}")

                # Copy only the specific CSV files we want
                for csv_file in existing_csv_files:
                    source_csv_path = os.path.join(source_dir, csv_file)
                    target_csv_path = os.path.join(param_var_dir, csv_file)
                    try:
                        shutil.copy2(source_csv_path, target_csv_path)
                        processing_summary['csv_files_copied'] += 1
                        sensitivity_logger.info(f"Copied specific CSV file: {csv_file}")
                    except Exception as e:
                        error_msg = f"Failed to copy CSV file {csv_file}: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

                # Copy the Python configuration file if it exists
                if py_file_exists:
                    target_py_path = os.path.join(param_var_dir, os.path.basename(config_file))
                    try:
                        shutil.copy2(config_file, target_py_path)
                        processing_summary['py_files_copied'] += 1
                        sensitivity_logger.info(f"Copied Python configuration file: {os.path.basename(config_file)}")
                    except Exception as e:
                        error_msg = f"Failed to copy Python configuration file: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

                # Track modules for this parameter variation
                param_key = f"{param_id}_{var_str}"
                if param_key not in processing_summary['processed_modules']:
                    processing_summary['processed_modules'][param_key] = []

                # Process all possible module files (1-100)
                for module_num in range(1, 101):
                    source_config_path = os.path.join(source_dir, f"{version}_config_module_{module_num}.json")
                    target_config_path = os.path.join(param_var_dir, f"{version}_config_module_{module_num}.json")

                    # Skip if source JSON file doesn't exist
                    if not os.path.exists(source_config_path):
                        continue

                    processing_summary['total_found'] += 1

                    try:
                        # Load the source config module
                        with open(source_config_path, 'r') as f:
                            config_module = json.load(f)

                        # Apply sensitivity variation to the config
                        modified_config = apply_sensitivity_variation(
                            copy.deepcopy(config_module),
                            param_id,
                            variation,
                            mode
                        )

                        # Save the modified config
                        with open(target_config_path, 'w') as f:
                            json.dump(modified_config, f, indent=4)

                        processing_summary['total_modified'] += 1
                        processing_summary['processed_modules'][param_key].append(module_num)
                        sensitivity_logger.info(
                            f"Applied {variation}{'%' if mode == 'symmetrical' else ''} "
                            f"variation to config module {module_num} for {param_id}"
                        )

                    except Exception as e:
                        error_msg = f"Failed to process config module {module_num} for {param_id}, variation {var_str}: {str(e)}"
                        sensitivity_logger.error(error_msg)
                        processing_summary['errors'].append(error_msg)

        sensitivity_logger.info(
            f"Config module processing completed: "
            f"found {processing_summary['total_found']} JSON files, "
            f"modified {processing_summary['total_modified']} JSON files, "
            f"copied {processing_summary['csv_files_copied']} specific CSV files, "
            f"copied {processing_summary['py_files_copied']} Python configuration files"
        )

        if processing_summary['errors']:
            sensitivity_logger.warning(f"Encountered {len(processing_summary['errors'])} errors during processing")

        return processing_summary

    except Exception as e:
        error_msg = f"Error in config module processing: {str(e)}"
        sensitivity_logger.exception(error_msg)
        processing_summary['errors'].append(error_msg)
        return processing_summary


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
def copy_config_modules():
    """Endpoint to process all configuration modules with sensitivity variations."""
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

        # Get version from the saved configuration or request body
        request_data = request.get_json() or {}
        version = request_data.get('version') or saved_config['versions'][0]

        # Get sensitivity parameters
        sen_parameters = request_data.get('parameters') or saved_config['SenParameters']

        # Execute the processing operation
        processing_summary = process_config_modules(
            version,
            sen_parameters
        )

        return jsonify({
            "status": "success",
            "message": "Config module processing completed successfully",
            "runId": run_id,
            "summary": processing_summary
        })

    except Exception as e:
        error_msg = f"Error during config module processing: {str(e)}"
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
        "server": "sensitivity-config-processor",
        "version": "1.1.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

# =====================================
# Application Entry Point
# =====================================

if __name__ == '__main__':
    app.run(debug=True, port=2600)