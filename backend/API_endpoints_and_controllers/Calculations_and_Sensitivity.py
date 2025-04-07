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

def run_script(script_name, *args, script_type="python", timeout=30):
    """
    Run a script with the specified arguments.

    Args:
        script_name (str): Path to the script
        args: Arguments to pass to the script
        script_type (str): Either "python" or "Rscript"
        timeout (int): Maximum execution time in seconds (default: 30)

    Returns:
        tuple: (success, error_message)
    """
    try:
        if not os.path.exists(script_name):
            error_msg = f"Script not found: {script_name}"
            logging.error(error_msg)
            return False, error_msg

        command = ['python' if script_type == "python" else 'Rscript', script_name]
        command.extend([str(arg) for arg in args])

        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=True
            )
            logging.info(f"Successfully ran {os.path.basename(script_name)}" +
                         (f" for version {args[0]}" if args else ""))
            return True, None

        except subprocess.TimeoutExpired:
            error_msg = f"Script timed out after {timeout}s: {os.path.basename(script_name)}"
            logging.error(error_msg)
            return False, error_msg

        except subprocess.CalledProcessError as e:
            error_msg = (f"Script failed with return code {e.returncode}: "
                         f"{os.path.basename(script_name)}\n"
                         f"Command: {' '.join(e.cmd)}\n"
                         f"Error output: {e.stderr or e.stdout}")
            logging.error(error_msg)
            return False, error_msg

    except FileNotFoundError:
        error_msg = f"Command not found: {command[0]}"
        logging.error(error_msg)
        return False, error_msg

    except Exception as e:
        error_msg = f"Unexpected error running {os.path.basename(script_name)}: {str(e)}"
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

def process_sensitivity_calculations(version, param_id, param_config, sensitivity_dir, calculation_script, config):
    """
    Process sensitivity calculations for a specific parameter and its variations.

    Args:
        version (int): Version number
        param_id (str): Parameter ID (e.g., 'S13')
        param_config (dict): Parameter configuration
        sensitivity_dir (str): Base sensitivity directory
        calculation_script (str): Path to primary calculation script
        config (dict): Full configuration including selectedV, selectedF, etc.

    Returns:
        dict: Results of processing
    """
    sensitivity_logger = logging.getLogger('sensitivity')

    param_start = time.time()
    sensitivity_logger.info(f"\nProcessing {param_id} directly:")
    sensitivity_logger.info(f"Mode: {param_config.get('mode')}")
    sensitivity_logger.info(f"Values: {param_config.get('values')}")

    # Get base directories
    base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
    results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')

    # Run CFA on each modified configuration
    mode = param_config.get('mode', 'symmetrical').lower()
    values = param_config.get('values', [])
    results = {"variations_processed": 0, "success_count": 0, "errors": []}

    # Determine variation list with consistent formatting
    if mode == 'symmetrical':
        base_variation = float(values[0])
        variations = [base_variation, -base_variation]
    else:  # 'multipoint' mode
        variations = [float(v) for v in values]

    # Define the CFA scripts to try (in order)
    cfa_scripts = [
        os.path.join(SCRIPT_DIR, "Core_calculation_engines", "CFA-b.py")    ]

    for variation in variations:
        var_str = f"{variation:+.2f}"  # Consistent +- format
        sensitivity_logger.info(f"Processing {param_id} variation {var_str}")

        # Get directory paths with correct capitalization
        mode_dir_name = "Symmetrical" if mode == "symmetrical" else "Multipoint"

        # Parameter variation directory (lowercase mode)
        param_var_dir = os.path.join(sensitivity_dir, param_id, mode, var_str)
        os.makedirs(param_var_dir, exist_ok=True)

        # Configuration directory (capitalized mode)
        config_dir = os.path.join(sensitivity_dir, mode_dir_name, "Configuration", f"{param_id}_{var_str}")
        os.makedirs(config_dir, exist_ok=True)

        # Create a modified SenParameters dictionary for this specific variation
        modified_sen_parameters = {
            param_id: {
                "enabled": True,
                "mode": mode,
                "values": [variation],
                "compareToKey": param_config.get('compareToKey', 'S13'),
                "comparisonType": param_config.get('comparisonType', 'primary'),
                "variation": variation,
                "variation_str": var_str
            }
        }

        # Find or copy configuration files
        config_matrix_file = os.path.join(config_dir, f"General_Configuration_Matrix({version}).csv")
        source_config_matrix = os.path.join(results_folder, f"General_Configuration_Matrix({version}).csv")

        # Copy the matrix file if it doesn't exist
        if not os.path.exists(config_matrix_file) and os.path.exists(source_config_matrix):
            import shutil
            shutil.copy2(source_config_matrix, config_matrix_file)
            sensitivity_logger.info(f"Copied configuration matrix to {config_matrix_file}")

        # Configuration file path
        config_file = os.path.join(config_dir, f"configurations({version}).py")
        source_config_file = os.path.join(base_dir, f"Batch({version})",
                                          f"ConfigurationPlotSpec({version})",
                                          f"configurations({version}).py")

        # Copy the config file if it doesn't exist
        if not os.path.exists(config_file) and os.path.exists(source_config_file):
            import shutil
            shutil.copy2(source_config_file, config_file)
            sensitivity_logger.info(f"Copied configuration file to {config_file}")

        # Set up environment variables for the calculation scripts
        env_vars = {
            **os.environ,
            'CONFIG_MATRIX_FILE': config_matrix_file,
            'CONFIG_FILE': config_file,
            'RESULTS_FOLDER': param_var_dir
        }

        # Try each calculation script in order
        success = False
        results["variations_processed"] += 1

        for script_path in cfa_scripts:
            script_name = os.path.basename(script_path)
            if not os.path.exists(script_path):
                sensitivity_logger.warning(f"Script not found: {script_path}, trying next script")
                continue

            sensitivity_logger.info(f"Running {script_name} for {param_id} variation {var_str}")

            try:
                # Prepare the command-line arguments
                result = subprocess.run(
                    [
                        'python',
                        script_path,
                        str(version),
                        json.dumps(config['selectedV']),
                        json.dumps(config['selectedF']),
                        str(config['targetRow']),
                        config['calculationOption'],
                        json.dumps(modified_sen_parameters)
                    ],
                    env=env_vars,
                    capture_output=True,
                    text=True,
                    timeout=300  # 5-minute timeout
                )

                if result.returncode == 0:
                    sensitivity_logger.info(f"Successfully ran {script_name} for {param_id} variation {var_str}")
                    success = True
                    break
                else:
                    error_msg = f"Error running {script_name}: {result.stderr}"
                    sensitivity_logger.error(error_msg)
                    # Continue to the next script if this one failed

            except subprocess.TimeoutExpired:
                error_msg = f"Timeout running {script_name} for {param_id} variation {var_str}"
                sensitivity_logger.error(error_msg)
                results["errors"].append(error_msg)

            except Exception as e:
                error_msg = f"Exception running {script_name} for {param_id} variation {var_str}: {str(e)}"
                sensitivity_logger.error(error_msg)
                results["errors"].append(error_msg)

        if success:
            results["success_count"] += 1

            # Generate plots if requested
            if param_config.get('waterfall') or param_config.get('bar') or param_config.get('point'):
                try:
                    # Implementation for plot generation would go here
                    # This is a placeholder - actual plot generation depends on your visualization library
                    plot_types = []
                    if param_config.get('waterfall'): plot_types.append('waterfall')
                    if param_config.get('bar'): plot_types.append('bar')
                    if param_config.get('point'): plot_types.append('point')

                    for plot_type in plot_types:
                        plot_dir = os.path.join(
                            sensitivity_dir,
                            mode_dir_name,
                            plot_type,
                            f"{param_id}_{plot_type}"
                        )
                        os.makedirs(plot_dir, exist_ok=True)
                        sensitivity_logger.info(f"Plot directory created: {plot_dir}")

                except Exception as e:
                    plot_error = f"Error generating plots for {param_id} variation {var_str}: {str(e)}"
                    sensitivity_logger.error(plot_error)
                    results["errors"].append(plot_error)
        else:
            error_msg = f"All calculation scripts failed for {param_id} variation {var_str}"
            sensitivity_logger.error(error_msg)
            results["errors"].append(error_msg)

    param_duration = time.time() - param_start
    sensitivity_logger.info(f"Completed {param_id} processing in {param_duration:.2f}s")
    results["duration"] = param_duration

    return results

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

        # Trigger config module copy service - MOVED FROM /runs to here
        sensitivity_logger.info("\nTriggering configuration module copying:")
        copy_service_result = trigger_config_module_copy(
            version,
            sensitivity_dir,
            config['SenParameters']
        )

        # If CalSen service is available, prepare paths
        calsen_result = None
        try:
            sensitivity_logger.info("Preparing path configurations with CalSen service...")
            cal_sen_response = requests.post(
                "http://localhost:2750/get_config_paths",
                json={
                    "version": version,
                    "payload": config
                },
                timeout=5
            )

            if cal_sen_response.status_code == 200:
                calsen_result = cal_sen_response.json()
                sensitivity_logger.info(f"CalSen paths prepared: {len(calsen_result.get('path_sets', {}))} configurations")

                # Save path sets for later use
                calsen_paths_file = os.path.join(config_dir, "calsen_paths.json")
                with open(calsen_paths_file, 'w') as f:
                    json.dump(calsen_result, f, indent=2)
            else:
                sensitivity_logger.warning("CalSen service did not return valid path sets")

        except requests.exceptions.RequestException:
            sensitivity_logger.warning("CalSen service not available")

        # Save configuration status
        with open(SENSITIVITY_CONFIG_STATUS_PATH, 'w') as f:
            json.dump({
                'configured': True,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'runId': run_id,
                'version': version,
                'configDir': config_dir,
                'sensitivityDir': sensitivity_dir,
                'configCopyInitiated': True,
                'configCopyResult': copy_service_result,
                'calsenResult': calsen_result is not None
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
            "configCopy": copy_service_result,
            "calsen": calsen_result is not None,
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

        # Step 3: Check if config files are already being copied
        sensitivity_logger.info("\nChecking configuration module copy status:")
        status_data = {}

        if os.path.exists(SENSITIVITY_CONFIG_STATUS_PATH):
            with open(SENSITIVITY_CONFIG_STATUS_PATH, 'r') as f:
                status_data = json.load(f)

        if status_data.get('configCopyInitiated'):
            sensitivity_logger.info("Configuration copying was already initiated during configuration step")
            copy_service_result = status_data.get('configCopyResult', {})
        else:
            # Fallback: trigger the config copy if not done during configure step
            sensitivity_logger.info("Configuration copying was not initiated - triggering now")
            copy_service_result = trigger_config_module_copy(
                version,
                sensitivity_dir,
                config['SenParameters']
            )

        # Verify that actual configuration files have been created
        sensitivity_logger.info("Verifying configuration files existence...")
        config_files_verified = False
        wait_duration = 180  # 3 minutes
        start_wait = time.time()

        while time.time() - start_wait < wait_duration:
            # Check for actual configuration files for each enabled parameter
            all_found = True
            for param_id, param_config in config['SenParameters'].items():
                if not param_config.get('enabled'):
                    continue

                mode = param_config.get('mode', 'symmetrical')
                values = param_config.get('values', [])

                # Determine variations based on mode
                if mode.lower() == 'symmetrical':
                    base_variation = float(values[0])
                    variations = [base_variation, -base_variation]
                else:  # multipoint mode
                    variations = [float(v) for v in values]

                # Check if configuration files exist for each variation
                for variation in variations:
                    var_str = f"{variation:+.2f}"
                    config_path_pattern = os.path.join(
                        sensitivity_dir,
                        param_id,
                        mode.lower(),
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

        # Step 4: Process sensitivity parameters with the updated process_sensitivity_calculations function
        enabled_params = [k for k, v in config['SenParameters'].items() if v.get('enabled')]
        if enabled_params:
            sensitivity_logger.info(f"\nProcessing {len(enabled_params)} enabled sensitivity parameters...")

            # Process each parameter
            processing_results = {}
            overall_success = True

            for param_id, param_config in config['SenParameters'].items():
                if not param_config.get('enabled'):
                    continue

                # Process this parameter's calculations using our new function
                result = process_sensitivity_calculations(
                    version,
                    param_id,
                    param_config,
                    sensitivity_dir,
                    calculation_script,
                    config
                )

                processing_results[param_id] = result

                # Check if all variations were processed successfully
                if result["success_count"] < result["variations_processed"]:
                    overall_success = False

            # Log summary of processing results
            sensitivity_logger.info("\nSensitivity Calculation Summary:")
            for param_id, result in processing_results.items():
                sensitivity_logger.info(f"{param_id}: {result['success_count']}/{result['variations_processed']} variations successful, took {result['duration']:.2f}s")
                if result["errors"]:
                    for error in result["errors"]:
                        sensitivity_logger.error(f"  - {error}")

            if overall_success:
                sensitivity_logger.info("All sensitivity calculations completed successfully")
            else:
                sensitivity_logger.warning("Some sensitivity calculations failed")

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
# Start Flask Application
# =====================================

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=2500)