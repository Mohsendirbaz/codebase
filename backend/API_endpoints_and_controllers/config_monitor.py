from flask import Flask, request, jsonify
import os
import re
import logging
import sys
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('config_monitor')

# Fix import path issues
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
    logger.info(f"Added {parent_dir} to Python path")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define base directory using an absolute path for consistency
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "Original")

# Import the medieval_parse_and_sanitize function directly
# This approach avoids the 'backend' module import problem
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from Load import medieval_parse_and_sanitize

@app.route('/parameters/<version>', methods=['GET'])
def get_parameters(version):
    """
    Retrieve parameters available for sensitivity analysis for the specified version
    """
    try:
        # Path to the configuration file
        config_file_path = os.path.join(
            UPLOAD_DIR,
            f"Batch({version})",
            f"ConfigurationPlotSpec({version})",
            f"U_configurations{version}.py"  # Removed parentheses to match actual naming
        )
        
        logger.info(f"Attempting to access file at: {config_file_path}")
        
        # Check if file exists, if not try alternative naming pattern
        if not os.path.exists(config_file_path):
            alt_path = os.path.join(
                UPLOAD_DIR,
                f"Batch({version})",
                f"ConfigurationPlotSpec({version})",
                f"U_configurations({version}).py"
            )
            if os.path.exists(alt_path):
                config_file_path = alt_path
                logger.info(f"Using alternative file path: {config_file_path}")
            else:
                logger.warning(f"Neither {config_file_path} nor {alt_path} exists")
                return jsonify({"error": "Configuration file not found", "parameters": []}), 404
        
        # Load and parse the configuration file
        with open(config_file_path, 'r', encoding='utf-8') as f:
            raw_content = f.read()
            
        # Parse the configuration to extract parameters
        filtered_values = medieval_parse_and_sanitize(raw_content)
        
        # Transform to the format needed by the frontend
        parameters = []
        for item in filtered_values:
            # Extract the parameter number from Amount format
            amount_match = re.search(r'Amount(\d+)', item['id'])
            if amount_match:
                param_num = amount_match.group(1)
                # Create parameter object
                parameters.append({
                    'id': item['id'],
                    'name': item.get('remarks', '') or item['id'],  # Fallback to ID if no remarks
                    'value': item['value'],
                    'parameterKey': f'S{param_num}'  # Corresponding sensitivity parameter key
                })
        
        logger.info(f"Successfully extracted {len(parameters)} parameters for version {version}")
        return jsonify({"parameters": parameters})
        
    except FileNotFoundError:
        error_msg = f"Configuration file not found for version {version}"
        logger.error(error_msg)
        return jsonify({"error": error_msg, "parameters": []}), 404
    except Exception as e:
        error_msg = f"Error retrieving parameters: {str(e)}"
        logger.error(f"{error_msg}\n{repr(e)}")
        return jsonify({"error": error_msg, "parameters": []}), 500

# Diagnostic endpoint to verify the server is running
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "upload_dir_exists": os.path.exists(UPLOAD_DIR),
        "base_dir": BASE_DIR
    })

if __name__ == '__main__':
    # Log detailed information about environment
    logger.info(f"Starting config_monitor server on port 5001")
    logger.info(f"Python path: {sys.path}")
    logger.info(f"Current directory: {os.getcwd()}")
    logger.info(f"Base directory: {BASE_DIR}")
    logger.info(f"Upload directory: {UPLOAD_DIR}")
    
    app.run(port=5001, debug=True)