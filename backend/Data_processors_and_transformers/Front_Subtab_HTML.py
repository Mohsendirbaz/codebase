"""Flask service (port:8009) - Processes HTML files from batch results"""
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
import re
import logging
import logging.config
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Use Path for more consistent path handling
BASE_PATH = Path(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))) / "Original"

def get_versions(directory: Path):
    if not directory.exists():
        logging.warning(f"Directory not found: {directory}")
        return []
    return [name.split("(")[1].split(")")[0] for name in os.listdir(directory)
            if name.startswith("Batch(") and name.endswith(")")]

# Updated get_html_files function to handle HTML files in the nested directory structure
@app.route('/api/album_html/<version>')
def get_html_files(version: str):
    logging.info(f"Processing request for version: {version}")
    html_files = []

    if not BASE_PATH.exists():
        logging.warning(f"Directory not found: {BASE_PATH}")
        return jsonify([])

    # Construct the path to the version's Results directory
    version_folder = BASE_PATH / f"Batch({version})" / f"Results({version})"
    logging.info(f"Scanning directory: {version_folder}")

    if not version_folder.exists():
        logging.warning(f"Version folder not found: {version_folder}")
        return jsonify([])

    # Look for HTML files in the Results directory
    for item in os.listdir(version_folder):
        item_path = version_folder / item

        # Check if it's a directory that might contain HTML files
        if os.path.isdir(item_path):
            logging.info(f"Checking directory: {item_path}")
            for file in os.listdir(item_path):
                if file.lower().endswith('.html'):
                    process_html_file(file, item_path, html_files)
        # Also check for HTML files directly in the Results directory
        elif item.lower().endswith('.html'):
            process_html_file(item, version_folder, html_files)

    logging.info(f"Found {len(html_files)} HTML files across {len(set(f['album'] for f in html_files))} albums")
    return jsonify(html_files)

def process_html_file(file, directory, html_files):
    """Helper function to process an HTML file and add it to the list"""
    file_path = directory / file
    try:
        # Read the HTML content with proper encoding
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Log the content length to verify it's being read correctly
        logging.info(f"Read HTML content from {file}, length: {len(content)}")

        album = directory.name

        # Check if this is from an organized album (HTML_v1_2_PlotType)
        album_match = re.match(r"HTML_v(\d+_\d+)_(.+)", album)
        if album_match:
            # This is an organized album
            versions_id = album_match.group(1)
            plot_type = album_match.group(2)
            display_name = f"{plot_type.replace('_', ' ')} for versions [{versions_id.replace('_', ', ')}]"
        else:
            # Check if this is a legacy plot directory (v1_2_Annual_Cash_Flows_Plot)
            legacy_match = re.match(r"v(\d+_\d+)_(.+)_Plot", album)
            if legacy_match:
                versions_id = legacy_match.group(1)
                plot_type = legacy_match.group(2)
                display_name = f"{plot_type.replace('_', ' ')} for versions [{versions_id.replace('_', ', ')}]"
            else:
                # Fall back to the original album name
                display_name = album.replace('_', ' ')

        # Create the HTML file object with all necessary information
        html_file_obj = {
            "name": file,
            "content": content,  # Include the full HTML content
            "album": album,
            "display_name": display_name,
            "path": str(file_path)  # Convert Path to string for JSON serialization
        }

        # Log the object structure (without the full content)
        logging.info(f"Created HTML file object: {file}, album: {album}, path: {str(file_path)}")

        # Add to the list of HTML files
        html_files.append(html_file_obj)
        logging.info(f"Processed {file} from album {album}")
    except Exception as e:
        logging.error(f"Failed to process {file}: {e}")
        logging.error(f"Exception details: {str(e)}")

# Add a route to serve static files from the correct directory
@app.route('/static/html/<version>/<album>/<filename>')
def serve_html(version, album, filename):
    """Serve HTML files from the correct directory based on version and album"""
    # Construct the path to the HTML file
    version_folder = BASE_PATH / f"Batch({version})" / f"Results({version})"

    # Try to find the file in the album directory first
    file_path = version_folder / album / filename

    # If not found, try directly in the Results directory
    if not file_path.exists():
        file_path = version_folder / filename
    logging.info(f"Serving HTML file: {file_path}")
    logging.info(f"File exists: {file_path.exists()}")

    # List all files in the directory to help debug
    parent_dir = file_path.parent
    if parent_dir.exists():
        logging.info(f"Files in directory {parent_dir}:")
        for file in parent_dir.iterdir():
            logging.info(f"  - {file.name}")
    else:
        logging.error(f"Directory not found: {parent_dir}")

    # Check if the file exists
    if not file_path.exists():
        logging.error(f"HTML file not found: {file_path}")
        return "File not found", 404

    # Serve the file from its directory
    try:
        logging.info(f"Attempting to serve file: {file_path.name} from directory: {str(file_path.parent)}")
        response = send_from_directory(str(file_path.parent), file_path.name)
        logging.info(f"Successfully served file: {file_path.name}")
        return response
    except Exception as e:
        logging.error(f"Error serving file: {e}")
        return f"Error serving file: {e}", 500

# Add a test route to verify the server is working
@app.route('/test')
def test():
    return "Flask server is working!"

if __name__ == '__main__':
    # Configure basic logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Get available versions and start the server
    versions = get_versions(BASE_PATH)
    logging.info(f"Available versions: {versions}")
    app.run(port=8009)