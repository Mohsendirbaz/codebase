import os
import logging
import sys

# Set up logging
log_directory = os.path.join(os.path.dirname(__file__), "Logs")
os.makedirs(log_directory, exist_ok=True)
log_file_path = os.path.join(log_directory, 'CFA_CALC.log')

print(f"Log directory: {log_directory}")
print(f"Log file path: {log_file_path}")

# Configure logging
logging.basicConfig(
    filename=log_file_path,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s: %(message)s',
    filemode='a'  # Changed from 'w' to 'a' to append instead of overwrite
)

# Log a test message
logging.info("=" * 80)
logging.info("TEST LOGGING SCRIPT")
logging.info("=" * 80)
logging.info("If you can see this message in the log file, logging is working correctly.")

# Ensure logs are immediately written to file
logging.getLogger().handlers[0].flush()

print(f"Test complete. Check {log_file_path} for the log message.")
