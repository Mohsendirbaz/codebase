import os
import json
from flask import Flask, request, jsonify
import logging
import requests
import subprocess
app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('CalSen')

def build_paths_for_version(version):
    """Build all required paths for a given version using the sensitivity config"""
    code_files_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend", "Original")

    # Path to sensitivity config file
    sensitivity_config_path = os.path.join(
        code_files_path,
        f"Batch({version})",
        f"Results({version})",
        "Sensitivity",
        "Reports",
        "sensitivity_config.json"
    )

    try:
        with open(sensitivity_config_path, 'r') as f:
            sensitivity_config = json.load(f)
    except FileNotFoundError:
        logger.error(f"Sensitivity config not found at {sensitivity_config_path}")
        return None

    # Build path sets for all enabled S parameters
    path_sets = {}

    for param_id, config in sensitivity_config.get('parameters', {}).items():
        if config.get('enabled', False):
            # Construct the results folder path
            results_folder = os.path.join(
                code_files_path,
                f"Batch({version})",
                f"Results({version})",
                "Sensitivity",
                param_id,
                config.get('mode', 'symmetrical').lower(),
                "+/_numbers"
            )

            # Create the config paths
            config_matrix_file = os.path.join(
                results_folder,
                f"General_Configuration_Matrix({version}).csv"
            )

            config_file = os.path.join(
                code_files_path,
                f"Batch({version})",
                f"ConfigurationPlotSpec({version})",
                f"configurations({version}).py"
            )

            # Only include if both files exist
            if os.path.exists(config_matrix_file) and os.path.exists(config_file):
                path_sets[param_id] = {
                    "config_matrix_file": config_matrix_file,
                    "config_file": config_file,
                    "results_folder": results_folder,
                    "mode": config.get('mode', 'symmetrical')
                }

    return path_sets if path_sets else None

@app.route('/process_sensitivity', methods=['POST'])
def process_sensitivity():
    """Endpoint to process sensitivity calculations for enabled parameters"""
    try:
        # Get request data
        data = request.json
        version = data.get('version')
        payload = data.get('payload', {})

        if not version:
            return jsonify({"error": "Version number is required"}), 400

        logger.info(f"Processing sensitivity for version {version}")

        # Build all path sets for this version
        path_sets = build_paths_for_version(version)

        if not path_sets:
            return jsonify({"error": f"No enabled configurations found for version {version}"}), 404

        # Process each enabled parameter
        results = {}
        for param_id, paths in path_sets.items():
            logger.info(f"Processing parameter {param_id}")

            # Prepare environment variables for CFA
            env_vars = {
                'CONFIG_MATRIX_FILE': paths['config_matrix_file'],
                'CONFIG_FILE': paths['config_file'],
                'RESULTS_FOLDER': paths['results_folder']
            }

            # Prepare CFA arguments
            args = [
                "python", "CFA-b.py",
                str(version),
                json.dumps(payload.get('selectedV', {})),
                json.dumps(payload.get('selectedF', {})),
                str(payload.get('targetRow', 20)),
                payload.get('selectedCalculationOption', 'freeFlowNPV'),
                json.dumps({param_id: payload.get('SenParameters', {}).get(param_id, {})})
            ]

            # Execute CFA process
            try:
                result = subprocess.run(
                    args,
                    env={**os.environ, **env_vars},
                    capture_output=True,
                    text=True
                )

                if result.returncode == 0:
                    results[param_id] = {
                        "status": "success",
                        "output": result.stdout,
                        "paths": paths
                    }
                else:
                    results[param_id] = {
                        "status": "error",
                        "error": result.stderr,
                        "paths": paths
                    }
            except Exception as e:
                results[param_id] = {
                    "status": "exception",
                    "error": str(e),
                    "paths": paths
                }

        return jsonify({
            "status": "completed",
            "version": version,
            "results": results,
            "payload": payload  # Return original payload for reference
        })

    except Exception as e:
        logger.error(f"Error in sensitivity processing: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/get_config_paths', methods=['POST'])
def get_config_paths():
    """Endpoint to retrieve configuration paths for a version"""
    try:
        data = request.json
        version = data.get('version')

        if not version:
            return jsonify({"error": "Version number is required"}), 400

        path_sets = build_paths_for_version(version)

        if not path_sets:
            return jsonify({"error": f"No enabled configurations found for version {version}"}), 404

        return jsonify({
            "status": "success",
            "version": version,
            "path_sets": path_sets
        })

    except Exception as e:
        logger.error(f"Error getting config paths: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "CalSen"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2750, debug=True)
