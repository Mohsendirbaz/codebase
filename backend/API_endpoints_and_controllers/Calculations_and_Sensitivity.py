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
    os.path.join(SCRIPT_DIR, "API_endpoints_and_controllers", 'Table.py')
]

CALCULATION_SCRIPTS = {
    'calculateForPrice': os.path.join(SCRIPT_DIR, "Core_calculation_engines", 'update_config_modules_with_CFA_8.py')
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
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        version = data.get('selectedVersions', [1])[0]
        selected_v = data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)})
        selected_f = data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)})
        target_row = int(data.get('targetRow', 20))
        sen_parameters = data.get('senParameters', {})

        run_id = time.strftime("%Y%m%d_%H%M%S")
        sensitivity_logger.info(f"\n{'='*80}\nInitiating Sensitivity Calculation Run - ID: {run_id}\n{'='*80}")
        sensitivity_logger.info(f"Configuration Details:")
        sensitivity_logger.info(f"Version: {version}")
        sensitivity_logger.info(f"Target Row: {target_row}")
        sensitivity_logger.info(f"Selected V Parameters: {json.dumps(selected_v, indent=2)}")
        sensitivity_logger.info(f"Selected F Parameters: {json.dumps(selected_f, indent=2)}")

        # Step 1: Run common Python scripts
        sensitivity_logger.info("\nExecuting Common Python Scripts:")
        for script in COMMON_PYTHON_SCRIPTS:
            sensitivity_logger.info(f"Executing: {os.path.basename(script)}")
            result = subprocess.run(
                ['python', script, str(version)],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                error_msg = f"Script execution failed: {os.path.basename(script)}\nError: {result.stderr}"
                sensitivity_logger.error(error_msg)
                raise Exception(error_msg)
            sensitivity_logger.info(f"Successfully completed: {os.path.basename(script)}")

        # Step 2: Process sensitivity parameters
        sensitivity_logger.info("\nProcessing Sensitivity Parameters:")
        enabled_params = [param_id for param_id, config in sen_parameters.items() if config.get('enabled')]
        sensitivity_logger.info(f"Found {len(enabled_params)} enabled sensitivity parameters")

        for param_id, config in sen_parameters.items():
            if not config.get('enabled'):
                continue

            sensitivity_logger.info(f"\nProcessing Parameter: {param_id}")
            sensitivity_logger.info(f"Mode: {config.get('mode')}")
            sensitivity_logger.info(f"Values: {config.get('values')}")

            # Get the calculation script path from configuration
            calculation_script = CALCULATION_SCRIPTS.get('calculateForPrice')
            if not calculation_script:
                raise Exception("Calculation script path not found in configuration")
                
            result = subprocess.run(
                [
                    'python',
                    calculation_script,
                    str(version),
                    json.dumps(selected_v),
                    json.dumps(selected_f),
                    str(target_row),
                    'calculateForPrice',
                    json.dumps({param_id: config})
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                error_msg = f"Calculation failed for parameter {param_id}: {result.stderr}"
                sensitivity_logger.error(error_msg)
                raise Exception(error_msg)
            
            sensitivity_logger.info(f"Successfully completed calculations for {param_id}")

        sensitivity_logger.info(f"\n{'='*80}")
        sensitivity_logger.info(f"Sensitivity Calculations Complete - Run ID: {run_id}")
        sensitivity_logger.info(f"Total Parameters Processed: {len(enabled_params)}")
        sensitivity_logger.info(f"{'='*80}\n")

        return jsonify({
            "status": "success",
            "message": "Calculations completed successfully",
            "runId": run_id
        })

    except Exception as e:
        error_msg = f"Error during orchestrated calculations: {str(e)}"
        sensitivity_logger.error(error_msg)
        return jsonify({"error": error_msg}), 500
        for param_id, config in sen_parameters.items():
            if not config.get('enabled'):
                continue

            sensitivity_script = os.path.join(
                SCRIPT_DIR,
                "Configuration_management",
                'update_config_modules_with_CFA.py'
            )
            
            sensitivity_params = {
                'param_id': param_id,
                'mode': config.get('mode'),
                'values': config.get('values', [])
            }
            
            result = subprocess.run(
                [
                    'python',
                    sensitivity_script,
                    str(version),
                    json.dumps(sensitivity_params)
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Sensitivity configuration update failed for {param_id}: {result.stderr}")

        # Step 3: Run financial calculations
        calculation_script = os.path.join(
            SCRIPT_DIR,
            "Core_calculation_engines",
            'update_config_modules_with_CFA_8.py'
        )
        
        # First run baseline calculation
        logging.info(f"Executing baseline calculation with parameters: version={version}, target_row={target_row}")
        command = [
            'python',
            calculation_script,
            str(version),
            json.dumps(selected_v),
            json.dumps(selected_f),
            str(target_row),
            'calculateForPrice',
            '{}'  # Empty senParameters for baseline
        ]
        logging.debug(f"Executing command: {' '.join(command)}")
        
        result = subprocess.run(
            command,
            capture_output=True,
            text=True
        )
        
        if result.stdout:
            logging.debug(f"Calculation output: {result.stdout[:200]}...")
        
        if result.returncode != 0:
            raise Exception(f"Baseline calculation failed: {result.stderr}")

        # Then run calculations for each sensitivity configuration
        results = {}
        for param_id, config in sen_parameters.items():
            if not config.get('enabled'):
                continue

            result = subprocess.run(
                [
                    'python',
                    calculation_script,
                    str(version),
                    json.dumps(selected_v),
                    json.dumps(selected_f),
                    str(target_row),
                    'calculateForPrice',
                    json.dumps({param_id: config})
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Sensitivity calculation failed for {param_id}: {result.stderr}")
                
            try:
                if result.stdout.strip():
                    results[param_id] = json.loads(result.stdout)
                else:
                    logging.warning(f"Empty output received for {param_id}")
                    results[param_id] = {}
            except json.JSONDecodeError as e:
                logging.error(f"Failed to parse JSON output for {param_id}: {str(e)}\nOutput: {result.stdout}")
                results[param_id] = {"error": "Invalid output format"}

        return jsonify({
            "status": "success",
            "message": "Calculations completed successfully",
            "results": results
        })

    except Exception as e:
        logging.error(f"Error during orchestrated calculations: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/sensitivity/visualization', methods=['POST'])
def get_sensitivity_visualization():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        version = data.get('selectedVersions', [1])[0]
        sen_parameters = data.get('senParameters', {})

        visualization_data = {
            'parameters': {},
            'relationships': [],
            'plots': {}
        }

        base_dir = os.path.join(BASE_DIR, 'public', 'Original')
        results_folder = os.path.join(base_dir, f'Batch({version})', f'Results({version})')

        for param_id, config in sen_parameters.items():
            if not config.get('enabled'):
                continue

            mode = config.get('mode')
            plot_types = []
            if config.get('waterfall'): plot_types.append('waterfall')
            if config.get('bar'): plot_types.append('bar')
            if config.get('point'): plot_types.append('point')

            # Add parameter metadata
            visualization_data['parameters'][param_id] = {
                'id': param_id,
                'mode': mode,
                'enabled': True
            }

            # Add relationship data
            if config.get('compareToKey'):
                visualization_data['relationships'].append({
                    'source': param_id,
                    'target': config['compareToKey'],
                    'type': config.get('comparisonType', 'primary'),
                    'plotTypes': plot_types
                })

            # Collect plot paths
            sensitivity_dir = os.path.join(
                results_folder,
                'Sensitivity',
                'Symmetrical' if mode == 'symmetrical' else 'Multipoint'
            )

            plot_paths = {}
            for plot_type in plot_types:
                plot_name = f"{plot_type}_{param_id}_{config['compareToKey']}_{config.get('comparisonType', 'primary')}"
                plot_path = os.path.join(sensitivity_dir, f"{plot_name}.png")
                
                if os.path.exists(plot_path):
                    plot_paths[plot_type] = os.path.relpath(plot_path, base_dir)

            visualization_data['plots'][param_id] = plot_paths

        return jsonify(visualization_data)

    except Exception as e:
        logging.error(f"Error generating visualization data: {str(e)}")
        return jsonify({"error": str(e)}), 500

# =====================================
# Application Entry Point
# =====================================

if __name__ == '__main__':
    app.run(debug=True, port=5007)
