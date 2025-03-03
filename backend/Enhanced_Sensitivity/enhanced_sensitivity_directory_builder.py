"""
Enhanced Sensitivity Directory Builder

This module provides functionality for creating sensitivity directories,
copying configuration files, and modifying parameter values for sensitivity analysis.
"""

import os
import shutil
import json
import logging
import re

logger = logging.getLogger(__name__)

class EnhancedSensitivityDirectoryBuilder:
    """
    Class for building and managing sensitivity analysis directory structure.
    """
    
    def __init__(self):
        """
        Initialize the directory builder.
        """
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
    def create_sensitivity_directories(self, version, sen_parameters):
        """
        Create directories for sensitivity analysis.
        
        Args:
            version (int): Version number
            sen_parameters (dict): Sensitivity parameters configuration
            
        Returns:
            tuple: (sensitivity_dir, reports_dir) - Paths to created directories
        """
        # Create main sensitivity directory
        sensitivity_dir = os.path.join(
            self.base_dir,
            "Original",
            f"Batch({version})",
            f"Results({version})",
            "Sensitivity"
        )
        
        # Create reports directory
        reports_dir = os.path.join(sensitivity_dir, "Reports")
        
        # Create directories for each parameter
        for param_id, param_config in sen_parameters.items():
            if not param_config.get('enabled', False):
                continue
                
            # Create parameter directory
            param_dir = os.path.join(sensitivity_dir, param_id)
            os.makedirs(param_dir, exist_ok=True)
            
            # Create variation directories
            variations = self._get_parameter_variations(param_config)
            for variation in variations:
                variation_dir = os.path.join(param_dir, variation)
                os.makedirs(variation_dir, exist_ok=True)
        
        # Create reports directory
        os.makedirs(reports_dir, exist_ok=True)
        
        logger.info(f"Created sensitivity directories: {sensitivity_dir}")
        logger.info(f"Created reports directory: {reports_dir}")
        
        return sensitivity_dir, reports_dir
    
    def copy_config_files(self, version, sensitivity_dir):
        """
        Copy configuration files to sensitivity directories.
        
        Args:
            version (int): Version number
            sensitivity_dir (str): Path to sensitivity directory
            
        Returns:
            list: List of copied files
        """
        # Source directory for configuration files
        source_dir = os.path.join(
            self.base_dir,
            "Original",
            f"Batch({version})",
            f"Results({version})"
        )
        
        # Files to copy
        config_files = [
            "CFA.csv",
            "Economic_Summary.csv",
            "config.json"
        ]
        
        copied_files = []
        
        # Copy files to each parameter variation directory
        for root, dirs, files in os.walk(sensitivity_dir):
            # Skip the Reports directory
            if "Reports" in root:
                continue
                
            # Only copy to leaf directories (variation directories)
            if not dirs:
                for file in config_files:
                    source_file = os.path.join(source_dir, file)
                    if os.path.exists(source_file):
                        dest_file = os.path.join(root, file)
                        shutil.copy2(source_file, dest_file)
                        copied_files.append(dest_file)
        
        logger.info(f"Copied {len(copied_files)} configuration files")
        
        return copied_files
    
    def modify_parameter_values(self, sensitivity_dir, sen_parameters):
        """
        Modify parameter values in configuration files for sensitivity analysis.
        
        Args:
            sensitivity_dir (str): Path to sensitivity directory
            sen_parameters (dict): Sensitivity parameters configuration
            
        Returns:
            list: List of modified files
        """
        modified_files = []
        
        # Process each parameter
        for param_id, param_config in sen_parameters.items():
            if not param_config.get('enabled', False):
                continue
                
            param_dir = os.path.join(sensitivity_dir, param_id)
            
            # Get parameter details
            param_file = param_config.get('file', 'config.json')
            param_path = param_config.get('path', '')
            param_base_value = float(param_config.get('baseValue', 0))
            
            # Process each variation directory
            variations = self._get_parameter_variations(param_config)
            for variation in variations:
                variation_dir = os.path.join(param_dir, variation)
                config_file = os.path.join(variation_dir, param_file)
                
                if not os.path.exists(config_file):
                    logger.warning(f"Config file not found: {config_file}")
                    continue
                
                # Calculate variation value
                variation_value = self._calculate_variation_value(
                    param_base_value, 
                    variation, 
                    param_config.get('step', 10)
                )
                
                # Modify the file based on its type
                if param_file.endswith('.json'):
                    self._modify_json_file(config_file, param_path, variation_value)
                elif param_file.endswith('.csv'):
                    self._modify_csv_file(
                        config_file, 
                        param_config.get('row', 0), 
                        param_config.get('col', 0), 
                        variation_value
                    )
                else:
                    logger.warning(f"Unsupported file type: {param_file}")
                    continue
                    
                modified_files.append(config_file)
        
        logger.info(f"Modified {len(modified_files)} configuration files")
        
        return modified_files
    
    def _get_parameter_variations(self, param_config):
        """
        Get parameter variations based on configuration.
        
        Args:
            param_config (dict): Parameter configuration
            
        Returns:
            list: List of variation names
        """
        variations = []
        
        # Get variation configuration
        step = param_config.get('step', 10)
        steps_up = param_config.get('stepsUp', 2)
        steps_down = param_config.get('stepsDown', 2)
        
        # Add base variation
        variations.append('base')
        
        # Add up variations
        for i in range(1, steps_up + 1):
            variations.append(f'plus_{step * i}')
            
        # Add down variations
        for i in range(1, steps_down + 1):
            variations.append(f'minus_{step * i}')
            
        return variations
    
    def _calculate_variation_value(self, base_value, variation, step):
        """
        Calculate variation value based on base value and variation name.
        
        Args:
            base_value (float): Base parameter value
            variation (str): Variation name
            step (float): Step size for variations
            
        Returns:
            float: Calculated variation value
        """
        if variation == 'base':
            return base_value
            
        if variation.startswith('plus_'):
            percentage = float(variation.replace('plus_', ''))
            return base_value * (1 + percentage / 100)
            
        if variation.startswith('minus_'):
            percentage = float(variation.replace('minus_', ''))
            return base_value * (1 - percentage / 100)
            
        return base_value
    
    def _modify_json_file(self, file_path, param_path, value):
        """
        Modify a JSON file to update a parameter value.
        
        Args:
            file_path (str): Path to JSON file
            param_path (str): Path to parameter in JSON (dot notation)
            value (float): New parameter value
        """
        try:
            # Read JSON file
            with open(file_path, 'r') as f:
                data = json.load(f)
                
            # Navigate to parameter path
            if param_path:
                keys = param_path.split('.')
                target = data
                for i, key in enumerate(keys):
                    if i == len(keys) - 1:
                        # Last key, update value
                        target[key] = value
                    else:
                        # Navigate to next level
                        target = target[key]
            else:
                # No path, update root value
                data = value
                
            # Write updated JSON
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error modifying JSON file {file_path}: {str(e)}")
    
    def _modify_csv_file(self, file_path, row, col, value):
        """
        Modify a CSV file to update a parameter value.
        
        Args:
            file_path (str): Path to CSV file
            row (int): Row index (0-based)
            col (int): Column index (0-based)
            value (float): New parameter value
        """
        try:
            # Read CSV file
            with open(file_path, 'r') as f:
                lines = f.readlines()
                
            # Check if row exists
            if row >= len(lines):
                logger.warning(f"Row {row} out of range in {file_path}")
                return
                
            # Split row into columns
            columns = lines[row].strip().split(',')
            
            # Check if column exists
            if col >= len(columns):
                logger.warning(f"Column {col} out of range in {file_path}")
                return
                
            # Update value
            columns[col] = str(value)
            
            # Join columns back into row
            lines[row] = ','.join(columns) + '\n'
            
            # Write updated CSV
            with open(file_path, 'w') as f:
                f.writelines(lines)
                
        except Exception as e:
            logger.error(f"Error modifying CSV file {file_path}: {str(e)}")
