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
STATIC_FOLDER = os.path.join(BASE_DIR,'Original')
ORIGINAL_BASE_DIR = os.path.join(BASE_DIR, 'backend', 'Original')

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
    """Remove a batch folder for the specified version from both locations."""
    batch_folder = os.path.join(STATIC_FOLDER, f'Batch({version})')
    original_batch_folder = os.path.join(ORIGINAL_BASE_DIR, f'Batch({version})')

    # Ensure thread-safe access
    with lock:
        success_messages = []
        error_messages = []

        # Remove from STATIC_FOLDER
        if os.path.exists(batch_folder):
            try:
                shutil.rmtree(batch_folder)  # Remove the entire folder
                success_messages.append(f"Batch({version}) removed from main location.")
            except Exception as e:
                error_messages.append(f"Error removing main batch: {str(e)}")
        else:
            error_messages.append(f"Batch({version}) does not exist in main location.")

        # Remove from ORIGINAL_BASE_DIR
        if os.path.exists(original_batch_folder):
            try:
                shutil.rmtree(original_batch_folder)  # Remove the entire folder
                success_messages.append(f"Batch({version}) removed from original location.")
            except Exception as e:
                error_messages.append(f"Error removing original batch: {str(e)}")
        else:
            error_messages.append(f"Batch({version}) does not exist in original location.")

        if error_messages and not success_messages:
            return {"status": "error", "message": " ".join(error_messages)}
        elif success_messages:
            logging.info(f"Batch({version}) removed from both locations successfully.")
            return {"status": "success", "message": " ".join(success_messages)}


@app.route('/clear-log', methods=['POST'])
def clear_log():
    """Clear the contents of a specified log file."""
    data = request.json
    file_path = data.get('path')

    if not file_path:
        return jsonify({"status": "error", "message": "No file path provided"}), 400

    try:
        # Check if the file exists
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": f"File not found: {file_path}"}), 404

        # Clear file contents by opening in write mode
        with open(file_path, 'w') as f:
            f.write('')

        return jsonify({"status": "success", "message": f"File cleared: {file_path}"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Error clearing file: {str(e)}"}), 500


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
