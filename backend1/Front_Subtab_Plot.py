from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import logging
import logging.config

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Determine the current working directory for logging
log_directory = os.getcwd()
log_file_path = os.path.join(log_directory, 'DirectoryInventorypng.log')

# Logging configuration dictionary
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s %(levelname)s %(message)s',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'formatter': 'standard',
            'class': 'logging.FileHandler',
            'filename': log_file_path,
            'mode': 'w',  # 'w' for write mode to overwrite the log file each run
        },
        'console': {
            'level': 'DEBUG',
            'formatter': 'standard',
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['file', 'console'],
        'level': 'DEBUG',
    },
}

# Apply the logging configuration
logging.config.dictConfig(LOGGING_CONFIG)

# Log the initial start message
logging.info("Logging setup complete.")
logging.info(f"Logging to file: {log_file_path}")

# Function to get the list of available versions
def get_available_versions(directory):
    versions = []
    if os.path.exists(directory):
        for folder_name in os.listdir(directory):
            if folder_name.startswith("Batch(") and folder_name.endswith(")"):
                version = folder_name.split("(")[1].split(")")[0]
                versions.append(version)
    else:
        logging.warning(f"Directory does not exist: {directory}")
    return versions

# Function to log png file names for each available version, exploring only existing albums
def log_png_file_names_for_versions(versions, base_directory):
    for version in versions:
        version_folder = f"{base_directory}/Batch({version})/Results({version})/"
        if os.path.exists(version_folder):
            albums = [d for d in os.listdir(version_folder) if os.path.isdir(os.path.join(version_folder, d))]

            for album in albums:
                album_folder = os.path.join(version_folder, album)
                
                if os.path.exists(album_folder):
                    for filename in os.listdir(album_folder):
                        if filename.lower().endswith('.png'):  # Case insensitive check for .png files
                            file_path = os.path.join(album_folder, filename)
                            logging.info(f"png file found: {filename}")
                            logging.info(f"Constructed Path: {file_path}")
                            logging.info(f"Exact Position: Version: {version}, Album: {album}")
                else:
                    logging.warning(f"Album folder does not exist for version {version}: {album_folder}")
        else:
            logging.warning(f"Results folder does not exist for version {version}: {version_folder}")

@app.route('/api/album/<version>', methods=['GET'])
def get_png_files(version):
    logging.info(f"Received request for png files with version: {version}")

    base_directory = os.path.join("C:/Users/Mohse/OneDrive/Documents/GitHub/TeaSpace/public", "Original")
    version_folder = f"{base_directory}/Batch({version})/Results({version})/"
    png_files = []

    if os.path.exists(version_folder):
        albums = [d for d in os.listdir(version_folder) if os.path.isdir(os.path.join(version_folder, d))]

        for album in albums:
            album_folder = os.path.join(version_folder, album)

            if os.path.exists(album_folder):
                for filename in os.listdir(album_folder):
                    if filename.lower().endswith('.png'):  # Case insensitive check for .png files
                        file_path = os.path.join(album_folder, filename)
                        png_files.append({
                            "name": filename,
                            "path": file_path,
                            "album": album  # Include album information
                        })
                        logging.info(f"png file found: {filename}")
                        logging.info(f"Constructed Path: {file_path}")
                        logging.info(f"Exact Position: Version: {version}, Album: {album}")
            else:
                logging.warning(f"Album folder does not exist: {album_folder}")
    else:
        logging.warning(f"Results folder does not exist: {version_folder}")

    return jsonify(png_files)

if __name__ == '__main__':
    logging.info("Starting Flask server on port 8008")

    # Retrieve the list of available versions and log their file names
    base_directory = os.path.join("C:/Users/Mohse/OneDrive/Documents/GitHub/TeaSpace/public", "Original")
    versions = get_available_versions(base_directory)
    log_png_file_names_for_versions(versions, base_directory)

    app.run(debug=True, port=8008)
