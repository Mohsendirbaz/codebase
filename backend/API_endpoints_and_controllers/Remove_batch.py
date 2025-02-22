from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import shutil
import threading
import logging

app = Flask(__name__)
CORS(app)

# Define the base directory of the project
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
STATIC_FOLDER = os.path.join(BASE_DIR, 'public', 'Original')

# Ensure the static/uploads directory exists
if not os.path.exists(STATIC_FOLDER):
    os.makedirs(STATIC_FOLDER)

lock = threading.Lock()

def get_all_versions():
    if not os.path.exists(STATIC_FOLDER):
        os.makedirs(STATIC_FOLDER)
    
    batches = [d for d in os.listdir(STATIC_FOLDER) if os.path.isdir(os.path.join(STATIC_FOLDER, d)) and d.startswith('Batch')]
    versions = []

    for batch in batches:
        try:
            version = int(batch.replace('Batch(', '').replace(')', ''))
            versions.append(version)
        except ValueError:
            pass

    return sorted(versions)


def remove_batch(version):
    """Remove a batch folder for the specified version."""
    batch_folder = os.path.join(STATIC_FOLDER, f'Batch({version})')

    # Ensure thread-safe access
    with lock:
        if os.path.exists(batch_folder):
            try:
                shutil.rmtree(batch_folder)  # Remove the entire folder
                return {"status": "success", "message": f"Batch({version}) removed successfully."}
                
            except Exception as e:
                return {"status": "error", "message": f"Error removing batch: {str(e)}"}
        else:
            return {"status": "error", "message": f"Batch({version}) does not exist."}
    logging.info(f"Batch({version}) removed successfully.")


@app.route('/Remove_batch', methods=['POST'])
def remove_batch_endpoint():
    """Handle batch removal via POST request."""
    data = request.json
    version = data.get('version')
    try:
        # Create a new batch and get the new batch number
        
        rb = remove_batch(version)
        max_version=max(get_all_versions())
        return jsonify({"rb": rb,
            "max_version": max_version
        }), 200
    except Exception as e:
        return jsonify({"message": "Error creating new batches", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=7001)
