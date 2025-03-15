"""Flask service (port:8009) - Processes HTML files from batch results"""
from flask import Flask, jsonify
from flask_cors import CORS
import os
import re
import logging
import logging.config
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Use Path for more consistent path handling
BASE_PATH = Path(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))) / "public" / "Original"

def get_versions(directory: Path):
    if not directory.exists():
        logging.warning(f"Directory not found: {directory}")
        return []
    return [name.split("(")[1].split(")")[0] for name in os.listdir(directory) 
            if name.startswith("Batch(") and name.endswith(")")]

# Updated get_html_files function to handle both organized and legacy HTML files
@app.route('/api/album_html/<version>')
def get_html_files(version: str):
    logging.info(f"Processing request for version: {version}")
    results_path = BASE_PATH / f"Batch({version})" / f"Results({version})"
    html_files = []

    if not results_path.exists():
        logging.warning(f"Results folder not found: {results_path}")
        return jsonify([])

    # First, look for organized HTML albums (with HTML_ prefix)
    html_albums = [d for d in os.listdir(results_path) 
                  if (results_path / d).is_dir() and d.startswith("HTML_")]
    
    # If no organized albums found, fall back to scanning all directories
    if not html_albums:
        logging.info(f"No organized HTML albums found, scanning all directories")
        for root, _, files in os.walk(results_path):
            root_path = Path(root)
            for file in files:
                if file.lower().endswith('.html'):
                    process_html_file(file, root_path, html_files)
    else:
        # Process organized albums
        for album in html_albums:
            album_path = results_path / album
            
            # Skip processing metadata file
            for file in os.listdir(album_path):
                if file.lower().endswith('.html') and file != "album_metadata.json":
                    process_html_file(file, album_path, html_files)
    
    logging.info(f"Found {len(html_files)} HTML files across {len(set(f['album'] for f in html_files))} albums")
    return jsonify(html_files)

def process_html_file(file, directory, html_files):
    """Helper function to process an HTML file and add it to the list"""
    file_path = directory / file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
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
        
        html_files.append({
            "name": file,
            "content": content,
            "album": album,
            "display_name": display_name,
            "path": str(file_path)  # Convert Path to string for JSON serialization
        })
        logging.info(f"Processed {file} from album {album}")
    except Exception as e:
        logging.error(f"Failed to process {file}: {e}")

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
