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

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

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

# =====================================
# Script Configurations
# =====================================

COMMON_PYTHON_SCRIPTS = [
    os.path.join(SCRIPT_DIR, "Configuration_management", 'formatter.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'module1.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'update_config_modules_with_CFA.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'Table.py')
]

def get_calculation_script(version):
    """Get the appropriate calculation script based on version number"""
    script_name = f'update_config_modules_with_CFA_{version}.py'
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
                   calculation_option, senParameters):
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
            json.dumps(senParameters)
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
    enabled_params = [k for k, v in config['senParameters'].items() if v.get('enabled')]
    if enabled_params:
        logger.info("\nSensitivity Analysis Configuration:")
        logger.info(f"Enabled Parameters: {', '.join(enabled_params)}")
        for param_id in enabled_params:
            param_config = config['senParameters'][param_id]
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

def process_sensitivity_visualization(senParameters):
    """
    Process sensitivity parameters for visualization.
    
    Args:
        senParameters (dict): Dictionary containing sensitivity parameters in format:
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
        for param_key, config in senParameters.items():
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

@app.route('/run', methods=['POST'])
def run_calculations():
    """Orchestrates the execution sequence of configuration updates and calculations."""
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Extract and validate configuration
        config = {
            'versions': data.get('selectedVersions', [1]),
            'selectedV': data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)}),
            'selectedF': data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)}),
            'calculationOption': data.get('selectedCalculationOption', 'freeFlowNPV'),
            'targetRow': int(data.get('targetRow', 20)),
            'senParameters': data.get('senParameters', {})
        }
        
        # Log run configuration
        log_run_configuration(sensitivity_logger, config)

        # Step 1: Execute configuration management scripts
        sensitivity_logger.info("\nExecuting Configuration Management Scripts:")
        start_time = time.time()
        
        for script in COMMON_PYTHON_SCRIPTS:
            script_name = os.path.basename(script)
            script_start = time.time()
            sensitivity_logger.info(f"\nExecuting: {script_name}")
            
            result = subprocess.run(
                ['python', script, str(config['versions'][0])],
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
                '{}'  # Empty senParameters for baseline
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
        enabled_params = [k for k, v in config['senParameters'].items() if v.get('enabled')]
        if enabled_params:
            sensitivity_logger.info(f"\nProcessing {len(enabled_params)} sensitivity parameters:")
            
            for param_id, param_config in config['senParameters'].items():
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

@app.route('/sensitivity/visualization', methods=['POST'])
def get_sensitivity_visualization():
    sensitivity_logger = logging.getLogger('sensitivity')
    run_id = time.strftime("%Y%m%d_%H%M%S")
    start_time = time.time()
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        version = data.get('selectedVersions', [1])[0]
        sen_parameters = data.get('senParameters', {})

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

        base_dir = os.path.join(BASE_DIR, 'public', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')
        
        plots_generated = 0
        
        for param_id, config in sen_parameters.items():
            if not config.get('enabled'):
                continue

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

            if not os.path.exists(sensitivity_dir):
                error_msg = f"Sensitivity directory not found: {sensitivity_dir}"
                sensitivity_logger.error(error_msg)
                visualization_data['parameters'][param_id]['status']['error'] = error_msg
                visualization_data['metadata']['errors'].append(error_msg)
                continue

            for plot_type in plot_types:
                plot_name = f"{plot_type}_{param_id}_{config['compareToKey']}_{config.get('comparisonType', 'primary')}"
                plot_path = os.path.join(sensitivity_dir, f"{plot_name}.png")
                
                plot_status = {
                    'status': 'error',
                    'path': None,
                    'error': None
                }

                if os.path.exists(plot_path):
                    relative_path = os.path.relpath(plot_path, base_dir)
                    plot_status.update({
                        'status': 'ready',
                        'path': relative_path,
                        'error': None
                    })
                    plots_generated += 1
                    sensitivity_logger.info(f"Found {plot_type} plot: {relative_path}")
                else:
                    error_msg = f"Plot not found: {plot_name}"
                    plot_status['error'] = error_msg
                    sensitivity_logger.warning(error_msg)

                visualization_data['plots'][param_id][plot_type] = plot_status

            # Update parameter processing status
            visualization_data['parameters'][param_id]['status']['processed'] = True

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

        return jsonify(visualization_data)

    except Exception as e:
        error_msg = f"Error generating visualization data: {str(e)}"
        sensitivity_logger.exception(error_msg)
        
        # Return partial data if available, along with error
        if 'visualization_data' in locals():
            visualization_data['metadata']['errors'].append(error_msg)
            return jsonify(visualization_data)
            
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

# =====================================
# Application Entry Point
# =====================================

if __name__ == '__main__':
    app.run(debug=True, port=5007)
