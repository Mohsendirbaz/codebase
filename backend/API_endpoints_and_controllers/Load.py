from flask import Flask, request, jsonify
import os
import re
import logging
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('config_loader')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define base directory using an absolute path for consistency
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "Original")

def medieval_parse_and_sanitize(content):
    """
    Parse U_configuration files to extract filteredValues data
    Uses regex and string manipulation to handle different formatting styles
    """
    filtered_values_json = []
    logger.info(f"Parsing configuration file content (length: {len(content)} chars)")

    # Locate and parse `filteredValues` section
    # Flexible pattern matching for different quote styles and whitespace
    filtered_values_match = re.search(r'["\']filteredValues["\']\s*:\s*\[', content)
    if not filtered_values_match:
        logger.warning("No 'filteredValues' section found in configuration file")
        return filtered_values_json  # Return empty if `filteredValues` not found

    # Start parsing from the location of the `filteredValues` array
    filtered_values_start = filtered_values_match.end()
    filtered_values_end = content.find(']', filtered_values_start)
    if filtered_values_end == -1:
        logger.warning("Malformed 'filteredValues' array in configuration file")
        return filtered_values_json  # Return empty if `filteredValues` array is malformed

    # Extract the content of the `filteredValues` array
    filtered_values_content = content[filtered_values_start:filtered_values_end]
    logger.debug(f"Found filteredValues content section of length: {len(filtered_values_content)}")

    item_count = 0
    # Process each entry within `filteredValues`
    while True:
        # Parse `id`
        id_start = filtered_values_content.find('"id":"')
        if id_start == -1:
            break
        id_start += len('"id":"')
        id_end = filtered_values_content.find('"', id_start)
        id_value = filtered_values_content[id_start:id_end]

        # Parse `value`
        value_start = filtered_values_content.find('"value":', id_end)
        if value_start == -1:
            break
        value_start += len('"value":')
        value_end = filtered_values_content.find(',', value_start)
        if filtered_values_content[value_start] == '"':
            value_end = filtered_values_content.find('"', value_start + 1) + 1
            value_value = filtered_values_content[value_start:value_end].strip('"')
        else:
            value_end = filtered_values_content.find(',', value_start)
            if value_end == -1:
                value_end = filtered_values_content.find('}', value_start)
            value_value = filtered_values_content[value_start:value_end].strip()

        # Convert value to number if possible
        try:
            value_value = float(value_value) if '.' in value_value else int(value_value)
        except ValueError:
            # Keep as string if conversion fails
            pass

        # Parse `remarks` to capture both "remarks":"" and missing `remarks`
        remarks_match = re.search(r'"remarks":"(.*?)"', filtered_values_content[id_end:])
        if remarks_match:
            remarks_value = remarks_match.group(1).replace("\\\\", "\\")  # Replace double backslashes with single backslash
        else:
            remarks_value = None  # Explicitly set to None if `remarks` is missing

        # Append only id, value, and remarks for this entry to `filtered_values_json`
        filtered_values_json.append({
            "id": id_value.strip('"'),
            "value": value_value,  # Numeric if converted successfully
            "remarks": remarks_value  # Will be None if `remarks` is missing
        })
        
        item_count += 1
        # Move to the next item in `filteredValues`
        filtered_values_content = filtered_values_content[value_end:]
    
    logger.info(f"Successfully parsed {item_count} configuration items")
    return filtered_values_json

@app.route('/load_configuration', methods=['POST'])
def load_configuration():
    data = request.get_json()
    version = data.get('version')
    
    if not version:
        logger.error("Missing version parameter in request")
        return jsonify({"error": "Version is required"}), 400

    # Path construction with parentheses around version number
    original_file_path = os.path.join(
        UPLOAD_DIR, 
        f"Batch({version})",
        f"ConfigurationPlotSpec({version})",
        f"U_configurations({version}).py"
    )
    
    logger.info(f"Attempting to load configuration file: {original_file_path}")
    
    try:
        with open(original_file_path, 'r', encoding='utf-8') as f:
            raw_content = f.read()
            logger.info(f"Successfully read configuration file of length: {len(raw_content)}")
    except FileNotFoundError:
        error_msg = f"Configuration file not found: {original_file_path}"
        logger.error(error_msg)
        return jsonify({
            "error": error_msg,
            "paths_checked": [original_file_path],
            "current_directory": os.getcwd()
        }), 404
    except Exception as e:
        error_msg = f"Error reading from configuration file: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

    # Parse and sanitize the content to get only `id`, `value`, and `remarks`
    filtered_values_json = medieval_parse_and_sanitize(raw_content)
    
    if not filtered_values_json:
        logger.warning(f"No configuration values extracted from file: {original_file_path}")
    
    # Return the sanitized data with additional metadata
    response_data = {
        "filteredValues": filtered_values_json,
        "metadata": {
            "version": version,
            "itemCount": len(filtered_values_json),
            "sourceFile": os.path.basename(original_file_path)
        }
    }
    
    return jsonify(response_data)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
