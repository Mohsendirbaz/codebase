import subprocess
import json
import time
import logging
import os

# Absolute path for log file
log_file_path = r"C:\Users\md8w7\OneDrive University of Missouri\Desktop\ImportantFiles\Milestone4\backend\RUN.log"

# Ensure the logging directory exists
log_dir = os.path.dirname(log_file_path)
if not os.path.exists(log_dir):
    try:
        os.makedirs(log_dir)
        print(f"Created log directory: {log_dir}")
    except OSError as e:
        print(f"Error creating log directory: {e}")
else:
    print(f"Log directory already exists: {log_dir}")

if not os.access(log_dir, os.W_OK):
    print(f"Log directory is not writable: {log_dir}")
else:
    print(f"Log directory is writable: {log_dir}")

try:
    logging.basicConfig(
        filename=log_file_path,
        level=logging.DEBUG,
        format='%(asctime)s %(levelname)s %(message)s'
    )
    logging.debug("Logging is configured and working correctly.")
except Exception as e:
    print(f"Error setting up logging: {e}")

def stream_price_from_script(version, selected_v, selected_f, target_row):
    """Stream 'price' values from the specific Python script within a specific line range."""
    logging.info(f"Starting price stream for version {version} with target_row {target_row}")

    try:
        process = subprocess.Popen(
            ['python', 'update_config_modules_with_CFA_8.py',
             str(version), json.dumps(selected_v), json.dumps(selected_f), json.dumps(target_row)],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )

        start_line = 550  # Start of the desired range
        end_line = 560    # End of the desired range

        logging.info(f"Processing lines from {start_line} to {end_line}")

        # Read all lines from the process output one by one
        for current_line_number, line in enumerate(process.stdout, start=1):
            logging.debug(f"Reading line {current_line_number}: {line.strip()}")

            # Process lines only within the specified range
            if start_line <= current_line_number <= end_line:
                if 'price' in line:  # Look for lines containing 'price'
                    try:
                        price_data = json.loads(line)
                        price_value = price_data.get('price')
                        logging.info(f"Streamed price for version {version}: {price_value}")
                        yield f"data: {json.dumps({'price': price_value})}\n\n"
                    except json.JSONDecodeError:
                        logging.error(f"Invalid JSON format in line {current_line_number}: {line.strip()}")
                        yield f"data: {{'error': 'Invalid JSON format in price data'}}\n\n"

            # Stop reading if the end of the desired range is reached
            if current_line_number > end_line:
                logging.info(f"Reached the end of the line range for version {version}")
                break

            time.sleep(0.1)  # Control the stream rate

        process.stdout.close()
        process.wait()
        if process.returncode != 0:
            error_message = process.stderr.read().strip()
            logging.error(f"Error in subprocess for version {version}: {error_message}")
            yield f"data: {{'error': '{error_message}'}}\n\n"
        else:
            logging.info(f"Subprocess for version {version} completed successfully")

    except Exception as e:
        logging.exception(f"Exception occurred while streaming price for version {version}: {str(e)}")
        yield f"data: {{'error': 'An unexpected error occurred: {str(e)}'}}\n\n"
