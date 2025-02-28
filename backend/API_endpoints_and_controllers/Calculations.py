from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import subprocess
import os
import logging
import json
import time
import sys
from tabulate import tabulate
from datetime import datetime

# Define script directory (relative to this file)
SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
base_dir = SCRIPT_DIR  # Keep for backward compatibility
sys.path.append(base_dir)

# =====================================
# Configuration Constants
# =====================================

# Default state configurations
DEFAULT_V_STATES = {f'V{i+1}': 'off' for i in range(10)}
DEFAULT_F_STATES = {f'F{i+1}': 'off' for i in range(5)}
DEFAULT_TARGET_ROW = 20
DEFAULT_CALCULATION_OPTION = 'calculateForPrice'

# =====================================
# Script Configurations
# =====================================

COMMON_PYTHON_SCRIPTS = [
    os.path.join(SCRIPT_DIR, "Configuration_management", 'formatter.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'module1.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'update_config_modules_with_CFA.py'),
    os.path.join(SCRIPT_DIR, "Configuration_management", 'Table.py')
]

CALCULATION_SCRIPTS = {
    'calculateForPrice': os.path.join(SCRIPT_DIR, "Core_calculation_engines", 'update_config_modules_with_CFA_7.py')
}

# =====================================
# Logging Configuration
# =====================================

# Configure logger
log_file = os.path.join(SCRIPT_DIR, "Logs", "CFA_CALC.log")
os.makedirs(os.path.dirname(log_file), exist_ok=True)

logger = logging.getLogger("CalculationsLogger")
logger.setLevel(logging.INFO)

# Create file handler
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)

# Add handler to logger
logger.addHandler(file_handler)

# =====================================
# Helper Functions
# =====================================

def log_state_parameters(versions, v_states, f_states, calculation_option, target_row, sen_parameters):
    """Log state parameters in a structured, tabulated format"""
    
    # Log versions
    logger.info(f"Processing versions: {versions}")
    
    # Log V states (enabled/disabled)
    v_enabled = [k for k, v in v_states.items() if v == 'on']
    v_disabled = [k for k, v in v_states.items() if v == 'off']
    logger.info(f"V states - Enabled: {v_enabled}, Disabled: {v_disabled}")
    
    # Log F states (enabled/disabled)
    f_enabled = [k for k, v in f_states.items() if v == 'on']
    f_disabled = [k for k, v in f_states.items() if v == 'off']
    logger.info(f"F states - Enabled: {f_enabled}, Disabled: {f_disabled}")
    
    # Log calculation options
    logger.info(f"Calculation option: {calculation_option}, Target row: {target_row}")
    
    # Log sensitivity parameters in tabular format if they exist
    if sen_parameters:
        # Extract relevant sensitivity parameters
        sen_table_data = []
        headers = ["Parameter", "Enabled", "Mode", "Compare To", "Comparison Type", "Visualization"]
        
        for param, config in sen_parameters.items():
            if isinstance(config, dict):
                visualization = []
                if config.get('waterfall'):
                    visualization.append('Waterfall')
                if config.get('bar'):
                    visualization.append('Bar')
                if config.get('point'):
                    visualization.append('Point')
                
                sen_table_data.append([
                    param,
                    "Yes" if config.get('enabled') else "No",
                    config.get('mode', 'N/A'),
                    config.get('compareToKey', 'N/A'),
                    config.get('comparisonType', 'N/A'),
                    ", ".join(visualization) if visualization else "None"
                ])
        
        if sen_table_data:
            table = tabulate(sen_table_data, headers=headers, tablefmt="grid")
            logger.info(f"Sensitivity Parameters:\n{table}")

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
            logger.error(error_msg)
            return False, error_msg
            
        logger.info(f"Successfully ran {os.path.basename(script_name)}" + 
                    (f" for version {args[0]}" if args else ""))
        return True, None
        
    except Exception as e:
        error_msg = f"Exception running {os.path.basename(script_name)}: {str(e)}"
        logger.exception(error_msg)
        return False, error_msg

def process_version(version, calculation_script, selected_v, selected_f, target_row, 
                   calculation_option, sen_parameters):
    try:
        # Log the start of processing for this version
        logger.info(f"Starting processing for version {version}")
        
        # Run common scripts first
        for script in COMMON_PYTHON_SCRIPTS:
            success, error = run_script(script, version)
            if not success:
                logger.error(f"Failed to run common script for version {version}: {error}")
                return error

        # Run the calculation script with all parameters
        success, error = run_script(
            calculation_script,
            version,
            json.dumps(selected_v),
            json.dumps(selected_f),
            target_row,
            calculation_option,
            json.dumps(sen_parameters)
        )
        if not success:
            logger.error(f"Failed to run calculation script for version {version}: {error}")
            return error

        logger.info(f"Successfully completed processing for version {version}")
        return None
    except Exception as e:
        error_msg = f"Error processing version {version}: {str(e)}"
        logger.exception(error_msg)
        return error_msg
# =====================================
# Flask Application Initialization
# =====================================

def initialize_app():
    app = Flask(__name__)
    CORS(app)
    return app

app = initialize_app()

@app.route('/run', methods=['POST'])
def run_scripts():
    try:
        # Get JSON data from request
        data = request.get_json()
        if not data:
            logger.error("No data provided in request")
            return jsonify({"error": "No data provided"}), 400

        # Extract and validate parameters with defaults
        selected_versions = data.get('selectedVersions', [1])
        if not selected_versions:
            logger.error("No versions selected")
            return jsonify({"error": "No versions selected"}), 400

        # Extract state parameters with defaults
        selected_v = data.get('selectedV', DEFAULT_V_STATES)
        selected_f = data.get('selectedF', DEFAULT_F_STATES)
        selected_calculation_option = data.get('selectedCalculationOption', DEFAULT_CALCULATION_OPTION)
        
        # Validate calculation option
        if not selected_calculation_option:
            logger.error("No calculation option selected")
            return jsonify({"error": "No calculation option selected"}), 400
        if selected_calculation_option not in CALCULATION_SCRIPTS:
            logger.error(f"Invalid calculation option: {selected_calculation_option}")
            return jsonify({"error": "Invalid calculation option"}), 400

        # Extract additional parameters
        target_row = int(data.get('targetRow', DEFAULT_TARGET_ROW))
        sen_parameters = data.get('SenParameters', {})  # Note: Frontend uses SenParameters (capital S)

        # Log all parameters in structured format
        log_state_parameters(
            selected_versions, 
            selected_v, 
            selected_f, 
            selected_calculation_option, 
            target_row, 
            sen_parameters
        )
        
        # Change to script directory for relative path operations
        os.chdir(SCRIPT_DIR)

        # Process each version
        calculation_script = CALCULATION_SCRIPTS[selected_calculation_option]
        for version in selected_versions:
            logger.info(f"Processing version {version}")
            error = process_version(
                version,
                calculation_script,
                selected_v,
                selected_f,
                target_row,
                selected_calculation_option,
                sen_parameters
            )
            if error:
                logger.error(f"Error processing version {version}: {error}")
                return jsonify({"error": error}), 500

        logger.info("Waiting 1 second before executing R scripts...")
        time.sleep(1)

        # Prepare response
        response_data = {
            "status": "success",
            "message": "Calculation completed successfully",
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info("Calculation completed successfully")
        return jsonify(response_data) if selected_calculation_option == 'calculateForPrice' else ('', 204)

    except Exception as e:
        error_msg = f"Error during calculation: {str(e)}"
        logger.exception(error_msg)
        return jsonify({"error": error_msg}), 500

# =====================================
# Application Entry Point
# =====================================

if __name__ == '__main__':
    app.run(debug=True, port=5007)
