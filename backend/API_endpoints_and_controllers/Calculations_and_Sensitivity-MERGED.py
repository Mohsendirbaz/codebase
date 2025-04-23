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
UTILITY_FUNCTIONS_DIR = os.path.join(BASE_DIR, 'backend', 'Utility_functions')

# Create logs directory if it doesn't exist
os.makedirs(LOGS_DIR, exist_ok=True)

# Log file paths
LOG_FILE_PATH = os.path.join(LOGS_DIR, "RUN.log")
SENSITIVITY_LOG_PATH = os.path.join(LOGS_DIR, "SENSITIVITY.log")

# Sensitivity configuration status file paths
SENSITIVITY_CONFIG_STATUS_PATH = os.path.join(LOGS_DIR, "sensitivity_config_status.json")
SENSITIVITY_CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "sensitivity_config_data.pkl")

import threading
import filelock
import tempfile
import functools

# Configure logger

# Global locks for synchronization
GLOBAL_CONFIG_LOCK = threading.Lock()
GLOBAL_RUN_LOCK = threading.Lock()
GLOBAL_PRICE_LOCK = threading.Lock()
GLOBAL_VISUALIZE_LOCK = threading.Lock()
GLOBAL_PAYLOAD_LOCK = threading.Lock()
GLOBAL_BASELINE_LOCK = threading.Lock()

# Event flags for pipeline execution control
PAYLOAD_REGISTERED = threading.Event()
BASELINE_COMPLETED = threading.Event()
CONFIG_COMPLETED = threading.Event()
RUNS_COMPLETED = threading.Event()

# Timeout for waiting (in seconds)
WAIT_TIMEOUT = 600  # 10 minutes

# Pipeline active flag (holds all routes except the active one)
PIPELINE_ACTIVE = threading.Event()

logger = logging.getLogger('sensitivity')
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

def get_sensitivity_calculation_script():
    """Get the CFA-b.py script for sensitivity analysis"""
    script_path = os.path.join(SCRIPT_DIR, "Core_calculation_engines", "CFA-b.py")
    if os.path.exists(script_path):
        return script_path
    raise Exception("CFA-b.py script not found for sensitivity calculations")
property_mapping = {
    "plantLifetimeAmount10": "Plant Lifetime",
    "bECAmount11": "Bare Erected Cost",
    "numberOfUnitsAmount12": "Number of Units",
    "initialSellingPriceAmount13": "Price",
    "totalOperatingCostPercentageAmount14": "Direct Total Operating Cost Percentage as % of Revenue",
    "engineering_Procurement_and_Construction_EPC_Amount15": "Engineering Procurement and Construction as % of BEC",
    "process_contingency_PC_Amount16": "Process Contingency as % of BEC",
    "project_Contingency_PT_BEC_EPC_PCAmount17": "Project Contingency as % of BEC, EPC, PC",
    "use_direct_operating_expensesAmount18": "Use Direct Operating Expenses",
    "use_direct_revenueAmount19": "Use Direct Revenue",
    "depreciationMethodAmount20": "Depreciation Method",
    "loanTypeAmount21": "Loan Type",
    "interestTypeAmount22": "Interest Type",
    "generalInflationRateAmount23": "General Inflation Rate",
    "interestProportionAmount24": "Interest Proportion",
    "principalProportionAmount25": "Principal Proportion",
    "loanPercentageAmount26": "Loan Percentage of TOC",
    "repaymentPercentageOfRevenueAmount27": "Repayment Percentage Of Revenue",
    "numberofconstructionYearsAmount28": "Number of Construction Years",
    "iRRAmount30": "Internal Rate of Return",
    "annualInterestRateAmount31": "Annual Interest Rate",
    "stateTaxRateAmount32": "State Tax Rate",
    "federalTaxRateAmount33": "Federal Tax Rate",
    "rawmaterialAmount34": "Feedstock Cost",
    "laborAmount35": "Labor Cost",
    "utilityAmount36": "Utility Cost",
    "maintenanceAmount37": "Maintenance Cost",
    "insuranceAmount38": "Insurance Cost",
    "vAmount40": "v40",
    "vAmount41": "v41",
    "vAmount42": "v42",
    "vAmount43": "v43",
    "vAmount44": "v44",
    "vAmount45": "v45",
    "vAmount46": "v46",
    "vAmount47": "v47",
    "vAmount48": "v48",
    "vAmount49": "v49",
    "vAmount50": "v50",
    "vAmount51": "v51",
    "vAmount52": "v52",
    "vAmount53": "v53",
    "vAmount54": "v54",
    "vAmount55": "v55",
    "vAmount56": "v56",
    "vAmount57": "v57",
    "vAmount58": "v58",
    "vAmount59": "v59",
    "rAmount60": "r60",
    "rAmount61": "r61",
    "rAmount62": "r62",
    "rAmount63": "r63",
    "rAmount64": "r64",
    "rAmount65": "r65",
    "rAmount66": "r66",
    "rAmount67": "r67",
    "rAmount68": "r68",
    "rAmount69": "r69",
    "rAmount70": "r70",
    "rAmount71": "r71",
    "rAmount72": "r72",
    "rAmount73": "r73",
    "rAmount74": "r74",
    "rAmount75": "r75",
    "rAmount76": "r76",
    "rAmount77": "r77",
    "rAmount78": "r78",
    "rAmount79": "r79",
}
CALCULATION_SCRIPTS = {
    'calculateForPrice': get_calculation_script,
    'calculateForPrice': get_calculation_script
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
    for subdir in ["Reports", "Cache", "Configuration"]:
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
            plot_dir = os.path.join(sensitivity_dir, mode_cap, plot_type, f"{param_id}_{plot_type}")
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

            # Use the values directly based on the mode
            variation_list = values

            # Save configuration for each variation
            for variation in variation_list:
                # Format the variation string (e.g., "+10.00" or "-5.00")
                var_str = f"{variation:+.2f}"

                # Create path to variation directory
                var_dir = os.path.join(sensitivity_dir, param_id, mode.lower(), var_str)

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
# =====================================
# Parameter Name Extraction Functions
# =====================================

def extract_parameter_display_names(calsen_result):
    """
    Extract parameter display names from CalSen service response.

    Args:
        calsen_result (dict): Response from CalSen service

    Returns:
        dict: Dictionary of parameter IDs to their display names
    """
    sensitivity_logger = logging.getLogger('sensitivity')
    parameter_names = {}

    if not calsen_result or not isinstance(calsen_result, dict):
        sensitivity_logger.warning("Invalid CalSen result format")
        return parameter_names

    # Extract parameter names if available in response
    if 'parameter_names' in calsen_result:
        parameter_names = calsen_result['parameter_names']
        sensitivity_logger.info(f"Extracted {len(parameter_names)} parameter display names from CalSen response")
    else:
        sensitivity_logger.warning("No parameter_names found in CalSen response")

    return parameter_names

def extract_property_mapping():
    """
    Extract property_mapping dictionary from common_utils.py file as a fallback.
    This mapping contains presentable names for sensitivity parameters.

    Returns:
        dict: Dictionary of parameter ID numbers to display names
    """
    common_utils_path = os.path.join(UTILITY_FUNCTIONS_DIR, 'common_utils.py')
    logger.info(f"Looking for property mapping in {common_utils_path}")

    property_mapping = {}
    try:
        # Read the file content
        with open(common_utils_path, 'r') as f:
            content = f.read()

        # Try to find the property_mapping dictionary in the file
        pattern = r'property_mapping\s*=\s*{([^}]*)}'
        match = re.search(pattern, content, re.DOTALL)

        if match:
            mapping_text = match.group(1)
            # Extract key-value pairs
            pairs = re.findall(r"'([^']+)':\s*'([^']+)'", mapping_text)
            for key, value in pairs:
                property_mapping[key] = value
            logger.info(f"Successfully extracted property mapping with {len(property_mapping)} entries")
        else:
            logger.warning("Could not find property_mapping in common_utils.py")

    except Exception as e:
        logger.error(f"Error extracting property mapping: {str(e)}")

    return property_mapping
def build_plot_labels(parameter_names, sensitivity_data):
    """
    Build x and y tick labels for sensitivity plots using parameter display names.

    Args:
        parameter_names (dict): Dictionary of parameter IDs to display names
        sensitivity_data (dict): Sensitivity data from get_sensitivity_data

    Returns:
        dict: Dictionary with x and y tick labels for plotting
    """
    sensitivity_logger = logging.getLogger('sensitivity')

    try:
        plot_labels = {
            "x_ticks": {},
            "y_ticks": {},
            "title": "",
            "x_axis_label": "",
            "y_axis_label": ""
        }

        # Extract parameter and comparison information
        param_id = sensitivity_data.get('parameter', '')
        compare_to_key = sensitivity_data.get('compareToKey', '')

        # Get parameter display names if available
        param_display_name = None
        compare_display_name = None

        if parameter_names and param_id in parameter_names:
            param_display_name = parameter_names[param_id].get('base_name', param_id)
        else:
            param_display_name = f"Parameter {param_id}"

        if parameter_names and compare_to_key in parameter_names:
            compare_display_name = parameter_names[compare_to_key].get('base_name', compare_to_key)
        else:
            compare_display_name = f"Parameter {compare_to_key}"

        # Build axis labels
        plot_labels["x_axis_label"] = f"{param_display_name} Value"
        plot_labels["y_axis_label"] = f"{compare_display_name} Value"
        plot_labels["title"] = f"{param_display_name} vs {compare_display_name}"

        # Build x tick labels from variations
        if 'variations' in sensitivity_data:
            for var_key, var_data in sensitivity_data['variations'].items():
                # Get display name if available
                if isinstance(var_data, dict) and 'display_name' in var_data:
                    tick_label = var_data['display_name']
                elif parameter_names and param_id in parameter_names:
                    var_str = var_key if isinstance(var_key, str) else f"{var_key:+.2f}"
                    if 'variations' in parameter_names[param_id] and var_str in parameter_names[param_id]['variations']:
                        tick_label = parameter_names[param_id]['variations'][var_str]
                    else:
                        tick_label = f"{param_display_name} ({var_str})"
                else:
                    tick_label = f"{var_key}"

                # Extract the numeric value for x position
                if isinstance(var_data, dict) and 'modified_value' in var_data:
                    x_pos = var_data['modified_value']
                else:
                    try:
                        x_pos = float(var_key) if '.' in var_key else int(var_key)
                    except (ValueError, TypeError):
                        x_pos = var_key

                plot_labels["x_ticks"][str(x_pos)] = tick_label

        # Add baseline label
        if 'baseline' in sensitivity_data:
            baseline_value = sensitivity_data.get('baseline_value')
            if baseline_value is not None:
                plot_labels["x_ticks"][str(baseline_value)] = f"Baseline ({baseline_value})"

        sensitivity_logger.info(f"Built plot labels with {len(plot_labels['x_ticks'])} x-tick labels")
        return plot_labels

    except Exception as e:
        sensitivity_logger.error(f"Error building plot labels: {str(e)}")
        return {
            "x_ticks": {},
            "y_ticks": {},
            "title": f"{param_id} vs {compare_to_key}",
            "x_axis_label": f"{param_id} Value",
            "y_axis_label": f"{compare_to_key} Value"
        }
def get_parameter_display_names(version):
    """
    Get parameter display names from CalSen service or fall back to local property mapping.
    Also builds axis labels for plotting.

    Args:
        version (int): Version number

    Returns:
        dict: Dictionary of parameter IDs to display names with plot labels
    """
    sensitivity_logger = logging.getLogger('sensitivity')

    parameter_names = {}

    # Try to get parameter names from CalSen service
    try:
        sensitivity_logger.info("Retrieving parameter display names from CalSen service...")
        response = requests.post(
            "http://localhost:2750/list_parameters",
            json={"version": version},
            timeout=3
        )

        if response.status_code == 200:
            calsen_data = response.json()
            if 'parameter_names' in calsen_data:
                parameter_names = calsen_data['parameter_names']
                sensitivity_logger.info(f"Retrieved {len(parameter_names)} parameter display names from CalSen")
            else:
                sensitivity_logger.warning("No parameter_names found in CalSen response")
        else:
            sensitivity_logger.warning(f"CalSen service returned error: {response.status_code}")
    except Exception as e:
        sensitivity_logger.warning(f"Error retrieving parameter names from CalSen: {str(e)}")

    # If no parameter names retrieved, fall back to cached file
    if not parameter_names:
        try:
            sensitivity_logger.info("Looking for cached parameter names...")
            base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
            sensitivity_dir = os.path.join(
                base_dir,
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity'
            )
            reports_dir = os.path.join(sensitivity_dir, "Reports")
            calsen_paths_file = os.path.join(reports_dir, "calsen_paths.json")

            if os.path.exists(calsen_paths_file):
                with open(calsen_paths_file, 'r') as f:
                    calsen_data = json.load(f)
                    if 'parameter_names' in calsen_data:
                        parameter_names = calsen_data['parameter_names']
                        sensitivity_logger.info(f"Found {len(parameter_names)} cached parameter display names")
        except Exception as e:
            sensitivity_logger.warning(f"Error reading cached parameter names: {str(e)}")

    # If still no parameter names, fall back to property_mapping
    if not parameter_names:
        sensitivity_logger.info("Falling back to property_mapping extraction...")
        # Now that property_mapping is relocated to this module, use it directly

        # Convert property_mapping to parameter_names format
        for param_num, display_name in property_mapping.items():
            if isinstance(param_num, str) and param_num.isdigit():
                param_id = f"S{param_num}"
                parameter_names[param_id] = {
                    "display_name": display_name,
                    "base_name": display_name,
                    "variations": {}
                }

        sensitivity_logger.info(f"Created {len(parameter_names)} parameter names from property_mapping")

    # Add plot labels to each parameter
    plot_labels = {}

    # Process each parameter to create plot labels
    for param_id, param_info in parameter_names.items():
        # Extract base name
        base_name = param_info.get('base_name', param_id)

        # Generate x-axis label and title formats
        x_axis_label = f"{base_name} Value"

        # For each potential comparison parameter
        for compare_id, compare_info in parameter_names.items():
            compare_name = compare_info.get('base_name', compare_id)

            # Create combined key
            combined_key = f"{param_id},{compare_id}"

            # Generate labels for this pairing
            plot_labels[combined_key] = {
                "x_axis_label": x_axis_label,
                "y_axis_label": f"{compare_name} Value",
                "title": f"{base_name} vs {compare_name}",
                "x_ticks": {},
                "y_ticks": {}
            }

            # Add tick labels from variations if available
            if 'variations' in param_info:
                for var_str, var_display in param_info['variations'].items():
                    try:
                        # Extract the numeric value from var_str
                        if var_str.startswith('+') or var_str.startswith('-'):
                            # It's a formatted variation string like "+10.00"
                            x_pos = float(var_str)
                        else:
                            # Try to convert to numeric
                            x_pos = float(var_str) if '.' in var_str else int(var_str)

                        # Add as x-tick
                        plot_labels[combined_key]["x_ticks"][str(x_pos)] = var_display
                    except (ValueError, TypeError):
                        # Skip if we can't convert to numeric
                        continue

    sensitivity_logger.info(f"Added plot labels for {len(plot_labels)} parameter combinations")

    # Add plot labels to the parameter_names response
    result = {
        "parameter_names": parameter_names,
        "plot_labels": plot_labels
    }

    # Save the result to the calsen_paths.json file if possible
    try:
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        sensitivity_dir = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity'
        )
        reports_dir = os.path.join(sensitivity_dir, "Reports")
        calsen_paths_file = os.path.join(reports_dir, "calsen_paths.json")

        # If the file exists, read it, update it, and write it back
        if os.path.exists(calsen_paths_file):
            with open(calsen_paths_file, 'r') as f:
                calsen_data = json.load(f)

            # Update with our new data
            calsen_data['parameter_names'] = parameter_names
            calsen_data['plot_labels'] = plot_labels

            # Write back
            with open(calsen_paths_file, 'w') as f:
                json.dump(calsen_data, f, indent=2)

            sensitivity_logger.info(f"Updated {calsen_paths_file} with parameter names and plot labels")
    except Exception as e:
        sensitivity_logger.warning(f"Error updating calsen_paths.json: {str(e)}")

    return result
def get_sensitivity_data(version, param_id, mode, compare_to_key):
    """
    Retrieve sensitivity analysis data for visualization.

    Args:
        version (int): Version number
        param_id (str): Parameter ID
        mode (str): Sensitivity mode (percentage, directvalue, absolutedeparture, montecarlo)
        compare_to_key (str): Comparison parameter

    Returns:
        dict: Sensitivity data including variations and values
    """
    # Map mode to directory name
    mode_dir_mapping = {
        'percentage': 'Percentage',
        'directvalue': 'DirectValue',
        'absolutedeparture': 'AbsoluteDeparture',
        'montecarlo': 'MonteCarlo'
    }
    mode_dir = mode_dir_mapping.get(mode.lower(), 'Percentage')

    # Build path to results file
    base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
    results_path = os.path.join(
        base_dir,
        f'Batch({version})',
        f'Results({version})',
        'Sensitivity',
        mode_dir,
        f"{param_id}_vs_{compare_to_key}_{mode.lower()}_results.json"
    )

    # Check if results file exists
    if not os.path.exists(results_path):
        logger.warning(f"Results file not found: {results_path}")
        return None

    # Load results data
    try:
        with open(results_path, 'r') as f:
            results_data = json.load(f)
        return results_data
    except Exception as e:
        logger.error(f"Error loading results data: {str(e)}")
        return None
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
            'calculationOption': data.get('selectedCalculationOption', 'calculateForPrice'),
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
                timeout=300
            )

            # After receiving response from CalSen
            if cal_sen_response.status_code == 200:
                calsen_result = cal_sen_response.json()
                sensitivity_logger.info(f"CalSen paths prepared: {len(calsen_result.get('path_sets', {}))} configurations")

                # Process parameter names for axis labels if not already in response
                if 'parameter_names' not in calsen_result and 'path_sets' in calsen_result:
                    parameter_names = {}
                    # For each enabled parameter in path_sets
                    for param_id, path_set in calsen_result.get('path_sets', {}).items():
                        # Extract numeric part (e.g., '13' from 'S13')
                        if param_id.startswith('S') and param_id[1:].isdigit():
                            param_num = param_id[1:]

                            # Get display name from property_mapping
                            display_name = property_mapping.get(param_num, f"Parameter {param_num}")

                            # Get variations for this parameter
                            variations = path_set.get('variations', {})
                            variation_values = []
                            variation_display_names = {}

                            # Process each variation
                            for var_key, var_data in variations.items():
                                variation = var_data.get('variation')
                                var_str = var_data.get('variation_str', f"{variation:+.2f}")
                                variation_values.append(var_str)

                                # Create display name with variation
                                variation_display_names[var_str] = f"{display_name} ({var_str})"

                            # Create full display name with all variations
                            full_display_name = f"{display_name} ({', '.join(variation_values)})"

                            # Add to parameter_names dictionary
                            parameter_names[param_id] = {
                                "display_name": full_display_name,
                                "base_name": display_name,
                                "variations": variation_display_names
                            }

                    # Add parameter_names to calsen_result
                    calsen_result['parameter_names'] = parameter_names
                    sensitivity_logger.info(f"Added {len(parameter_names)} parameter display names for axis labels")

                # Save path sets for later use
                calsen_paths_file = os.path.join(config_dir, "calsen_paths.json")
                with open(calsen_paths_file, 'w') as f:
                    json.dump(calsen_result, f, indent=2)
                sensitivity_logger.info(f"Saved CalSen path configuration to {calsen_paths_file}")
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
                'calsenResult': calsen_result is not None,
                'hasParameterNames': calsen_result is not None and 'parameter_names' in calsen_result
            }, f, indent=2)

        # Save configuration data for later use
        with open(SENSITIVITY_CONFIG_DATA_PATH, 'wb') as f:
            pickle.dump(config, f)

        sensitivity_logger.info(f"\nSensitivity configuration completed successfully")
        sensitivity_logger.info(f"Configuration files saved: {len(saved_files)}")
        sensitivity_logger.info(f"Configuration status saved to: {SENSITIVITY_CONFIG_STATUS_PATH}")
        sensitivity_logger.info(f"{'='*80}\n")

        # Prepare response with parameter names if available
        response_data = {
            "status": "success",
            "message": "Sensitivity configurations generated and saved successfully",
            "runId": run_id,
            "configDir": config_dir,
            "sensitivityDir": sensitivity_dir,
            "savedFiles": len(saved_files),
            "configCopy": copy_service_result,
            "calsen": calsen_result is not None,
            "nextStep": "Visit /runs to execute sensitivity calculations"
        }

        # Add parameter names to response if available
        if calsen_result and 'parameter_names' in calsen_result:
            response_data['parameter_names'] = calsen_result['parameter_names']
            sensitivity_logger.info(f"Added {len(calsen_result['parameter_names'])} parameter display names to response")

        return jsonify(response_data)

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
                'calculationOption': data.get('selectedCalculationOption', 'calculateForPrice'),
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

                mode = param_config.get('mode', 'percentage')
                values = param_config.get('values', [])

                # Use the values directly based on mode
                variation_list = values

                # Check if configuration files exist for each variation
                for variation in variation_list:
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

            # Note: Actual sensitivity calculations will be performed separately by the /calculate-sensitivity endpoint
            sensitivity_logger.info("Initial run completed. For detailed parameter calculations, use the /calculate-sensitivity endpoint.")

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
            'calculationOption': data.get('selectedCalculationOption', 'calculateForPrice'),
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

@app.route('/calculate-sensitivity', methods=['POST'])
def calculate_sensitivity():
    """
    Execute specific sensitivity calculations using CFA-b.py with paths from CalSen service.
    This endpoint runs after the general sensitivity configurations and runs have completed.
    It leverages the CalSen service for path resolution to ensure consistent file locations.
    """
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        # Check if sensitivity configurations have been generated
        is_configured, saved_config = check_sensitivity_config_status()

        if not is_configured:
            sensitivity_logger.warning("Sensitivity configurations have not been generated yet")
            return jsonify({
                "error": "Sensitivity configurations must be generated first",
                "message": "Please complete the /sensitivity/configure and /runs endpoints before calculating specific sensitivities",
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
                'calculationOption': data.get('selectedCalculationOption', 'calculateForPrice'),
                'targetRow': int(data.get('targetRow', 20)),
                'SenParameters': data.get('SenParameters', {})
            }
            sensitivity_logger.info("Using request data for configuration")
        else:
            return jsonify({"error": "No configuration data available"}), 400

        # Get version and base paths
        version = config['versions'][0]
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')

        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Parameter-Specific Sensitivity Calculations - Run ID: {run_id}")
        sensitivity_logger.info(f"{'='*80}")
        sensitivity_logger.info(f"Version: {version}")
        sensitivity_logger.info(f"Calculation Mode: {config['calculationOption']}")
        sensitivity_logger.info(f"Target Row: {config['targetRow']}")

        # Get CFA-b.py script path
        cfa_b_script = get_sensitivity_calculation_script()
        sensitivity_logger.info(f"Using calculation script: {os.path.basename(cfa_b_script)}")

        # Process enabled sensitivity parameters
        enabled_params = [(param_id, param_config) for param_id, param_config
                          in config['SenParameters'].items() if param_config.get('enabled')]

        if not enabled_params:
            sensitivity_logger.warning("No enabled sensitivity parameters found")
            return jsonify({
                "status": "warning",
                "message": "No enabled sensitivity parameters found for calculation",
                "runId": run_id
            })

        sensitivity_logger.info(f"Processing {len(enabled_params)} enabled parameters")

        # Results collection
        calculation_results = {}
        overall_success = True

        # Mode mapping for standardized directory names
        mode_dir_mapping = {
            'percentage': 'Percentage',
            'directvalue': 'DirectValue',
            'absolutedeparture': 'AbsoluteDeparture',
            'montecarlo': 'MonteCarlo'
        }

        # Process each parameter
        for param_id, param_config in enabled_params:
            mode = param_config.get('mode', 'percentage')
            values = param_config.get('values', [])
            compare_to_key = param_config.get('compareToKey', 'S13')

            if not values:
                sensitivity_logger.warning(f"No values specified for {param_id}, skipping")
                continue

            # Determine variations based on mode
            variations = []
            for value in values:
                if value is not None:
                    try:
                        variations.append(float(value))
                    except (ValueError, TypeError):
                        sensitivity_logger.warning(f"Invalid variation value in {param_id}: {value}")

            if not variations:
                sensitivity_logger.warning(f"No valid variation values for {param_id}, skipping")
                continue

            param_results = {"variations": {}, "success": True}

            # Process each variation
            for variation in variations:
                var_str = f"{variation:+.2f}"
                sensitivity_logger.info(f"Processing {param_id} variation {var_str}")

                try:
                    # Call CFA-b.py with CalSen paths
                    sensitivity_logger.info(f"Executing CFA-b.py for {param_id} variation {var_str}...")

                    # Prepare the environment variables to avoid division by zero errors
                    env = os.environ.copy()
                    env["PYTHONPATH"] = SCRIPT_DIR + os.pathsep + env.get("PYTHONPATH", "")

                    # Log the full command for debugging
                    command = [
                        'python',
                        cfa_b_script,
                        str(version),
                        json.dumps(config['selectedV']),
                        json.dumps(config['selectedF']),
                        str(config['targetRow']),
                        config['calculationOption'],
                        json.dumps({param_id: param_config}),
                        "--param_id", param_id,
                        "--variation", str(variation),
                        "--compare_to_key", compare_to_key,
                        "--mode", mode
                    ]
                    sensitivity_logger.info(f"Command: {' '.join(command)}")

                    result = subprocess.run(
                        command,
                        capture_output=True,
                        text=True,
                        timeout=600,  # 10-minute timeout
                        env=env,
                        cwd=SCRIPT_DIR  # Set working directory to script directory
                    )

                    # Log the output for debugging
                    if result.stdout:
                        sensitivity_logger.info(f"Command stdout: {result.stdout}")
                    if result.stderr:
                        sensitivity_logger.error(f"Command stderr: {result.stderr}")

                    if result.returncode == 0:
                        sensitivity_logger.info(f"Successfully calculated {param_id} variation {var_str}")
                        param_results["variations"][var_str] = {
                            "status": "success",
                            "message": "Calculation completed successfully"
                        }

                        # Try to extract economic summary for this variation
                        try:
                            # Map the mode to the standardized directory name
                            mode_cap = mode_dir_mapping.get(mode.lower(), 'Percentage')

                            # Check both possible locations for the economic summary
                            param_var_dir = os.path.join(
                                sensitivity_dir, param_id, mode.lower(), var_str
                            )
                            econ_summary_file = os.path.join(
                                param_var_dir, f"Economic_Summary({version}).csv"
                            )

                            # If not found, try the mode directory
                            if not os.path.exists(econ_summary_file):
                                econ_summary_file = os.path.join(
                                    sensitivity_dir, mode_cap, "Configuration",
                                    f"{param_id}_{var_str}", f"Economic_Summary({version}).csv"
                                )

                            if os.path.exists(econ_summary_file):
                                # Read economic summary and extract relevant information
                                econ_df = pd.read_csv(econ_summary_file)
                                sensitivity_logger.info(f"Found economic summary at {econ_summary_file}")

                                # Extract average selling price and NPV
                                price_row = econ_df[econ_df['Metric'] == 'Average Selling Price (Project Life Cycle)']
                                npv_row = econ_df[econ_df['Metric'] == 'Cumulative NPV']

                                if not price_row.empty and not npv_row.empty:
                                    # Extract values (removing $ and commas)
                                    price_str = price_row.iloc[0]['Value'].replace('$', '').replace(',', '')
                                    npv_str = npv_row.iloc[0]['Value'].replace('$', '').replace(',', '')

                                    try:
                                        price = float(price_str)
                                        npv = float(npv_str)

                                        param_results["variations"][var_str]["price"] = price
                                        param_results["variations"][var_str]["npv"] = npv
                                        sensitivity_logger.info(f"Extracted price: ${price:,.2f}, NPV: ${npv:,.2f}")
                                    except ValueError as ve:
                                        sensitivity_logger.warning(f"Could not parse price or NPV values: {ve}")
                            else:
                                sensitivity_logger.warning(f"Economic summary not found at: {econ_summary_file}")
                                sensitivity_logger.info(f"Checked locations: {param_var_dir} and {sensitivity_dir}/{mode_cap}/Configuration/{param_id}_{var_str}")

                        except Exception as e:
                            sensitivity_logger.error(f"Error extracting economic summary: {str(e)}")

                    else:
                        error_msg = f"Calculation failed for {param_id} variation {var_str}: {result.stderr}"
                        sensitivity_logger.error(error_msg)
                        param_results["variations"][var_str] = {
                            "status": "error",
                            "message": error_msg
                        }
                        param_results["success"] = False
                        overall_success = False

                except subprocess.TimeoutExpired:
                    error_msg = f"Calculation timed out for {param_id} variation {var_str}"
                    sensitivity_logger.error(error_msg)
                    param_results["variations"][var_str] = {
                        "status": "error",
                        "message": error_msg
                    }
                    param_results["success"] = False
                    overall_success = False

                except Exception as e:
                    error_msg = f"Error processing {param_id} variation {var_str}: {str(e)}"
                    sensitivity_logger.error(error_msg)
                    param_results["variations"][var_str] = {
                        "status": "error",
                        "message": error_msg
                    }
                    param_results["success"] = False
                    overall_success = False

            # Add results for this parameter
            calculation_results[param_id] = param_results

        # Log summary and return results
        sensitivity_logger.info("\nSensitivity Calculation Summary:")
        for param_id, result in calculation_results.items():
            success_count = sum(1 for var in result["variations"].values() if var.get("status") == "success")
            total_count = len(result["variations"])
            sensitivity_logger.info(f"{param_id}: {success_count}/{total_count} variations successful")

        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Run completed - ID: {run_id}")
        sensitivity_logger.info(f"Overall success: {overall_success}")
        sensitivity_logger.info(f"{'='*80}\n")

        # Return results
        return jsonify({
            "status": "success" if overall_success else "partial",
            "message": "Sensitivity calculations completed" + (" with some errors" if not overall_success else ""),
            "runId": run_id,
            "results": calculation_results
        })

    except Exception as e:
        error_msg = f"Error during sensitivity calculations: {str(e)}"
        sensitivity_logger.error(error_msg)
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

@app.route('/api/sensitivity/visualize', methods=['POST'])
def sensitivity_visualize():
    """
    Generate visualization data for sensitivity analysis.

    Expected JSON payload:
    {
        "version": 1,
        "param_id": "S10",
        "mode": "percentage",
        "compareToKey": "S13",
        "plotTypes": ["waterfall", "bar", "point"]
    }
    """
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Sensitivity Visualization Request - Run ID: {run_id}")
        sensitivity_logger.info(f"{'='*80}")

        data = request.json
        if not data:
            sensitivity_logger.error("No data provided in request")
            return jsonify({"error": "No data provided"}), 400

        # Extract parameters
        version = data.get('version', 1)
        param_id = data.get('param_id')
        mode = data.get('mode', 'percentage')
        compare_to_key = data.get('compareToKey', 'S13')
        plot_types = data.get('plotTypes', ['waterfall', 'bar', 'point'])

        sensitivity_logger.info(f"Visualization request for:")
        sensitivity_logger.info(f"Version: {version}")
        sensitivity_logger.info(f"Parameter: {param_id}")
        sensitivity_logger.info(f"Mode: {mode}")
        sensitivity_logger.info(f"Comparison key: {compare_to_key}")
        sensitivity_logger.info(f"Plot types: {', '.join(plot_types)}")

        if not param_id:
            sensitivity_logger.error("Parameter ID is required but not provided")
            return jsonify({"error": "Parameter ID is required"}), 400

        # Get sensitivity data
        sensitivity_logger.info(f"Retrieving sensitivity data for {param_id}...")
        sensitivity_data = get_sensitivity_data(version, param_id, mode, compare_to_key)
        if not sensitivity_data:
            error_msg = f"No data available for {param_id} in {mode} mode"
            sensitivity_logger.error(error_msg)
            return jsonify({
                "error": "Sensitivity data not found",
                "message": error_msg
            }), 404

        sensitivity_logger.info("Successfully retrieved sensitivity data")

        # Check if plots exist or need to be generated
        plots_info = {}
        mode_dir_mapping = {
            'percentage': 'Percentage',
            'directvalue': 'DirectValue',
            'absolutedeparture': 'AbsoluteDeparture',
            'montecarlo': 'MonteCarlo'
        }
        mode_dir = mode_dir_mapping.get(mode.lower(), 'Percentage')

        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        sensitivity_dir = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity',
            mode_dir
        )

        sensitivity_logger.info(f"Checking for plots in directory: {sensitivity_dir}")

        for plot_type in plot_types:
            plot_name = f"{plot_type}_{param_id}_{compare_to_key}_primary.png"
            plot_path = os.path.join(sensitivity_dir, plot_type, plot_name)

            if os.path.exists(plot_path):
                sensitivity_logger.info(f"Found existing {plot_type} plot at: {plot_path}")
                plots_info[plot_type] = {
                    "status": "available",
                    "path": os.path.relpath(plot_path, base_dir)
                }
            else:
                sensitivity_logger.info(f"Need to generate {plot_type} plot...")
                try:
                    # Import plot generation function
                    from sensitivity_Routes import generate_plot_from_results

                    # Get path to results file
                    results_path = os.path.join(
                        sensitivity_dir,
                        f"{param_id}_vs_{compare_to_key}_{mode.lower()}_results.json"
                    )

                    sensitivity_logger.info(f"Generating {plot_type} plot from results at: {results_path}")

                    # Generate plot
                    success = generate_plot_from_results(
                        version=version,
                        param_id=param_id,
                        compare_to_key=compare_to_key,
                        plot_type=plot_type,
                        mode=mode,
                        result_path=results_path
                    )

                    if success and os.path.exists(plot_path):
                        sensitivity_logger.info(f"Successfully generated {plot_type} plot at: {plot_path}")
                        plots_info[plot_type] = {
                            "status": "generated",
                            "path": os.path.relpath(plot_path, base_dir)
                        }
                    else:
                        error_msg = f"Failed to generate {plot_type} plot"
                        sensitivity_logger.error(error_msg)
                        plots_info[plot_type] = {
                            "status": "error",
                            "error": error_msg
                        }
                except Exception as e:
                    error_msg = f"Error generating {plot_type} plot: {str(e)}"
                    sensitivity_logger.error(error_msg)
                    plots_info[plot_type] = {
                        "status": "error",
                        "error": error_msg
                    }

        # Prepare visualization data
        visualization_data = {
            "parameter": param_id,
            "compareToKey": compare_to_key,
            "mode": mode,
            "data": sensitivity_data,
            "plots": plots_info
        }

        sensitivity_logger.info(f"Visualization request completed successfully for run ID: {run_id}")
        sensitivity_logger.info(f"{'='*80}\n")

        return jsonify(visualization_data)

    except Exception as e:
        error_msg = f"Error in visualization endpoint: {str(e)}"
        sensitivity_logger.error(error_msg)
        sensitivity_logger.info(f"{'='*80}\n")
        return jsonify({
            "error": f"Error generating visualization: {str(e)}"
        }), 500

@app.route('/api/sensitivity/parameters', methods=['GET'])
def get_sensitivity_parameters():
    """Get all available sensitivity parameters for visualization."""
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Get Sensitivity Parameters Request - Run ID: {run_id}")
        sensitivity_logger.info(f"{'='*80}")

        version = request.args.get('version', '1')
        sensitivity_logger.info(f"Requested parameters for version: {version}")

        # Try to get parameters from CalSen service first
        try:
            sensitivity_logger.info("Attempting to get parameters from CalSen service...")
            response = requests.post(
                "http://localhost:2750/list_parameters",
                json={"version": int(version)},
                timeout=5
            )

            if response.status_code == 200:
                sensitivity_logger.info("Successfully retrieved parameters from CalSen service")
                sensitivity_logger.info(f"{'='*80}\n")
                return jsonify(response.json())
        except Exception as e:
            sensitivity_logger.warning(f"CalSen service not available: {str(e)}")
            # Continue with fallback

        # Fallback: scan directories
        sensitivity_logger.info("Falling back to directory scanning method")
        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
        sensitivity_dir = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity'
        )

        if not os.path.exists(sensitivity_dir):
            error_msg = f"No sensitivity data found for version {version}"
            sensitivity_logger.error(error_msg)
            sensitivity_logger.info(f"{'='*80}\n")
            return jsonify({
                "status": "error",
                "message": error_msg
            }), 404

        # Look for parameter directories (starting with S)
        parameters = []
        sensitivity_logger.info(f"Scanning directory for parameters: {sensitivity_dir}")

        for item in os.listdir(sensitivity_dir):
            item_path = os.path.join(sensitivity_dir, item)

            if os.path.isdir(item_path) and item.startswith('S'):
                param_id = item

                # Find mode directories inside parameter directory
                modes = []
                for subdir in os.listdir(item_path):
                    subdir_path = os.path.join(item_path, subdir)
                    if os.path.isdir(subdir_path):
                        modes.append(subdir)

                # Add parameter info
                parameters.append({
                    "id": param_id,
                    "modes": modes
                })
                sensitivity_logger.info(f"Found parameter: {param_id} with modes: {', '.join(modes)}")

        sensitivity_logger.info(f"Found {len(parameters)} parameters total")
        sensitivity_logger.info(f"{'='*80}\n")

        return jsonify({
            "status": "success",
            "version": version,
            "parameters": parameters,
            "source": "directory"
        })

    except Exception as e:
        error_msg = f"Error retrieving sensitivity parameters: {str(e)}"
        sensitivity_logger.error(error_msg)
        sensitivity_logger.info(f"{'='*80}\n")
        return jsonify({
            "error": f"Error retrieving sensitivity parameters: {str(e)}"
        }), 500

@app.route('/run-all-sensitivity', methods=['POST'])
def run_all_sensitivity():
    """
    Unified wrapper to execute all sensitivity_Routes endpoints sequentially.
    Meant to replicate frontend's full analysis process with a single call.
    """
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "Missing input payload"}), 400

        headers = {'Content-Type': 'application/json'}
        version = payload.get('selectedVersions', [1])[0]
        base_url = 'http://127.0.0.1:2500'

        enabled_params = payload.get('enabledParams', [])

        def post(path, body=None):
            r = requests.post(f"{base_url}{path}", headers=headers, json=body or payload)
            return r.status_code, r.json() if r.ok else {"error": r.text}

        def get(path):
            r = requests.get(f"{base_url}{path}", headers=headers)
            return r.status_code, r.json() if r.ok else {"error": r.text}

        result = {}

        result['summary'] = get(f"//sensitivity/plots/<mode>/<plot_type>")
        result['summary'] = get(f"/sensitivity/percentage")
        result['summary'] = get(f"/sensitivity/analysis")

        # 5. /sensitivity/analysis for each param
        result['analysis'] = []
        for param in enabled_params:
            param_payload = {
                "param_id": param['paramId'],
                "mode": param['mode'],
                "values": param['values'],
                "compareToKey": param.get('compareToKey', 'S13'),
                "version": version,
                "waterfall": True,
                "bar": True,
                "point": True
            }
            result['analysis'].append({
                "param_id": param['paramId'],
                "result": post('/sensitivity/analysis', param_payload)
            })

        # 6. /api/sensitivity/parameters
        result['parameters'] = get(f"/api/sensitivity/parameters?version={version}")

        # 7. /generate-report
        result['report'] = post('/generate-report', {"version": version})

        # 8. /api/sensitivity-summary/<version>
        result['summary'] = get(f"/api/sensitivity-summary/{version}")

        # 9. /api/sensitivity/visualize for first parameter (if available)
        if result['parameters'][0] == 200 and result['parameters'][1]:
            first_param = result['parameters'][1][0]
            viz_payload = {
                "version": version,
                "param_id": first_param['id'],
                "mode": first_param['modes'][0] if first_param['modes'] else 'percentage',
                "compareToKey": first_param.get('compareToKey', 'S13'),
                "plotTypes": ['waterfall', 'bar', 'point']
            }
            result['visualize'] = post('/api/sensitivity/visualize', viz_payload)

        # 10. /runs route
        result['runs'] = post('/runs', payload)

        return jsonify({
            "status": "success",
            "message": "All sensitivity routes triggered via unified endpoint.",
            "results": result
        })

    except Exception as e:
        return jsonify({
            "error": f"Error executing unified sensitivity runner: {str(e)}"
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=2500)
