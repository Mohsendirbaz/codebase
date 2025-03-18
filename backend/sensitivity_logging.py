"""
Logging module for sensitivity analysis.

This module provides specialized logging functions for sensitivity analysis,
helping to track the workflow and debug issues.
"""

import os
import logging
import time
import json
from functools import wraps

# Configure logging
LOGS_DIR = os.path.join(os.path.dirname(__file__), 'Logs')
os.makedirs(LOGS_DIR, exist_ok=True)

SENSITIVITY_LOG_PATH = os.path.join(LOGS_DIR, "SENSITIVITY.log")

# Create sensitivity logger
sensitivity_logger = logging.getLogger('sensitivity')
sensitivity_logger.setLevel(logging.DEBUG)
sensitivity_logger.propagate = False  # Prevent propagation to root logger

# Add file handler if not already added
if not sensitivity_logger.handlers:
    file_handler = logging.FileHandler(SENSITIVITY_LOG_PATH)
    file_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    sensitivity_logger.addHandler(file_handler)

def log_execution_flow(stage, message):
    """
    Log execution flow with stage information.
    
    Args:
        stage (str): Stage of execution (e.g., 'enter', 'exit', 'checkpoint', 'error')
        message (str): Log message
    """
    if stage == 'enter':
        sensitivity_logger.info(f"[ENTER] {message}")
    elif stage == 'exit':
        sensitivity_logger.info(f"[EXIT] {message}")
    elif stage == 'checkpoint':
        sensitivity_logger.info(f"[CHECKPOINT] {message}")
    elif stage == 'error':
        sensitivity_logger.error(f"[ERROR] {message}")
    else:
        sensitivity_logger.info(f"[{stage.upper()}] {message}")

def log_plot_generation_start(param_id, compare_to_key, plot_type, mode):
    """
    Log the start of plot generation.
    
    Args:
        param_id (str): Parameter ID (e.g., 'S34')
        compare_to_key (str): Parameter to compare against (e.g., 'S13')
        plot_type (str): Type of plot (e.g., 'waterfall', 'bar', 'point')
        mode (str): Analysis mode (e.g., 'symmetrical', 'multiple')
    """
    sensitivity_logger.info(f"PLOT GENERATION STARTED: {plot_type} plot for {param_id} vs {compare_to_key} ({mode})")

def log_plot_generation_complete(param_id, compare_to_key, plot_type, mode, plot_path):
    """
    Log the completion of plot generation.
    
    Args:
        param_id (str): Parameter ID (e.g., 'S34')
        compare_to_key (str): Parameter to compare against (e.g., 'S13')
        plot_type (str): Type of plot (e.g., 'waterfall', 'bar', 'point')
        mode (str): Analysis mode (e.g., 'symmetrical', 'multiple')
        plot_path (str): Path to the generated plot
    """
    sensitivity_logger.info(f"PLOT GENERATION COMPLETED: {plot_type} plot for {param_id} vs {compare_to_key} ({mode}) - {plot_path}")

def log_plot_generation_error(param_id, compare_to_key, plot_type, mode, error_msg):
    """
    Log an error during plot generation.
    
    Args:
        param_id (str): Parameter ID (e.g., 'S34')
        compare_to_key (str): Parameter to compare against (e.g., 'S13')
        plot_type (str): Type of plot (e.g., 'waterfall', 'bar', 'point')
        mode (str): Analysis mode (e.g., 'symmetrical', 'multiple')
        error_msg (str): Error message
    """
    sensitivity_logger.error(f"PLOT GENERATION FAILED: {plot_type} plot for {param_id} vs {compare_to_key} ({mode}) - {error_msg}")

def log_plot_data_loading(param_id, compare_to_key, data_path, success=True, error_msg=None):
    """
    Log the loading of plot data.
    
    Args:
        param_id (str): Parameter ID (e.g., 'S34')
        compare_to_key (str): Parameter to compare against (e.g., 'S13')
        data_path (str): Path to the data file
        success (bool): Whether the data loading was successful
        error_msg (str, optional): Error message if loading failed
    """
    if success:
        sensitivity_logger.info(f"DATA LOADING SUCCESSFUL: {param_id} vs {compare_to_key} from {data_path}")
    else:
        sensitivity_logger.error(f"DATA LOADING FAILED: {param_id} vs {compare_to_key} from {data_path} - {error_msg}")

def log_plot_data_processing(param_id, compare_to_key, success=True, error_msg=None):
    """
    Log the processing of plot data.
    
    Args:
        param_id (str): Parameter ID (e.g., 'S34')
        compare_to_key (str): Parameter to compare against (e.g., 'S13')
        success (bool): Whether the data processing was successful
        error_msg (str, optional): Error message if processing failed
    """
    if success:
        sensitivity_logger.info(f"DATA PROCESSING SUCCESSFUL: {param_id} vs {compare_to_key}")
    else:
        sensitivity_logger.error(f"DATA PROCESSING FAILED: {param_id} vs {compare_to_key} - {error_msg}")

def log_plot_rendering(param_id, compare_to_key, plot_type, success=True, error_msg=None):
    """
    Log the rendering of a plot.
    
    Args:
        param_id (str): Parameter ID (e.g., 'S34')
        compare_to_key (str): Parameter to compare against (e.g., 'S13')
        plot_type (str): Type of plot (e.g., 'waterfall', 'bar', 'point')
        success (bool): Whether the rendering was successful
        error_msg (str, optional): Error message if rendering failed
    """
    if success:
        sensitivity_logger.info(f"PLOT RENDERING SUCCESSFUL: {plot_type} plot for {param_id} vs {compare_to_key}")
    else:
        sensitivity_logger.error(f"PLOT RENDERING FAILED: {plot_type} plot for {param_id} vs {compare_to_key} - {error_msg}")

def log_plot_saving(param_id, compare_to_key, plot_type, plot_path, success=True, error_msg=None):
    """
    Log the saving of a plot.
    
    Args:
        param_id (str): Parameter ID (e.g., 'S34')
        compare_to_key (str): Parameter to compare against (e.g., 'S13')
        plot_type (str): Type of plot (e.g., 'waterfall', 'bar', 'point')
        plot_path (str): Path to save the plot
        success (bool): Whether the saving was successful
        error_msg (str, optional): Error message if saving failed
    """
    if success:
        sensitivity_logger.info(f"PLOT SAVING SUCCESSFUL: {plot_type} plot for {param_id} vs {compare_to_key} - {plot_path}")
    else:
        sensitivity_logger.error(f"PLOT SAVING FAILED: {plot_type} plot for {param_id} vs {compare_to_key} - {error_msg}")

def plot_generation_operation(func):
    """
    Decorator for plot generation operations.
    
    This decorator logs the start and end of a plot generation operation,
    as well as any errors that occur.
    
    Args:
        func: The function to decorate
        
    Returns:
        The decorated function
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        param_id = kwargs.get('param_id', args[0] if args else 'unknown')
        compare_to_key = kwargs.get('compare_to_key', args[1] if len(args) > 1 else 'unknown')
        plot_type = kwargs.get('plot_type', args[2] if len(args) > 2 else 'unknown')
        
        operation_name = func.__name__.replace('_', ' ').title()
        
        sensitivity_logger.info(f"STARTING {operation_name}: {plot_type} plot for {param_id} vs {compare_to_key}")
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            sensitivity_logger.info(f"COMPLETED {operation_name}: {plot_type} plot for {param_id} vs {compare_to_key} in {duration:.2f}s")
            return result
        except Exception as e:
            duration = time.time() - start_time
            sensitivity_logger.error(f"ERROR IN {operation_name}: {plot_type} plot for {param_id} vs {compare_to_key} - {str(e)} (after {duration:.2f}s)")
            raise
            
    return wrapper

def log_sensitivity_config_status(status, run_id=None, version=None, config_dir=None, error=None):
    """
    Log sensitivity configuration status to a JSON file.
    
    Args:
        status (bool): Whether configurations are ready
        run_id (str, optional): Run ID
        version (int, optional): Version number
        config_dir (str, optional): Path to configuration directory
        error (str, optional): Error message if status is False
        
    Returns:
        bool: True if logging was successful, False otherwise
    """
    try:
        status_data = {
            'configured': status,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        if run_id:
            status_data['runId'] = run_id
            
        if version:
            status_data['version'] = version
            
        if config_dir:
            status_data['configDir'] = config_dir
            
        if error:
            status_data['error'] = error
            
        status_path = os.path.join(LOGS_DIR, "sensitivity_config_status.json")
        
        with open(status_path, 'w') as f:
            json.dump(status_data, f, indent=2)
            
        sensitivity_logger.info(f"Sensitivity configuration status updated: configured={status}")
        return True
        
    except Exception as e:
        sensitivity_logger.error(f"Error logging sensitivity configuration status: {str(e)}")
        return False

def get_sensitivity_config_status():
    """
    Get sensitivity configuration status from the JSON file.
    
    Returns:
        dict: Status data, or None if file doesn't exist or is invalid
    """
    status_path = os.path.join(LOGS_DIR, "sensitivity_config_status.json")
    
    if not os.path.exists(status_path):
        return None
        
    try:
        with open(status_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        sensitivity_logger.error(f"Error reading sensitivity configuration status: {str(e)}")
        return None

# Example usage
if __name__ == "__main__":
    # Test logging functions
    log_execution_flow('enter', "Starting sensitivity analysis")
    
    log_plot_generation_start('S34', 'S13', 'waterfall', 'symmetrical')
    log_plot_generation_complete('S34', 'S13', 'waterfall', 'symmetrical', '/path/to/plot.png')
    
    log_plot_data_loading('S35', 'S13', '/path/to/data.json')
    log_plot_data_processing('S35', 'S13')
    log_plot_rendering('S35', 'S13', 'bar')
    log_plot_saving('S35', 'S13', 'bar', '/path/to/plot.png')
    
    log_sensitivity_config_status(True, run_id='test_run', version=1, config_dir='/path/to/config')
    
    status = get_sensitivity_config_status()
    print("Configuration status:", status)
    
    log_execution_flow('exit', "Sensitivity analysis completed")
