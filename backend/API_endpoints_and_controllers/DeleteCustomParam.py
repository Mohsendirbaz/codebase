from flask import Flask, request, jsonify
import os
import re
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set up the upload directory path
script_dir = Path(__file__).resolve().parent.parent
UPLOAD_DIR = script_dir.parent / "Original"

@app.route('/delete_custom_param', methods=['POST'])
def delete_custom_param():
    """
    Delete a customized parameter from the U_configurations file.

    Expected JSON payload:
    {
        "version": "1",
        "paramId": "someParameterId",
        "start": 5,
        "end": 10
    }

    Returns:
        JSON response with success message or error
    """
    data = request.get_json()
    version = data.get('version')
    param_id = data.get('paramId')
    start = data.get('start')
    end = data.get('end')

    # Validate required parameters
    if not all([version, param_id, start is not None, end is not None]):
        return jsonify({"error": "Missing required parameters"}), 400

    # Construct the path to the U_configurations file
    file_path = UPLOAD_DIR / f'Batch({version})/ConfigurationPlotSpec({version})/U_configurations({version}).py'

    try:
        # Read the original file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find all filteredValue objects in the content
        # This pattern is more flexible and can handle different JSON formats
        pattern = re.compile(r'({[\s\n]*"filteredValue"[\s\n]*:[\s\n]*{[^}]*}[\s\n]*})')
        all_matches = list(pattern.finditer(content))

        # Filter matches to find the one with matching id, start, and end
        matches = []
        for match in all_matches:
            match_text = match.group(1)

            # Extract id, start, and end from the match
            id_match = re.search(r'"id"\s*:\s*"([^"]+)"', match_text)
            start_match = re.search(r'"start"\s*:\s*(\d+)', match_text)
            end_match = re.search(r'"end"\s*:\s*(\d+)', match_text)

            # Check if this match has the properties we're looking for
            if (id_match and start_match and end_match and
                id_match.group(1) == param_id and
                int(start_match.group(1)) == int(start) and
                int(end_match.group(1)) == int(end)):
                matches.append(match)

        if not matches:
            return jsonify({"error": "Parameter not found"}), 404

        # Remove the parameter from the content
        new_content = content[:matches[0].start()] + content[matches[0].end():]

        # Clean up any trailing commas that might be left after removal
        new_content = new_content.replace(',\n\n', '\n\n')
        new_content = new_content.replace(',\n]', '\n]')

        # Write the updated content back to the file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return jsonify({"message": "Parameter deleted successfully"}), 200

    except FileNotFoundError:
        return jsonify({"error": f"Configuration file not found for version {version}"}), 404
    except Exception as e:
        return jsonify({"error": f"Error deleting parameter: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(port=5002, debug=True)
