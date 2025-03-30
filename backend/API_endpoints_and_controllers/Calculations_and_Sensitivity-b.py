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

    logging.info("Logging configured correctly - Main logs going to: " + LOG_FILE_PATH)
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

def run_script(script_name, *args, script_type="python"):
    """
    Run a script with the specified arguments.

    Args:
        script_name (str): Path to the script
        args: Arguments to pass to the script
        script_type (str): Either "python" or "Rscript"

    Returns:
        tuple: (success, error_message)
    """
    try:
        command = ['python' if script_type == "python" else 'Rscript', script_name]
        command.extend([str(arg) for arg in args])

        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode != 0:
            error_msg = f"Error running {os.path.basename(script_name)}: {result.stderr}"
            logging.error(error_msg)
            return False, error_msg

        logging.info(f"Successfully ran {os.path.basename(script_name)}" +
                     (f" for version {args[0]}" if args else ""))
        return True, None

    except Exception as e:
        error_msg = f"Exception running {os.path.basename(script_name)}: {str(e)}"
        logging.exception(error_msg)
        return False, error_msg

def process_version(version, calculation_script, selected_v, selected_f, target_row,
                    calculation_option, SenParameters):
    """
    Process a specific version by running configuration scripts and calculation script.

    Args:
        version: Version number
        calculation_script: Path to calculation script
        selected_v: Dictionary of V parameter selections
        selected_f: Dictionary of F parameter selections
        target_row: Target row for calculations
        calculation_option: Calculation mode
        SenParameters: Sensitivity parameters

    Returns:
        error message if any, None otherwise
    """
    try:
        # Run common configuration scripts
        for script in COMMON_PYTHON_SCRIPTS:
            success, error = run_script(script, version)
            if not success:
                return error

        # Run calculation script
        success, error = run_script(
            calculation_script,
            version,
            json.dumps(selected_v),
            json.dumps(selected_f),
            json.dumps(target_row),
            calculation_option,
            json.dumps(SenParameters)
        )
        if not success:
            return error

        return None
    except Exception as e:
        error_msg = f"Error processing version {version}: {str(e)}"
        logging.exception(error_msg)
        return error_msg

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
    for subdir in ["Reports", "Cache", "Configuration"]:
        path = os.path.join(sensitivity_dir, subdir)
        os.makedirs(path, exist_ok=True)
        sensitivity_logger.info(f"Created {subdir} directory: {path}")

    reports_dir = os.path.join(sensitivity_dir, "Reports")

    # Create analysis mode directories
    for mode in ["Symmetrical", "Multipoint"]:
        mode_dir = os.path.join(sensitivity_dir, mode)
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
        mode = param_config.get('mode', 'symmetrical')
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

        # Create mode directory within parameter
        param_mode_dir = os.path.join(param_dir, mode)
        os.makedirs(param_mode_dir, exist_ok=True)

        # Determine variation values based on mode
        variation_list = []
        if mode.lower() == 'symmetrical':
            if values and len(values) > 0:
                base_variation = values[0]
                variation_list = [base_variation, -base_variation]
        else:  # 'multipoint' or other modes
            variation_list = values

        # Create variation directories
        for variation in variation_list:
            var_str = f"{variation:+.2f}"

            # 1. Create parameter variation directories
            var_dir = os.path.join(param_dir, mode, var_str)
            os.makedirs(var_dir, exist_ok=True)
            sensitivity_logger.info(f"Created parameter variation directory: {var_dir}")

            # 2. Create configuration variation directories
            mode_name = "Symmetrical" if mode.lower() == "symmetrical" else "Multipoint"
            config_var_dir = os.path.join(sensitivity_dir, mode_name, "Configuration", f"{param_id}_{var_str}")
            os.makedirs(config_var_dir, exist_ok=True)
            sensitivity_logger.info(f"Created config variation directory: {config_var_dir}")

        # Create plot type directories for this parameter
        mode_dir = os.path.join(sensitivity_dir,
                                "Symmetrical" if mode.lower() == "symmetrical" else "Multipoint")

        for plot_type in plot_types:
            plot_dir = os.path.join(mode_dir, plot_type, f"{param_id}_{plot_type}")
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
            mode = param_config.get('mode', 'symmetrical')
            values = param_config.get('values', [])

            if not values:
                continue

            # Determine variation list based on mode
            if mode.lower() == 'symmetrical':
                # For symmetrical, use first value to create +/- variations
                base_variation = values[0]
                variation_list = [base_variation, -base_variation]
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

def process_sensitivity_visualization(SenParameters):
    """
    Process sensitivity parameters for visualization.

    Args:
        SenParameters (dict): Dictionary containing sensitivity parameters

    Returns:
        dict: Visualization data structure
    """
    sensitivity_logger = logging.getLogger('sensitivity')

    try:
        visualization_data = {
            'parameters': {},
            'relationships': []
        }

        run_id = time.strftime("%Y%m%d_%H%M%S")
        sensitivity_logger.info(f"\n{'='*80}\nNew Sensitivity Analysis Run - ID: {run_id}\n{'='*80}")

        # Process each parameter (S10 through S61)
        for param_key, config in SenParameters.items():
            if not config.get('enabled', False):
                continue

            if not (param_key.startswith('S') and param_key[1:].isdigit() and
                    10 <= int(param_key[1:]) <= 61):
                sensitivity_logger.warning(f"Invalid parameter key: {param_key}")
                continue

            visualization_data['parameters'][param_key] = {
                'id': param_key,
                'mode': config.get('mode'),
                'enabled': True
            }

            sensitivity_logger.info(f"\nParameter: {param_key}")
            sensitivity_logger.info("-" * 40)

            if config.get('mode'):
                sensitivity_logger.info(f"Analysis Mode: {config['mode']}")
                values = config.get('values', [])

                if config['mode'] == 'symmetrical':
                    if values and values[0] is not None:
                        sensitivity_logger.info(f"Variation: ±{values[0]}%")
                    else:
                        sensitivity_logger.info("Variation: Not specified")

                elif config['mode'] == 'multiple':
                    valid_points = [str(point) for point in values if point is not None]
                    if valid_points:
                        sensitivity_logger.info(f"Points: {', '.join(valid_points)}%")
                    else:
                        sensitivity_logger.info("Points: Not specified")

            if config.get('compareToKey'):
                plot_types = []
                if config.get('waterfall'): plot_types.append('waterfall')
                if config.get('bar'): plot_types.append('bar')
                if config.get('point'): plot_types.append('point')

                visualization_data['relationships'].append({
                    'source': param_key,
                    'target': config['compareToKey'],
                    'type': config.get('comparisonType', 'primary'),
                    'plotTypes': plot_types
                })

                sensitivity_logger.info(
                    f"Comparison: Against {config['compareToKey']} as "
                    f"{'primary (X axis)' if config.get('comparisonType') == 'primary' else 'secondary (Y axis)'}"
                )

                if plot_types:
                    sensitivity_logger.info(f"Plot Types: {', '.join(plot_types)}")

        return visualization_data

    except Exception as e:
        error_msg = f"Error processing sensitivity visualization: {str(e)}"
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

        # Wait for config copy service to complete (or timeout after 5 minutes)
        sensitivity_logger.info("Waiting for configuration copying to complete...")
        max_wait_time = 300  # 5 minutes in seconds
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
                if mode.lower() == 'symmetrical':
                    base_variation = values[0]
                    variations = [base_variation, -base_variation]
                else:
                    variations = values

                # Check if configuration files exist for each variation
                for variation in variations:
                    var_str = f"{variation:+.2f}"
                    mode_dir = 'symmetrical' if mode.lower() == 'symmetrical' else 'multiple'
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
                                variations = [base_variation, -base_variation]
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

        # Return success response with timing information
        return jsonify({
            "status": "success",
            "message": "Calculations completed successfully",
            "runId": run_id,
            "timing": {
                "total": f"{total_time:.2f}s",
                "configuration": f"{config_time:.2f}s",
                "calculations": len(enabled_params) + 1
            },
            "configCopy": copy_service_result
        })

    except Exception as e:
        error_msg = f"Error during orchestrated calculations: {str(e)}"
        sensitivity_logger.error(error_msg)
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

# =====================================
# Visualization Endpoint
# =====================================

@app.route('/sensitivity/visualize', methods=['POST'])
def get_sensitivity_visualization():
    """
    Get visualization data for sensitivity analysis.
    This endpoint processes sensitivity parameters and returns structured data
    for visualization in the frontend.
    """
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")
    start_time = time.time()

    # Enhanced logging for visualization process
    sensitivity_logger.info("\n" + "="*80)
    sensitivity_logger.info("PLOT GENERATION STARTED - Run ID: " + run_id)
    sensitivity_logger.info("="*80)

    try:
        # Check if sensitivity configurations have been generated
        is_configured, saved_config = check_sensitivity_config_status()

        # If sensitivity configurations haven't been generated, return an error
        if not is_configured:
            sensitivity_logger.warning("Sensitivity configurations have not been generated yet")
            return jsonify({
                "error": "Sensitivity configurations must be generated first",
                "message": "Please call /sensitivity/configure endpoint to generate and save sensitivity configurations before visualizing results",
                "nextStep": "Call /sensitivity/configure endpoint first"
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Use saved version if available, otherwise use request data
        if saved_config and 'versions' in saved_config:
            version = saved_config['versions'][0]
            sensitivity_logger.info("Using saved version from configuration")
        else:
            version = data.get('selectedVersions', [1])[0]

        # Use saved parameters if available, otherwise use request data
        if saved_config and 'SenParameters' in saved_config:
            sen_parameters = saved_config['SenParameters']
            sensitivity_logger.info("Using saved sensitivity parameters from configuration")
        else:
            sen_parameters = data.get('SenParameters', {})

        log_execution_flow('enter', f"Processing visualization request - Run ID: {run_id}")
        sensitivity_logger.info(f"\nProcessing visualization request - Run ID: {run_id}")
        sensitivity_logger.info(f"Version: {version}")
        sensitivity_logger.info(f"Parameters: {list(sen_parameters.keys())}")

        visualization_data = {
            'parameters': {},
            'relationships': [],
            'plots': {},
            'metadata': {
                'version': str(version),
                'runId': run_id,
                'processingTime': 0,
                'plotsGenerated': 0,
                'errors': []
            }
        }

        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')

        # Create sensitivity directories early in the process
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        # Create main sensitivity directory
        os.makedirs(sensitivity_dir, exist_ok=True)
        sensitivity_logger.info(f"Created main sensitivity directory: {sensitivity_dir}")

        # Create subdirectories for different analysis types
        for mode in ['Symmetrical', 'Multipoint']:
            mode_dir = os.path.join(sensitivity_dir, mode)
            os.makedirs(mode_dir, exist_ok=True)
            sensitivity_logger.info(f"Created sensitivity mode directory: {mode_dir}")

            # Create subdirectories for plot types and configuration
            for subdir in ['waterfall', 'bar', 'point', 'Configuration']:
                subdir_path = os.path.join(mode_dir, subdir)
                os.makedirs(subdir_path, exist_ok=True)
                sensitivity_logger.info(f"Created sensitivity subdirectory: {subdir_path}")

                # Create parameter-specific variation directories for Configuration
                if subdir == 'Configuration':
                    # For each enabled parameter, create variation directories
                    for param_id, param_config in sen_parameters.items():
                        if not param_config.get('enabled'):
                            continue

                        # Get variation values
                        values = param_config.get('values', [])
                        if not values:
                            continue

                        # Determine variation list based on mode
                        if mode.lower() == 'symmetrical':
                            # For symmetrical, use first value to create +/- variations
                            base_variation = values[0]
                            variation_list = [base_variation, -base_variation]
                        else:  # 'multiple' mode
                            # For multiple, use all values directly
                            variation_list = values

                        # Create a directory for each variation
                        for variation in variation_list:
                            # Format the variation string (e.g., "+10.00" or "-5.00")
                            var_str = f"{variation:+.2f}"

                            # Create a subdirectory for this specific parameter and variation
                            param_var_dir = os.path.join(subdir_path, f"{param_id}_{var_str}")
                            os.makedirs(param_var_dir, exist_ok=True)
                            sensitivity_logger.info(f"Created parameter variation directory: {param_var_dir}")

        # Create standalone Configuration directory
        config_dir = os.path.join(sensitivity_dir, "Configuration")
        os.makedirs(config_dir, exist_ok=True)
        sensitivity_logger.info(f"Created standalone Configuration directory: {config_dir}")

        # Create Reports and Cache directories
        for extra_dir in ['Reports', 'Cache']:
            extra_path = os.path.join(sensitivity_dir, extra_dir)
            os.makedirs(extra_path, exist_ok=True)
            sensitivity_logger.info(f"Created sensitivity extra directory: {extra_path}")

        plots_generated = 0

        for param_id, config in sen_parameters.items():
            if not config.get('enabled'):
                continue

            # Log the start of processing for this parameter
            log_execution_flow('checkpoint', f"Processing parameter {param_id}")
            sensitivity_logger.info(f"\nProcessing {param_id}:")

            mode = config.get('mode')
            plot_types = []
            if config.get('waterfall'): plot_types.append('waterfall')
            if config.get('bar'): plot_types.append('bar')
            if config.get('point'): plot_types.append('point')

            # Special handling for S34-S38 against S13
            is_special_case = (
                    param_id >= 'S34' and param_id <= 'S38' and
                    config.get('compareToKey') == 'S13'
            )

            if is_special_case:
                sensitivity_logger.info(f"{param_id} identified as special case (vs S13)")

            # Add parameter metadata with status
            visualization_data['parameters'][param_id] = {
                'id': param_id,
                'mode': mode,
                'enabled': True,
                'status': {
                    'processed': False,
                    'error': None,
                    'isSpecialCase': is_special_case
                }
            }

            # Add relationship data
            if config.get('compareToKey'):
                relationship = {
                    'source': param_id,
                    'target': config['compareToKey'],
                    'type': config.get('comparisonType', 'primary'),
                    'plotTypes': plot_types
                }
                visualization_data['relationships'].append(relationship)
                sensitivity_logger.info(
                    f"Added relationship: {param_id} -> {config['compareToKey']} "
                    f"({config.get('comparisonType', 'primary')})"
                )

            # Initialize plot data structure
            visualization_data['plots'][param_id] = {}

            # Collect plot paths with status
            sensitivity_dir = os.path.join(
                results_folder,
                'Sensitivity',
                'Symmetrical' if mode == 'symmetrical' else 'Multipoint'
            )

            # Initialize plot data structure for this parameter
            visualization_data['plots'][param_id] = {}

            # Check if sensitivity directory exists
            if not os.path.exists(sensitivity_dir):
                error_msg = f"Sensitivity directory not found: {sensitivity_dir}"
                sensitivity_logger.error(error_msg)
                log_execution_flow('error', error_msg)
                visualization_data['parameters'][param_id]['status']['error'] = error_msg
                visualization_data['metadata']['errors'].append(error_msg)
                continue

            # Check for results files before attempting to visualize
            result_file_name = f"{param_id}_vs_{config['compareToKey']}_{mode.lower()}_results.json"
            result_file_path = os.path.join(sensitivity_dir, result_file_name)

            if not os.path.exists(result_file_path):
                sensitivity_logger.warning(f"Results file not found: {result_file_path}")
                sensitivity_logger.info("Checking if results processing needs to be triggered...")

            # Check if process_sensitivity_results.py needs to be executed
            try:
                process_script = os.path.join(
                    SCRIPT_DIR,
                    "API_endpoints_and_controllers",
                    "process_sensitivity_results.py"
                )

                if os.path.exists(process_script):
                    sensitivity_logger.info(f"Triggering results processing for {param_id}...")
                    process_result = subprocess.run(
                        ['python', process_script, str(version), '0.5'],  # 30 second wait time
                        capture_output=True,
                        text=True
                    )

                    if process_result.returncode == 0:
                        sensitivity_logger.info("Successfully processed sensitivity results")

                        # Check again for results file
                        if os.path.exists(result_file_path):
                            sensitivity_logger.info(f"Results file now found after processing: {result_file_path}")
                        else:
                            sensitivity_logger.warning(f"Results file still not found after processing: {result_file_path}")
                    else:
                        sensitivity_logger.error(f"Error in manual results processing: {process_result.stderr}")
            except Exception as e:
                sensitivity_logger.error(f"Exception in manual results processing: {str(e)}")

            # First, we need to make sure results processing is complete
            # Check for results file existence
            result_file_name = f"{param_id}_vs_{config['compareToKey']}_{mode.lower()}_results.json"
            result_file_path = os.path.join(sensitivity_dir, result_file_name)

            # If results file doesn't exist, wait and trigger results processing
            if not os.path.exists(result_file_path):
                sensitivity_logger.warning(f"Results file not found: {result_file_path}")
                sensitivity_logger.info("Triggering results processing explicitly...")

                try:
                    process_script = os.path.join(
                        SCRIPT_DIR,
                        "API_endpoints_and_controllers",
                        "process_sensitivity_results.py"
                    )

                    if os.path.exists(process_script):
                        sensitivity_logger.info(f"Executing results processing for {param_id}...")
                        process_result = subprocess.run(
                            ['python', process_script, str(version), '1'],  # 1 minute wait time
                            capture_output=True,
                            text=True
                        )

                        if process_result.returncode == 0:
                            sensitivity_logger.info("Successfully processed sensitivity results")

                            # Check if results file was created
                            if os.path.exists(result_file_path):
                                sensitivity_logger.info(f"Results file now created: {result_file_path}")
                            else:
                                sensitivity_logger.warning(f"Results file still not found after processing: {result_file_path}")
                                # Wait a bit more in case file writing is delayed
                                time.sleep(5)
                        else:
                            sensitivity_logger.error(f"Error in results processing: {process_result.stderr}")
                    else:
                        sensitivity_logger.error(f"Results processing script not found: {process_script}")
                except Exception as e:
                    sensitivity_logger.error(f"Exception in results processing: {str(e)}")

            # Now that results processing has been attempted, process each plot type
            for plot_type in plot_types:
                # Log the start of plot generation attempt
                log_plot_generation_start(param_id, config['compareToKey'], plot_type, mode)
                sensitivity_logger.info(f"Beginning plot generation for {param_id} {plot_type} plot...")

                # Construct the plot name and path
                plot_name = f"{plot_type}_{param_id}_{config['compareToKey']}_{config.get('comparisonType', 'primary')}"
                plot_path = os.path.join(sensitivity_dir, f"{plot_name}.png")

                # Initialize plot status
                plot_status = {
                    'status': 'error',
                    'path': None,
                    'error': None
                }

                # Check again for the results file now that processing has completed
                if os.path.exists(result_file_path):
                    sensitivity_logger.info(f"Using results data from: {result_file_path}")

                    # Check if the plot file exists
                    if os.path.exists(plot_path):
                        # Plot exists, log success
                        relative_path = os.path.relpath(plot_path, base_dir)
                        plot_status.update({
                            'status': 'ready',
                            'path': relative_path,
                            'error': None
                        })
                        plots_generated += 1
                        sensitivity_logger.info(f"Found existing {plot_type} plot: {relative_path}")
                        log_plot_generation_complete(param_id, config['compareToKey'], plot_type, mode, plot_path)
                    else:
                        # Plot doesn't exist, but we have results data - generate the plot
                        sensitivity_logger.info(f"Generating {plot_type} plot from results data...")
                        log_plot_data_loading(param_id, config['compareToKey'], result_file_path, success=True)

                        # Attempt to generate the plot using sensitivity_Routes functions
                        try:
                            # Import the plot generation script
                            try:
                                from sensitivity_Routes import generate_plot_from_results

                                # Generate the plot
                                generated = generate_plot_from_results(
                                    version=version,
                                    param_id=param_id,
                                    compare_to_key=config['compareToKey'],
                                    plot_type=plot_type,
                                    mode=mode,
                                    result_path=result_file_path
                                )

                                if generated and os.path.exists(plot_path):
                                    sensitivity_logger.info(f"Successfully generated {plot_type} plot: {plot_path}")
                                    relative_path = os.path.relpath(plot_path, base_dir)
                                    plot_status.update({
                                        'status': 'ready',
                                        'path': relative_path,
                                        'error': None
                                    })
                                    plots_generated += 1
                                    log_plot_generation_complete(param_id, config['compareToKey'], plot_type, mode, plot_path)
                                else:
                                    error_msg = f"Plot generation failed despite having result data"
                                    plot_status['error'] = error_msg
                                    sensitivity_logger.warning(error_msg)
                                    log_plot_rendering(param_id, config['compareToKey'], plot_type, success=False,
                                                       error_msg=error_msg)
                            except ImportError:
                                error_msg = "Could not import plot generation function"
                                plot_status['error'] = error_msg
                                sensitivity_logger.warning(error_msg)
                                log_plot_rendering(param_id, config['compareToKey'], plot_type, success=False,
                                                   error_msg=error_msg)
                        except Exception as e:
                            error_msg = f"Error generating plot: {str(e)}"
                            plot_status['error'] = error_msg
                            sensitivity_logger.error(error_msg)
                            log_plot_rendering(param_id, config['compareToKey'], plot_type, success=False,
                                               error_msg=error_msg)
                else:
                    # No results data available even after processing
                    error_msg = f"Results data not available for {param_id} even after processing"
                    plot_status['error'] = error_msg
                    sensitivity_logger.error(error_msg)
                    log_plot_data_loading(param_id, config['compareToKey'], result_file_path, success=False,
                                          error_msg=error_msg)

                # Add plot status to visualization data
                visualization_data['plots'][param_id][plot_type] = plot_status

            # Update parameter processing status
            visualization_data['parameters'][param_id]['status']['processed'] = True
            log_execution_flow('checkpoint', f"Completed processing parameter {param_id}")

        # Update metadata
        processing_time = time.time() - start_time
        visualization_data['metadata'].update({
            'processingTime': round(processing_time, 2),
            'plotsGenerated': plots_generated
        })

        sensitivity_logger.info("\n" + "="*80)
        sensitivity_logger.info(f"PLOT GENERATION COMPLETED - Run ID: {run_id}")
        sensitivity_logger.info(f"Processing time: {processing_time:.2f}s")
        sensitivity_logger.info(f"Plots generated: {plots_generated}")
        if visualization_data['metadata']['errors']:
            sensitivity_logger.info(f"Errors encountered: {len(visualization_data['metadata']['errors'])}")
        sensitivity_logger.info("="*80 + "\n")

        log_execution_flow('exit', f"Visualization processing complete - Run ID: {run_id}")
        return jsonify(visualization_data)

    except Exception as e:
        error_msg = f"Error generating visualization data: {str(e)}"
        sensitivity_logger.exception(error_msg)
        log_execution_flow('error', error_msg)

        # Return partial data if available, along with error
        if 'visualization_data' in locals():
            visualization_data['metadata']['errors'].append(error_msg)
            return jsonify(visualization_data)

        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

# =====================================
# Price Endpoints
# =====================================

def find_price_from_economic_summaries(version):
    """
    Find price value from economic summaries in multiple potential locations.

    Args:
        version (int/str): Version number

    Returns:
        tuple: (price, source) - price is the found price value or None if not found,
                                source is a description of where it was found
    """
    sensitivity_logger = logging.getLogger('sensitivity')

    # Convert version to int if it's a string
    version_num = int(version) if not isinstance(version, int) else version

    # List of potential paths to check for economic summaries
    paths_to_check = [
        # Main economic summary
        os.path.join(
            ORIGINAL_BASE_DIR,
            f'Batch({version_num})',
            f'Results({version_num})',
            f"Economic_Summary({version_num}).csv"
        ),
        # Secondary location - in Results root
        os.path.join(
            ORIGINAL_BASE_DIR,
            f'Batch({version_num})',
            f'Results({version_num})',
            f"Economic_Summary.csv"
        ),
        # In sensitivity directory
        os.path.join(
            ORIGINAL_BASE_DIR,
            f'Batch({version_num})',
            f'Results({version_num})',
            'Sensitivity',
            f"Economic_Summary({version_num}).csv"
        )
    ]

    # Also search for any economic summary CSVs using glob pattern
    glob_patterns = [
        os.path.join(
            ORIGINAL_BASE_DIR,
            f'Batch({version_num})',
            f'Results({version_num})',
            "**",
            f"Economic_Summary*.csv"
        ),
        os.path.join(
            ORIGINAL_BASE_DIR,
            f'Batch({version_num})',
            f'Results({version_num})',
            "Sensitivity",
            "**",
            f"Economic_Summary*.csv"
        )
    ]

    # First check specific paths
    for idx, path in enumerate(paths_to_check):
        sensitivity_logger.info(f"Checking for economic summary at path {idx+1}/{len(paths_to_check)}: {path}")

        if os.path.exists(path):
            try:
                economic_df = pd.read_csv(path)
                price_rows = economic_df[economic_df['Metric'] == 'Average Selling Price (Project Life Cycle)']

                if not price_rows.empty:
                    price_value = float(price_rows.iloc[0, 1])  # Assuming price is in second column
                    sensitivity_logger.info(f"Found price in economic summary at {path}: {price_value}")
                    return price_value, f"economic_summary_path_{idx+1}"
                else:
                    sensitivity_logger.warning(f"Price row not found in economic summary at {path}")
            except Exception as e:
                sensitivity_logger.error(f"Error reading economic summary at {path}: {str(e)}")

    # Then try using glob patterns
    for pattern_idx, pattern in enumerate(glob_patterns):
        sensitivity_logger.info(f"Searching for economic summaries with pattern {pattern_idx+1}/{len(glob_patterns)}")

        try:
            matches = glob.glob(pattern, recursive=True)
            sensitivity_logger.info(f"Found {len(matches)} potential economic summary files")

            for match_idx, match_path in enumerate(matches):
                try:
                    economic_df = pd.read_csv(match_path)
                    price_rows = economic_df[economic_df['Metric'] == 'Average Selling Price (Project Life Cycle)']

                    if not price_rows.empty:
                        price_value = float(price_rows.iloc[0, 1])
                        sensitivity_logger.info(f"Found price in economic summary at {match_path}: {price_value}")
                        return price_value, f"glob_pattern_{pattern_idx+1}_match_{match_idx+1}"
                except Exception as e:
                    sensitivity_logger.error(f"Error reading match {match_idx+1} at {match_path}: {str(e)}")
        except Exception as e:
            sensitivity_logger.error(f"Error with glob pattern {pattern_idx+1}: {str(e)}")

    # If we reach here, no price was found in any economic summary
    sensitivity_logger.warning(f"No price found in any economic summary for version {version_num}")
    return None, "not_found"

@app.route('/prices/<version>', methods=['GET'])
def get_price(version):
    """
    Get calculated price for a specific version.
    This endpoint matches the existing one used in HomePage.js.
    """
    try:
        sensitivity_logger = logging.getLogger('sensitivity')
        sensitivity_logger.info(f"Fetching price for version: {version}")

        # Try to find price from economic summaries in multiple locations
        price, source = find_price_from_economic_summaries(version)

        if price is not None:
            return jsonify({
                'price': price,
                'version': version,
                'source': source,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
            })

        # Check for sensitivity results that might have price data
        try:
            base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
            sensitivity_dir = os.path.join(
                base_dir,
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity'
            )

            # Look for any results JSON files
            result_files = glob.glob(os.path.join(sensitivity_dir, "*_results.json"))

            for result_file in result_files:
                sensitivity_logger.info(f"Checking sensitivity result file: {result_file}")

                try:
                    with open(result_file, 'r') as f:
                        result_data = json.load(f)

                    # Look for price in variations
                    if 'variations' in result_data:
                        for variation in result_data['variations']:
                            if variation.get('status') == 'completed' and 'values' in variation and 'price' in variation['values']:
                                price = variation['values']['price']
                                if price is not None:
                                    sensitivity_logger.info(f"Found price in sensitivity result: {price}")
                                    return jsonify({
                                        'price': price,
                                        'version': version,
                                        'source': f"sensitivity_result_{os.path.basename(result_file)}",
                                        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
                                    })
                except Exception as e:
                    sensitivity_logger.error(f"Error reading sensitivity result file {result_file}: {str(e)}")
        except Exception as e:
            sensitivity_logger.error(f"Error searching sensitivity results: {str(e)}")

        # Fallback to simulated price with detailed logging
        price = 1000.00 + float(version) * 100
        sensitivity_logger.warning(f"Using simulated price {price} for version {version} - No real data found")

        return jsonify({
            'price': price,
            'version': version,
            'source': 'simulated',
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
        })

    except Exception as e:
        sensitivity_logger = logging.getLogger('sensitivity')
        sensitivity_logger.exception(f"Error fetching price: {str(e)}")
        return jsonify({
            "error": str(e),
            "version": version
        }), 500

@app.route('/stream_prices/<version>', methods=['GET'])
def stream_prices(version):
    """
    Stream real-time price updates.
    This endpoint matches the existing one used in HomePage.js but with improved price finding.
    """
    def generate():
        try:
            sensitivity_logger = logging.getLogger('sensitivity')
            sensitivity_logger.info(f"Starting price stream for version: {version}")

            # Try to find real price using our comprehensive search function
            price, source = find_price_from_economic_summaries(version)

            # If we found a real price, use it with small variations
            if price is not None:
                sensitivity_logger.info(f"Initial real price from {source}: {price}")
                yield f"data: {json.dumps({'price': price, 'version': version, 'source': source})}\n\n"

                # Stream updates with small variations around the actual price
                variations = [-2, 0, 2]  # First down, then same, then up
                for i, variation in enumerate(variations):
                    time.sleep(1)
                    updated_price = price + variation
                    sensitivity_logger.info(f"Streaming real price update {i+1}: {updated_price} (variation: {variation})")
                    yield f"data: {json.dumps({'price': updated_price, 'version': version, 'source': f'{source}_variation_{i+1}'})}\n\n"

                # Send completion message with original price
                yield f"data: {json.dumps({'complete': True, 'price': price, 'version': version, 'source': source})}\n\n"
                return

            # Check sensitivity results as a fallback
            try:
                base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
                sensitivity_dir = os.path.join(
                    base_dir,
                    f'Batch({version})',
                    f'Results({version})',
                    'Sensitivity'
                )

                # Look for any results JSON files
                result_files = glob.glob(os.path.join(sensitivity_dir, "*_results.json"))

                for result_file in result_files:
                    try:
                        with open(result_file, 'r') as f:
                            result_data = json.load(f)

                        # Look for price in variations
                        if 'variations' in result_data:
                            for variation in result_data['variations']:
                                if variation.get('status') == 'completed' and 'values' in variation and 'price' in variation['values']:
                                    price = variation['values']['price']
                                    if price is not None:
                                        source = f"sensitivity_result_{os.path.basename(result_file)}"
                                        sensitivity_logger.info(f"Found price in sensitivity result: {price}")

                                        # Initial data
                                        yield f"data: {json.dumps({'price': price, 'version': version, 'source': source})}\n\n"

                                        # Stream updates with small variations
                                        variations = [-2, 0, 2]  # First down, then same, then up
                                        for i, variation in enumerate(variations):
                                            time.sleep(1)
                                            updated_price = price + variation
                                            sensitivity_logger.info(f"Streaming price update {i+1}: {updated_price} (variation: {variation})")
                                            yield f"data: {json.dumps({'price': updated_price, 'version': version, 'source': f'{source}_variation_{i+1}'})}\n\n"

                                        # Send completion message
                                        yield f"data: {json.dumps({'complete': True, 'price': price, 'version': version, 'source': source})}\n\n"
                                        return
                    except Exception as e:
                        sensitivity_logger.error(f"Error reading sensitivity result file {result_file}: {str(e)}")
            except Exception as e:
                sensitivity_logger.error(f"Error searching sensitivity results: {str(e)}")

            # Fallback to simulated price as last resort
            price = 1000.00 + float(version) * 100
            sensitivity_logger.warning(f"Using simulated initial price: {price}")

            # Send initial data
            yield f"data: {json.dumps({'price': price, 'version': version, 'source': 'simulated'})}\n\n"

            # Simulate updates every second for 5 seconds
            for i in range(5):
                time.sleep(1)
                price += 5.0 * (i + 1)
                sensitivity_logger.warning(f"Streaming simulated price update {i+1}: {price}")
                yield f"data: {json.dumps({'price': price, 'version': version, 'source': 'simulated'})}\n\n"

            # Send completion message
            yield f"data: {json.dumps({'complete': True, 'price': price, 'version': version, 'source': 'simulated'})}\n\n"

        except Exception as e:
            sensitivity_logger = logging.getLogger('sensitivity')
            sensitivity_logger.exception(f"Error in price stream: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(generate(), mimetype='text/event-stream')

# =====================================
# Integration with Config Copy Service
# =====================================

@app.route('/copy-config-modules', methods=['POST'])
def copy_config_modules_proxy():
    """
    Proxy endpoint that forwards requests to the config module copy service on port 2600.
    This provides redundancy in case the 2600 service isn't running.
    """
    try:
        sensitivity_logger = logging.getLogger('sensitivity')
        sensitivity_logger.info("Received request to copy config modules")

        # Forward the request to the actual service
        try:
            response = requests.post(
                "http://localhost:2600/copy-config-modules",
                json=request.json,
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                sensitivity_logger.info(f"Config copy service response: {result.get('message')}")
                return jsonify(result), response.status_code
            else:
                error_msg = f"Error from config copy service: {response.text}"
                sensitivity_logger.error(error_msg)
                return jsonify({"error": error_msg}), response.status_code

        except requests.exceptions.ConnectionError:
            # If the service is not running, provide a fallback response
            sensitivity_logger.warning("Config copy service not running - providing fallback response")
            return jsonify({
                "status": "fallback",
                "message": "Config module copy service not available. Using fallback implementation.",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            })
    except Exception as e:
        sensitivity_logger = logging.getLogger('sensitivity')
        sensitivity_logger.exception(f"Error in config module copy proxy: {str(e)}")
        return jsonify({"error": str(e)}), 500

# =====================================
# Utility Endpoints
# =====================================

@app.route('/images/<path:image_path>', methods=['GET'])
def get_image(image_path):
    """Serve image files from the results directory."""
    try:
        # Construct the full path to the image
        full_path = os.path.join(ORIGINAL_BASE_DIR, image_path)

        if not os.path.exists(full_path):
            logging.warning(f"Image not found: {full_path}")
            return jsonify({"error": "Image not found"}), 404

        return send_file(full_path, mimetype='image/png')

    except Exception as e:
        logging.exception(f"Error serving image: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for server detection.
    Returns a 200 OK response with basic server information.
    """
    # Also check if the 2600 service is running
    config_copy_service_status = "available"
    try:
        response = requests.get("http://localhost:2600/health", timeout=2)
        if not response.ok:
            config_copy_service_status = "unavailable"
    except requests.exceptions.RequestException:
        config_copy_service_status = "unavailable"

    return jsonify({
        "status": "ok",
        "server": "sensitivity-analysis-server",
        "version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "services": {
            "config_copy_service": config_copy_service_status
        }
    })

# =====================================
# Application Entry Point
# =====================================

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=2500)