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

SCRIPT_DIR = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend"
LOG_FILE_PATH = os.path.join(SCRIPT_DIR, "Logs", "RUN.log")
SENSITIVITY_LOG_PATH = os.path.join(SCRIPT_DIR, "Logs", "SENSITIVITY.log")

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
    os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)
    
    logging.basicConfig(
        filename=LOG_FILE_PATH,
        level=logging.DEBUG,
        format='%(asctime)s %(levelname)s %(message)s'
    )
    
    sensitivity_logger = logging.getLogger('sensitivity')
    sensitivity_handler = logging.FileHandler(SENSITIVITY_LOG_PATH)
    sensitivity_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    sensitivity_logger.addHandler(sensitivity_handler)
    sensitivity_logger.setLevel(logging.DEBUG)
    
    logging.info("Logging configured correctly.")

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
            # Skip disabled parameters
            if not config.get('enabled', False):
                continue
                
            # Validate parameter key format
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

@app.route('/sensitivity/visualization', methods=['POST'])
def get_sensitivity_visualization():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        senParameters = data.get('senParameters', {})
        if not isinstance(senParameters, dict):
            return jsonify({"error": "Invalid sensitivity parameters format"}), 400
            
        visualization_data = process_sensitivity_visualization(senParameters)
        return jsonify(visualization_data)
        
    except Exception as e:
        error_msg = f"Error generating visualization: {str(e)}"
        logging.exception(error_msg)
        return jsonify({"error": error_msg}), 500

@app.route('/run', methods=['POST'])
def run_scripts():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        selected_versions = data.get('selectedVersions', [1])
        if not selected_versions:
            return jsonify({"error": "No versions selected"}), 400

        selected_v = data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)})
        selected_f = data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)})
        selected_calculation_option = data.get('selectedCalculationOption', '')
        
        if not selected_calculation_option:
            return jsonify({"error": "No calculation option selected"}), 400
        if selected_calculation_option not in CALCULATION_SCRIPTS:
            return jsonify({"error": "Invalid calculation option"}), 400

        target_row = int(data.get('targetRow', 20))
        senParameters = data.get('senParameters', {})

        logging.info(f"Received request with calculation: {data}")
        os.chdir(SCRIPT_DIR)

        calculation_script = CALCULATION_SCRIPTS[selected_calculation_option]
        for version in selected_versions:
            error = process_version(
                version,
                calculation_script,
                selected_v,
                selected_f,
                target_row,
                selected_calculation_option,
                senParameters
            )
            if error:
                return jsonify({"error": error}), 500

        logging.info("Waiting 1 second before executing R scripts...")
        time.sleep(1)

        for plot_name, r_script in PLOT_SCRIPTS.items():
            success, error = run_script(r_script, *selected_versions, script_type="r")
            if not success:
                return jsonify({"error": error}), 500

        response_data = {
            "status": "success",
            "message": "Calculation completed successfully"
        }
        
        return jsonify(response_data) if selected_calculation_option == 'calculateForPrice' else ('', 204)

    except Exception as e:
        error_msg = f"Error during calculation: {str(e)}"
        logging.exception(error_msg)
        return jsonify({"error": error_msg}), 500

# =====================================
# Application Entry Point
# =====================================

if __name__ == '__main__':
    app.run(debug=True, port=5007)