import os
import json
import logging
import subprocess
from typing import Dict, Optional, Any
from flask import Flask, request, jsonify

app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('CalSen')

def get_code_files_path() -> str:
    """Get the absolute path to the codebase root"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, "..", "..", "..", "backend", "Original")  # Fixed path traversal

def build_paths_for_version(version: int) -> Optional[Dict[str, Dict[str, str]]]:
    """Build all required paths for a given version"""
    try:
        code_files_path = get_code_files_path()

        # Validate base path exists
        if not os.path.exists(code_files_path):
            logger.error(f"Base code path not found: {code_files_path}")
            return None

        sensitivity_config_path = os.path.join(
            code_files_path,
            f"Batch({version})",
            f"Results({version})",
            "Sensitivity",
            "Reports",
            "sensitivity_config.json"
        )

        # Load config with explicit encoding
        with open(sensitivity_config_path, 'r', encoding='utf-8') as f:
            sensitivity_config = json.load(f)

        path_sets = {}
        for param_id, config in sensitivity_config.get('parameters', {}).items():
            if config.get('enabled', False):
                variation = config.get('variation', '+0.0')
                variation_dir = variation.replace('.', '_')  # +10.5 -> +10_5

                results_folder = os.path.join(
                    code_files_path,
                    f"Batch({version})",
                    f"Results({version})",
                    "Sensitivity",
                    param_id,
                    config.get('mode', 'symmetrical').lower(),
                    variation_dir
                )

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

                if all(os.path.exists(p) for p in [config_matrix_file, config_file]):
                    path_sets[param_id] = {
                        "config_matrix_file": config_matrix_file,
                        "config_file": config_file,
                        "results_folder": results_folder,
                        "mode": config.get('mode', 'symmetrical'),
                        "variation": variation
                    }

        return path_sets or None

    except Exception as e:
        logger.error(f"Path building failed: {str(e)}", exc_info=True)
        return None

@app.route('/process_sensitivity', methods=['POST'])
def process_sensitivity() -> Any:
    """Process sensitivity calculations"""
    try:
        data = request.get_json()
        version = data.get('version')

        if not version:
            return jsonify({"error": "Version required"}), 400

        path_sets = build_paths_for_version(version)
        if not path_sets:
            return jsonify({"error": "No valid configurations"}), 404

        results = {}
        payload = data.get('payload', {})

        for param_id, paths in path_sets.items():
            try:
                result = subprocess.run(
                    [
                        "python", "CFA-b.py",
                        str(version),
                        json.dumps(payload.get('selectedV', {})),
                        json.dumps(payload.get('selectedF', {})),
                        str(payload.get('targetRow', 20)),
                        payload.get('calculationOption', 'freeFlowNPV'),
                        json.dumps({"sensitivity_params": payload.get('SenParameters', {}).get(param_id, {})}),
                        f"--config_matrix_file={paths['config_matrix_file']}",
                        f"--config_file={paths['config_file']}",
                        f"--results_folder={paths['results_folder']}"
                    ],
                    capture_output=True,
                    text=True,
                    timeout=300,
                    check=True
                )
                results[param_id] = {
                    "status": "success",
                    "output": json.loads(result.stdout),
                    "paths": paths
                }
            except subprocess.CalledProcessError as e:
                results[param_id] = {
                    "status": "error",
                    "error": e.stderr,
                    "paths": paths
                }

        return jsonify({
            "status": "completed",
            "version": version,
            "results": results
        })

    except Exception as e:
        logger.error(f"Processing failed: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=2750, debug=False)