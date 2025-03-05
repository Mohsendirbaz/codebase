from flask import Flask, request, jsonify
import os
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", "Original")

def medieval_parse_and_sanitize(content):
    filtered_values_json = []

    # Locate and parse `filteredValues` section
    filtered_values_match = re.search(r'"filteredValues":\s*\[', content)
    if not filtered_values_match:
        return filtered_values_json  # Return empty if `filteredValues` not found

    # Start parsing from the location of the `filteredValues` array
    filtered_values_start = filtered_values_match.end()
    filtered_values_end = content.find(']', filtered_values_start)
    if filtered_values_end == -1:
        return filtered_values_json  # Return empty if `filteredValues` array is malformed

    # Extract the content of the `filteredValues` array
    filtered_values_content = content[filtered_values_start:filtered_values_end]

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
            pass  # Keep as string if conversion fails

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

        # Move to the next item in `filteredValues`
        filtered_values_content = filtered_values_content[value_end:]
    
    return filtered_values_json

@app.route('/load_configuration', methods=['POST'])
def load_configuration():
    data = request.get_json()
    version = data.get('version')
    
    if not version:
        return jsonify({"error": "Version is required"}), 400

    original_file_path = os.path.join(UPLOAD_DIR, f'Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py')
    
    try:
        with open(original_file_path, 'r', encoding='utf-8') as f:
            raw_content = f.read()
    except Exception as e:
        return jsonify({"error": f"Error reading from original file: {str(e)}"}), 500

    # Parse and sanitize the content to get only `id`, `value`, and `remarks`
    filtered_values_json = medieval_parse_and_sanitize(raw_content)

    # Return only the sanitized data
    return jsonify({"filteredValues": filtered_values_json})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
