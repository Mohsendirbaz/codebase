from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import os
import json
import traceback

app = Flask(__name__)
# Enable CORS for all routes to allow requests from the React frontend
CORS(app)

# Configuration for file paths - using the actual project structure
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),"Original")

@app.route('/config_monitor/standard/<version>', methods=['GET'])
def get_standard_config(version):
    """
    Dedicated endpoint for standard configuration parameters
    """
    try:
        app.logger.info(f"Loading standard configuration for version: {version}")
        
        # Construct path to configuration file
        file_path = os.path.join(UPLOAD_DIR, f'Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py')
        
        if not os.path.exists(file_path):
            app.logger.warning(f"Configuration file not found: {file_path}")
            return jsonify({"error": f"Configuration file for version {version} not found"}), 404
        
        # Initialize filtered values
        filtered_values = []
        
        # Read and parse the file
        with open(file_path, 'r') as file:
            for line in file:
                line = line.strip()
                if line:
                    try:
                        # Parse JSON object from line
                        data = json.loads(line)
                        
                        # Extract filteredValues array if present
                        if 'filteredValues' in data and isinstance(data['filteredValues'], list):
                            filtered_values.extend(data['filteredValues'])
                            # Break after finding the filteredValues array
                            # Assuming it only appears once in the file
                            break
                    except json.JSONDecodeError:
                        app.logger.warning(f"Failed to parse line as JSON: {line}")
                        continue
        
        # Return the filtered values
        return jsonify({"filteredValues": filtered_values})
        
    except Exception as e:
        app.logger.error(f"Error in get_standard_config: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/config_monitor/time_dependent/<version>', methods=['GET'])
def get_time_dependent_config(version):
    """
    Dedicated endpoint for time-dependent parameters
    """
    try:
        app.logger.info(f"Loading time-dependent configuration for version: {version}")
        
        # Construct path to configuration file
        file_path = os.path.join(UPLOAD_DIR, f'Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py')
        
        if not os.path.exists(file_path):
            app.logger.warning(f"Configuration file not found: {file_path}")
            return jsonify({"error": f"Configuration file for version {version} not found"}), 404
        
        # Initialize time-dependent parameters
        time_dependent_params = []
        
        # Read and parse the file
        with open(file_path, 'r') as file:
            for line in file:
                line = line.strip()
                if line:
                    try:
                        # Parse JSON object from line
                        data = json.loads(line)
                        
                        # Extract filteredValue object if present
                        if 'filteredValue' in data and isinstance(data['filteredValue'], dict):
                            # Make sure it has start/end periods
                            if 'start' in data['filteredValue'] and 'end' in data['filteredValue']:
                                time_dependent_params.append(data['filteredValue'])
                    except json.JSONDecodeError:
                        continue
        
        app.logger.info(f"Found {len(time_dependent_params)} time-dependent parameters")
        return jsonify({"timeDependent": time_dependent_params})
        
    except Exception as e:
        app.logger.error(f"Error in get_time_dependent_config: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/config_monitor/raw/<version>', methods=['GET'])
def get_raw_config_file(version):
    """
    Endpoint to get the raw configuration file content
    """
    try:
        app.logger.info(f"Fetching raw configuration file for version: {version}")
        
        # Construct path to configuration file
        file_path = os.path.join(UPLOAD_DIR, f'Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py')
        
        if not os.path.exists(file_path):
            app.logger.warning(f"Configuration file not found: {file_path}")
            return jsonify({"error": f"Configuration file for version {version} not found"}), 404
        
        # Read the entire file
        with open(file_path, 'r') as file:
            content = file.read()
        
        return Response(content, mimetype='text/plain')
        
    except Exception as e:
        app.logger.error(f"Error in get_raw_config_file: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/config_monitor/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint
    """
    return jsonify({"status": "healthy", "service": "Config Monitor API"})

@app.route('/', methods=['GET'])
def index():
    """
    Index route with information about available endpoints
    """
    endpoints = {
        "standard": "GET /config_monitor/standard/<version>",
        "time_dependent": "GET /config_monitor/time_dependent/<version>",
        "raw": "GET /config_monitor/raw/<version>",
        "health": "GET /config_monitor/health"
    }
    return jsonify({
        "name": "Configuration Monitor API",
        "endpoints": endpoints
    })

if __name__ == '__main__':
    # Enable more detailed logging
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the application on port 5001 to avoid conflict with existing server
    app.run(debug=True, host='0.0.0.0', port=5001)
