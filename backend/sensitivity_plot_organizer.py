"""
Organizer module for sensitivity plots.

This module provides functions for organizing and managing sensitivity plots,
including creating directories, naming plots, and tracking plot metadata.
"""

import os
import json
import time
import logging
from sensitivity_logging import log_execution_flow

# Configure logging
logger = logging.getLogger(__name__)

class SensitivityPlotOrganizer:
    """Organizer for sensitivity plots."""
    
    def __init__(self, base_dir=None, version=1):
        """Initialize the organizer with the base directory and version."""
        if base_dir is None:
            # Use default directory structure
            self.base_dir = os.path.join(
                os.path.dirname(__file__),
                'Original',
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity'
            )
        else:
            self.base_dir = base_dir
            
        self.version = version
        self.logger = logger
        
        # Create base directory if it doesn't exist
        os.makedirs(self.base_dir, exist_ok=True)
        self.logger.info(f"Using sensitivity directory: {self.base_dir}")
        
        # Create metadata file path
        self.metadata_file = os.path.join(self.base_dir, 'plot_metadata.json')
        
        # Load existing metadata if available
        self.metadata = self._load_metadata()
        
    def _load_metadata(self):
        """Load plot metadata from file."""
        if os.path.exists(self.metadata_file):
            try:
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                self.logger.error(f"Error loading plot metadata: {str(e)}")
                return {}
        else:
            return {}
            
    def _save_metadata(self):
        """Save plot metadata to file."""
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.metadata, f, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Error saving plot metadata: {str(e)}")
            return False
            
    def create_plot_directories(self, modes=None, plot_types=None):
        """Create directories for sensitivity plots."""
        if modes is None:
            modes = ['Symmetrical', 'Multipoint']
            
        if plot_types is None:
            plot_types = ['waterfall', 'bar', 'point']
            
        # Create directories for each mode
        for mode in modes:
            mode_dir = os.path.join(self.base_dir, mode)
            os.makedirs(mode_dir, exist_ok=True)
            
            # Create directories for each plot type
            for plot_type in plot_types:
                plot_dir = os.path.join(mode_dir, plot_type)
                os.makedirs(plot_dir, exist_ok=True)
                
        # Create additional directories
        os.makedirs(os.path.join(self.base_dir, 'Configuration'), exist_ok=True)
        os.makedirs(os.path.join(self.base_dir, 'Reports'), exist_ok=True)
        os.makedirs(os.path.join(self.base_dir, 'Cache'), exist_ok=True)
        
        self.logger.info(f"Created plot directories in {self.base_dir}")
        return True
        
    def get_plot_path(self, param_id, compare_to_key, plot_type, mode, comparison_type='primary'):
        """Get the path for a sensitivity plot."""
        # Determine the mode directory
        if mode.lower() == 'symmetrical':
            mode_dir = os.path.join(self.base_dir, 'Symmetrical')
        else:
            mode_dir = os.path.join(self.base_dir, 'Multipoint')
            
        # Determine the plot type directory
        plot_dir = os.path.join(mode_dir, plot_type)
        
        # Create the plot filename
        plot_name = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}.png"
        
        # Return the full path
        return os.path.join(plot_dir, plot_name)
        
    def register_plot(self, param_id, compare_to_key, plot_type, mode, plot_path, comparison_type='primary'):
        """Register a plot in the metadata."""
        # Create parameter entry if it doesn't exist
        if param_id not in self.metadata:
            self.metadata[param_id] = {
                'id': param_id,
                'plots': {}
            }
            
        # Create plot type entry if it doesn't exist
        if plot_type not in self.metadata[param_id]['plots']:
            self.metadata[param_id]['plots'][plot_type] = {}
            
        # Add plot metadata
        self.metadata[param_id]['plots'][plot_type][compare_to_key] = {
            'path': plot_path,
            'mode': mode,
            'comparisonType': comparison_type,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Save metadata
        self._save_metadata()
        
        self.logger.info(f"Registered plot: {plot_type} for {param_id} vs {compare_to_key}")
        return True
        
    def get_plots_for_parameter(self, param_id):
        """Get all plots for a parameter."""
        if param_id in self.metadata:
            return self.metadata[param_id]
        else:
            return None
            
    def get_all_plots(self):
        """Get all registered plots."""
        return self.metadata

# Example usage
if __name__ == "__main__":
    # Create organizer
    organizer = SensitivityPlotOrganizer()
    
    # Create plot directories
    organizer.create_plot_directories()
    
    # Get plot path
    plot_path = organizer.get_plot_path('S34', 'S13', 'waterfall', 'symmetrical')
    print(f"Plot path: {plot_path}")
    
    # Register a plot
    organizer.register_plot('S34', 'S13', 'waterfall', 'symmetrical', plot_path)
    
    # Get plots for parameter
    plots = organizer.get_plots_for_parameter('S34')
    print(f"Plots for S34: {plots}")
