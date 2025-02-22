from flask import Flask, request
from flask_cors import CORS
import subprocess
import os
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

log_file_path = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\PNG.log"
logging.basicConfig(
    filename=log_file_path,
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)
logger = logging.getLogger(__name__)

script_dir = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend"
script_files = ['PNG_PLOT.py']
def log_properties_as_table(properties):
    # Create a header for the table
    header = f"{'Row':<5} | {'Property'}"
    logger.info(header)
    logger.info('-' * len(header))  # print a separator line
    
    # Log each property with its index
    for index, prop in enumerate(properties, 1):
        logger.info(f"{index:<5} | {prop}")
@app.route('/runPNG', methods=['POST'])
def run_scripts():
    data = request.get_json()
    selected_versions = data.get('selectedVersions', [1])
    selected_properties = data.get('selectedProperties', ['plantLifetimeAmount1'])
    remarks = data.get('remarks', 'off')
    customized_features = data.get('customizedFeatures', 'off')

    logging.info(f"Selected versions: {selected_versions}")
    log_properties_as_table(selected_properties)
    logging.info(f"Remarks state: {remarks}")
    logging.info(f"Customized Features state: {customized_features}")
    
    try:
        os.chdir(script_dir)
        selected_versions_str = ",".join(map(str, selected_versions))
        selected_properties_str = ",".join(selected_properties)

        for script_filename in script_files:
            result = subprocess.run(
                ['python', script_filename, selected_versions_str, selected_properties_str, remarks, customized_features],
                capture_output=True, text=True, env=os.environ.copy()
            )
            logging.info(f"Output of {script_filename}: {result.stdout}")
            if result.returncode != 0:
                return f"Error running {script_filename}: {result.stderr}", 500
    except Exception as e:
        return f"Unexpected error: {e}", 500

    return '', 204  # No Content response

if __name__ == '__main__':
    app.run(debug=True, port=5008)
