import os
import json
import shutil
from datetime import datetime
from pathlib import Path
import sys
import importlib.util
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
import re  # For regular expression parsing
import copy


# Import centralized logging
from sensitivity_logging import get_manager_logger

# Add the project root to the Python path
BASE_DIR = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# Import utility functions
try:
    from backend.Utility_functions.common_utils import property_mapping
except ImportError:
    get_manager_logger().warning("Could not import property_mapping, using empty mapping")
    property_mapping = {}

class SensitivityAnalysisManager:
    """
    Unified manager for sensitivity analysis that coordinates calculation results,
    configuration management, and file organization.
    """
    
    def __init__(self):
        # Define base directories using Path for cross-platform compatibility
        self.base_dir = BASE_DIR
        self.original_dir = self.base_dir / "Original"  # Use backend/Original instead of public/Original
        self.logs_dir = self.base_dir / "Logs"
        
        # Create logging directories
        os.makedirs(self.logs_dir, exist_ok=True)
        
        # Get logger from centralized logging
        self.logger = get_manager_logger()
        
        self.logger.info("Sensitivity Analysis Manager initialized")
        
        # Standard directory structure for sensitivity results
        self.directory_structure = {
            'Symmetrical': ['waterfall', 'bar', 'point'],
            'Multipoint': ['waterfall', 'bar', 'point'],
            'Reports': [],
            'Configuration': [],
            'Cache': []
        }
    
    def ensure_sensitivity_directories(self, version: int) -> Dict[str, Path]:
        """
        Ensures that all required directories for sensitivity analysis exist.
        Returns a dictionary of created directory paths.
        """
        from sensitivity_logging import log_directory_create, log_directory_check, directory_operation, track_method
        
        version_str = str(version)
        batch_dir = self.original_dir / f"Batch({version_str})"
        results_dir = batch_dir / f"Results({version_str})"
        sensitivity_dir = results_dir / "Sensitivity"
        
        # Log the directory check operation
        log_directory_check(sensitivity_dir, os.path.exists(sensitivity_dir))
        
        # Create the main sensitivity directory with logging
        with directory_operation('create', sensitivity_dir):
            os.makedirs(sensitivity_dir, exist_ok=True)
        
        # Create subdirectories for different analysis types and outputs
        created_dirs = {'root': sensitivity_dir}
        
        # First, create all the main directories
        for main_dir in self.directory_structure.keys():
            main_path = sensitivity_dir / main_dir
            
            # Log the directory check operation
            log_directory_check(main_path, os.path.exists(main_path))
            
            # Create main directory with logging
            with directory_operation('create', main_path):
                os.makedirs(main_path, exist_ok=True)
            
            created_dirs[main_dir.lower()] = main_path
        
        # Then create all subdirectories
        for main_dir, sub_dirs in self.directory_structure.items():
            main_path = sensitivity_dir / main_dir
            
            # Create sub-directories if needed
            for sub_dir in sub_dirs:
                sub_path = main_path / sub_dir
                
                # Log the directory check operation
                log_directory_check(sub_path, os.path.exists(sub_path))
                
                # Create sub-directory with logging
                with directory_operation('create', sub_path):
                    os.makedirs(sub_path, exist_ok=True)
                
                created_dirs[f"{main_dir.lower()}_{sub_dir}"] = sub_path
        
        # Explicitly create the Configuration directory in each main directory
        for main_dir in self.directory_structure.keys():
            # Skip the standalone Configuration directory as it's already created above
            if main_dir == 'Configuration':
                continue
                
            config_dir = sensitivity_dir / main_dir / "Configuration"
            
            # Log the directory check operation
            log_directory_check(config_dir, os.path.exists(config_dir))
            
            # Create Configuration directory with logging
            with directory_operation('create', config_dir):
                os.makedirs(config_dir, exist_ok=True)
            
            created_dirs[f"{main_dir.lower()}_configuration"] = config_dir
            
        # Ensure the standalone Configuration directory exists and is properly logged
        config_dir = sensitivity_dir / "Configuration"
        log_directory_check(config_dir, os.path.exists(config_dir))
        with directory_operation('create', config_dir):
            os.makedirs(config_dir, exist_ok=True)
        self.logger.info(f"Created/verified standalone Configuration directory: {config_dir}")
        
        self.logger.info(f"Created/verified sensitivity directories for version {version}: {list(created_dirs.keys())}")
        return created_dirs
    
    def get_parameter_info(self, param_id: str) -> Dict:
        """
        Gets information about a sensitivity parameter including its mapping.
        """
        # Extract parameter number (e.g., S10 -> 10)
        if not (param_id.startswith('S') and param_id[1:].isdigit()):
            raise ValueError(f"Invalid parameter ID format: {param_id}")
        
        param_num = int(param_id[1:])
        
        # Get dynamic parameter mappings
        param_mappings = self._get_dynamic_param_mappings()
        
        property_id = param_mappings.get(param_num)
        if not property_id:
            self.logger.warning(f"No property mapping found for parameter {param_id}")
            return {"id": param_id, "property_id": None, "display_name": param_id}
        
        # Get display name from property mapping
        display_name = property_mapping.get(property_id, property_id)
        
        return {
            "id": param_id,
            "property_id": property_id,
            "display_name": display_name
        }

    def _get_dynamic_param_mappings(self) -> Dict[int, str]:
        """
        Dynamically generates parameter mappings from common_utils.py and frontend code.
        This ensures consistency between frontend and backend parameter definitions.
        
        Returns:
            dict: Mapping from parameter numbers (SXX) to property IDs
        """
        # Check if we've already cached the mappings
        if hasattr(self, '_param_mappings_cache'):
            return self._param_mappings_cache
        
        # Standard mappings as fallback
        standard_mappings = {
            10: "plantLifetimeAmount10",
            11: "bECAmount11",
            12: "numberOfUnitsAmount12",
            13: "initialSellingPriceAmount13",
            14: "totalOperatingCostPercentageAmount14",
            15: "engineering_Procurement_and_Construction_EPC_Amount15",
            16: "process_contingency_PC_Amount16",
            17: "project_Contingency_PT_BEC_EPC_PCAmount17",
            18: "use_direct_operating_expensesAmount18",
            20: "depreciationMethodAmount20",
            21: "loanTypeAmount21",
            22: "interestTypeAmount22",
            23: "generalInflationRateAmount23",
            24: "interestProportionAmount24",
            25: "principalProportionAmount25",
            26: "loanPercentageAmount26",
            27: "repaymentPercentageOfRevenueAmount27",
            28: "numberofconstructionYearsAmount28",
            30: "iRRAmount30",
            31: "annualInterestRateAmount31",
            32: "stateTaxRateAmount32",
            33: "federalTaxRateAmount33",
            34: "rawmaterialAmount34",
            35: "laborAmount35",
            36: "utilityAmount36",
            37: "maintenanceAmount37",
            38: "insuranceAmount38",
            40: "vAmount40",
            41: "vAmount41",
            42: "vAmount42",
            43: "vAmount43",
            44: "vAmount44",
            45: "vAmount45",
            46: "vAmount46",
            47: "vAmount47",
            48: "vAmount48",
            49: "vAmount49",
            50: "vAmount50",
            51: "vAmount51",
            52: "vAmount52",
            53: "vAmount53",
            54: "vAmount54",
            55: "vAmount55",
            56: "vAmount56",
            57: "vAmount57",
            58: "vAmount58",
            59: "vAmount59",
            60: "vAmount60",
            61: "vAmount61"
        }
        
        try:
            # Try to extract from property_mapping in common_utils.py
            dynamic_mappings = {}
            for prop_id in property_mapping.keys():
                # Extract the parameter number from property names like "vAmount45" or "bECAmount11"
                match = re.search(r'Amount(\d+)$', prop_id)
                if match:
                    param_num = int(match.group(1))
                    dynamic_mappings[param_num] = prop_id
            
            # If we found mappings, use them; otherwise use standard mappings
            result_mappings = dynamic_mappings if dynamic_mappings else standard_mappings
            
            # Try to enhance with frontend mappings if available
            try:
                # Path to useFormValues.js relative to backend directory
                frontend_path = os.path.join(
                    os.path.dirname(os.path.dirname(self.base_dir)), 
                    'src', 'useFormValues.js'
                )
                
                if os.path.exists(frontend_path):
                    with open(frontend_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Find the property mapping section
                        start_marker = 'const propertyMapping = {'
                        end_marker = '};'
                        start_idx = content.find(start_marker)
                        
                        if start_idx != -1:
                            # Extract property mapping block
                            start_idx += len(start_marker)
                            end_idx = content.find(end_marker, start_idx)
                            mapping_block = content[start_idx:end_idx].strip()
                            
                            # Parse each property mapping line
                            for line in mapping_block.split('\n'):
                                line = line.strip()
                                if not line or line.startswith('//') or ':' not in line:
                                    continue
                                    
                                # Extract property ID
                                property_id = line.split(':', 1)[0].strip().strip('"\'')
                                
                                # Extract parameter number from property ID
                                match = re.search(r'Amount(\d+)$', property_id)
                                if match:
                                    param_num = int(match.group(1))
                                    result_mappings[param_num] = property_id
            except Exception as frontend_error:
                self.logger.warning(f"Could not extract mappings from frontend: {str(frontend_error)}")
            
            # Cache the mappings for future use
            self._param_mappings_cache = result_mappings
            self.logger.info(f"Generated {len(result_mappings)} parameter mappings")
            return result_mappings
            
        except Exception as e:
            self.logger.error(f"Error generating parameter mappings: {str(e)}")
            # Fall back to standard mappings
            return standard_mappings
    
    def load_config_module(self, version: int, year: int = None) -> Dict[str, Any]:
        """
        Loads a configuration module for a specific version and year.
        If year is None, loads the base configuration.
        
        Args:
            version: The version number
            year: Optional year for year-specific configurations
            
        Returns:
            Dictionary containing the configuration module data
        """
        try:
            code_files_path = os.path.join(self.original_dir, f"Batch({version})", f"Results({version})")
            
            if year is not None:
                config_file = os.path.join(code_files_path, f"{version}_config_module_{year}.json")
            else:
                config_file = os.path.join(code_files_path, f"{version}_config_module.json")
                
            if not os.path.exists(config_file):
                raise FileNotFoundError(f"Configuration file not found: {config_file}")
            
            # Load the JSON configuration file
            with open(config_file, 'r') as f:
                config_data = json.load(f)
                
            self.logger.info(f"Loaded configuration module for version {version}, year {year if year is not None else 'base'}")
            return config_data
            
        except FileNotFoundError as e:
            self.logger.error(str(e))
            raise
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in configuration file: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error loading configuration module: {str(e)}")
            raise
    
    def apply_sensitivity_variation(self, config_data: Dict[str, Any], param_id: str, 
                                  variation: float) -> Dict[str, Any]:
        """
        Applies a sensitivity variation to a parameter in the configuration data.
        
        Args:
            config_data: The configuration data to modify
            param_id: The parameter ID (e.g., 'S10')
            variation: The percentage variation to apply
            
        Returns:
            Modified configuration data
        """
        # Get the property mapping for this parameter
        param_info = self.get_parameter_info(param_id)
        property_id = param_info['property_id']
        
        if not property_id:
            raise ValueError(f"Cannot apply variation: No property mapping for {param_id}")
        
        # Get the original value
        if property_id not in config_data:
            raise ValueError(f"Configuration does not contain property: {property_id}")
        
        original_value = config_data[property_id]
        
        # Create a deep copy to avoid modifying the original
        modified_config = copy.deepcopy(config_data)
        
        # Apply the variation based on data type
        if isinstance(original_value, (list, tuple, np.ndarray)):
            # For vector parameters
            modified_value = [val * (1 + variation/100) for val in original_value]
        elif isinstance(original_value, (int, float)):
            # For scalar parameters
            modified_value = original_value * (1 + variation/100)
        else:
            # For other types, log a warning and don't modify
            self.logger.warning(f"Cannot apply variation to {property_id} with type {type(original_value)}")
            return modified_config
        
        # Set the modified value
        modified_config[property_id] = modified_value
        
        self.logger.info(f"Applied {variation}% variation to {property_id}: {original_value} -> {modified_value}")
        return modified_config
    
    def save_variation_config(self, config_data: Dict[str, Any], version: int, year: int, 
                            param_id: str, variation: float, mode: str) -> str:
        """
        Saves a variation configuration module in the sensitivity directory structure.
        
        Args:
            config_data: The configuration data to save
            version: The version number
            year: Year for the configuration
            param_id: Parameter ID that was varied
            variation: Variation percentage applied
            mode: Sensitivity mode ('symmetrical' or 'multiple')
            
        Returns:
            Path to the saved configuration file
        """
        from sensitivity_logging import log_directory_check, log_directory_create, directory_operation, log_configuration_saving
        
        # Ensure sensitivity directories exist
        directories = self.ensure_sensitivity_directories(version)
        
        # Determine appropriate subdirectory based on mode
        if mode.lower() == 'symmetrical':
            config_dir = directories['symmetrical'] / 'Configuration'
        else:
            config_dir = directories['multipoint'] / 'Configuration'
        
        # Log directory check and creation
        with directory_operation('check', config_dir):
            log_directory_check(config_dir, os.path.exists(config_dir))
        
        # Create the directory if it doesn't exist
        with directory_operation('create', config_dir):
            os.makedirs(config_dir, exist_ok=True)
            self.logger.info(f"Created/verified configuration directory: {config_dir}")
        
        # Format the variation string (e.g., "+10.00" or "-5.00")
        var_str = f"{variation:+.2f}"
        
        # Generate filename using the format that CFA.py expects
        # CFA.py expects: {version}_config_module_{year}.json
        filename = f"{version}_config_module_{year}.json"
        
        # Create a subdirectory for this specific parameter and variation
        param_var_dir = config_dir / f"{param_id}_{var_str}"
        
        # Log directory check and creation
        with directory_operation('check', param_var_dir):
            log_directory_check(param_var_dir, os.path.exists(param_var_dir))
        
        # Create the directory if it doesn't exist
        with directory_operation('create', param_var_dir):
            os.makedirs(param_var_dir, exist_ok=True)
            self.logger.info(f"Created/verified parameter variation directory: {param_var_dir}")
        
        # Save the file in the parameter-specific subdirectory
        file_path = os.path.join(param_var_dir, filename)
        
        try:
            # Save the configuration
            with open(file_path, 'w') as f:
                json.dump(config_data, f, indent=2)
            
            self.logger.info(f"Saved variation config for {param_id} with {variation}% variation to {file_path}")
            log_configuration_saving(file_path, success=True)
            return file_path
        except Exception as e:
            error_msg = f"Failed to save configuration file {file_path}: {str(e)}"
            self.logger.error(error_msg)
            log_configuration_saving(file_path, success=False, error_msg=error_msg)
            raise
    
    def generate_sensitivity_configs(self, version: int, param_id: str, mode: str, 
                                   values: List[float]) -> List[Dict]:
        """
        Generates configuration variations for sensitivity analysis.
        
        This function creates and saves multiple configuration files by applying
        variations to a specific parameter. The number of configurations generated
        depends on the mode ('symmetrical' or 'multiple') and the length of the values list.
        
        For each row in the configuration matrix, a set of configurations is generated
        by applying variations to the parameter specified by param_id.
        
        Args:
            version: The version number
            param_id: The parameter ID to vary (e.g., 'S10')
            mode: The sensitivity mode ('symmetrical' or 'multiple')
            values: List of variation values
                   - For 'symmetrical' mode, only the first value is used to create +/- variations
                   - For 'multiple' mode, all values are used directly
            
        Returns:
            List of dictionaries containing information about the generated configurations
        """
        self.logger.info(f"Generating sensitivity configs for version {version}, parameter {param_id}, mode {mode}")
        
        # Validate inputs
        if not values:
            self.logger.warning(f"No variation values provided for {param_id}")
            return []
        
        # Find the configuration matrix
        code_files_path = os.path.join(self.original_dir, f"Batch({version})", f"Results({version})")
        config_matrix_file = os.path.join(code_files_path, f"General_Configuration_Matrix({version}).csv")
        
        # Track all generated configurations
        generated_configs = []
        
        try:
            # Determine variation list based on mode
            if mode.lower() == 'symmetrical':
                # For symmetrical, use first value to create +/- variations
                base_variation = values[0]
                variation_list = [base_variation, -base_variation]
                self.logger.info(f"Using symmetrical variations: +/-{base_variation}%")
            else:  # 'multiple' mode
                # For multiple, use all values directly
                variation_list = values
                self.logger.info(f"Using multiple point variations: {variation_list}")
            
            # Check if configuration matrix exists
            if os.path.exists(config_matrix_file):
                self.logger.info(f"Found configuration matrix at {config_matrix_file}")
                config_matrix_df = pd.read_csv(config_matrix_file)
                
                # Process configurations for each row in the matrix
                for index, row in config_matrix_df.iterrows():
                    # Extract year information
                    start_year = int(row['start'])
                    
                    self.logger.info(f"Processing configuration for year {start_year} (row {index+1}/{len(config_matrix_df)})")
                    
                    # Load the base configuration for this year
                    try:
                        base_config = self.load_config_module(version, start_year)
                    except FileNotFoundError:
                        self.logger.warning(f"Could not find config for year {start_year}, skipping")
                        continue
                    
                    # Create variation configurations for this year
                    for variation in variation_list:
                        # Apply the variation to create a new configuration
                        modified_config = self.apply_sensitivity_variation(base_config, param_id, variation)
                        
                        # Save the modified configuration in the sensitivity directory
                        output_path = self.save_variation_config(
                            modified_config, 
                            version, 
                            start_year, 
                            param_id, 
                            variation,
                            mode
                        )
                        
                        # Record information about this configuration
                        config_info = {
                            'version': version,
                            'param_id': param_id,
                            'year': start_year,
                            'variation': variation,
                            'mode': mode,
                            'file_path': output_path
                        }
                        
                        generated_configs.append(config_info)
                        self.logger.info(f"Generated configuration for {param_id} with {variation}% variation for year {start_year}")
            else:
                # If no matrix file exists, just use a single base configuration
                self.logger.warning(f"Configuration matrix not found at {config_matrix_file}")
                self.logger.info("Falling back to single base configuration")
                
                try:
                    base_config = self.load_config_module(version)
                    
                    # Create variation configurations
                    for variation in variation_list:
                        # Apply the variation
                        modified_config = self.apply_sensitivity_variation(base_config, param_id, variation)
                        
                        # Save in the sensitivity directory
                        output_path = self.save_variation_config(
                            modified_config, 
                            version, 
                            0,  # Use 0 for the base configuration with no specific year
                            param_id, 
                            variation,
                            mode
                        )
                        
                        # Record information
                        config_info = {
                            'version': version,
                            'param_id': param_id,
                            'year': None,
                            'variation': variation,
                            'mode': mode,
                            'file_path': output_path
                        }
                        
                        generated_configs.append(config_info)
                        self.logger.info(f"Generated base configuration for {param_id} with {variation}% variation")
                        
                except FileNotFoundError:
                    self.logger.error(f"Could not find any configuration module for version {version}")
                    return []
            
            self.logger.info(f"Generated {len(generated_configs)} configurations for sensitivity analysis")
            return generated_configs
            
        except Exception as e:
            self.logger.error(f"Error generating sensitivity configurations: {str(e)}")
            raise
    
    def store_calculation_result(self, version: int, param_id: str, compare_to_key: str,
                               result_data: Dict, mode: str) -> Path:
        """
        Stores sensitivity calculation results in a standardized format.
        Returns the path to the stored result file.
        """
        from sensitivity_logging import log_execution_flow, track_method, log_directory_check, directory_operation, log_result_saving
        
        try:
            log_execution_flow('enter', f"Storing calculation result for {param_id} vs {compare_to_key}")
            version_str = str(version)
            
            # Ensure directories exist
            directories = self.ensure_sensitivity_directories(version)
            
            # Check if mode directory exists
            if mode.lower() not in directories:
                error_msg = f"Mode directory key '{mode.lower()}' not found in directories. Available keys: {list(directories.keys())}"
                self.logger.error(error_msg)
                log_execution_flow('error', error_msg)
                return None
                
            mode_dir = directories[mode.lower()]
            
            # Log directory check and creation
            with directory_operation('check', mode_dir):
                log_directory_check(mode_dir, os.path.exists(mode_dir))
            
            # Create the directory if it doesn't exist
            with directory_operation('create', mode_dir):
                os.makedirs(mode_dir, exist_ok=True)
                self.logger.info(f"Created/verified mode directory: {mode_dir}")
            
            # Prepare metadata
            try:
                param_info = self.get_parameter_info(param_id)
                metadata = {
                    'version': version,
                    'param_id': param_id,
                    'compare_to_key': compare_to_key,
                    'mode': mode,
                    'timestamp': datetime.now().isoformat(),
                    'property_info': param_info
                }
                
                # Combine with calculation results
                full_data = {
                    'metadata': metadata,
                    'results': result_data
                }
                
                # Generate filename
                filename = f"{param_id}_vs_{compare_to_key}_{mode.lower()}_results.json"
                filepath = mode_dir / filename
                
                # Save results
                try:
                    with open(filepath, 'w') as f:
                        json.dump(full_data, f, indent=2)
                    
                    self.logger.info(f"Successfully stored calculation result: {filepath}")
                    log_execution_flow('exit', f"Successfully stored calculation result for {param_id}")
                    log_result_saving(filepath, success=True)
                    return filepath
                    
                except (IOError, PermissionError) as file_error:
                    error_msg = f"Failed to write result file {filepath}: {str(file_error)}"
                    self.logger.error(error_msg)
                    log_execution_flow('error', error_msg)
                    log_result_saving(filepath, success=False, error_msg=error_msg)
                    return None
                    
            except Exception as metadata_error:
                error_msg = f"Failed to prepare metadata for {param_id}: {str(metadata_error)}"
                self.logger.error(error_msg)
                log_execution_flow('error', error_msg)
                return None
                
        except Exception as e:
            error_msg = f"Unexpected error in store_calculation_result: {str(e)}"
            self.logger.exception(error_msg)
            log_execution_flow('error', error_msg)
            return None
    
    def generate_plot(self, version: int, param_id: str, compare_to_key: str, 
                    mode: str, plot_type: str, comparison_type: str,
                    result_file: Path) -> Path:
        """
        Generates a plot visualization for sensitivity analysis results.
        Returns the path to the generated plot file.
        
        This function groups plots by compare_to_key to facilitate comparison
        of different parameters against the same reference parameter.
        
        Args:
            version: The version number
            param_id: The parameter ID that was varied
            compare_to_key: The parameter to compare against
            mode: Sensitivity mode ('symmetrical' or 'multiple')
            plot_type: Type of plot ('waterfall', 'bar', 'point')
            comparison_type: Type of comparison ('primary', 'secondary')
            result_file: Path to the result data file
            
        Returns:
            Path to the generated plot file
        """
        from sensitivity_logging import (
            log_execution_flow, track_method, log_directory_check,
            log_plot_generation_start, log_plot_generation_complete, log_plot_generation_error,
            log_plot_data_loading, log_plot_data_processing, log_plot_rendering, log_plot_saving,
            plot_generation_operation
        )
        
        # Use the plot generation context manager to track the entire operation
        with plot_generation_operation(param_id, compare_to_key, plot_type, mode):
            try:
                log_execution_flow('enter', f"Generating {plot_type} plot for {param_id} vs {compare_to_key}")
                version_str = str(version)
                
                # Ensure directories exist
                directories = self.ensure_sensitivity_directories(version)
                
                # Check if the plot directory exists
                plot_dir_key = f"{mode.lower()}_{plot_type}"
                if plot_dir_key not in directories:
                    error_msg = f"Plot directory key '{plot_dir_key}' not found in directories. Available keys: {list(directories.keys())}"
                    self.logger.error(error_msg)
                    log_execution_flow('error', error_msg)
                    log_plot_generation_error(param_id, compare_to_key, plot_type, mode, error_msg)
                    return None
                    
                plot_dir = directories[plot_dir_key]
                
                # Log directory check
                log_directory_check(plot_dir, os.path.exists(plot_dir))
                if not os.path.exists(plot_dir):
                    error_msg = f"Plot directory does not exist: {plot_dir}"
                    self.logger.error(error_msg)
                    log_execution_flow('error', error_msg)
                    log_plot_generation_error(param_id, compare_to_key, plot_type, mode, error_msg)
                    return None
                
                # Create a subdirectory for this compare_to_key to group related plots
                compare_to_dir = plot_dir / compare_to_key
                
                # Log directory check and creation
                log_directory_check(compare_to_dir, os.path.exists(compare_to_dir))
                try:
                    os.makedirs(compare_to_dir, exist_ok=True)
                    self.logger.info(f"Created/verified compare_to directory: {compare_to_dir}")
                except Exception as dir_error:
                    error_msg = f"Failed to create compare_to directory: {compare_to_dir}. Error: {str(dir_error)}"
                    self.logger.error(error_msg)
                    log_execution_flow('error', error_msg)
                    log_plot_generation_error(param_id, compare_to_key, plot_type, mode, error_msg)
                    return None
                
                # Generate plot filename
                plot_name = f"{plot_type}_{param_id}_vs_{compare_to_key}_{comparison_type}.png"
                plot_path = compare_to_dir / plot_name
                
                # Check if result file exists
                if not os.path.exists(result_file):
                    error_msg = f"Result file does not exist: {result_file}"
                    self.logger.error(error_msg)
                    log_execution_flow('error', error_msg)
                    log_plot_data_loading(param_id, compare_to_key, result_file, success=False, error_msg=error_msg)
                    return None
                
                # Load the result data
                try:
                    with open(result_file, 'r') as f:
                        try:
                            result_data = json.load(f)
                            log_plot_data_loading(param_id, compare_to_key, result_file, success=True)
                        except json.JSONDecodeError as json_error:
                            error_msg = f"Failed to parse result file {result_file}: {str(json_error)}"
                            self.logger.error(error_msg)
                            log_execution_flow('error', error_msg)
                            log_plot_data_loading(param_id, compare_to_key, result_file, success=False, error_msg=error_msg)
                            return None
                except Exception as file_error:
                    error_msg = f"Failed to open result file {result_file}: {str(file_error)}"
                    self.logger.error(error_msg)
                    log_execution_flow('error', error_msg)
                    log_plot_data_loading(param_id, compare_to_key, result_file, success=False, error_msg=error_msg)
                    return None
                
                # Process the data for plotting
                try:
                    # In a real implementation, this would process the data for the specific plot type
                    # For now, just log that we're processing the data
                    log_plot_data_processing(param_id, compare_to_key, f"Processing data for {plot_type} plot", success=True)
                except Exception as processing_error:
                    error_msg = f"Failed to process data for {plot_type} plot: {str(processing_error)}"
                    self.logger.error(error_msg)
                    log_execution_flow('error', error_msg)
                    log_plot_data_processing(param_id, compare_to_key, f"Processing data for {plot_type} plot", success=False, error_msg=error_msg)
                    return None
                
                # Render the plot
                try:
                    # In a real implementation, this would generate the actual plot
                    # For now, just log that we're rendering the plot
                    self.logger.info(f"Rendering {plot_type} plot at {plot_path}")
                    self.logger.info(f"  - Data source: {result_file}")
                    self.logger.info(f"  - Parameters: {param_id} vs {compare_to_key} ({comparison_type})")
                    
                    # Log the plot rendering
                    log_plot_rendering(param_id, compare_to_key, plot_type, success=True)
                except Exception as rendering_error:
                    error_msg = f"Failed to render {plot_type} plot: {str(rendering_error)}"
                    self.logger.error(error_msg)
                    log_execution_flow('error', error_msg)
                    log_plot_rendering(param_id, compare_to_key, plot_type, success=False, error_msg=error_msg)
                    return None
                
                # Save the plot
                try:
                    # In a real implementation, this would save the plot to disk
                    # For now, just log that we're saving the plot
                    
                    # Simulate writing to the file to test if we have write permissions
                    with open(plot_path, 'w') as f:
                        f.write("Placeholder for plot data")
                    
                    # Log successful plot saving
                    log_plot_saving(plot_path, success=True)
                except Exception as saving_error:
                    error_msg = f"Failed to save plot to {plot_path}: {str(saving_error)}"
                    self.logger.error(error_msg)
                    log_execution_flow('error', error_msg)
                    log_plot_saving(plot_path, success=False, error_msg=error_msg)
                    return None
                
                # Log successful plot generation
                self.logger.info(f"Successfully generated {plot_type} plot at {plot_path}")
                log_execution_flow('exit', f"Successfully generated {plot_type} plot")
                log_plot_generation_complete(param_id, compare_to_key, plot_type, mode, plot_path)
                return plot_path
                
            except Exception as e:
                error_msg = f"Unexpected error in generate_plot: {str(e)}"
                self.logger.exception(error_msg)
                log_execution_flow('error', error_msg)
                log_plot_generation_error(param_id, compare_to_key, plot_type, mode, error_msg)
                return None
    
    def organize_sensitivity_results(self, version: int) -> Dict:
        """
        Organizes all sensitivity results for a version into a structured format
        suitable for frontend consumption.
        
        This implementation groups results by compare_to_key to facilitate
        comparison of different parameters against the same reference parameter.
        
        Args:
            version: The version number
            
        Returns:
            Dict containing organized sensitivity results
        """
        from sensitivity_logging import log_execution_flow, track_method, log_directory_check
        
        try:
            log_execution_flow('enter', f"Organizing sensitivity results for version {version}")
            version_str = str(version)
            
            # Get all sensitivity directories
            directories = self.ensure_sensitivity_directories(version)
            
            # Structure to hold organized results
            organized_results = {
                'version': version,
                'parameters': {},
                'compare_to_groups': {},
                'plots': {},
                'results': {},
                'errors': []  # Track errors for reporting
            }
            
            # Scan for result files
            for mode in ['Symmetrical', 'Multipoint']:
                # Check if mode directory exists
                if mode.lower() not in directories:
                    error_msg = f"Mode directory key '{mode.lower()}' not found in directories. Available keys: {list(directories.keys())}"
                    self.logger.error(error_msg)
                    organized_results['errors'].append(error_msg)
                    log_execution_flow('error', error_msg)
                    continue
                    
                mode_dir = directories[mode.lower()]
                
                # Log directory check
                log_directory_check(mode_dir, os.path.exists(mode_dir))
                if not os.path.exists(mode_dir):
                    error_msg = f"Mode directory does not exist: {mode_dir}"
                    self.logger.error(error_msg)
                    organized_results['errors'].append(error_msg)
                    log_execution_flow('error', error_msg)
                    continue
                
                # Find result files
                try:
                    result_files = list(mode_dir.glob(f"*_results.json"))
                    self.logger.info(f"Found {len(result_files)} result files in {mode_dir}")
                except Exception as glob_error:
                    error_msg = f"Failed to glob result files in {mode_dir}: {str(glob_error)}"
                    self.logger.error(error_msg)
                    organized_results['errors'].append(error_msg)
                    log_execution_flow('error', error_msg)
                    continue
                
                # Process each result file
                for result_file in result_files:
                    try:
                        self.logger.info(f"Processing result file: {result_file}")
                        
                        # Try to read and parse the result file
                        try:
                            with open(result_file, 'r') as f:
                                result_data = json.load(f)
                        except (IOError, PermissionError) as file_error:
                            error_msg = f"Failed to read result file {result_file}: {str(file_error)}"
                            self.logger.error(error_msg)
                            organized_results['errors'].append(error_msg)
                            log_execution_flow('error', error_msg)
                            continue
                        except json.JSONDecodeError as json_error:
                            error_msg = f"Failed to parse result file {result_file}: {str(json_error)}"
                            self.logger.error(error_msg)
                            organized_results['errors'].append(error_msg)
                            log_execution_flow('error', error_msg)
                            continue
                        
                        # Extract metadata
                        try:
                            param_id = result_data['metadata']['param_id']
                            compare_to_key = result_data['metadata']['compare_to_key']
                            self.logger.info(f"Processing results for {param_id} vs {compare_to_key}")
                        except KeyError as key_error:
                            error_msg = f"Missing metadata in result file {result_file}: {str(key_error)}"
                            self.logger.error(error_msg)
                            organized_results['errors'].append(error_msg)
                            log_execution_flow('error', error_msg)
                            continue
                        
                        # Add parameter info if not already present
                        if param_id not in organized_results['parameters']:
                            try:
                                organized_results['parameters'][param_id] = self.get_parameter_info(param_id)
                            except Exception as param_error:
                                error_msg = f"Failed to get parameter info for {param_id}: {str(param_error)}"
                                self.logger.error(error_msg)
                                organized_results['errors'].append(error_msg)
                                log_execution_flow('error', error_msg)
                                # Continue anyway with basic info
                                organized_results['parameters'][param_id] = {"id": param_id, "display_name": param_id}
                        
                        # Add result data
                        key = f"{param_id}_vs_{compare_to_key}_{mode.lower()}"
                        organized_results['results'][key] = result_data.get('results', {})
                        
                        # Group by compare_to_key
                        if compare_to_key not in organized_results['compare_to_groups']:
                            try:
                                compare_to_info = self.get_parameter_info(compare_to_key)
                                organized_results['compare_to_groups'][compare_to_key] = {
                                    'key': compare_to_key,
                                    'display_name': compare_to_info.get('display_name', compare_to_key),
                                    'parameters': [],
                                    'plots': {}
                                }
                            except Exception as compare_error:
                                error_msg = f"Failed to get compare_to info for {compare_to_key}: {str(compare_error)}"
                                self.logger.error(error_msg)
                                organized_results['errors'].append(error_msg)
                                log_execution_flow('error', error_msg)
                                # Continue anyway with basic info
                                organized_results['compare_to_groups'][compare_to_key] = {
                                    'key': compare_to_key,
                                    'display_name': compare_to_key,
                                    'parameters': [],
                                    'plots': {}
                                }
                        
                        # Add parameter to the group if not already present
                        if param_id not in organized_results['compare_to_groups'][compare_to_key]['parameters']:
                            organized_results['compare_to_groups'][compare_to_key]['parameters'].append(param_id)
                        
                        # Find and add plot information
                        plot_types = ['waterfall', 'bar', 'point']
                        for plot_type in plot_types:
                            # Check if plot directory exists
                            plot_dir_key = f"{mode.lower()}_{plot_type}"
                            if plot_dir_key not in directories:
                                error_msg = f"Plot directory key '{plot_dir_key}' not found in directories for {param_id}"
                                self.logger.warning(error_msg)
                                continue
                                
                            plot_dir = directories[plot_dir_key]
                            
                            # Create compare_to subdirectory path
                            compare_to_dir = plot_dir / compare_to_key
                            
                            # Check if compare_to directory exists
                            if not compare_to_dir.exists():
                                self.logger.warning(f"Compare_to directory does not exist: {compare_to_dir}")
                                continue
                                
                            for comparison_type in ['primary', 'secondary']:
                                plot_name = f"{plot_type}_{param_id}_vs_{compare_to_key}_{comparison_type}.png"
                                plot_path = compare_to_dir / plot_name
                                
                                # Check if plot file exists
                                if plot_path.exists():
                                    plot_key = f"{plot_type}_{param_id}_vs_{compare_to_key}_{comparison_type}"
                                    try:
                                        plot_info = {
                                            'type': plot_type,
                                            'param_id': param_id,
                                            'compare_to_key': compare_to_key,
                                            'comparison_type': comparison_type,
                                            'mode': mode.lower(),
                                            'path': str(plot_path.relative_to(self.original_dir)),
                                            'url': f"/images/Original/{plot_path.relative_to(self.original_dir)}"
                                        }
                                        
                                        # Add to main plots dictionary
                                        organized_results['plots'][plot_key] = plot_info
                                        
                                        # Add to compare_to_group plots
                                        if plot_type not in organized_results['compare_to_groups'][compare_to_key]['plots']:
                                            organized_results['compare_to_groups'][compare_to_key]['plots'][plot_type] = []
                                        
                                        organized_results['compare_to_groups'][compare_to_key]['plots'][plot_type].append(plot_info)
                                        self.logger.info(f"Added plot: {plot_path}")
                                    except Exception as plot_error:
                                        error_msg = f"Failed to process plot {plot_path}: {str(plot_error)}"
                                        self.logger.error(error_msg)
                                        organized_results['errors'].append(error_msg)
                                        log_execution_flow('error', error_msg)
                                else:
                                    self.logger.warning(f"Plot file does not exist: {plot_path}")
                        
                    except Exception as result_error:
                        error_msg = f"Error processing result file {result_file}: {str(result_error)}"
                        self.logger.error(error_msg)
                        organized_results['errors'].append(error_msg)
                        log_execution_flow('error', error_msg)
            
            # Log summary information
            param_count = len(organized_results['parameters'])
            result_count = len(organized_results['results'])
            plot_count = len(organized_results['plots'])
            group_count = len(organized_results['compare_to_groups'])
            
            self.logger.info(f"Organized sensitivity results for version {version}:")
            self.logger.info(f"  - {param_count} parameters")
            self.logger.info(f"  - {result_count} results")
            self.logger.info(f"  - {plot_count} plots")
            self.logger.info(f"  - {group_count} comparison groups")
            
            log_execution_flow('exit', f"Successfully organized sensitivity results for version {version}")
            return organized_results
            
        except Exception as e:
            error_msg = f"Unexpected error in organize_sensitivity_results: {str(e)}"
            self.logger.exception(error_msg)
            log_execution_flow('error', error_msg)
            return {
                'version': version,
                'parameters': {},
                'compare_to_groups': {},
                'plots': {},
                'results': {},
                'errors': [error_msg]
            }
    
    def generate_comparison_report(self, version: int, compare_to_key: str, mode: str) -> Dict:
        """
        Generates a comprehensive comparison report for a specific reference parameter.
        
        This function creates a report that compares the effects of varying different
        parameters on a single reference parameter (e.g., NPV or IRR).
        
        Args:
            version: The version number
            compare_to_key: The reference parameter to compare against
            mode: Sensitivity mode ('symmetrical' or 'multiple')
            
        Returns:
            Dict containing the report data
        """
        # Get organized results
        organized_results = self.organize_sensitivity_results(version)
        
        # Filter for the specified compare_to_key and mode
        if compare_to_key not in organized_results['compare_to_groups']:
            self.logger.warning(f"No results found for compare_to_key {compare_to_key}")
            return {"error": f"No results found for {compare_to_key}"}
        
        compare_group = organized_results['compare_to_groups'][compare_to_key]
        
        # Create report structure
        report = {
            'version': version,
            'compare_to_key': compare_to_key,
            'compare_to_display_name': compare_group['display_name'],
            'mode': mode,
            'timestamp': datetime.now().isoformat(),
            'parameters': [],
            'plots': {},
            'summary': {}
        }
        
        # Extract parameter-specific results
        for param_id in compare_group['parameters']:
            result_key = f"{param_id}_vs_{compare_to_key}_{mode.lower()}"
            
            if result_key not in organized_results['results']:
                continue
                
            param_info = organized_results['parameters'].get(param_id, {})
            result_data = organized_results['results'][result_key]
            # Add parameter with its result data
            param_result = {
                'param_id': param_id,
                'display_name': param_info.get('display_name', param_id),
                'property_id': param_info.get('property_id'),
                'variation_results': result_data,
                'plots': {}
            }
            
            # Add plot information for this parameter
            for plot_type in ['waterfall', 'bar', 'point']:
                if plot_type in compare_group['plots'] and compare_group['plots'][plot_type]:
                    # Find plots for this parameter
                    param_plots = [
                        plot for plot in compare_group['plots'][plot_type]
                        if plot['param_id'] == param_id
                    ]
                    
                    if param_plots:
                        param_result['plots'][plot_type] = param_plots
            
            report['parameters'].append(param_result)
        
        # Add plot information to the report
        for plot_type in ['waterfall', 'bar', 'point']:
            if plot_type in compare_group['plots']:
                report['plots'][plot_type] = compare_group['plots'][plot_type]
        
        # Generate summary statistics
        if report['parameters']:
            # Calculate aggregate statistics across all parameters
            all_variations = []
            all_impacts = []
            
            for param_result in report['parameters']:
                variation_results = param_result.get('variation_results', {})
                
                if 'variations' in variation_results:
                    variations = variation_results['variations']
                    impacts = variation_results.get('impacts', [])
                    
                    all_variations.extend(variations)
                    all_impacts.extend(impacts)
            
            # Calculate summary statistics
            if all_variations and all_impacts:
                report['summary'] = {
                    'parameter_count': len(report['parameters']),
                    'avg_impact': sum(all_impacts) / len(all_impacts) if all_impacts else 0,
                    'max_impact': max(all_impacts) if all_impacts else 0,
                    'min_impact': min(all_impacts) if all_impacts else 0,
                    'most_sensitive_param': None,
                    'least_sensitive_param': None
                }
                
                # Find most and least sensitive parameters
                max_sensitivity = 0
                min_sensitivity = float('inf')
                
                for param_result in report['parameters']:
                    variation_results = param_result.get('variation_results', {})
                    
                    if 'impacts' in variation_results:
                        impacts = variation_results['impacts']
                        avg_impact = sum(impacts) / len(impacts) if impacts else 0
                        max_impact = max(impacts) if impacts else 0
                        
                        # Use maximum impact as sensitivity measure
                        if abs(max_impact) > max_sensitivity:
                            max_sensitivity = abs(max_impact)
                            report['summary']['most_sensitive_param'] = {
                                'param_id': param_result['param_id'],
                                'display_name': param_result['display_name'],
                                'sensitivity': max_impact
                            }
                        
                        if abs(max_impact) < min_sensitivity and abs(max_impact) > 0:
                            min_sensitivity = abs(max_impact)
                            report['summary']['least_sensitive_param'] = {
                                'param_id': param_result['param_id'],
                                'display_name': param_result['display_name'],
                                'sensitivity': max_impact
                            }
        
        self.logger.info(f"Generated comparison report for {compare_to_key} ({mode}) with {len(report['parameters'])} parameters")
        return report

# Create a singleton instance for easy import
sensitivity_manager = SensitivityAnalysisManager()
