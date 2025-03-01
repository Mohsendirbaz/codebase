import os
import logging
from datetime import datetime
from pathlib import Path

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
            'workflow': self.logs_dir / "sensitivity_workflow.log"
        }
        
        # Create component loggers
        self.loggers = {}
        for component, log_file in self.log_files.items():
            logger = logging.getLogger(f"sensitivity.{component}")
            logger.setLevel(logging.INFO)
            
            # Add file handler if not already added
            if not logger.handlers:
                file_handler = logging.FileHandler(str(log_file))
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