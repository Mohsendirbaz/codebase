from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import os
import logging
import logging.config

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Determine the current working directory for logging
log_directory = os.getcwd()
log_file_path = os.path.join(log_directory, 'DirectoryInventory.log')

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
        logging.info(f"Available versions: {versions}")
    else:
        logging.warning(f"Directory does not exist: {directory}")
    return versions

# Function to log file names for each available version
def log_CSV_file_names_for_versions(versions, base_directory):
    for version in versions:
        results_folder = os.path.join(base_directory, f"Batch({version})/Results({version})")
        if os.path.exists(results_folder):
            logging.info(f"Fetching CSV files for version {version} in folder {results_folder}")
            for root, dirs, files in os.walk(results_folder):
                for filename in files:
                    if filename.endswith('.CSV'):
                        logging.info(f"CSV file found: {filename} in version {version}, located in {root}")
                    else:
                        logging.info(f"Skipping non-CSV file: {filename}")
        else:
            logging.warning(f"Results folder does not exist for version {version}: {results_folder}")


ML_DIR = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\Original"
@app.route('/api/csv-files/<version>', methods=['GET'])
def get_CSV_files(version):
    logging.info(f"Received request for CSV files with version: {version}")

    results_folder = os.path.join(
        ML_DIR, 
        f"Batch({version})", f"Results({version})"
    )

    CSV_files = []

    if os.path.exists(results_folder):
        logging.info(f"Fetching CSV files for version {version} in folder {results_folder}")
        for root, dirs, files in os.walk(results_folder):
            for filename in files:
                if filename.endswith('.csv'):
                    file_path = os.path.join(root, filename)
                    try:
                        logging.debug(f"Processing file: {filename}")
                        df = pd.read_csv(file_path)
                        logging.debug(f"DataFrame built for {filename}: \n{df.head().to_string()}")  # Log the first few rows of the DataFrame
                        df = df.fillna("null")  # Handling NaN values
                        CSV_files.append({
                            "name": filename,
                            "data": df.to_dict(orient='records')
                        })
                        logging.info(f"Successfully processed {filename} with {len(df)} rows.")
                    except Exception as e:
                        logging.error(f"Error processing {filename}: {e}")
                else:
                    logging.info(f"Skipping non-CSV file: {filename}")
    else:
        logging.warning(f"Results folder does not exist: {results_folder}")

    if not CSV_files:
        logging.info(f"No CSV files found for version {version} in folder {results_folder}")
    else:
        # Log the names of the CSV files
        for CSV_file in CSV_files:
            logging.info(f"CSV file processed: {CSV_file['name']}")

    return jsonify(CSV_files)

if __name__ == '__main__':
    logging.info("Starting Flask server on port 8007")

    # Retrieve the list of available versions and log their file names
    base_directory = r"C:\Users\Mohse\OneDrive\Documents\GitHub\TeaSpace\backend\Original"
    versions = get_available_versions(base_directory)
    log_CSV_file_names_for_versions(versions, base_directory)

    app.run(debug=True, port=8007)
