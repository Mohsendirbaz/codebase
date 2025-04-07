"""
Sensitivity Configuration Base - Lean Version

Provides core functionality for copying and modifying configuration modules
for sensitivity analysis with reduced duplication and consolidated features.
"""

import os
import sys
import time
import json
import logging
import shutil
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_DIR = os.path.join(BASE_DIR, 'backend')
LOGS_DIR = os.path.join(SCRIPT_DIR, 'Logs')
ORIGINAL_BASE_DIR = os.path.join(BASE_DIR, 'Original')
CONFIG_STATUS_PATH = os.path.join(LOGS_DIR, "sensitivity_config_status.json")
CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "sensitivity_config_data.pkl")

# Logger setup
def setup_logging():
    os.makedirs(LOGS_DIR, exist_ok=True)

    logger = logging.getLogger('sensitivity')
    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    handler = logging.FileHandler(os.path.join(LOGS_DIR, "SENSITIVITY.log"))
    handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    logger.addHandler(handler)

    return logger

logger = setup_logging()

def import_sensitivity_functions():
    """Dynamically import required sensitivity functions."""
    try:
        sys.path.append(os.path.join(SCRIPT_DIR, "Configuration_managment"))
        from Sen_Config import apply_sensitivity_variation, find_parameter_by_id
        return apply_sensitivity_variation, find_parameter_by_id
    except ImportError as e:
        logger.error(f"Failed to import sensitivity functions: {str(e)}")
        raise

def check_config_status():
    """Check if sensitivity configurations are ready."""
    if not os.path.exists(CONFIG_STATUS_PATH):
        return False, None

    try:
        with open(CONFIG_STATUS_PATH, 'r') as f:
            status = json.load(f)

        if not status.get('configured', False):
            return False, None

        if os.path.exists(CONFIG_DATA_PATH):
            with open(CONFIG_DATA_PATH, 'rb') as f:
                return True, pickle.load(f)
        return True, None
    except Exception as e:
        logger.error(f"Error checking config status: {str(e)}")
        return False, None

def generate_datapoints(version, parameters):
    """Generate sensitivity plot datapoints file."""
    try:
        apply_var, find_param = import_sensitivity_functions()

        # Find base config for baseline values
        base_config = None
        source_dir = os.path.join(ORIGINAL_BASE_DIR, f'Batch({version})', f'Results({version})')

        for module_num in range(1, 101):
            config_path = os.path.join(source_dir, f"{version}_config_module_{module_num}.json")
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    base_config = json.load(f)
                break

        datapoints = {"metadata": {"structure_explanation": "..."}}  # Simplified for brevity

        for param_id, config in parameters.items():
            if not config.get('enabled'):
                continue

            compare_key = config.get('compareToKey', 'S13')
            mode = 'percentage' if config.get('mode') in ['percentage', 'multiple'] else 'multipoint'
            values = config.get('values', [])

            # Get baseline value
            baseline = 10000  # Default fallback
            if base_config:
                try:
                    param_key = find_param(base_config, param_id)
                    baseline = float(base_config[param_key]) if isinstance(base_config[param_key], str) else base_config[param_key]
                except Exception:
                    pass

            # Generate data points
            data_points = {}
            for val in sorted(values):
                if val == 0:
                    continue
                point_key = int(baseline * (1 + val/100) if mode == 'percentage' else baseline + val)
                data_points[str(point_key)] = None

            datapoints[f"{param_id},{compare_key}"] = {
                "baseline": {str(int(baseline)): None},
                "info": "-" if all(v < 0 for v in values) else "+" if all(v > 0 for v in values) else f"b{sum(1 for v in values if v < 0)}",
                "data": data_points
            }

        # Save datapoints file
        output_path = os.path.join(ORIGINAL_BASE_DIR, f'Batch({version})', f'Results({version})', f"SensitivityPlotDatapoints_{version}.json")
        with open(output_path, 'w') as f:
            json.dump(datapoints, f, indent=2)

        return output_path
    except Exception as e:
        logger.error(f"Error generating datapoints: {str(e)}")
        return None

def process_configs(version, parameters):
    """Process all configuration modules with sensitivity variations."""
    summary = {
        'processed': 0,
        'errors': [],
        'files_copied': 0
    }

    try:
        apply_var, _ = import_sensitivity_functions()
        source_dir = os.path.join(ORIGINAL_BASE_DIR, f'Batch({version})', f'Results({version})')
        target_dir = os.path.join(BASE_DIR, 'backend', 'Original', f'Batch({version})', f'Results({version})', 'Sensitivity')

        # Copy required CSV files
        csv_files = [f"Configuration_Matrix({version}).csv", f"General_Configuration_Matrix({version}).csv"]
        for csv_file in csv_files:
            src = os.path.join(source_dir, csv_file)
            if os.path.exists(src):
                for param_id, config in parameters.items():
                    if not config.get('enabled'):
                        continue

                    mode = 'percentage' if config.get('mode') in ['percentage', 'multiple'] else 'multipoint'
                    for val in [config['values'][0]] if mode == 'percentage' else config['values']:
                        dest_dir = os.path.join(target_dir, param_id, mode, f"{val:+.2f}")
                        os.makedirs(dest_dir, exist_ok=True)
                        shutil.copy2(src, os.path.join(dest_dir, csv_file))
                        summary['files_copied'] += 1

        # Process JSON configs
        for module_num in range(1, 101):
            src_config = os.path.join(source_dir, f"{version}_config_module_{module_num}.json")
            if not os.path.exists(src_config):
                continue

            with open(src_config, 'r') as f:
                config = json.load(f)

            for param_id, param_config in parameters.items():
                if not param_config.get('enabled'):
                    continue

                mode = 'percentage' if param_config.get('mode') in ['percentage', 'multiple'] else 'multipoint'
                for val in [param_config['values'][0]] if mode == 'percentage' else param_config['values']:
                    dest_dir = os.path.join(target_dir, param_id, mode, f"{val:+.2f}")
                    modified_config = apply_var(config.copy(), param_id, val, mode)

                    with open(os.path.join(dest_dir, f"{version}_config_module_{module_num}.json"), 'w') as f:
                        json.dump(modified_config, f, indent=4)
                    summary['processed'] += 1

        # Generate datapoints file
        generate_datapoints(version, parameters)
        return summary

    except Exception as e:
        logger.error(f"Error processing configs: {str(e)}")
        summary['errors'].append(str(e))
        return summary

# Flask App
app = Flask(__name__)
CORS(app)

@app.route('/copy-config-modules', methods=['POST'])
def handle_config_processing():
    """Endpoint to process configuration modules."""
    run_id = time.strftime("%Y%m%d_%H%M%S")

    try:
        is_ready, config = check_config_status()
        if not is_ready:
            return jsonify({"error": "Configurations not ready", "runId": run_id}), 400

        data = request.get_json() or {}
        version = data.get('version') or config['versions'][0]
        params = data.get('parameters') or config['SenParameters']

        result = process_configs(version, params)
        return jsonify({
            "status": "success",
            "runId": run_id,
            "result": result
        })
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        return jsonify({"error": str(e), "runId": run_id}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "server": "sensitivity-config-processor",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

if __name__ == '__main__':
    app.run(port=2600)