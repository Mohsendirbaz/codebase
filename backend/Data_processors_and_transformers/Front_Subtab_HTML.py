"""Flask service (port:8009) - Processes HTML files from batch results"""
from flask import Flask, jsonify
from flask_cors import CORS
import os
import logging
import logging.config

app = Flask(__name__)
CORS(app)

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", "Original")

def get_versions(directory: str):
    if not os.path.exists(directory):
        logging.warning(f"Directory not found: {directory}")
        return []
    return [name.split("(")[1].split(")")[0] for name in os.listdir(directory) 
            if name.startswith("Batch(") and name.endswith(")")]

@app.route('/api/album_html/<version>')
def get_html_files(version: str):
    logging.info(f"Processing request for version: {version}")
    results_path = os.path.join(BASE_PATH, f"Batch({version})", f"Results({version})")
    html_files = []

    if not os.path.exists(results_path):
        logging.warning(f"Results folder not found: {results_path}")
        return jsonify([])

    for root, _, files in os.walk(results_path):
        for file in files:
            if file.lower().endswith('.html'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    album = os.path.basename(os.path.dirname(file_path))
                    html_files.append({
                        "name": file,
                        "content": content,
                        "album": album
                    })
                    logging.info(f"Processed {file}")
                except Exception as e:
                    logging.error(f"Failed to process {file}: {e}")

    return jsonify(html_files)

if __name__ == '__main__':
    versions = get_versions(BASE_PATH)
    app.run(port=8009)
