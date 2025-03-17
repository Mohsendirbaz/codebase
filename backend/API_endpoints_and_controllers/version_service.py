from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Define the base directory of the project
BASE_DIR = os.path.join(os.path.dirname(__file__), '..', '..')
STATIC_FOLDER = os.path.join(BASE_DIR, 'Original')

def get_all_versions():
    """Scan the Original directory and extract version numbers from Batch folders."""
    if not os.path.exists(STATIC_FOLDER):
        os.makedirs(STATIC_FOLDER)
    
    batches = [d for d in os.listdir(STATIC_FOLDER) if os.path.isdir(os.path.join(STATIC_FOLDER, d)) and d.startswith('Batch')]
    versions = []

    for batch in batches:
        try:
            # Extract numeric portion from batch folder name
            version_str = ''.join(filter(lambda x: x.isdigit() or x == '.', batch))
            version = float(version_str) if '.' in version_str else int(version_str)
            versions.append(version)
        except ValueError:
            pass

    return sorted(versions)

@app.route('/versions', methods=['GET'])
def list_versions_route():
    try:
        versions = get_all_versions()
        return jsonify({"versions": versions}), 200
    except Exception as e:
        return jsonify({"message": "Error listing versions", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8002)
