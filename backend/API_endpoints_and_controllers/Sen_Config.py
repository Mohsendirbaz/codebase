import json
import os
import pandas as pd
import importlib.util
import sys
import copy
import logging
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Sensitivity_File_Manager import SensitivityFileManager

# Configure logger
logger = logging.getLogger('sensitivity')

def parse_filtered_values(filtered_values):
    """Parse filtered values from string to dictionary."""
    try:
        # Convert double-double quotes for strings to single double-quotes before parsing
        filtered_values_dict = json.loads(filtered_values.replace('""', '"'))
        return filtered_values_dict
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing filtered_values: {filtered_values}. Error: {e}")
        return []

def strip_value(value):
    """Strips quotes from numeric values and keeps strings quoted."""
    if isinstance(value, str):
        try:
            if '.' in value:
                return float(value)  # Handle floats
            return int(value)  # Handle integers
        except ValueError:
            return value  # Return string as is if conversion fails
    return value

def find_parameter_by_id(config_module, param_id):
    """
    Find the parameter name in config_module that corresponds to the param_id.
    
    Args:
        config_module (dict): Configuration module
        param_id (str): Parameter ID (e.g., 'S13')
        
    Returns:
        str: Parameter name found in config_module
    """
    # Extract the numerical part of the parameter ID
    if not param_id.startswith('S') or not param_id[1:].isdigit():
        raise ValueError(f"Invalid parameter ID format: {param_id}")
        
    param_index = param_id[1:]
    
    # Special case for S13 (price parameter)
    if param_id == 'S13':
        for key in config_module:
            if 'priceAmount' in key:
                logger.info(f"Found price parameter: {key} for S13")
                return key
                
    # Search for parameter by pattern
    for key in config_module:
        if f"Amount{param_index}" in key:
            logger.info(f"Found parameter by index: {key} for {param_id}")
            return key
            
    # If not found by direct match, search for any key containing the index
    for key in config_module:
        if param_index in key and 'Amount' in key:
            logger.info(f"Found parameter by partial match: {key} for {param_id}")
            return key
            
    raise ValueError(f"Could not find parameter for {param_id} in config module")

def apply_sensitivity_variation(config_module, param_id, variation_value, mode='symmetrical'):
    """
    Applies sensitivity variation to the specified parameter.
    
    Args:
        config_module (dict): Configuration module
        param_id (str): Parameter ID (e.g., 'S13')
        variation_value (float): Variation value to apply
        mode (str): Either 'symmetrical'/'percentage' or 'multipoint'/'discrete'
        
    Returns:
        dict: Modified configuration module
    """
    try:
        # Normalize mode terminology
        if mode in ['percentage', 'multiple']:
            mode = 'symmetrical'
        elif mode == 'discrete':
            mode = 'multipoint'
            
        # Find parameter in config module
        param_name = find_parameter_by_id(config_module, param_id)
        
        # Get original value
        original_value = config_module[param_name]
        
        # Apply variation based on mode
        if mode == 'symmetrical':
            # For percentage/symmetrical mode, apply percentage change
            if isinstance(original_value, (int, float)):
                modified_value = original_value * (1 + variation_value/100)
            elif isinstance(original_value, list):
                # For list values, apply to each element
                modified_value = [val * (1 + variation_value/100) for val in original_value]
            else:
                raise TypeError(f"Unsupported parameter type: {type(original_value)}")
        elif mode == 'multipoint':
            # For discrete mode, directly replace with the variation value
            modified_value = variation_value
        else:
            raise ValueError(f"Unknown variation mode: {mode}")
            
        # Update the config module
        config_module[param_name] = modified_value
        
        logger.info(
            f"Applied {variation_value} {'%' if mode == 'symmetrical' else ''} "
            f"variation to {param_name} ({param_id})"
        )
        
        return config_module
        
    except Exception as e:
        logger.error(f"Error applying sensitivity variation: {str(e)}")
        raise

def generate_sensitivity_configs(config_received, config_matrix_df, results_folder, version, 
                               param_id, mode, variations):
    """
    Generates configuration modules for sensitivity analysis.
    
    Args:
        config_received: Original configuration
        config_matrix_df: DataFrame with configuration matrix
        results_folder (str): Path to results folder
        version (int): Version number
        param_id (str): Parameter ID
        mode (str): Either 'symmetrical' or 'multipoint'
        variations (list): List of variation values
        
    Returns:
        list: Paths to generated configuration files
    """
    logger.info(f"Generating sensitivity configs for {param_id} in {mode} mode")
    config_paths = []
    
    try:
        base_configs = []
        
        # First, generate base configurations
        for idx, row in config_matrix_df.iterrows():
            start_year = int(row['start'])
            filtered_values = row['filtered_values']
            
            # Create base config module
            config_module = {}
            
            # For module-based configs, convert to dictionary
            if not isinstance(config_received, dict):
                for param in dir(config_received):
                    if not param.startswith('__'):
                        config_module[param] = copy.deepcopy(getattr(config_received, param))
            else:
                config_module = copy.deepcopy(config_received)
            
            # Apply filtered values
            if isinstance(filtered_values, str):
                filtered_values = parse_filtered_values(filtered_values)
                
            for item in filtered_values:
                if item.get('remarks') != "Default entry":
                    config_module[item.get('id')] = strip_value(item.get('value'))
            
            base_configs.append((start_year, config_module))
        
        # Generate sensitivity variations
        if mode == 'symmetrical':
            variation = variations[0]
            variations_list = [variation, -variation]
        else:  # multipoint
            variations_list = variations
        
        # Apply variations and save configurations
        for variation in variations_list:
            for start_year, base_config in base_configs:
                # Create a fresh copy for this variation
                sensitivity_config = copy.deepcopy(base_config)
                
                # Apply sensitivity variation
                sensitivity_config = apply_sensitivity_variation(
                    sensitivity_config, param_id, variation, mode
                )
                
                # Save configuration
                config_path = save_sensitivity_config(
                    sensitivity_config, 
                    results_folder, 
                    version,
                    param_id,
                    mode,
                    variation,
                    start_year
                )
                config_paths.append(config_path)
                
        return config_paths
                
    except Exception as e:
        logger.error(f"Error generating sensitivity configurations: {str(e)}")
        raise

def save_sensitivity_config(config_module, results_folder, version, param_id, 
                          mode, variation, start_year):
    """
    Saves sensitivity configuration with appropriate naming convention.
    
    Args:
        config_module (dict): Configuration module
        results_folder (str): Path to results folder
        version (int): Version number
        param_id (str): Parameter ID
        mode (str): Either 'symmetrical' or 'multipoint'
        variation (float): Variation value
        start_year (int): Start year
        
    Returns:
        str: Path to saved configuration file
    """
    try:
        # Convert config module to dictionary if it's not already
        if not isinstance(config_module, dict):
            config_dict = {
                param: getattr(config_module, param) 
                for param in dir(config_module) 
                if not param.startswith('__')
            }
        else:
            config_dict = config_module
        
        # Create sensitivity-specific subdirectory
        sensitivity_dir = os.path.join(
            results_folder,
            'Sensitivity',
            'Symmetrical' if mode == 'symmetrical' else 'Multipoint'
        )
        os.makedirs(sensitivity_dir, exist_ok=True)
        
        # Generate filename using concatenation convention
        var_str = f"{variation:+.2f}"
        filename = f"{version}_config_module_{start_year}_{param_id}_{var_str}.json"
        filepath = os.path.join(sensitivity_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(config_dict, f, indent=4)
            
        logger.info(f"Saved sensitivity configuration: {filepath}")
        return filepath
        
    except Exception as e:
        logger.error(f"Error saving sensitivity configuration: {str(e)}")
        raise