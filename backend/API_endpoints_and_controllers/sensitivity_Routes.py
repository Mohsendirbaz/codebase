"""
Sensitivity Routes Module
Provides Flask endpoints for sensitivity analysis visualization and interaction.
Compatible with CalSen service and updated calculation approach.
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
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
from matplotlib.ticker import MaxNLocator

# Base directories setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_DIR = os.path.join(BASE_DIR, 'backend')
LOGS_DIR = os.path.join(SCRIPT_DIR, 'Logs')
ORIGINAL_BASE_DIR = os.path.join(BASE_DIR, 'backend', 'Original')

# Create logs directory if it doesn't exist
os.makedirs(LOGS_DIR, exist_ok=True)

# Log file path
SENSITIVITY_ROUTES_LOG_PATH = os.path.join(LOGS_DIR, "SENSITIVITY_ROUTES.log")

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(SENSITIVITY_ROUTES_LOG_PATH),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('sensitivity_routes')
logger.info("Sensitivity Routes module initializing")

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# =====================================
# Helper Functions
# =====================================

def get_sensitivity_dir(version):
    """Get the sensitivity directory path for a given version"""
    return os.path.join(ORIGINAL_BASE_DIR, f"Batch({version})", f"Results({version})", "Sensitivity")

def get_parameter_variations(version, param_id):
    """
    Get all variations for a specific parameter.
    
    Args:
        version (str): Version number
        param_id (str): Parameter ID (e.g., "S13")
        
    Returns:
        dict: Dictionary with parameter mode and variations
    """
    sensitivity_dir = get_sensitivity_dir(version)
    param_dir = os.path.join(sensitivity_dir, param_id)

    if not os.path.exists(param_dir):
        logger.warning(f"Parameter directory not found: {param_dir}")
        return None

    # Find mode directories
    mode_dirs = glob.glob(os.path.join(param_dir, "*"))
    if not mode_dirs:
        logger.warning(f"No mode directories found in {param_dir}")
        return None

    # Use the first mode found
    mode_dir = mode_dirs[0]
    mode = os.path.basename(mode_dir)

    # Find variation directories
    var_dirs = glob.glob(os.path.join(mode_dir, "*"))
    if not var_dirs:
        logger.warning(f"No variation directories found in {mode_dir}")
        return None

    # Extract variations
    variations = []
    for var_dir in var_dirs:
        var_str = os.path.basename(var_dir)
        try:
            if var_str.startswith('+') or var_str.startswith('-'):
                var_val = float(var_str)
                variations.append(var_val)
        except ValueError:
            continue

    return {
        "mode": mode,
        "variations": variations
    }

def get_config_file_path(version, param_id, mode, variation):
    """
    Get path to parameter configuration file.
    
    Args:
        version (str): Version number
        param_id (str): Parameter ID (e.g., "S13")
        mode (str): Mode (symmetrical or multipoint)
        variation (float): Variation value
        
    Returns:
        str: Path to configuration file
    """
    sensitivity_dir = get_sensitivity_dir(version)
    var_str = f"{variation:+.2f}"

    # Parameter variation directory
    param_var_dir = os.path.join(sensitivity_dir, param_id, mode.lower(), var_str)

    # Configuration file
    config_file = os.path.join(param_var_dir, f"{param_id}_config.json")

    return config_file if os.path.exists(config_file) else None

def load_parameter_config(version, param_id, mode, variation):
    """
    Load parameter configuration from file.
    
    Args:
        version (str): Version number
        param_id (str): Parameter ID (e.g., "S13")
        mode (str): Mode (symmetrical or multipoint)
        variation (float): Variation value
        
    Returns:
        dict: Parameter configuration
    """
    config_file = get_config_file_path(version, param_id, mode, variation)

    if not config_file:
        logger.warning(f"Configuration file not found for {param_id}, {mode}, {variation}")
        return None

    try:
        with open(config_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading configuration file {config_file}: {str(e)}")
        return None

def find_result_files(version, param_id, compare_to_key, mode):
    """
    Find result files for a parameter comparison.
    
    Args:
        version (str): Version number
        param_id (str): Parameter ID (e.g., "S13")
        compare_to_key (str): Comparison parameter ID
        mode (str): Mode (symmetrical or multipoint)
        
    Returns:
        list: List of result file paths
    """
    sensitivity_dir = get_sensitivity_dir(version)

    # Convert mode to directory name
    mode_dir_name = "Symmetrical" if mode.lower() in ["symmetrical", "percentage"] else "Multipoint"

    # Search pattern
    pattern = os.path.join(
        sensitivity_dir,
        mode_dir_name,
        f"{param_id}_vs_{compare_to_key}_{mode.lower()}_results.json"
    )

    return glob.glob(pattern)

def generate_plot_from_results(version, param_id, compare_to_key, plot_type, mode, result_path, var_str=None):
    """
    Generate a plot from existing result data.
    
    Args:
        version (str): Version number
        param_id (str): Parameter ID (e.g., "S13")
        compare_to_key (str): Comparison parameter ID
        plot_type (str): Plot type (waterfall, bar, point)
        mode (str): Mode (symmetrical or multipoint)
        result_path (str): Path to result data file
        var_str (str, optional): Variation string for specific plots
        
    Returns:
        str: Path to generated plot
    """
    if not os.path.exists(result_path):
        logger.error(f"Result file not found: {result_path}")
        return None

    try:
        # Load result data
        with open(result_path, 'r') as f:
            result_data = json.load(f)

        # Extract data for plotting
        x_values = result_data.get("x_values", [])
        y_values = result_data.get("y_values", [])
        baseline = result_data.get("baseline", 0)

        if not x_values or not y_values:
            logger.error(f"Missing data in result file: {result_path}")
            return None

        # Convert mode for directory path
        mode_dir = 'Symmetrical' if mode.lower() in ['symmetrical', 'percentage'] else 'Multipoint'

        # Create plot path
        plot_file_name = f"{plot_type}_{param_id}_{compare_to_key}"
        if var_str:
            plot_file_name += f"_{var_str}"
        plot_file_name += f"_{result_data.get('comparison_type', 'primary')}.png"

        # Full path to plot file
        sensitivity_dir = get_sensitivity_dir(version)
        plot_path = os.path.join(
            sensitivity_dir,
            mode_dir,
            plot_type,
            plot_file_name
        )

        # Create plot directory if it doesn't exist
        os.makedirs(os.path.dirname(plot_path), exist_ok=True)

        # Generate plot based on type
        plt.figure(figsize=(10, 6), dpi=100)

        if plot_type == 'waterfall':
            # Waterfall plot
            # Implementation depends on your visualization requirements
            pass

        elif plot_type == 'bar':
            # Bar plot
            plt.bar(x_values, y_values)
            plt.axhline(y=baseline, color='r', linestyle='-', label='Baseline')
            plt.title(f"{param_id} vs {compare_to_key} Bar Plot")
            plt.xlabel(param_id)
            plt.ylabel(compare_to_key)
            plt.grid(True, alpha=0.3)
            plt.legend()

        elif plot_type == 'point':
            # Point plot
            plt.plot(x_values, y_values, 'o-')
            plt.axhline(y=baseline, color='r', linestyle='-', label='Baseline')
            plt.title(f"{param_id} vs {compare_to_key} Point Plot")
            plt.xlabel(param_id)
            plt.ylabel(compare_to_key)
            plt.grid(True, alpha=0.3)
            plt.legend()

        # Save the plot
        plt.savefig(plot_path, bbox_inches='tight')
        plt.close()

        logger.info(f"Generated {plot_type} plot at {plot_path}")
        return plot_path

    except Exception as e:
        logger.exception(f"Error generating plot: {str(e)}")
        return None

def run_calculation_script(version, param_id, param_config, mode, variation, compare_to_key):
    """
    Run calculation script for a specific parameter variation.
    
    Args:
        version (str): Version number
        param_id (str): Parameter ID (e.g., "S13")
        param_config (dict): Parameter configuration
        mode (str): Mode (symmetrical or multipoint)
        variation (float): Variation value
        compare_to_key (str): Comparison parameter ID
        
    Returns:
        bool: True if successful, False otherwise
    """
    sensitivity_dir = get_sensitivity_dir(version)
    var_str = f"{variation:+.2f}"

    # Parameter variation directory (lowercase mode)
    param_var_dir = os.path.join(sensitivity_dir, param_id, mode.lower(), var_str)

    # Configuration directory (capitalized mode)
    mode_dir_name = "Symmetrical" if mode.lower() == "symmetrical" else "Multipoint"
    config_dir = os.path.join(sensitivity_dir, mode_dir_name, "Configuration", f"{param_id}_{var_str}")

    # Configuration files
    config_matrix_file = os.path.join(config_dir, f"General_Configuration_Matrix({version}).csv")
    config_file = os.path.join(config_dir, f"configurations({version}).py")

    # Copy matrix file if it doesn't exist
    source_matrix_file = os.path.join(
        ORIGINAL_BASE_DIR, f"Batch({version})", f"Results({version})",
        f"General_Configuration_Matrix({version}).csv"
    )

    if not os.path.exists(config_matrix_file) and os.path.exists(source_matrix_file):
        os.makedirs(os.path.dirname(config_matrix_file), exist_ok=True)
        shutil.copy2(source_matrix_file, config_matrix_file)
        logger.info(f"Copied matrix file to {config_matrix_file}")

    # Copy config file if it doesn't exist
    source_config_file = os.path.join(
        ORIGINAL_BASE_DIR, f"Batch({version})", f"ConfigurationPlotSpec({version})",
        f"configurations({version}).py"
    )

    if not os.path.exists(config_file) and os.path.exists(source_config_file):
        os.makedirs(os.path.dirname(config_file), exist_ok=True)
        shutil.copy2(source_config_file, config_file)
        logger.info(f"Copied config file to {config_file}")

    # Create modified SenParameters dictionary
    modified_sen_parameters = {
        param_id: {
            "enabled": True,
            "mode": mode,
            "values": [variation],
            "compareToKey": compare_to_key,
            "comparisonType": param_config.get('comparisonType', 'primary'),
            "variation": variation,
            "variation_str": var_str
        }
    }

    # Define the CFA scripts to try (in order)
    cfa_scripts = [
        os.path.join(SCRIPT_DIR, "Core_calculation_engines", "CFA-b.py"),
        os.path.join(SCRIPT_DIR, "Core_calculation_engines", "CFA.py")
    ]

    # Environment variables for scripts
    env_vars = {
        **os.environ,
        'CONFIG_MATRIX_FILE': config_matrix_file,
        'CONFIG_FILE': config_file,
        'RESULTS_FOLDER': param_var_dir
    }

    # Try each script in order
    for script_path in cfa_scripts:
        if not os.path.exists(script_path):
            continue

        script_name = os.path.basename(script_path)
        logger.info(f"Running {script_name} for {param_id} variation {var_str}")

        try:
            # Additional arguments for the calculation script
            args = [
                'python',
                script_path,
                str(version),
                '{}',  # Empty selected_v
                '{}',  # Empty selected_f
                '10',  # Default target_row
                'freeFlowNPV',  # Default calculation option
                json.dumps(modified_sen_parameters)
            ]

            # Run the script
            result = subprocess.run(
                args,
                env=env_vars,
                capture_output=True,
                text=True,
                timeout=300  # 5-minute timeout
            )

            if result.returncode == 0:
                logger.info(f"Successfully ran {script_name} for {param_id} variation {var_str}")
                return True
            else:
                logger.error(f"Error running {script_name}: {result.stderr}")
                # Try next script

        except subprocess.TimeoutExpired:
            logger.error(f"Timeout running {script_name} for {param_id} variation {var_str}")
            # Try next script

        except Exception as e:
            logger.error(f"Exception running {script_name}: {str(e)}")
            # Try next script

    # All scripts failed
    logger.error(f"All calculation scripts failed for {param_id} variation {var_str}")
    return False

def process_sensitivity_results(version, param_id, compare_to_key, mode):
    """
    Process sensitivity results for a parameter and generate comparison data.
    
    Args:
        version (str): Version number
        param_id (str): Parameter ID (e.g., "S13")
        compare_to_key (str): Comparison parameter ID
        mode (str): Mode (symmetrical or multipoint)
        
    Returns:
        dict: Processed results
    """
    sensitivity_dir = get_sensitivity_dir(version)

    # Get parameter variations
    param_info = get_parameter_variations(version, param_id)
    if not param_info:
        logger.error(f"Could not find parameter variations for {param_id}")
        return None

    variations = param_info["variations"]
    if not variations:
        logger.error(f"No variations found for {param_id}")
        return None

    # Process each variation
    x_values = []
    y_values = []
    baseline = None

    for variation in variations:
        var_str = f"{variation:+.2f}"
        logger.info(f"Processing variation {var_str} for {param_id}")

        # Load parameter configuration
        param_config = load_parameter_config(version, param_id, param_info["mode"], variation)
        if not param_config:
            logger.warning(f"Could not load configuration for {param_id} variation {var_str}")
            continue

        # Process this variation if needed
        param_var_dir = os.path.join(sensitivity_dir, param_id, param_info["mode"].lower(), var_str)
        result_file = os.path.join(param_var_dir, "Economic_Summary(1).csv")

        if not os.path.exists(result_file):
            logger.warning(f"Result file not found: {result_file}, running calculation")

            # Run calculation for this variation
            success = run_calculation_script(
                version, param_id, param_config, param_info["mode"], variation, compare_to_key
            )

            if not success or not os.path.exists(result_file):
                logger.error(f"Failed to generate result file for {param_id} variation {var_str}")
                continue

        # Extract result data from Economic_Summary CSV
        try:
            economic_data = pd.read_csv(result_file)

            # Find the row with the price data
            price_row = economic_data[economic_data['Metric'].str.contains('Average Selling Price')]
            if price_row.empty:
                logger.warning(f"No price data found in {result_file}")
                continue

            # Extract price value
            price_str = price_row['Value'].iloc[0]
            price_value = float(price_str.replace('$', '').replace(',', ''))

            # Collect data points
            x_values.append(variation)
            y_values.append(price_value)

            # If variation is 0, use as baseline
            if variation == 0 or (baseline is None and len(y_values) == 1):
                baseline = price_value

        except Exception as e:
            logger.error(f"Error extracting data from {result_file}: {str(e)}")
            continue

    # Sort data points by x value
    if x_values and y_values:
        sorted_points = sorted(zip(x_values, y_values))
        x_values = [p[0] for p in sorted_points]
        y_values = [p[1] for p in sorted_points]

    # Save results to a JSON file
    result_data = {
        "parameter": param_id,
        "compare_to": compare_to_key,
        "mode": mode,
        "x_values": x_values,
        "y_values": y_values,
        "baseline": baseline,
        "comparison_type": "primary",  # Default to primary
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    # Convert mode for directory path
    mode_dir = 'Symmetrical' if mode.lower() in ['symmetrical', 'percentage'] else 'Multipoint'

    # Save result JSON
    result_file_path = os.path.join(
        sensitivity_dir,
        mode_dir,
        f"{param_id}_vs_{compare_to_key}_{mode.lower()}_results.json"
    )

    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(result_file_path), exist_ok=True)

    with open(result_file_path, 'w') as f:
        json.dump(result_data, f, indent=2)

    logger.info(f"Saved result data to {result_file_path}")

    return result_data

def get_calsen_paths(version, param_id=None):
    """
    Get paths from CalSen service.
    
    Args:
        version (str): Version number
        param_id (str, optional): Parameter ID (e.g., "S13")
        
    Returns:
        dict: Path sets from CalSen service
    """
    try:
        response = requests.post(
            "http://localhost:2750/get_config_paths",
            json={"version": version},
            timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            path_sets = result.get("path_sets", {})

            if param_id:
                return path_sets.get(param_id)
            return path_sets

        logger.warning(f"CalSen service returned non-200 status: {response.status_code}")
        return None

    except requests.exceptions.RequestException:
        logger.warning("CalSen service not available")
        return None

# =====================================
# API Endpoints
# =====================================

@app.route('/sensitivity/parameters', methods=['GET'])
def get_parameters():
    """Get all sensitivity parameters for a version"""
    version = request.args.get('version', '1')

    # Try to get parameters from CalSen service first
    calsen_paths = get_calsen_paths(version)

    if calsen_paths:
        # Convert CalSen paths to parameter list
        parameters = [
            {
                "id": param_id,
                "mode": paths.get("mode"),
                "variations": list(paths.get("variations", {}).keys()),
                "compareToKey": paths.get("compareToKey")
            }
            for param_id, paths in calsen_paths.items()
        ]

        return jsonify({
            "status": "success",
            "version": version,
            "parameters": parameters,
            "source": "calsen"
        })

    # Fallback: scan directories
    sensitivity_dir = get_sensitivity_dir(version)

    if not os.path.exists(sensitivity_dir):
        return jsonify({
            "error": f"Sensitivity directory not found for version {version}"
        }), 404

    # Find parameter directories
    param_dirs = glob.glob(os.path.join(sensitivity_dir, "S*"))

    parameters = []
    for param_dir in param_dirs:
        param_id = os.path.basename(param_dir)

        # Get parameter info
        param_info = get_parameter_variations(version, param_id)
        if param_info:
            var_strs = [f"{v:+.2f}" for v in param_info["variations"]]

            # Load parameter configuration to get compareToKey
            param_config = None
            if param_info["variations"]:
                param_config = load_parameter_config(
                    version, param_id, param_info["mode"], param_info["variations"][0]
                )

            parameters.append({
                "id": param_id,
                "mode": param_info["mode"],
                "variations": var_strs,
                "compareToKey": param_config.get("compareToKey") if param_config else None
            })

    return jsonify({
        "status": "success",
        "version": version,
        "parameters": parameters,
        "source": "directory"
    })

@app.route('/sensitivity/parameter/<param_id>', methods=['GET'])
def get_parameter(param_id):
    """Get details for a specific parameter"""
    version = request.args.get('version', '1')

    # Try to get parameter from CalSen service first
    calsen_paths = get_calsen_paths(version, param_id)

    if calsen_paths:
        variations = calsen_paths.get("variations", {})
        var_data = {}

        for var_str, paths in variations.items():
            var_data[var_str] = {
                "param_var_dir": paths.get("param_var_dir"),
                "config_var_dir": paths.get("config_var_dir"),
                "variation": paths.get("variation")
            }

        return jsonify({
            "status": "success",
            "version": version,
            "parameter": {
                "id": param_id,
                "mode": calsen_paths.get("mode"),
                "compareToKey": calsen_paths.get("compareToKey"),
                "comparisonType": calsen_paths.get("comparisonType"),
                "variations": var_data
            },
            "source": "calsen"
        })

    # Fallback: get parameter info from directories
    param_info = get_parameter_variations(version, param_id)

    if not param_info:
        return jsonify({
            "error": f"Parameter {param_id} not found for version {version}"
        }), 404

    variations = param_info["variations"]
    var_data = {}

    for variation in variations:
        var_str = f"{variation:+.2f}"

        # Load parameter configuration
        param_config = load_parameter_config(version, param_id, param_info["mode"], variation)

        if param_config:
            var_data[var_str] = {
                "variation": variation,
                "config": param_config
            }

    # Find parameter config from first variation
    compare_to_key = None
    comparison_type = None

    if variations and var_data:
        first_var = f"{variations[0]:+.2f}"
        if first_var in var_data and "config" in var_data[first_var]:
            config = var_data[first_var]["config"]
            compare_to_key = config.get("compareToKey") or config.get("config", {}).get("compareToKey")
            comparison_type = config.get("comparisonType") or config.get("config", {}).get("comparisonType")

    return jsonify({
        "status": "success",
        "version": version,
        "parameter": {
            "id": param_id,
            "mode": param_info["mode"],
            "compareToKey": compare_to_key,
            "comparisonType": comparison_type,
            "variations": var_data
        },
        "source": "directory"
    })

@app.route('/sensitivity/results/<param_id>', methods=['GET'])
def get_results(param_id):
    """Get results for a parameter comparison"""
    version = request.args.get('version', '1')
    compare_to_key = request.args.get('compareToKey')
    mode = request.args.get('mode', 'symmetrical')

    # If compareToKey is not provided, try to get it from parameter config
    if not compare_to_key:
        param_info = get_parameter_variations(version, param_id)

        if param_info and param_info["variations"]:
            variation = param_info["variations"][0]
            param_config = load_parameter_config(version, param_id, param_info["mode"], variation)

            if param_config:
                compare_to_key = param_config.get("compareToKey") or param_config.get("config", {}).get("compareToKey")

    if not compare_to_key:
        return jsonify({
            "error": "compareToKey is required"
        }), 400

    # Check if result file exists
    result_files = find_result_files(version, param_id, compare_to_key, mode)

    if result_files:
        # Use existing result file
        with open(result_files[0], 'r') as f:
            result_data = json.load(f)

        return jsonify({
            "status": "success",
            "version": version,
            "parameter": param_id,
            "compareToKey": compare_to_key,
            "mode": mode,
            "results": result_data,
            "resultFile": result_files[0]
        })

    # Process results
    result_data = process_sensitivity_results(version, param_id, compare_to_key, mode)

    if not result_data:
        return jsonify({
            "error": f"Failed to process results for {param_id} vs {compare_to_key}"
        }), 500

    return jsonify({
        "status": "success",
        "version": version,
        "parameter": param_id,
        "compareToKey": compare_to_key,
        "mode": mode,
        "results": result_data,
        "generated": True
    })

@app.route('/sensitivity/plot/<param_id>', methods=['GET'])
def get_plot(param_id):
    """Get or generate a plot for a parameter comparison"""
    version = request.args.get('version', '1')
    compare_to_key = request.args.get('compareToKey')
    plot_type = request.args.get('type', 'point')
    mode = request.args.get('mode', 'symmetrical')
    variation = request.args.get('variation')

    # If compareToKey is not provided, try to get it from parameter config
    if not compare_to_key:
        param_info = get_parameter_variations(version, param_id)

        if param_info and param_info["variations"]:
            var_val = param_info["variations"][0]
            param_config = load_parameter_config(version, param_id, param_info["mode"], var_val)

            if param_config:
                compare_to_key = param_config.get("compareToKey") or param_config.get("config", {}).get("compareToKey")

    if not compare_to_key:
        return jsonify({
            "error": "compareToKey is required"
        }), 400

    # Check if results exist or need to be generated
    result_files = find_result_files(version, param_id, compare_to_key, mode)

    if not result_files:
        # Process results first
        result_data = process_sensitivity_results(version, param_id, compare_to_key, mode)

        if not result_data:
            return jsonify({
                "error": f"Failed to process results for {param_id} vs {compare_to_key}"
            }), 500

        # Add result file to the list
        sensitivity_dir = get_sensitivity_dir(version)
        mode_dir = 'Symmetrical' if mode.lower() in ['symmetrical', 'percentage'] else 'Multipoint'
        result_path = os.path.join(
            sensitivity_dir,
            mode_dir,
            f"{param_id}_vs_{compare_to_key}_{mode.lower()}_results.json"
        )

        result_files = [result_path]

    # Generate plot
    var_str = f"{float(variation):+.2f}" if variation else None
    plot_path = generate_plot_from_results(
        version, param_id, compare_to_key, plot_type, mode, result_files[0], var_str
    )

    if not plot_path:
        return jsonify({
            "error": f"Failed to generate {plot_type} plot for {param_id} vs {compare_to_key}"
        }), 500

    # Return plot file
    if request.args.get('inline', 'false').lower() == 'true':
        # Serve the plot inline as a data URL
        with open(plot_path, 'rb') as f:
            plot_data = f.read()

        response = Response(plot_data, mimetype='image/png')
        return response

    # Return plot file path
    return jsonify({
        "status": "success",
        "version": version,
        "parameter": param_id,
        "compareToKey": compare_to_key,
        "plotType": plot_type,
        "mode": mode,
        "plotPath": plot_path,
        "plotUrl": f"/sensitivity/plot-file?path={plot_path}"
    })

@app.route('/sensitivity/plot-file', methods=['GET'])
def get_plot_file():
    """Serve a plot file"""
    plot_path = request.args.get('path')

    if not plot_path or not os.path.exists(plot_path):
        return jsonify({
            "error": "Plot file not found"
        }), 404

    return send_file(plot_path, mimetype='image/png')

@app.route('/sensitivity/process-all', methods=['POST'])
def process_all_sensitivity():
    """Process all sensitivity parameters for a version"""
    data = request.json
    version = data.get('version', '1')
    wait_time = data.get('waitTime', 0.5)  # Default to 0.5 seconds between calculations

    # Get all parameters
    sensitivity_dir = get_sensitivity_dir(version)

    if not os.path.exists(sensitivity_dir):
        return jsonify({
            "error": f"Sensitivity directory not found for version {version}"
        }), 404

    # Find parameter directories
    param_dirs = glob.glob(os.path.join(sensitivity_dir, "S*"))

    if not param_dirs:
        return jsonify({
            "error": f"No parameter directories found in {sensitivity_dir}"
        }), 404

    # Process each parameter
    results = {}

    for param_dir in param_dirs:
        param_id = os.path.basename(param_dir)
        logger.info(f"Processing parameter {param_id}")

        # Get parameter info
        param_info = get_parameter_variations(version, param_id)
        if not param_info:
            logger.warning(f"Could not get variations for {param_id}")
            results[param_id] = {"status": "error", "message": "Could not get variations"}
            continue

        # Load parameter configuration to get compareToKey
        compare_to_key = None
        if param_info["variations"]:
            param_config = load_parameter_config(
                version, param_id, param_info["mode"], param_info["variations"][0]
            )

            if param_config:
                compare_to_key = param_config.get("compareToKey") or param_config.get("config", {}).get("compareToKey")

        if not compare_to_key:
            logger.warning(f"No compareToKey found for {param_id}")
            results[param_id] = {"status": "error", "message": "No compareToKey found"}
            continue

        # Process results
        result_data = process_sensitivity_results(version, param_id, compare_to_key, param_info["mode"])

        if result_data:
            results[param_id] = {
                "status": "success",
                "compareToKey": compare_to_key,
                "mode": param_info["mode"],
                "points": len(result_data.get("x_values", []))
            }
        else:
            results[param_id] = {
                "status": "error",
                "message": "Failed to process results"
            }

        # Wait before processing next parameter
        time.sleep(float(wait_time))

    return jsonify({
        "status": "success",
        "version": version,
        "results": results,
        "processed": len(results)
    })

@app.route('/sensitivity/run-calculation', methods=['POST'])
def run_calculation():
    """Run calculation for a specific parameter variation"""
    data = request.json
    version = data.get('version', '1')
    param_id = data.get('paramId')
    variation = data.get('variation')
    compare_to_key = data.get('compareToKey')
    mode = data.get('mode', 'symmetrical')

    if not param_id or variation is None or not compare_to_key:
        return jsonify({
            "error": "paramId, variation, and compareToKey are required"
        }), 400

    # Convert variation to float
    try:
        variation = float(variation)
    except ValueError:
        return jsonify({
            "error": f"Invalid variation value: {variation}"
        }), 400

    # Load parameter configuration
    param_config = load_parameter_config(version, param_id, mode, variation)

    if not param_config:
        return jsonify({
            "error": f"Parameter configuration not found for {param_id} variation {variation}"
        }), 404

    # Run calculation
    success = run_calculation_script(version, param_id, param_config, mode, variation, compare_to_key)

    if not success:
        return jsonify({
            "error": f"Failed to run calculation for {param_id} variation {variation}"
        }), 500

    return jsonify({
        "status": "success",
        "version": version,
        "paramId": param_id,
        "variation": variation,
        "compareToKey": compare_to_key,
        "mode": mode
    })

# =====================================
# Main Application
# =====================================

if __name__ == '__main__':
    # Get port from command line arguments or use default
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000

    logger.info(f"Starting Sensitivity Routes service on port {port}")
    app.run(debug=False, host='0.0.0.0', port=port)