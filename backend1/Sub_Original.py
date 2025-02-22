from flask import Flask, request
from flask_cors import CORS
import subprocess
import os
import logging
import json
app = Flask(__name__)
CORS(app)  # This enables CORS for all routes

# Absolute path for log file
log_file_path = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend\app_executionSub.log"

# Ensure the logging directory exists
if not os.path.exists(os.path.dirname(log_file_path)):
    os.makedirs(os.path.dirname(log_file_path))

# Configure logging
logging.basicConfig(
    filename=log_file_path,
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s %(message)s'
)

logging.debug("Logging is configured and working correctly.")

script_dir = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend"
script_files = [ 'AggregatedSubPlots2.py']

@app.route('/runSub', methods=['POST'])
def run_scripts():
    data = request.get_json()
    selected_versions = data.get('selectedVersions', [1])
    selected_properties = data.get('selectedProperties', ['initialSellingPriceAmount1'])  # Default to a list
    remarks = data.get('remarks', 'on')  # New remarks state passed from frontend
    customized_features = data.get('customizedFeatures', 'off')
    selected_v = data.get('selectedV', None)

    logging.info(f"Received data: {data}")
   

    try:
        # Change working directory to the script directory
        os.chdir(script_dir)
        logging.info(f"Changed working directory to: {script_dir}")

        # Convert versions and properties to a string format suitable for command line arguments
        selected_versions_str = ",".join(map(str, selected_versions))
        selected_properties_str = ",".join(selected_properties)

        logging.debug(f"Formatted versions string: {selected_versions_str}")
        logging.debug(f"Formatted properties string: {selected_properties_str}")

        # Run the script with the selected versions, properties, and remarks as arguments
        for script_filename in script_files:
          
            result = subprocess.run(
                ['python', script_filename, selected_versions_str, selected_properties_str, remarks,customized_features, json.dumps(selected_v)],  # Added remarks argument
                capture_output=True, text=True
            )
            
            # Check for errors in each script execution
            if result.returncode != 0:
                logging.error(f"Error running {script_filename}: {result.stderr}")
                return f"Error running {script_filename}: {result.stderr}", 500

    except FileNotFoundError:
        logging.error(f"File not found in directory: {script_dir}")
        return f"File not found in directory: {script_dir}", 404
    except subprocess.CalledProcessError as e:
        logging.error(f"Error running scripts: {e}")
        return f"Error running scripts: {e}", 500
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return f"Unexpected error: {e}", 500

    return '', 204  # No Content response

if __name__ == '__main__':
    app.run(debug=True, port=5009)
