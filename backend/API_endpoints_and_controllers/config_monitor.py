from flask import Flask, request, jsonify
import os
import logging
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Set up logging to file
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'config_monitor.log')

file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)

logger = logging.getLogger('config_monitor')
logger.addHandler(file_handler)
logger.setLevel(logging.INFO)

@app.route('/monitor/config', methods=['POST'])
def get_config_status():
    try:
        data = request.get_json()
        version = data.get('version')
        
        if not version:
            logger.error("No version provided")
            return jsonify({"error": "Version is required"}), 400

        # Log monitoring request
        logger.info(f"Configuration monitoring request for version {version}")

        # Get current configuration values
        config_values = get_current_config(version)
        
        # Log successful response
        logger.info(f"Returning {len(config_values)} configuration values for version {version}")
        
        return jsonify({
            "status": "success",
            "version": version,
            "config_values": config_values
        })

    except Exception as e:
        logger.error(f"Error in config monitoring: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/monitor/sensitivity', methods=['POST'])
def get_sensitivity_status():
    try:
        data = request.get_json()
        version = data.get('version')
        
        if not version:
            logger.error("No version provided")
            return jsonify({"error": "Version is required"}), 400

        # Log monitoring request
        logger.info(f"Sensitivity monitoring request for version {version}")

        # Get current sensitivity settings
        sensitivity_values = get_current_sensitivity(version)
        
        # Log successful response
        logger.info(f"Returning sensitivity values for version {version}")
        
        return jsonify({
            "status": "success",
            "version": version,
            "sensitivity_values": sensitivity_values
        })

    except Exception as e:
        logger.error(f"Error in sensitivity monitoring: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_current_config(version):
    """Get current configuration values from U_configurations file"""
    try:
        # Log the attempt
        logger.info(f"Fetching configuration values for version {version}")
        
        # Always convert to integer version - ignore decimals
        try:
            # Extract the integer part from the version
            if isinstance(version, str):
                if '.' in version:
                    int_version = int(version.split('.')[0])
                else:
                    int_version = int(version)
            else:
                int_version = int(float(version))
                
            logger.info(f"Using integer version: {int_version}")
        except:
            logger.info(f"Could not convert version to integer, using as is: {version}")
            int_version = version
            
        # Define base directory for Original folder
        base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "Original")
        
        # Search for available main version configuration files
        available_files = []
        content = None
        
        # First try all batch directories that might contain our version
        for dir_name in os.listdir(base_dir):
            if dir_name.startswith('Batch('):
                # For each batch dir, check if it has a config file with our int_version
                batch_dir = os.path.join(base_dir, dir_name)
                config_dir = os.path.join(batch_dir, f'ConfigurationPlotSpec({int_version})')
                
                if os.path.exists(config_dir):
                    config_file = os.path.join(config_dir, f'U_configurations({int_version}).py')
                    if os.path.exists(config_file):
                        available_files.append(config_file)
                        
        # If we found files, use the first one
        if available_files:
            file_path = available_files[0]
            logger.info(f"Found configuration file: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        else:
            # Fallback to old method if no files found
            logger.info(f"No configuration files found for version {int_version}, using fallback search")
            
            # Try specific paths as fallback
            possible_paths = [
                os.path.join(base_dir, f'Batch({int_version})/ConfigurationPlotSpec({int_version})/U_configurations({int_version}).py'),
                os.path.join(base_dir, f'Batch({int_version})/U_configurations({int_version}).py'),
                os.path.join(base_dir, f'Batch({int_version})/U_configurations.py')
            ]
            
            found_file = False
            for path in possible_paths:
                if os.path.exists(path):
                    logger.info(f"Found configuration file with fallback: {path}")
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    found_file = True
                    break
                    
            if not found_file:
                logger.warning(f"No configuration files found for version {int_version}")
                return []
                
        # If we have content, extract the filtered values
        if content:
            # Extract filteredValues section
            import re
            filtered_values_match = re.search(r'"filteredValues":\s*\[(.*?)\]', content, re.DOTALL)
            if filtered_values_match:
                filtered_values_str = filtered_values_match.group(1)
                # Parse individual entries
                entries = []
                current_entry = {}
                for line in filtered_values_str.split('\n'):
                    line = line.strip()
                    if not line or line == '{' or line == '},':
                        if current_entry:
                            entries.append(current_entry)
                            current_entry = {}
                        continue
                        
                    # Extract key-value pairs
                    match = re.match(r'"(\w+)"\s*:\s*(.+?)(,|\s*$)', line)
                    if match:
                        key, value = match.group(1), match.group(2).rstrip(',')
                        # Clean up value
                        if value.startswith('"') and value.endswith('"'):
                            value = value[1:-1]  # Remove quotes
                        elif value.lower() == 'true':
                            value = True
                        elif value.lower() == 'false':
                            value = False
                        else:
                            try:
                                value = float(value) if '.' in value else int(value)
                            except ValueError:
                                pass
                        current_entry[key] = value
                
                if current_entry:  # Add last entry if exists
                    entries.append(current_entry)
                    
                logger.info(f"Successfully parsed {len(entries)} configuration entries")
                return entries
            
            logger.warning("No filteredValues section found in configuration file")
        
        # If we got here, either no content or no filtered values found
        logger.error(f"No valid configuration data found for version {version}")
        return []
        
    except Exception as e:
        logger.error(f"Error getting config values: {str(e)}")
        raise

def get_current_sensitivity(version):
    """Get current sensitivity settings from storage"""
    try:
        # Log the attempt
        logger.info(f"Fetching sensitivity values for version {version}")
        
        # Your implementation to get current sensitivity values
        # This should connect to your storage/database
        
        return []  # Replace with actual implementation
        
    except Exception as e:
        logger.error(f"Error getting sensitivity values: {str(e)}")
        raise

if __name__ == '__main__':
    app.run(port=5001, debug=True)
