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
        self.original_dir = self.base_dir / "public" / "Original"
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
        version_str = str(version)
        batch_dir = self.original_dir / f"Batch({version_str})"
        results_dir = batch_dir / f"Results({version_str})"
        sensitivity_dir = results_dir / "Sensitivity"
        
        # Create the main sensitivity directory
        os.makedirs(sensitivity_dir, exist_ok=True)
        
        # Create subdirectories for different analysis types and outputs
        created_dirs = {'root': sensitivity_dir}
        
        for main_dir, sub_dirs in self.directory_structure.items():
            main_path = sensitivity_dir / main_dir
            os.makedirs(main_path, exist_ok=True)
            created_dirs[main_dir.lower()] = main_path
            
            # Create sub-directories if needed
            for sub_dir in sub_dirs:
                sub_path = main_path / sub_dir
                os.makedirs(sub_path, exist_ok=True)
                created_dirs[f"{main_dir.lower()}_{sub_dir}"] = sub_path
        
        self.logger.info(f"Created sensitivity directories for version {version}")
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
    
    def load_config_module(self, version: int, year: int = None) -> Any:
        """
        Loads a configuration module for a specific version and year.
        If year is None, loads the base configuration.
        """
        version_str = str(version)
        
        # Find the appropriate configuration file
        if year is None:
            # Use the main configuration file
            config_dir = self.base_dir / "backend" / "Configuration_management"
            config_file = config_dir / f"config_module_{version_str}.py"
        else:
            # Use a year-specific configuration file if it exists
            year_str = str(year)
            results_dir = self.original_dir / f"Batch({version_str})" / f"Results({version_str})"
            config_file = results_dir / f"config_module_{version_str}_{year_str}.py"
            
            # If year-specific file doesn't exist, fall back to the main config
            if not os.path.exists(config_file):
                self.logger.warning(f"Year-specific config {config_file} not found, using main config")
                config_dir = self.base_dir / "backend" / "Configuration_management"
                config_file = config_dir / f"config_module_{version_str}.py"
        
        if not os.path.exists(config_file):
            raise FileNotFoundError(f"Config file not found: {config_file}")
        
        # Load the configuration module
        spec = importlib.util.spec_from_file_location("config_module", config_file)
        config_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(config_module)
        
        return config_module
    
    def save_sensitivity_config(self, config_module: Any, version: int, param_id: str, 
                               mode: str, variation: float, year: int = None) -> Path:
        """
        Saves a modified configuration for sensitivity analysis.
        Returns the path to the saved configuration file.
        """
        version_str = str(version)
        
        # Ensure directories exist
        directories = self.ensure_sensitivity_directories(version)
        config_dir = directories['configuration']
        
        # Convert config module to dictionary
        config_dict = {
            attr: getattr(config_module, attr) 
            for attr in dir(config_module) 
            if not attr.startswith('__')
        }
        
        # Generate filename
        year_suffix = f"_{year}" if year is not None else ""
        filename = f"{version_str}_config_{param_id}_{variation:.2f}{year_suffix}.json"
        filepath = config_dir / filename
        
        # Save configuration
        with open(filepath, 'w') as f:
            json.dump(config_dict, f, indent=2)
        
        self.logger.info(f"Saved sensitivity configuration: {filepath}")
        return filepath
    
    def apply_sensitivity_variation(self, config_module: Any, param_id: str, variation: float) -> Any:
        """
        Applies a sensitivity variation to a parameter in the configuration module.
        Returns the modified configuration module.
        """
        param_info = self.get_parameter_info(param_id)
        property_id = param_info['property_id']
        
        if not property_id:
            raise ValueError(f"Cannot apply variation: No property mapping for {param_id}")
        
        # Get the original value
        if not hasattr(config_module, property_id):
            raise AttributeError(f"Configuration module has no attribute '{property_id}'")
        
        original_value = getattr(config_module, property_id)
        
        # Apply the variation
        if isinstance(original_value, (list, tuple, np.ndarray)):
            # For vector parameters
            modified_value = [val * (1 + variation/100) for val in original_value]
        else:
            # For scalar parameters
            modified_value = original_value * (1 + variation/100)
        
        # Set the modified value
        setattr(config_module, property_id, modified_value)
        
        self.logger.info(f"Applied {variation}% variation to {property_id} (from {original_value} to {modified_value})")
        return config_module
    
    def generate_sensitivity_configs(self, version: int, param_id: str, mode: str, 
                                    variations: List[float]) -> List[Dict]:
        """
        Generates configuration variations for sensitivity analysis.
        Returns information about the generated configurations.
        """
        self.logger.info(f"Generating sensitivity configs for {param_id} in version {version}, mode: {mode}")
        
        # Load the configuration matrix to get year-specific configurations
        version_str = str(version)
        results_dir = self.original_dir / f"Batch({version_str})" / f"Results({version_str})"
        matrix_file = results_dir / f"Configuration_Matrix({version_str}).csv"
        
        configs_info = []
        
        try:
            # Check if configuration matrix exists
            if os.path.exists(matrix_file):
                matrix_df = pd.read_csv(matrix_file)
                
                # Process each year range in the matrix
                for _, row in matrix_df.iterrows():
                    start_year = int(row['start'])
                    end_year = int(row['end'])
                    
                    # Load base config for this year range
                    base_config = self.load_config_module(version, start_year)
                    
                    # Apply the filtered values from the configuration matrix
                    # This step is kept simple here but would need to be expanded
                    # to properly apply all filtered values from the matrix
                    
                    # Generate variations
                    if mode == 'symmetrical' and variations:
                        # For symmetrical mode, generate +/- variations
                        variation = variations[0]
                        variation_list = [variation, -variation]
                    else:
                        # For multipoint mode, use the provided variations
                        variation_list = variations
                    
                    # Create and save configurations for each variation
                    for var in variation_list:
                        # Make a deep copy of the configuration
                        import copy
                        var_config = copy.deepcopy(base_config)
                        
                        # Apply the variation
                        var_config = self.apply_sensitivity_variation(var_config, param_id, var)
                        
                        # Save the configuration
                        config_path = self.save_sensitivity_config(
                            var_config, version, param_id, mode, var, start_year
                        )
                        
                        configs_info.append({
                            'version': version,
                            'param_id': param_id,
                            'variation': var,
                            'year_range': (start_year, end_year),
                            'config_path': str(config_path)
                        })
            else:
                # If no matrix file, just use the base configuration
                base_config = self.load_config_module(version)
                
                # Generate variations
                if mode == 'symmetrical' and variations:
                    variation = variations[0]
                    variation_list = [variation, -variation]
                else:
                    variation_list = variations
                
                # Create and save configurations for each variation
                for var in variation_list:
                    import copy
                    var_config = copy.deepcopy(base_config)
                    var_config = self.apply_sensitivity_variation(var_config, param_id, var)
                    config_path = self.save_sensitivity_config(
                        var_config, version, param_id, mode, var
                    )
                    
                    configs_info.append({
                        'version': version,
                        'param_id': param_id,
                        'variation': var,
                        'year_range': None,
                        'config_path': str(config_path)
                    })
                    
        except Exception as e:
            self.logger.error(f"Error generating sensitivity configurations: {str(e)}")
            raise
        
        return configs_info
    
    def store_calculation_result(self, version: int, param_id: str, compare_to_key: str,
                                result_data: Dict, mode: str) -> Path:
        """
        Stores sensitivity calculation results in a standardized format.
        Returns the path to the stored result file.
        """
        version_str = str(version)
        
        # Ensure directories exist
        directories = self.ensure_sensitivity_directories(version)
        mode_dir = directories[mode.lower()]
        
        # Prepare metadata
        metadata = {
            'version': version,
            'param_id': param_id,
            'compare_to_key': compare_to_key,
            'mode': mode,
            'timestamp': datetime.now().isoformat(),
            'property_info': self.get_parameter_info(param_id)
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
        with open(filepath, 'w') as f:
            json.dump(full_data, f, indent=2)
        
        self.logger.info(f"Stored calculation result: {filepath}")
        return filepath
    
    def generate_plot(self, version: int, param_id: str, compare_to_key: str, 
                     mode: str, plot_type: str, comparison_type: str,
                     result_file: Path) -> Path:
        """
        Generates a plot visualization for sensitivity analysis results.
        Returns the path to the generated plot file.
        """
        version_str = str(version)
        
        # Ensure directories exist
        directories = self.ensure_sensitivity_directories(version)
        plot_dir = directories[f"{mode.lower()}_{plot_type}"]
        
        # Generate plot filename
        plot_name = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}.png"
        plot_path = plot_dir / plot_name
        
        # In a real implementation, this would call a plotting function or script
        # For now, we'll just log the information
        self.logger.info(f"Would generate {plot_type} plot at {plot_path}")
        self.logger.info(f"  - Data source: {result_file}")
        self.logger.info(f"  - Parameters: {param_id} vs {compare_to_key} ({comparison_type})")
        
        # In a real implementation, return the actual plot path
        # For now, just return the expected path
        return plot_path
    
    def organize_sensitivity_results(self, version: int) -> Dict:
        """
        Organizes all sensitivity results for a version into a structured format
        suitable for frontend consumption.
        """
        version_str = str(version)
        
        # Get all sensitivity directories
        directories = self.ensure_sensitivity_directories(version)
        
        # Structure to hold organized results
        organized_results = {
            'version': version,
            'parameters': {},
            'plots': {},
            'results': {}
        }
        
        # Scan for result files
        for mode in ['Symmetrical', 'Multipoint']:
            mode_dir = directories[mode.lower()]
            result_files = list(mode_dir.glob(f"*_results.json"))
            
            for result_file in result_files:
                try:
                    with open(result_file, 'r') as f:
                        result_data = json.load(f)
                    
                    param_id = result_data['metadata']['param_id']
                    compare_to_key = result_data['metadata']['compare_to_key']
                    
                    # Add parameter info if not already present
                    if param_id not in organized_results['parameters']:
                        organized_results['parameters'][param_id] = self.get_parameter_info(param_id)
                    
                    # Add result data
                    key = f"{param_id}_vs_{compare_to_key}_{mode.lower()}"
                    organized_results['results'][key] = result_data['results']
                    
                    # Find and add plot information
                    plot_types = ['waterfall', 'bar', 'point']
                    for plot_type in plot_types:
                        plot_dir = directories[f"{mode.lower()}_{plot_type}"]
                        for comparison_type in ['primary', 'secondary']:
                            plot_name = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}.png"
                            plot_path = plot_dir / plot_name
                            
                            if plot_path.exists():
                                plot_key = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}"
                                organized_results['plots'][plot_key] = {
                                    'type': plot_type,
                                    'param_id': param_id,
                                    'compare_to_key': compare_to_key,
                                    'comparison_type': comparison_type,
                                    'mode': mode.lower(),
                                    'path': str(plot_path.relative_to(self.original_dir)),
                                    'url': f"/images/Original/{plot_path.relative_to(self.original_dir)}"
                                }
                except Exception as e:
                    self.logger.error(f"Error processing result file {result_file}: {str(e)}")
        
        self.logger.info(f"Organized {len(organized_results['results'])} results and {len(organized_results['plots'])} plots for version {version}")
        return organized_results

# Create a singleton instance for easy import
sensitivity_manager = SensitivityAnalysisManager()