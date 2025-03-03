"""
Orchestrates the execution sequence of configuration updates and calculations.

This function is the main entry point for the 'run' route in the Flask application.
It handles the following steps:
1. Extracts and validates the configuration data from the request.
2. Executes the configuration management scripts.
3. Processes the calculations based on the selected calculation mode.
4. If sensitivity analysis is enabled, processes the sensitivity parameters and executes the corresponding calculations.
5. Logs the run configuration and timing information.
6. Returns a success response with timing details, or an error response if any exceptions occur.

Args:
    None

Returns:
    A JSON response with the status, message, run ID, and timing information.
"""
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import subprocess
import os
import logging
import json
import time
import sys
import shutil
import pickle

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

# Import plot generation logging functions
from sensitivity_logging import (
    log_plot_generation_start, log_plot_generation_complete, log_plot_generation_error,
    log_plot_data_loading, log_plot_data_processing, log_plot_rendering, log_plot_saving,
    plot_generation_operation, log_execution_flow
)

# =====================================
# Configuration Constants
# =====================================

# Define base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
SCRIPT_DIR = os.path.join(BASE_DIR, 'backend')
LOGS_DIR = os.path.join(SCRIPT_DIR, 'Logs')

# Create logs directory if it doesn't exist
os.makedirs(LOGS_DIR, exist_ok=True)

LOG_FILE_PATH = os.path.join(LOGS_DIR, "RUN.log")
SENSITIVITY_LOG_PATH = os.path.join(LOGS_DIR, "SENSITIVITY.log")

# Sensitivity configuration status file
SENSITIVITY_CONFIG_STATUS_PATH = os.path.join(LOGS_DIR, "sensitivity_config_status.json")
SENSITIVITY_CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "sensitivity_config_data.pkl")

# =====================================
# Script Configurations
# =====================================

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

PLOT_SCRIPTS = {}

# =====================================
# Logging Configuration
# =====================================

def setup_logging():
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(SCRIPT_DIR, "Logs")
    os.makedirs(log_dir, exist_ok=True)
    
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
# Script Execution Functions
# =====================================

def run_script(script_name, *args, script_type="python"):
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
    try:
        for script in COMMON_PYTHON_SCRIPTS:
            success, error = run_script(script, version)
            if not success:
                return error

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
    Create directory structure for sensitivity analysis.
    
    Args:
        version (int): Version number
        SenParameters (dict): Dictionary containing sensitivity parameters
        
    Returns:
        tuple: (sensitivity_dir, reports_dir) - Paths to the main sensitivity directory and reports directory
    """
    sensitivity_logger = logging.getLogger('sensitivity')
    
    # Create sensitivity directories
    base_dir = os.path.join(BASE_DIR, 'backend', 'Original')
    results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
    sensitivity_dir = os.path.join(results_folder, 'Sensitivity')
    
    # Create main sensitivity directory
    os.makedirs(sensitivity_dir, exist_ok=True)
    sensitivity_logger.info(f"Created main sensitivity directory: {sensitivity_dir}")
    
    # Create Reports directory (only additional folder in Sensitivity)
    reports_dir = os.path.join(sensitivity_dir, "Reports")
    os.makedirs(reports_dir, exist_ok=True)
    sensitivity_logger.info(f"Created Reports directory: {reports_dir}")
    
    # Create parameter-specific directories with mode and variation
    for param_id, param_config in SenParameters.items():
        if not param_config.get('enabled'):
            continue
            
        # Get variation values
        values = param_config.get('values', [])
        if not values:
            continue
            
        # Get mode (symmetrical or multipoint)
        mode = param_config.get('mode', 'symmetrical')
        
        # Determine variation list based on mode
        if mode.lower() == 'symmetrical':
            # For symmetrical, use first value to create +/- variations
            base_variation = values[0]
            variation_list = [base_variation, -base_variation]
        else:  # 'multipoint' mode
            # For multipoint, use all values directly
            variation_list = values
            
        # Create a directory for each variation
        for variation in variation_list:
            # Format the variation string (e.g., "+20.00" or "-20.00")
            var_str = f"{variation:+.2f}"
            
            # Create the full directory path: Sensitivity/param_id/mode/variation
            var_dir = os.path.join(sensitivity_dir, param_id, mode, var_str)
            os.makedirs(var_dir, exist_ok=True)
            sensitivity_logger.info(f"Created directory: {var_dir}")
    
    # Return the sensitivity directory and reports directory
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
                
                # Create a deep copy of the config module for this variation
                config_module_path = os.path.join(results_folder, f"{version}_config_module_3.json")
                if os.path.exists(config_module_path):
                    # Load the config module
                    with open(config_module_path, 'r') as f:
                        config_module = json.load(f)
                    
                    # Save a copy in the variation directory
                    var_config_path = os.path.join(var_dir, f"{version}_config_module_3.json")
                    with open(var_config_path, 'w') as f:
                        json.dump(config_module, f, indent=4)
                    saved_files.append(var_config_path)
                    sensitivity_logger.info(f"Saved config module copy: {var_config_path}")
            
        return saved_files
        
    except Exception as e:
        error_msg = f"Error saving configuration files: {str(e)}"
        sensitivity_logger.exception(error_msg)
        raise

def process_sensitivity_visualization(SenParameters):
    """
    Process sensitivity parameters for visualization.
    
    Args:
        SenParameters (dict): Dictionary containing sensitivity parameters in format:
            {
                'S10': {
                    'mode': str,
                    'values': list,
                    'enabled': bool,
                    'compareToKey': str,
                    'comparisonType': str,
                    'waterfall': bool,
                    'bar': bool,
                    'point': bool
                },
                ...
            }
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

def initialize_app():
    app = Flask(__name__)
    CORS(app)
    setup_logging()
    return app

app = initialize_app()

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
# Route Handlers
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

        # Step 2: Process calculations based on mode
        sensitivity_logger.info("\nProcessing Calculations:")
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

        # Step 3: Process sensitivity parameters if enabled
        enabled_params = [k for k, v in config['SenParameters'].items() if v.get('enabled')]
        if enabled_params:
            sensitivity_logger.info(f"\nProcessing {len(enabled_params)} sensitivity parameters:")
            
            for param_id, param_config in config['SenParameters'].items():
                if not param_config.get('enabled'):
                    continue
                    
                param_start = time.time()
                sensitivity_logger.info(f"\nProcessing {param_id}:")
                sensitivity_logger.info(f"Mode: {param_config.get('mode')}")
                sensitivity_logger.info(f"Values: {param_config.get('values')}")
                
                result = subprocess.run(
                    [
                        'python',
                        calculation_script,
                        str(config['versions'][0]),
                        json.dumps(config['selectedV']),
                        json.dumps(config['selectedF']),
                        str(config['targetRow']),
                        config['calculationOption'],
                        json.dumps({param_id: param_config})
                    ],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode != 0:
                    error_msg = f"Sensitivity calculation failed for {param_id}: {result.stderr}"
                    sensitivity_logger.error(error_msg)
                    raise Exception(error_msg)
                
                param_duration = time.time() - param_start
                sensitivity_logger.info(f"Completed {param_id} in {param_duration:.2f}s")

        total_time = time.time() - start_time
        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Run Summary - ID: {run_id}")
        sensitivity_logger.info(f"Total execution time: {total_time:.2f}s")
        sensitivity_logger.info(f"Configuration scripts: {config_time:.2f}s")
        sensitivity_logger.info(f"Calculations completed: {len(enabled_params) + 1}")  # +1 for baseline
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
            }
        })

    except Exception as e:
        error_msg = f"Error during orchestrated calculations: {str(e)}"
        sensitivity_logger.error(error_msg)
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

@app.route('/sensitivity/visualize', methods=['POST'])
def get_sensitivity_visualization():
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")
    start_time = time.time()
    
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

        base_dir = os.path.join(BASE_DIR, 'backend', 'Original')  # Use backend/Original instead of public/Original
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

            # Check if sensitivity directory exists
            if not os.path.exists(sensitivity_dir):
                error_msg = f"Sensitivity directory not found: {sensitivity_dir}"
                sensitivity_logger.error(error_msg)
                log_execution_flow('error', error_msg)
                visualization_data['parameters'][param_id]['status']['error'] = error_msg
                visualization_data['metadata']['errors'].append(error_msg)
                continue

            # Process each plot type
            for plot_type in plot_types:
                # Log the start of plot generation attempt
                log_plot_generation_start(param_id, config['compareToKey'], plot_type, mode)
                
                # Construct the plot name and path
                plot_name = f"{plot_type}_{param_id}_{config['compareToKey']}_{config.get('comparisonType', 'primary')}"
                plot_path = os.path.join(sensitivity_dir, f"{plot_name}.png")
                
                # Initialize plot status
                plot_status = {
                    'status': 'error',
                    'path': None,
                    'error': None
                }

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
                    sensitivity_logger.info(f"Found {plot_type} plot: {relative_path}")
                    log_plot_generation_complete(param_id, config['compareToKey'], plot_type, mode, plot_path)
                else:
                    # Plot doesn't exist, log the error
                    error_msg = f"Plot not found: {plot_name}"
                    plot_status['error'] = error_msg
                    sensitivity_logger.warning(error_msg)
                    
                    # Log detailed information about the missing plot
                    log_plot_generation_error(param_id, config['compareToKey'], plot_type, mode, error_msg)
                    
                    # Check if result data exists for this parameter
                    result_file_name = f"{param_id}_vs_{config['compareToKey']}_{mode.lower()}_results.json"
                    result_file_path = os.path.join(sensitivity_dir, result_file_name)
                    
                    if os.path.exists(result_file_path):
                        # Result data exists but plot wasn't generated
                        log_plot_data_loading(param_id, config['compareToKey'], result_file_path, success=True)
                        log_plot_rendering(param_id, config['compareToKey'], plot_type, success=False, 
                                          error_msg="Plot generation was not attempted or failed")
                    else:
                        # Result data doesn't exist
                        log_plot_data_loading(param_id, config['compareToKey'], result_file_path, success=False, 
                                             error_msg="Result data file not found")

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

        sensitivity_logger.info(f"\nVisualization processing complete - Run ID: {run_id}")
        sensitivity_logger.info(f"Processing time: {processing_time:.2f}s")
        sensitivity_logger.info(f"Plots generated: {plots_generated}")
        if visualization_data['metadata']['errors']:
            sensitivity_logger.info(f"Errors encountered: {len(visualization_data['metadata']['errors'])}")
        
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
# Health Check Endpoint
# =====================================

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for server detection.
    Returns a 200 OK response with basic server information.
    """
    return jsonify({
        "status": "ok",
        "server": "sensitivity-analysis-server",
        "version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

# =====================================
# Application Entry Point
# =====================================

if __name__ == '__main__':
    app.run(debug=True, port=25007)
