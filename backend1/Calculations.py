from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import subprocess
import os
import logging
import json
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Absolute path for log file
log_file_path = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\RUN.log"
log_dir = os.path.dirname(log_file_path)
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    filename=log_file_path,
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s %(message)s'
)
logging.info("Logging configured correctly.")

script_dir = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend"

# only need versions that are selected
Common_Python_Scripts = [
    'formatter.py',
    'module1.py',
    'update_config_modules_with_CFA.py',
    'Table.py'
]

# only one option can be selected at a time
calculations = {
    'freeFlowNPV': 'update_config_modules_with_CFA_7.py',
    'calculateForPrice': 'update_config_modules_with_CFA_8.py',
    'calculateForIRR': 'update_config_modules_with_CFA_9.py',
}

# runs for everything
plots = {
    'Pie_Chart': 'generate_pie_chart.R',
}

def stream_sse(process):
    """
    Generator function to stream the output of the subprocess for SSE.
    Reads from stdout line by line and yields it as SSE data.
    """
    for line in iter(process.stdout.readline, ''):
        if line.strip():  # Ensure we ignore empty lines
            logging.info(f"Streaming line: {line.strip()}")
            yield f"data: {line.strip()}\n\n"

    process.stdout.close()
    process.wait()
    if process.returncode != 0:
        error_message = process.stderr.read().strip()
        logging.error(f"Subprocess error: {error_message}")
        yield f"data: {{'error': '{error_message}'}}\n\n"

@app.route('/run', methods=['POST'])
def run_scripts():
    data = request.get_json()
    selected_versions = data.get('selectedVersions', [1])
    selected_v = data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)})
    selected_f = data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)})
    selected_calculation_option = data.get('selectedCalculationOption', '')
    target_row = int(data.get('targetRow', 20))

    logging.info(f"Received request with calculation: {data}")
    try:
        os.chdir(script_dir)

        for version in selected_versions:
            for script_filename in Common_Python_Scripts:
                result = subprocess.run(['python', script_filename, str(version)], capture_output=True, text=True)
                if result.returncode != 0:
                    logging.error(f"Error running {script_filename} for version {version}: {result.stderr}")
                    return jsonify({"error": result.stderr}), 500
                logging.info(f"Successfully ran {script_filename} for version {version}")

            calculation_script = calculations[selected_calculation_option]
            for version in selected_versions:
                result = subprocess.run(
                    [
                        'python', calculation_script,
                        str(version),
                        json.dumps(selected_v),
                        json.dumps(selected_f),
                        json.dumps(target_row),
                        str(selected_calculation_option)
                    ],
                    capture_output=True, text=True
                )
                if result.returncode != 0:
                    logging.error(f"Error running {calculation_script} for version {version}: {result.stderr}")
                    return jsonify({"error": result.stderr}), 500
                logging.info(f"Successfully ran {calculation_script} for version {version}")

        logging.info("Waiting 1 second before executing R scripts...")
        time.sleep(1)

        for plot_name, r_script in plots.items():
            logging.info(f"Running R script: {r_script}")
            result = subprocess.run(['Rscript', r_script] + [str(v) for v in selected_versions], capture_output=True, text=True)
            if result.returncode != 0:
                logging.error(f"Error running {r_script}: {result.stderr}")
                return jsonify({"error": result.stderr}), 500
            logging.info(f"Successfully ran R script: {r_script}")

    except Exception as e:
        logging.exception(f"Exception occurred: {str(e)}")
        return jsonify({"error": str(e)}), 500

    return '', 204

if __name__ == '__main__':
    app.run(debug=True, port=5007)
