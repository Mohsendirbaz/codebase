import json
import os
import pandas as pd
import importlib.util
import sys
import copy
import logging
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Sensitivity_File_Manager import store_calculation_result

def parse_filtered_values(filtered_values):
    try:
        # Convert double-double quotes for strings to single double-quotes before parsing
        filtered_values_dict = json.loads(filtered_values.replace('""', '"'))
        return filtered_values_dict
    except json.JSONDecodeError as e:
        print(f"Error parsing filtered_values: {filtered_values}. Error: {e}")
        return []

# Function to strip unnecessary quotes from numeric values
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

def apply_sensitivity_variation(config_module, param_id, variation_value):
    """
    Applies sensitivity variation to the specified parameter.
    """
    try:
        # Extract the base parameter name and index from param_id (e.g., S10, S11)
        param_index = int(param_id[1:])
        
        # Apply variation based on parameter index
        if 10 <= param_index <= 61:
            # Map parameter indices to their corresponding attributes
            param_mappings = {
                # Add mappings for all parameters S10-S61
                10: 'initialSellingPriceAmount13',
                11: 'variable_costsAmount4',
                # ... add other mappings as needed
            }
            
            if param_index in param_mappings:
                param_name = param_mappings[param_index]
                original_value = getattr(config_module, param_name)
                
                # Handle different parameter types
                if isinstance(original_value, list):
                    # For vector parameters, apply variation to all elements
                    modified_value = [val * (1 + variation_value/100) for val in original_value]
                else:
                    # For scalar parameters
                    modified_value = original_value * (1 + variation_value/100)
                
                setattr(config_module, param_name, modified_value)
                logging.info(f"Applied {variation_value}% variation to {param_name}")
                
        return config_module
        
    except Exception as e:
        logging.error(f"Error applying sensitivity variation: {str(e)}")
        raise

def generate_sensitivity_configs(config_received, config_matrix_df, results_folder, version, 
                              param_id, mode, variations):
    """
    Generates configuration modules for sensitivity analysis.
    """
    try:
        base_configs = []
        
        # First, generate base configurations
        for idx, row in config_matrix_df.iterrows():
            start_year = int(row['start'])
            filtered_values = row['filtered_values']
            
            # Create base config module
            config_module = importlib.util.module_from_spec(
                importlib.util.spec_from_loader('config_module', loader=None)
            )
            
            # Copy all attributes from received config
            for param in dir(config_received):
                if not param.startswith('__'):
                    setattr(config_module, param, 
                           copy.deepcopy(getattr(config_received, param)))
            
            # Apply filtered values
            if isinstance(filtered_values, str):
                filtered_values = parse_filtered_values(filtered_values)
                
            for item in filtered_values:
                if item.get('remarks') != "Default entry":
                    setattr(config_module, item.get('id'), 
                           strip_value(item.get('value')))
            
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
                    sensitivity_config, param_id, variation
                )
                
                # Save configuration
                save_sensitivity_config(
                    sensitivity_config, 
                    results_folder, 
                    version,
                    param_id,
                    mode,
                    variation,
                    start_year
                )
                
    except Exception as e:
        logging.error(f"Error generating sensitivity configurations: {str(e)}")
        raise

def save_sensitivity_config(config_module, results_folder, version, param_id, 
                          mode, variation, start_year):
    """
    Saves sensitivity configuration with appropriate naming convention.
    """
    try:
        # Convert config module to dictionary
        config_dict = {
            param: getattr(config_module, param) 
            for param in dir(config_module) 
            if not param.startswith('__')
        }
        
        # Create sensitivity-specific subdirectory
        sensitivity_dir = os.path.join(
            results_folder,
            'Sensitivity',
            'Symmetrical' if mode == 'symmetrical' else 'Multipoint'
        )
        os.makedirs(sensitivity_dir, exist_ok=True)
        
        # Generate filename using concatenation convention
        filename = f"{version}_config_module_{start_year}_{param_id}_{variation}.json"
        filepath = os.path.join(sensitivity_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(config_dict, f, indent=4)
            
        logging.info(f"Saved sensitivity configuration: {filepath}")
        
    except Exception as e:
        logging.error(f"Error saving sensitivity configuration: {str(e)}")
        raise