"""
Sensitivity Visualization Flask API
Provides endpoints for sensitivity analysis configuration, execution, and visualization.
Integrates with the PlotsTabs and SensitivityPlotsTabs frontend components.
"""
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import subprocess
import os
import logging
import json
import time
import sys
import shutil
import pickle
import requests
import glob
import re
import pandas as pd

# Base directories setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_DIR = os.path.join(BASE_DIR, 'backend')
LOGS_DIR = os.path.join(SCRIPT_DIR, 'Logs')
ORIGINAL_BASE_DIR = os.path.join(BASE_DIR, 'backend', 'Original')

# Create logs directory if it doesn't exist
os.makedirs(LOGS_DIR, exist_ok=True)

# Log file paths
LOG_FILE_PATH = os.path.join(LOGS_DIR, "RUN.log")
SENSITIVITY_LOG_PATH = os.path.join(LOGS_DIR, "SENSITIVITY.log")

# Sensitivity configuration status file paths
SENSITIVITY_CONFIG_STATUS_PATH = os.path.join(LOGS_DIR, "sensitivity_config_status.json")
SENSITIVITY_CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "sensitivity_config_data.pkl")

# Import needed modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Try to import sensitivity logging functions if available
try:
    from sensitivity_logging import (
        log_plot_generation_start, log_plot_generation_complete, log_plot_generation_error,
        log_plot_data_loading, log_plot_data_processing, log_plot_rendering, log_plot_saving,
        plot_generation_operation, log_execution_flow
    )
except ImportError:
    # Create dummy logging functions if module not available
    def log_execution_flow(stage, message): logging.info(f"{stage}: {message}")
    def log_plot_generation_start(*args): logging.info(f"Plot generation start: {args}")
    def log_plot_generation_complete(*args): logging.info(f"Plot generation complete: {args}")
    def log_plot_generation_error(*args): logging.info(f"Plot generation error: {args}")
    def log_plot_data_loading(*args, **kwargs): logging.info(f"Plot data loading: {args}")
    def log_plot_data_processing(*args): logging.info(f"Plot data processing: {args}")
    def log_plot_rendering(*args, **kwargs): logging.info(f"Plot rendering: {args}")
    def log_plot_saving(*args): logging.info(f"Plot saving: {args}")
    def plot_generation_operation(*args, **kwargs): return lambda x: x

# Script configurations
COMMON_PYTHON_SCRIPTS = [
    os.path.join(SCRIPT_DIR, "Configuration_management", 'formatter.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'module1.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'config_modules.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'Table.py')
]

def get_calculation_script(version):
    """Get the appropriate calculation script based on version number"""
    script_name = f'CFA.py'
    """ we'd like to add CFA-b.py equipped with path resolution module tailored for sensitivity analysis, that would not be function of version, since all sensitivity analyses are uniform with that regard """
    script_path = os.path.join(SCRIPT_DIR, "Core_calculation_engines", script_name)
    if os.path.exists(script_path):
        return script_path
    raise Exception(f"Calculation script not found for version {version}")



CALCULATION_SCRIPTS = {
    'calculateForPrice': get_calculation_script,
    'freeFlowNPV': get_calculation_script
}

# =====================================
# Logging Configuration
# =====================================

def setup_logging():
    """Configure application logging with separate handlers for main and sensitivity logs"""
    # Create logs directory if it doesn't exist
    os.makedirs(LOGS_DIR, exist_ok=True)

    # Clear any existing handlers
    logging.getLogger().handlers = []
    logging.getLogger('sensitivity').handlers = []

    # Configure main application logger (root logger)
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

    # Only log the configuration messages once
    if not main_logger.handlers or not sensitivity_logger.handlers:
        main_logger.info("Logging configured correctly - Main logs going to: " + LOG_FILE_PATH)
        sensitivity_logger.info("Sensitivity logging configured correctly - Logs going to: " + SENSITIVITY_LOG_PATH)

# =====================================
# Helper Functions
# =====================================

def trigger_config_module_copy(version, sensitivity_dir, sen_parameters):
    """
    Triggers the independent config module copy service.

    Args:
        version (int): Version number
        sensitivity_dir (str): Path to sensitivity directory
        sen_parameters (dict): Sensitivity parameters

    Returns:
        dict: Response from the config copy service
    """
    sensitivity_logger = logging.getLogger('sensitivity')

    try:
        sensitivity_logger.info("Triggering config module copy service on port 2600...")
        response = requests.post(
            "http://localhost:2600/copy-config-modules",
            json={
                "version": version,
                "sensitivity_dir": sensitivity_dir,
                "parameters": sen_parameters
            },
            timeout=10  # Initial connection timeout
        )

        if response.status_code == 200:
            result = response.json()
            sensitivity_logger.info(f"Config copy service triggered successfully: {result.get('message')}")
            return result
        else:
            error_msg = f"Error triggering config copy service: {response.text}"
            sensitivity_logger.error(error_msg)
            return {"error": error_msg}

    except requests.exceptions.ConnectionError:
        sensitivity_logger.warning("Config copy service not running or unreachable")
        return {"error": "Config copy service not available"}
    except Exception as e:
        error_msg = f"Error connecting to config copy service: {str(e)}"
        sensitivity_logger.error(error_msg)
        return {"error": error_msg}

def log_run_configuration(logger, config):
    """Log run configuration in a structured format"""
    logger.info("\n" + "="*80)
    logger.info("CFA Run Configuration")
    logger.info("="*80)

    # Basic Configuration
    logger.info("\nBasic Configuration:")
    logger.info(f"Version(s): {', '.join(map(str, config['versions']))}")
    logger.info(f"Calculation Mode: {config['calculationOption']}")
    if config['calculationOption'] == 'calculateForPrice':
        logger.info(f"Target Row: {config['targetRow']}")

    # Parameter States
    logger.info("\nParameter States:")
    v_enabled = [k for k, v in config['selectedV'].items() if v == 'on']
    f_enabled = [k for k, v in config['selectedF'].items() if v == 'on']
    logger.info(f"Enabled V Parameters: {', '.join(v_enabled) if v_enabled else 'None'}")
    logger.info(f"Enabled F Parameters: {', '.join(f_enabled) if f_enabled else 'None'}")

    # Sensitivity Configuration (if enabled)
    enabled_params = [k for k, v in config['SenParameters'].items() if v.get('enabled')]
    if enabled_params:
        logger.info("\nSensitivity Analysis Configuration:")
        logger.info(f"Enabled Parameters: {', '.join(enabled_params)}")
        for param_id in enabled_params:
            param_config = config['SenParameters'][param_id]
            logger.info(f"\n{param_id} Configuration:")
            logger.info(f"  Mode: {param_config.get('mode')}")
            logger.info(f"  Values: {param_config.get('values')}")
            if param_config.get('compareToKey'):
                logger.info(f"  Comparison:")
                logger.info(f"    Target: {param_config['compareToKey']}")
                logger.info(f"    Type: {param_config.get('comparisonType', 'primary')}")
                plot_types = []
                if param_config.get('waterfall'): plot_types.append('waterfall')
                if param_config.get('bar'): plot_types.append('bar')
                if param_config.get('point'): plot_types.append('point')
                logger.info(f"    Plot Types: {', '.join(plot_types)}")

    logger.info("\n" + "="*80 + "\n")

def create_sensitivity_directories(version, SenParameters):
    """
    Create comprehensive directory structure for sensitivity analysis.

    Args:
        version (int): Version number
        SenParameters (dict): Dictionary containing sensitivity parameters

    Returns:
        tuple: (sensitivity_dir, reports_dir) - Paths to directories
    """
    sensitivity_logger = logging.getLogger('sensitivity')

    # Define base paths
    base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
    results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
    sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

    # Create main sensitivity directory
    os.makedirs(sensitivity_dir, exist_ok=True)
    sensitivity_logger.info(f"Created main sensitivity directory: {sensitivity_dir}")

    # Create standard subdirectories
    for subdir in ["Reports"]:
        path = os.path.join(sensitivity_dir, subdir)
        os.makedirs(path, exist_ok=True)
        sensitivity_logger.info(f"Created {subdir} directory: {path}")

    reports_dir = os.path.join(sensitivity_dir, "Reports")

    # Create mode directories for all supported modes
    mode_dir_mapping = {
        'percentage': 'Percentage',
        'directvalue': 'DirectValue',
        'absolutedeparture': 'AbsoluteDeparture',
        'montecarlo': 'MonteCarlo'
    }

    # Create standard directories for each mode
    for mode_name in mode_dir_mapping.values():
        mode_dir = os.path.join(sensitivity_dir, mode_name)
        os.makedirs(mode_dir, exist_ok=True)
        sensitivity_logger.info(f"Created mode directory: {mode_dir}")

        # Create plot type subdirectories
        for plot_type in ["waterfall", "bar", "point", "Configuration"]:
            plot_type_dir = os.path.join(mode_dir, plot_type)
            os.makedirs(plot_type_dir, exist_ok=True)
            sensitivity_logger.info(f"Created plot type directory: {plot_type_dir}")

    # Process each parameter
    enabled_params = [(param_id, config) for param_id, config in SenParameters.items()
                      if config.get('enabled')]

    for param_id, param_config in enabled_params:
        # Skip disabled parameters
        if not param_config.get('enabled'):
            continue

        # Get parameter details
        mode = param_config.get('mode', 'percentage')
        values = param_config.get('values', [])
        plot_types = []

        if param_config.get('waterfall'): plot_types.append('waterfall')
        if param_config.get('bar'): plot_types.append('bar')
        if param_config.get('point'): plot_types.append('point')

        if not values:
            continue

        # Create parameter base directory
        param_dir = os.path.join(sensitivity_dir, param_id)
        os.makedirs(param_dir, exist_ok=True)

        # Create mode directory within parameter (lowercase mode)
        param_mode_dir = os.path.join(param_dir, mode.lower())
        os.makedirs(param_mode_dir, exist_ok=True)

        # Use values directly from configuration without special handling
        variation_list = values

        # Create variation directories
        for variation in variation_list:
            var_str = f"{variation:+.2f}"

            # 1. Create parameter variation directories
            var_dir = os.path.join(param_dir, mode.lower(), var_str)
            os.makedirs(var_dir, exist_ok=True)
            sensitivity_logger.info(f"Created parameter variation directory: {var_dir}")

            # 2. Create configuration variation directories
            # Map to the proper capitalized mode directory
            mode_cap = mode_dir_mapping.get(mode.lower(), 'Percentage')
            config_var_dir = os.path.join(sensitivity_dir, mode_cap, "Configuration", f"{param_id}_{var_str}")
            os.makedirs(config_var_dir, exist_ok=True)
            sensitivity_logger.info(f"Created configuration directory: {config_var_dir}")

        # Create plot type directories for this parameter
        # Map to the proper capitalized mode directory
        mode_cap = mode_dir_mapping.get(mode.lower(), 'Percentage')

        for plot_type in plot_types:
            plot_dir = os.path.join(sensitivity_dir, mode_cap, plot_type)
            os.makedirs(plot_dir, exist_ok=True)
            sensitivity_logger.info(f"Created plot directory: {plot_dir}")

    return sensitivity_dir, reports_dir

def save_sensitivity_config_files(version, reports_dir, SenParameters):
    """
    Save sensitivity configuration files to the appropriate directories.

    Args:
        version (int): Version number
        reports_dir (str): Path to the reports directory
        SenParameters (dict): Dictionary containing sensitivity parameters

    Returns:
        list: List of saved configuration file paths
    """
    sensitivity_logger = logging.getLogger('sensitivity')
    saved_files = []

    try:
        # Get base directory
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Save main configuration file in reports directory
        config_file = os.path.join(reports_dir, "sensitivity_config.json")
        with open(config_file, 'w') as f:
            json.dump({
                'version': version,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'parameters': SenParameters
            }, f, indent=2)
        saved_files.append(config_file)
        sensitivity_logger.info(f"Saved main configuration file: {config_file}")

        # Save individual parameter configuration files in their respective directories
        for param_id, param_config in SenParameters.items():
            if not param_config.get('enabled'):
                continue

            # Get mode and values
            mode = param_config.get('mode', 'percentage')
            values = param_config.get('values', [])

            if not values:
                continue

            # Determine variation list based on mode
            if mode.lower() == 'percentage':
                # For percentage, use first value to create +/- variations
                base_variation = values[0]
                variation_list = [base_variation]
            else:  # 'multipoint' mode
                # For multipoint, use all values directly
                variation_list = values

            # Save configuration for each variation
            for variation in variation_list:
                # Format the variation string (e.g., "+10.00" or "-5.00")
                var_str = f"{variation:+.2f}"

                # Create path to variation directory
                var_dir = os.path.join(sensitivity_dir, param_id, mode, var_str)

                # Save configuration file
                param_file = os.path.join(var_dir, f"{param_id}_config.json")
                with open(param_file, 'w') as f:
                    json.dump({
                        'parameter': param_id,
                        'config': param_config,
                        'variation': variation,
                        'variation_str': var_str,
                        'mode': mode,
                        'version': version,
                        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
                    }, f, indent=2)
                saved_files.append(param_file)
                sensitivity_logger.info(f"Saved parameter configuration file: {param_file}")
                # Configuration variation directories are created with 2 minutes pause via flask at 2600

        return saved_files

    except Exception as e:
        error_msg = f"Error saving configuration files: {str(e)}"
        sensitivity_logger.exception(error_msg)
        raise

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

app = Flask(__name__)
CORS(app)
setup_logging()

# =====================================
# Sensitivity Configuration Endpoint
# =====================================

@app.route('/sensitivity/configure', methods=['POST'])
def configure_sensitivity():
    """
    Generate and save sensitivity configurations with their applied variations.
    This must be called before running sensitivity calculations.
    """
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Extract configuration
        config = {
            'versions': data.get('selectedVersions', [1]),
            'selectedV': data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)}),
            'selectedF': data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)}),
            'calculationOption': data.get('selectedCalculationOption', 'freeFlowNPV'),
            'targetRow': int(data.get('targetRow', 20)),
            'SenParameters': data.get('SenParameters', {})
        }

        version = config['versions'][0]

        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Sensitivity Configuration Generation - Run ID: {run_id}")
        sensitivity_logger.info(f"{'='*80}")
        sensitivity_logger.info(f"Version: {version}")
        sensitivity_logger.info(f"Calculation Mode: {config['calculationOption']}")
        sensitivity_logger.info(f"Target Row: {config['targetRow']}")

        # Create sensitivity directories
        sensitivity_dir, config_dir = create_sensitivity_directories(version, config['SenParameters'])

        # Log run configuration
        log_run_configuration(sensitivity_logger, config)

        # Save configuration files
        saved_files = save_sensitivity_config_files(version, config_dir, config['SenParameters'])

        # Save configuration status
        with open(SENSITIVITY_CONFIG_STATUS_PATH, 'w') as f:
            json.dump({
                'configured': True,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'runId': run_id,
                'version': version,
                'configDir': config_dir,
                'sensitivityDir': sensitivity_dir
            }, f, indent=2)

        # Save configuration data for later use
        with open(SENSITIVITY_CONFIG_DATA_PATH, 'wb') as f:
            pickle.dump(config, f)

        sensitivity_logger.info(f"\nSensitivity configuration completed successfully")
        sensitivity_logger.info(f"Configuration files saved: {len(saved_files)}")
        sensitivity_logger.info(f"Configuration status saved to: {SENSITIVITY_CONFIG_STATUS_PATH}")
        sensitivity_logger.info(f"{'='*80}\n")

        return jsonify({
            "status": "success",
            "message": "Sensitivity configurations generated and saved successfully",
            "runId": run_id,
            "configDir": config_dir,
            "sensitivityDir": sensitivity_dir,
            "savedFiles": len(saved_files),
            "nextStep": "Visit /runs to execute sensitivity calculations"
        })

    except Exception as e:
        error_msg = f"Error generating sensitivity configurations: {str(e)}"
        sensitivity_logger.error(error_msg)

        # Update configuration status to indicate failure
        with open(SENSITIVITY_CONFIG_STATUS_PATH, 'w') as f:
            json.dump({
                'configured': False,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'runId': run_id,
                'error': error_msg
            }, f, indent=2)

        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

# =====================================
# Run Calculations Endpoint
# =====================================

@app.route('/runs', methods=['POST'])
def run_calculations():
    """Orchestrates the execution sequence of configuration updates and calculations."""
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        # Check if sensitivity configurations have been generated
        is_configured, saved_config = check_sensitivity_config_status()

        # If sensitivity configurations haven't been generated, return an error
        if not is_configured:
            sensitivity_logger.warning("Sensitivity configurations have not been generated yet")
            return jsonify({
                "error": "Sensitivity configurations must be generated first",
                "message": "Please call /sensitivity/configure endpoint to generate and save sensitivity configurations before running calculations",
                "nextStep": "Call /sensitivity/configure endpoint first"
            }), 400

        # Use the saved configuration data if available, otherwise use the request data
        data = request.get_json()
        if saved_config:
            config = saved_config
            sensitivity_logger.info("Using saved sensitivity configuration data")
        elif data:
            config = {
                'versions': data.get('selectedVersions', [1]),
                'selectedV': data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)}),
                'selectedF': data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)}),
                'calculationOption': data.get('selectedCalculationOption', 'freeFlowNPV'),
                'targetRow': int(data.get('targetRow', 20)),
                'SenParameters': data.get('SenParameters', {})
            }
            sensitivity_logger.info("Using request data for configuration")
        else:
            return jsonify({"error": "No configuration data available"}), 400

        # Extract year columns config from form values
        year_columns_config = {}
        form_values = data.get('formValues', {})
        amount10_keys = [k for k in form_values if isinstance(k, str) and 'Amount10' in k]
        if amount10_keys and form_values.get(amount10_keys[0]):
            try:
                value = form_values[amount10_keys[0]].get('value')
                if value:
                    year_columns = int(value)
                    for version in config['versions']:
                        year_columns_config[str(version)] = year_columns
                    sensitivity_logger.info(f"Year columns configuration set to {year_columns} for all versions")
            except (ValueError, TypeError, AttributeError) as e:
                sensitivity_logger.warning(f"Error extracting year columns config: {e}")

        # Get version and paths
        version = config['versions'][0]
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Verify that sensitivity directories exist
        if not os.path.exists(sensitivity_dir):
            error_msg = f"Sensitivity directory not found: {sensitivity_dir}"
            sensitivity_logger.error(error_msg)
            return jsonify({
                "error": error_msg,
                "message": "Please call /sensitivity/configure endpoint to generate and save sensitivity configurations",
                "nextStep": "Call /sensitivity/configure endpoint first"
            }), 400

        sensitivity_logger.info(f"Using sensitivity directory: {sensitivity_dir}")

        # Log run configuration
        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Sensitivity Calculation Run - ID: {run_id}")
        sensitivity_logger.info(f"{'='*80}")
        log_run_configuration(sensitivity_logger, config)

        # Execute configuration management scripts
        sensitivity_logger.info("\nExecuting Configuration Management Scripts:")
        start_time = time.time()

        for script in COMMON_PYTHON_SCRIPTS:
            script_name = os.path.basename(script)
            script_start = time.time()
            sensitivity_logger.info(f"\nExecuting: {script_name}")

            result = subprocess.run(
                ['python', script, str(version)],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                error_msg = f"Script execution failed: {script_name}\nError: {result.stderr}"
                sensitivity_logger.error(error_msg)
                raise Exception(error_msg)

            script_duration = time.time() - script_start
            sensitivity_logger.info(f"Completed {script_name} in {script_duration:.2f}s")
            time.sleep(0.5)  # Ensure proper sequencing

        config_time = time.time() - start_time
        sensitivity_logger.info(f"\nConfiguration scripts completed in {config_time:.2f}s")

        # Step 2: Process baseline calculation
        sensitivity_logger.info("\nProcessing Baseline Calculation:")
        calc_start = time.time()

        # Get calculation script
        calculation_script_func = CALCULATION_SCRIPTS.get(config['calculationOption'])
        if not calculation_script_func:
            raise Exception(f"No script found for calculation mode: {config['calculationOption']}")

        calculation_script = calculation_script_func(config['versions'][0])
        sensitivity_logger.info(f"Using calculation script: {os.path.basename(calculation_script)}")

        # Run baseline calculation first
        sensitivity_logger.info("\nExecuting baseline calculation:")
        result = subprocess.run(
            [
                'python',
                calculation_script,
                str(config['versions'][0]),
                json.dumps(config['selectedV']),
                json.dumps(config['selectedF']),
                str(config['targetRow']),
                config['calculationOption'],
                '{}'  # Empty SenParameters for baseline
            ],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            error_msg = f"Baseline calculation failed: {result.stderr}"
            sensitivity_logger.error(error_msg)
            raise Exception(error_msg)

        sensitivity_logger.info("Baseline calculation completed successfully")

        # Step 3: Trigger the config module copy service BEFORE sensitivity calculations
        sensitivity_logger.info("\nTriggering configuration module copying:")
        copy_service_result = trigger_config_module_copy(
            version,
            sensitivity_dir,
            config['SenParameters']
        )

        # Wait for config copy service to complete (or timeout after a few seconds)
        sensitivity_logger.info("Waiting for configuration copying to complete...")
        max_wait_time = 3 # in seconds
        start_wait = time.time()
        config_copy_complete = False

        # First check if service is available
        while time.time() - start_wait < max_wait_time:
            try:
                response = requests.get("http://localhost:2600/health", timeout=2)
                if response.ok:
                    config_copy_complete = True
                    sensitivity_logger.info("Configuration copying service is available")
                    break
            except requests.exceptions.RequestException:
                pass

            # Log progress and wait
            elapsed = time.time() - start_wait
            sensitivity_logger.info(f"Still waiting for configuration service... ({elapsed:.0f}s elapsed)")
            time.sleep(15)  # Check every 15 seconds

        # Now verify that actual configuration files have been created (more reliable check)
        sensitivity_logger.info("Verifying configuration files existence...")
        config_files_verified = False
        start_wait = time.time()  # Reset timer

        while time.time() - start_wait < max_wait_time:
            # Check for actual configuration files for each enabled parameter
            all_found = True
            for param_id, param_config in config['SenParameters'].items():
                if not param_config.get('enabled'):
                    continue

                mode = param_config.get('mode', 'symmetrical')
                values = param_config.get('values', [])

                # Determine variations based on mode
                if mode.lower() == 'percentage':
                    base_variation = values[0]
                    variations = [base_variation]
                else:
                    variations = values

                # Check if configuration files exist for each variation
                for variation in variations:
                    var_str = f"{variation:+.2f}"
                    mode_dir = 'percentage' if mode.lower() == 'percentage' else 'multiple'
                    config_path_pattern = os.path.join(
                        sensitivity_dir,
                        param_id,
                        mode_dir,
                        var_str,
                        f"{version}_config_module_*.json"
                    )

                    if not glob.glob(config_path_pattern):
                        all_found = False
                        sensitivity_logger.info(f"Still waiting for config files for {param_id} variation {var_str}...")
                        break

                if not all_found:
                    break

            if all_found:
                config_files_verified = True
                sensitivity_logger.info("All required configuration files verified!")
                break

            # Log progress and wait
            elapsed = time.time() - start_wait
            sensitivity_logger.info(f"Still waiting for configuration files... ({elapsed:.0f}s elapsed)")
            time.sleep(15)  # Check every 15 seconds

        if not config_files_verified:
            sensitivity_logger.warning("Timed out waiting for all configuration files, proceeding anyway")

        # Update configuration pickle file to ensure version matching for subsequent steps
        sensitivity_logger.info("Updating configuration data with current version...")
        try:
            # Save configuration data with explicit version for process_sensitivity_results.py to use
            with open(SENSITIVITY_CONFIG_DATA_PATH, 'wb') as f:
                # Ensure version is correctly saved in the configuration
                if isinstance(config['versions'], list) and version not in config['versions']:
                    config['versions'].append(version)
                pickle.dump(config, f)
            sensitivity_logger.info(f"Updated configuration data with version {version}")
        except Exception as e:
            sensitivity_logger.error(f"Error updating configuration data: {str(e)}")

        # Step 4: Now process sensitivity parameters if enabled (AFTER config copy is done)
        enabled_params = [k for k, v in config['SenParameters'].items() if v.get('enabled')]
        if enabled_params:
            sensitivity_logger.info(f"\nExecuting process_sensitivity_results.py to handle modified configurations...")

            try:
                process_script = os.path.join(
                    SCRIPT_DIR,
                    "API_endpoints_and_controllers",
                    "process_sensitivity_results.py"
                )

                if os.path.exists(process_script):
                    sensitivity_logger.info(f"Running process_sensitivity_results.py for {version}...")
                    process_result = subprocess.run(
                        ['python', process_script, str(version), '0.5'],  # 30 second wait time
                        capture_output=True,
                        text=True
                    )

                    if process_result.returncode == 0:
                        sensitivity_logger.info("Successfully processed sensitivity results")
                    else:
                        error_output = process_result.stderr or process_result.stdout
                        sensitivity_logger.error(f"Error processing sensitivity results: {error_output}")

                        # Try running with backup approach if the first attempt failed
                        sensitivity_logger.info("Attempting backup approach for sensitivity processing...")
                        for param_id, param_config in config['SenParameters'].items():
                            if not param_config.get('enabled'):
                                continue

                            param_start = time.time()
                            sensitivity_logger.info(f"\nProcessing {param_id} directly:")
                            sensitivity_logger.info(f"Mode: {param_config.get('mode')}")
                            sensitivity_logger.info(f"Values: {param_config.get('values')}")

                            # Run CFA on each modified configuration
                            mode = param_config.get('mode', 'symmetrical')
                            values = param_config.get('values', [])

                            if mode.lower() == 'symmetrical':
                                base_variation = values[0]
                                variations = [base_variation]
                            else:
                                variations = values

                            for variation in variations:
                                var_str = f"{variation:+.2f}"
                                sensitivity_logger.info(f"Direct processing of {param_id} variation {var_str}")

                                # Find modified config files
                                mode_dir = 'symmetrical' if mode.lower() == 'symmetrical' else 'multiple'
                                config_pattern = os.path.join(
                                    sensitivity_dir,
                                    param_id,
                                    mode_dir,
                                    var_str,
                                    f"{version}_config_module_*.json"
                                )

                                config_files = glob.glob(config_pattern)
                                if config_files:
                                    for config_file in config_files:
                                        sensitivity_logger.info(f"Running CFA with config file: {config_file}")
                                        result = subprocess.run(
                                            [
                                                'python',
                                                calculation_script,
                                                str(version),
                                                '-c', config_file,
                                                '--sensitivity',
                                                param_id,
                                                str(variation),
                                                param_config.get('compareToKey', 'S13')
                                            ],
                                            capture_output=True,
                                            text=True
                                        )

                                        if result.returncode != 0:
                                            sensitivity_logger.error(f"Error running CFA: {result.stderr}")
                                        else:
                                            sensitivity_logger.info(f"Successfully ran CFA on modified config: {config_file}")
                                else:
                                    sensitivity_logger.warning(f"No config files found for {param_id} variation {var_str}")

                            param_duration = time.time() - param_start
                            sensitivity_logger.info(f"Completed {param_id} backup processing in {param_duration:.2f}s")
                else:
                    sensitivity_logger.error(f"Results processing script not found: {process_script}")

            except Exception as e:
                sensitivity_logger.error(f"Exception triggering sensitivity results processing: {str(e)}")

        total_time = time.time() - start_time
        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Run Summary - ID: {run_id}")
        sensitivity_logger.info(f"Total execution time: {total_time:.2f}s")
        sensitivity_logger.info(f"Configuration scripts: {config_time:.2f}s")
        sensitivity_logger.info(f"Configurations processed: {len(enabled_params)}")
        sensitivity_logger.info(f"{'='*80}\n")

        # Return success response with timing information and year columns
        return jsonify({
            "status": "success",
            "message": "Calculations completed successfully",
            "runId": run_id,
            "timing": {
                "total": f"{total_time:.2f}s",
                "configuration": f"{config_time:.2f}s",
                "calculations": len(enabled_params) + 1
            },
            "configCopy": copy_service_result,
            "yearColumns": year_columns_config
        })

    except Exception as e:
        error_msg = f"Error during orchestrated calculations: {str(e)}"
        sensitivity_logger.error(error_msg)
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

# =====================================
# Baseline Calculation Endpoint
# =====================================

@app.route('/run-baseline', methods=['POST'])
def run_baseline():
    """Endpoint dedicated to baseline calculations only"""
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Extract configuration matching the /runs endpoint pattern
        config = {
            'versions': data.get('selectedVersions', [1]),
            'selectedV': data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)}),
            'selectedF': data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)}),
            'calculationOption': data.get('selectedCalculationOption', 'freeFlowNPV'),
            'targetRow': int(data.get('targetRow', 20)),
            'SenParameters': {}  # Empty SenParameters for baseline
        }

        version = config['versions'][0]
        calculation_option = config['calculationOption']
        target_row = config['targetRow']

        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Baseline Calculation - Run ID: {run_id}")
        sensitivity_logger.info(f"{'='*80}")
        sensitivity_logger.info(f"Version: {version}")
        sensitivity_logger.info(f"Calculation Mode: {calculation_option}")
        sensitivity_logger.info(f"Target Row: {target_row}")

        # Execute configuration management scripts (same as /runs endpoint)
        sensitivity_logger.info("\nExecuting Configuration Management Scripts:")
        start_time = time.time()

        for script in COMMON_PYTHON_SCRIPTS:
            script_name = os.path.basename(script)
            script_start = time.time()
            sensitivity_logger.info(f"\nExecuting: {script_name}")

            result = subprocess.run(
                ['python', script, str(version)],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                error_msg = f"Script execution failed: {script_name}\nError: {result.stderr}"
                sensitivity_logger.error(error_msg)
                raise Exception(error_msg)

            script_duration = time.time() - script_start
            sensitivity_logger.info(f"Completed {script_name} in {script_duration:.2f}s")
            time.sleep(0.5)  # Ensure proper sequencing

        config_time = time.time() - start_time
        sensitivity_logger.info(f"\nConfiguration scripts completed in {config_time:.2f}s")

        # Get calculation script (same as /runs endpoint)
        calculation_script_func = CALCULATION_SCRIPTS.get(calculation_option)
        if not calculation_script_func:
            raise Exception(f"No script found for calculation mode: {calculation_option}")

        calculation_script = calculation_script_func(version)
        sensitivity_logger.info(f"Using calculation script: {os.path.basename(calculation_script)}")

        # Run baseline calculation with the same pattern as /runs endpoint
        sensitivity_logger.info("\nExecuting baseline calculation:")
        result = subprocess.run(
            [
                'python',
                calculation_script,
                str(version),
                json.dumps(config['selectedV']),
                json.dumps(config['selectedF']),
                str(target_row),
                calculation_option,
                '{}'  # Empty SenParameters for baseline
            ],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            error_msg = f"Baseline calculation failed: {result.stderr}"
            sensitivity_logger.error(error_msg)
            raise Exception(error_msg)

        sensitivity_logger.info("Baseline calculation completed successfully")

        total_time = time.time() - start_time
        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Run Summary - ID: {run_id}")
        sensitivity_logger.info(f"Total execution time: {total_time:.2f}s")
        sensitivity_logger.info(f"Configuration scripts: {config_time:.2f}s")
        sensitivity_logger.info(f"{'='*80}\n")

        return jsonify({
            "status": "success",
            "message": "Baseline calculation completed",
            "runId": run_id,
            "version": version,
            "timing": {
                "total": f"{total_time:.2f}s",
                "configuration": f"{config_time:.2f}s"
            }
        })

    except Exception as e:
        error_msg = f"Error during baseline calculation: {str(e)}"
        sensitivity_logger.error(error_msg)
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500
if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=2500)