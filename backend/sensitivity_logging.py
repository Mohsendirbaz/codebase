import os
import logging
import traceback
import inspect
import functools
from datetime import datetime
from pathlib import Path
from contextlib import contextmanager

# Global operation sequence counter for tracking execution order
_operation_sequence = 0

class SensitivityLoggingManager:
    """Centralizes logging configuration for all sensitivity analysis components."""
    
    def __init__(self, base_dir=None):
        if not base_dir:
            self.base_dir = Path(os.path.dirname(os.path.abspath(__file__)))
            self.logs_dir = self.base_dir / "Logs" / "Sensitivity"
        else:
            self.base_dir = Path(base_dir)
            self.logs_dir = self.base_dir / "Logs" / "Sensitivity"
        
        # Create logs directory structure
        os.makedirs(self.logs_dir, exist_ok=True)
        
        # Log file paths
        self.log_files = {
            'manager': self.logs_dir / "sensitivity_manager.log",
            'plots': self.logs_dir / "sensitivity_plots.log",
            'html': self.logs_dir / "sensitivity_html.log",
            'integration': self.logs_dir / "sensitivity_integration.log",
            'api': self.logs_dir / "sensitivity_api.log",
            'workflow': self.logs_dir / "sensitivity_workflow.log",
            'directory_ops': self.logs_dir / "sensitivity_directory_ops.log",  # Logger for directory operations
            'execution_flow': self.logs_dir / "sensitivity_execution_flow.log",  # Logger for execution flow
            'plot_generation': self.logs_dir / "sensitivity_plot_generation.log",  # New logger for plot generation
            'data_processing': self.logs_dir / "sensitivity_data_processing.log",  # New logger for data processing
            'configuration': self.logs_dir / "sensitivity_configuration.log"  # New logger for configuration operations
        }
        
        # Create component loggers
        self.loggers = {}
        for component, log_file in self.log_files.items():
            logger = logging.getLogger(f"sensitivity.{component}")
            logger.setLevel(logging.INFO)
            
            # Add file handler if not already added
            if not logger.handlers:
                file_handler = logging.FileHandler(str(log_file))
                
                # Enhanced formatter with more context
                if component in ['directory_ops', 'execution_flow']:
                    formatter = logging.Formatter(
                        '%(asctime)s - [%(levelname)s] - [SEQ:%(seq_num)s] - %(name)s - %(caller_info)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S'
                    )
                else:
                    formatter = logging.Formatter(
                        '%(asctime)s - [%(levelname)s] - %(name)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S'
                    )
                
                file_handler.setFormatter(formatter)
                logger.addHandler(file_handler)
            
            self.loggers[component] = logger
        
        # Special setup for workflow logger to capture all component logs
        workflow_logger = self.loggers['workflow']
        workflow_logger.setLevel(logging.INFO)
        
        # Add handlers to capture logs from all components
        for component, logger in self.loggers.items():
            if component != 'workflow':
                for handler in logger.handlers:
                    class ComponentFilter(logging.Filter):
                        def __init__(self, component_name):
                            super().__init__()
                            self.component_name = component_name
                        
                        def filter(self, record):
                            record.component = self.component_name
                            return True
                    
                    component_filter = ComponentFilter(component)
                    handler.addFilter(component_filter)
                    workflow_logger.addHandler(handler)
        
        # Create consolidated log file
        self.consolidated_log_path = self.add_consolidated_log_handler()
    
    def get_logger(self, component):
        """Get a logger for a specific component."""
        if component not in self.loggers:
            raise ValueError(f"No logger configured for component: {component}")
        return self.loggers[component]
    
    def add_consolidated_log_handler(self, log_file_path=None):
        """Add a handler to capture all logs in a single consolidated file."""
        if not log_file_path:
            log_file_path = self.logs_dir / f"consolidated_{datetime.now().strftime('%Y%m%d')}.log"
        
        # Create handler for consolidated log file
        file_handler = logging.FileHandler(str(log_file_path))
        formatter = logging.Formatter(
            '%(asctime)s - [%(levelname)s] - %(name)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(formatter)
        
        # Add handler to root logger to capture all logs
        root_logger = logging.getLogger()
        root_logger.addHandler(file_handler)
        
        return log_file_path
    
    def log_directory_operation(self, operation, directory, result=None, error=None, component='directory_ops'):
        """
        Log directory operations with detailed context.
        
        Args:
            operation: Type of operation ('create', 'check', 'access')
            directory: Path to the directory
            result: Boolean indicating success/failure
            error: Exception if an error occurred
            component: Logger component to use
        """
        global _operation_sequence
        _operation_sequence += 1
        
        # Get caller information
        frame = inspect.currentframe().f_back
        caller_info = f"{frame.f_code.co_filename}:{frame.f_lineno} in {frame.f_code.co_name}"
        
        # Get the appropriate logger
        logger = self.get_logger(component)
        
        # Create log record with extra context
        log_record = logging.LogRecord(
            name=logger.name,
            level=logging.INFO,
            pathname=frame.f_code.co_filename,
            lineno=frame.f_lineno,
            msg="",  # Will be set below
            args=(),
            exc_info=None
        )
        
        # Add extra attributes
        log_record.seq_num = _operation_sequence
        log_record.caller_info = caller_info
        
        # Set message based on operation type
        if operation == "create":
            if result:
                log_record.msg = f"DIRECTORY CREATED: {directory}"
                log_record.levelno = logging.INFO
                log_record.levelname = "INFO"
            else:
                log_record.msg = f"DIRECTORY CREATION FAILED: {directory}"
                log_record.levelno = logging.ERROR
                log_record.levelname = "ERROR"
                if error:
                    # Log the error separately
                    error_record = logging.LogRecord(
                        name=logger.name,
                        level=logging.ERROR,
                        pathname=frame.f_code.co_filename,
                        lineno=frame.f_lineno,
                        msg=f"  Error: {str(error)}",
                        args=(),
                        exc_info=None
                    )
                    error_record.seq_num = _operation_sequence
                    error_record.caller_info = caller_info
                    logger.handle(error_record)
        
        elif operation == "check":
            if result:
                log_record.msg = f"DIRECTORY EXISTS: {directory}"
                log_record.levelno = logging.DEBUG
                log_record.levelname = "DEBUG"
            else:
                log_record.msg = f"DIRECTORY MISSING: {directory}"
                log_record.levelno = logging.WARNING
                log_record.levelname = "WARNING"
        
        elif operation == "access":
            if result:
                log_record.msg = f"DIRECTORY ACCESSED: {directory}"
                log_record.levelno = logging.DEBUG
                log_record.levelname = "DEBUG"
            else:
                log_record.msg = f"DIRECTORY ACCESS FAILED: {directory}"
                log_record.levelno = logging.ERROR
                log_record.levelname = "ERROR"
                if error:
                    # Log the error separately
                    error_record = logging.LogRecord(
                        name=logger.name,
                        level=logging.ERROR,
                        pathname=frame.f_code.co_filename,
                        lineno=frame.f_lineno,
                        msg=f"  Error: {str(error)}",
                        args=(),
                        exc_info=None
                    )
                    error_record.seq_num = _operation_sequence
                    error_record.caller_info = caller_info
                    logger.handle(error_record)
        
        # Handle the log record
        logger.handle(log_record)
    
    def log_execution_flow(self, event, message, component='execution_flow'):
        """
        Log execution flow events with sequence tracking.
        
        Args:
            event: Type of event ('enter', 'exit', 'checkpoint')
            message: Description of the event
            component: Logger component to use
        """
        global _operation_sequence
        _operation_sequence += 1
        
        # Get caller information
        frame = inspect.currentframe().f_back
        caller_info = f"{frame.f_code.co_filename}:{frame.f_lineno} in {frame.f_code.co_name}"
        
        # Get the appropriate logger
        logger = self.get_logger(component)
        
        # Create log record with extra context
        log_record = logging.LogRecord(
            name=logger.name,
            level=logging.INFO,
            pathname=frame.f_code.co_filename,
            lineno=frame.f_lineno,
            msg=f"[{event.upper()}] {message}",
            args=(),
            exc_info=None
        )
        
        # Add extra attributes
        log_record.seq_num = _operation_sequence
        log_record.caller_info = caller_info
        
        # Handle the log record
        logger.handle(log_record)
    
    @contextmanager
    def track_method_execution(self, method_name, component='execution_flow'):
        """
        Context manager to track method entry and exit.
        
        Args:
            method_name: Name of the method being tracked
            component: Logger component to use
        """
        self.log_execution_flow('enter', f"Entering method: {method_name}", component)
        try:
            yield
        except Exception as e:
            self.log_execution_flow('error', f"Error in method {method_name}: {str(e)}", component)
            raise
        finally:
            self.log_execution_flow('exit', f"Exiting method: {method_name}", component)

# Create a singleton instance
logging_manager = SensitivityLoggingManager()

# Convenience functions to get loggers
def get_manager_logger():
    return logging_manager.get_logger('manager')

def get_plots_logger():
    return logging_manager.get_logger('plots')

def get_html_logger():
    return logging_manager.get_logger('html')

def get_integration_logger():
    return logging_manager.get_logger('integration')

def get_api_logger():
    return logging_manager.get_logger('api')

def get_workflow_logger():
    return logging_manager.get_logger('workflow')

def get_directory_ops_logger():
    return logging_manager.get_logger('directory_ops')

def get_execution_flow_logger():
    return logging_manager.get_logger('execution_flow')

def get_plot_generation_logger():
    return logging_manager.get_logger('plot_generation')

def get_data_processing_logger():
    return logging_manager.get_logger('data_processing')

def get_configuration_logger():
    return logging_manager.get_logger('configuration')

# Decorator for tracking method execution
def track_method(component='execution_flow'):
    """Decorator to track method entry and exit."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            method_name = f"{func.__module__}.{func.__qualname__}"
            with logging_manager.track_method_execution(method_name, component):
                return func(*args, **kwargs)
        return wrapper
    return decorator

# Utility functions for directory operations
def log_directory_create(directory, result=None, error=None):
    """Log directory creation operation."""
    logging_manager.log_directory_operation('create', directory, result, error)

def log_directory_check(directory, result=None):
    """Log directory check operation."""
    logging_manager.log_directory_operation('check', directory, result)

def log_directory_access(directory, result=None, error=None):
    """Log directory access operation."""
    logging_manager.log_directory_operation('access', directory, result, error)

# Context manager for directory operations
@contextmanager
def directory_operation(operation, directory):
    """
    Context manager for directory operations.
    
    Args:
        operation: Type of operation ('create', 'check', 'access')
        directory: Path to the directory
    """
    try:
        if operation == 'create':
            logging_manager.log_directory_operation('create', directory, result=None)
            yield
            logging_manager.log_directory_operation('create', directory, result=True)
        elif operation == 'check':
            logging_manager.log_directory_operation('check', directory, result=None)
            yield
            logging_manager.log_directory_operation('check', directory, result=True)
        elif operation == 'access':
            logging_manager.log_directory_operation('access', directory, result=None)
            yield
            logging_manager.log_directory_operation('access', directory, result=True)
    except Exception as e:
        logging_manager.log_directory_operation(operation, directory, result=False, error=e)
        raise

# Plot generation logging functions
def log_plot_generation_start(param_id, compare_to_key, plot_type, mode):
    """Log the start of plot generation for a specific parameter."""
    logger = get_plot_generation_logger()
    logger.info(f"PLOT GENERATION STARTED: {plot_type} plot for {param_id} vs {compare_to_key} ({mode})")

def log_plot_generation_complete(param_id, compare_to_key, plot_type, mode, output_path):
    """Log the successful completion of plot generation."""
    logger = get_plot_generation_logger()
    logger.info(f"PLOT GENERATION COMPLETED: {plot_type} plot for {param_id} vs {compare_to_key} ({mode}) -> {output_path}")

def log_plot_generation_error(param_id, compare_to_key, plot_type, mode, error_msg):
    """Log an error during plot generation."""
    logger = get_plot_generation_logger()
    logger.error(f"PLOT GENERATION FAILED: {plot_type} plot for {param_id} vs {compare_to_key} ({mode}) - {error_msg}")

def log_plot_data_loading(param_id, compare_to_key, data_file, success=True, error_msg=None):
    """Log the data loading step for plot generation."""
    logger = get_data_processing_logger()
    if success:
        logger.info(f"DATA LOADED: {param_id} vs {compare_to_key} from {data_file}")
    else:
        logger.error(f"DATA LOADING FAILED: {param_id} vs {compare_to_key} from {data_file} - {error_msg}")

def log_plot_data_processing(param_id, compare_to_key, operation, success=True, error_msg=None):
    """Log data processing operations for plot generation."""
    logger = get_data_processing_logger()
    if success:
        logger.info(f"DATA PROCESSING: {operation} for {param_id} vs {compare_to_key} completed")
    else:
        logger.error(f"DATA PROCESSING FAILED: {operation} for {param_id} vs {compare_to_key} - {error_msg}")

def log_plot_rendering(param_id, compare_to_key, plot_type, success=True, error_msg=None):
    """Log the actual rendering of the plot."""
    logger = get_plot_generation_logger()
    if success:
        logger.info(f"PLOT RENDERED: {plot_type} for {param_id} vs {compare_to_key}")
    else:
        logger.error(f"PLOT RENDERING FAILED: {plot_type} for {param_id} vs {compare_to_key} - {error_msg}")

def log_plot_saving(output_path, success=True, error_msg=None):
    """Log the saving of the plot to disk."""
    logger = get_plot_generation_logger()
    if success:
        logger.info(f"PLOT SAVED: {output_path}")
    else:
        logger.error(f"PLOT SAVING FAILED: {output_path} - {error_msg}")

# Context manager for plot generation
@contextmanager
def plot_generation_operation(param_id, compare_to_key, plot_type, mode):
    """
    Context manager for tracking plot generation operations.
    
    Args:
        param_id: The parameter ID being varied
        compare_to_key: The parameter being compared against
        plot_type: Type of plot ('waterfall', 'bar', 'point')
        mode: Sensitivity mode ('symmetrical', 'multipoint')
    """
    log_plot_generation_start(param_id, compare_to_key, plot_type, mode)
    try:
        yield
        # Note: The successful completion will be logged by the caller with the output path
    except Exception as e:
        log_plot_generation_error(param_id, compare_to_key, plot_type, mode, str(e))
        raise

# Data processing logging functions
def log_configuration_loading(config_file, success=True, error_msg=None):
    """Log configuration file loading operations."""
    logger = get_configuration_logger()
    if success:
        logger.info(f"CONFIGURATION LOADED: {config_file}")
    else:
        logger.error(f"CONFIGURATION LOADING FAILED: {config_file} - {error_msg}")

def log_configuration_saving(config_file, success=True, error_msg=None):
    """Log configuration file saving operations."""
    logger = get_configuration_logger()
    if success:
        logger.info(f"CONFIGURATION SAVED: {config_file}")
    else:
        logger.error(f"CONFIGURATION SAVING FAILED: {config_file} - {error_msg}")

def log_result_saving(result_file, success=True, error_msg=None):
    """Log result file saving operations."""
    logger = get_data_processing_logger()
    if success:
        logger.info(f"RESULT SAVED: {result_file}")
    else:
        logger.error(f"RESULT SAVING FAILED: {result_file} - {error_msg}")
