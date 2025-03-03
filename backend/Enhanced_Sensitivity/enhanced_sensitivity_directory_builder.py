"""
Enhanced Sensitivity Directory Builder

This module handles the creation of directory structure for sensitivity analysis,
copying configuration files to variation directories, and managing the modification
of parameter values for each variation.
"""

import os
import json
import shutil
import logging
from pathlib import Path
import sys

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'enhanced_sensitivity.log'))
    ]
)
logger = logging.getLogger(__name__)

class EnhancedSensitivityDirectoryBuilder:
    """
    Handles the creation of directory structure for sensitivity analysis,
    copying configuration files to variation directories, and managing the
    modification of parameter values for each variation.
    """
    
    def __init__(self, base_dir=None):
        """
        Initialize the directory builder with the base directory.
        
        Args:
            base_dir (str, optional): Base directory for sensitivity analysis.
                If not provided, uses the default directory structure.
        """
        if base_dir:
            self.base_dir = base_dir
        else:
            # Default directory structure
            current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.base_dir = os.path.join(current_dir, 'Original')
            
        logger.info(f"Initialized EnhancedSensitivityDirectoryBuilder with base directory: {self.base_dir}")
    
    def create_sensitivity_directories(self, version, sen_parameters):
        """
        Create directory structure for sensitivity analysis.
        
        Args:
            version (int): Version number
            sen_parameters (dict): Dictionary containing sensitivity parameters
            
        Returns:
            tuple: (sensitivity_dir, reports_dir) - Paths to the main sensitivity directory and reports directory
        """
        logger.info(f"Creating sensitivity directories for version {version}")
        
        # Create sensitivity directories
        results_folder = os.path.join(self.base_dir, f'Batch({version})', f'Results({version})')
        sensitivity_dir = os.path.join(results_folder, 'Sensitivity')
        
        # Create main sensitivity directory
        os.makedirs(sensitivity_dir, exist_ok=True)
        logger.info(f"Created main sensitivity directory: {sensitivity_dir}")
        
        # Create Reports directory (only additional folder in Sensitivity)
        reports_dir = os.path.join(sensitivity_dir, "Reports")
        os.makedirs(reports_dir, exist_ok=True)
        logger.info(f"Created Reports directory: {reports_dir}")
        
        # Create parameter-specific directories with mode and variation
        for param_id, param_config in sen_parameters.items():
            if not param_config.get('enabled'):
                continue
                
            # Get variation values
            values = param_config.get('values', [])
            if not values:
                continue
                
            # Get mode (symmetrical or multipoint)
            mode = param_config.get('mode', 'symmetrical')
            
            # Determine variation list based on mode
            if mode.lower() == 'symmetrical':
                # For symmetrical, use first value to create +/- variations at 50% of the specified value
                base_variation = values[0]
                # Calculate 50% of the base variation for symmetrical mode
                half_variation = base_variation / 2
                variation_list = [half_variation, -half_variation]
                logger.info(f"Using symmetrical variations: +/-{half_variation}% (50% of {base_variation}%)")
            else:  # 'multipoint' mode
                # For multipoint, use all values directly
                variation_list = values
                logger.info(f"Using multiple point variations: {variation_list}")
                
            # Create a directory for each variation
            for variation in variation_list:
                # Format the variation string (e.g., "+10.00" or "-10.00")
                var_str = f"{variation:+.2f}"
                
                # Create the full directory path: Sensitivity/param_id/mode/variation
                var_dir = os.path.join(sensitivity_dir, param_id, mode, var_str)
                os.makedirs(var_dir, exist_ok=True)
                logger.info(f"Created directory: {var_dir}")
        
        # Return the sensitivity directory and reports directory
        return sensitivity_dir, reports_dir
    
    def copy_config_files(self, version, sensitivity_dir):
        """
        Copy all JSON configuration files from the Results folder to each variation directory.
        
        Args:
            version (int): Version number
            sensitivity_dir (str): Path to the sensitivity directory
            
        Returns:
            int: Number of files copied
        """
        logger.info(f"Copying configuration files for version {version}")
        
        # Get the Results folder
        results_folder = os.path.join(self.base_dir, f'Batch({version})', f'Results({version})')
        
        # Get all JSON files in the Results folder
        json_files = [f for f in os.listdir(results_folder) if f.endswith('.json')]
        logger.info(f"Found {len(json_files)} JSON files in Results folder")
        
        # Count the number of files copied
        files_copied = 0
        
        # Iterate through all subdirectories in the sensitivity directory
        for root, dirs, files in os.walk(sensitivity_dir):
            # Skip the Reports directory
            if os.path.basename(root) == "Reports":
                continue
                
            # Check if this is a variation directory (has 3 levels of nesting)
            # Sensitivity/param_id/mode/variation
            rel_path = os.path.relpath(root, sensitivity_dir)
            if rel_path != '.' and len(Path(rel_path).parts) == 3:
                logger.info(f"Copying files to variation directory: {rel_path}")
                
                # Copy each JSON file to the variation directory
                for json_file in json_files:
                    src_file = os.path.join(results_folder, json_file)
                    dst_file = os.path.join(root, json_file)
                    
                    # Copy the file
                    shutil.copy2(src_file, dst_file)
                    files_copied += 1
                    
                # Also copy CSV files if they exist
                csv_files = [f for f in os.listdir(results_folder) if f.endswith('.csv')]
                for csv_file in csv_files:
                    src_file = os.path.join(results_folder, csv_file)
                    dst_file = os.path.join(root, csv_file)
                    
                    # Copy the file
                    shutil.copy2(src_file, dst_file)
                    files_copied += 1
        
        logger.info(f"Copied {files_copied} files to variation directories")
        return files_copied
    
    def modify_parameter_values(self, sensitivity_dir, sen_parameters):
        """
        Modify parameter values in configuration files according to variations.
        
        Args:
            sensitivity_dir (str): Path to the sensitivity directory
            sen_parameters (dict): Dictionary containing sensitivity parameters
            
        Returns:
            int: Number of files modified
        """
        logger.info("Modifying parameter values in configuration files")
        
        # Count the number of files modified
        files_modified = 0
        
        # Iterate through all subdirectories in the sensitivity directory
        for root, dirs, files in os.walk(sensitivity_dir):
            # Skip the Reports directory
            if os.path.basename(root) == "Reports":
                continue
                
            # Check if this is a variation directory (has 3 levels of nesting)
            # Sensitivity/param_id/mode/variation
            rel_path = os.path.relpath(root, sensitivity_dir)
            if rel_path != '.' and len(Path(rel_path).parts) == 3:
                # Extract parameter ID, mode, and variation from the path
                param_id, mode, variation_str = Path(rel_path).parts
                
                # Skip if parameter is not enabled
                if not sen_parameters.get(param_id, {}).get('enabled'):
                    continue
                
                # Get the parameter configuration
                param_config = sen_parameters.get(param_id, {})
                
                # Get the property ID for this parameter
                property_id = self.get_property_id(param_id)
                if not property_id:
                    logger.warning(f"No property ID found for parameter {param_id}")
                    continue
                
                # Convert variation string to float
                variation = float(variation_str.replace('+', ''))
                
                # Find the config module file
                config_files = [f for f in files if f.endswith('_config_module_3.json')]
                if not config_files:
                    logger.warning(f"No config module file found in {root}")
                    continue
                
                # Modify each config module file
                for config_file in config_files:
                    config_path = os.path.join(root, config_file)
                    
                    # Load the config module
                    with open(config_path, 'r') as f:
                        config_data = json.load(f)
                    
                    # Get the original value
                    original_value = config_data.get(property_id)
                    if original_value is None:
                        logger.warning(f"Property {property_id} not found in {config_file}")
                        continue
                    
                    # Calculate the new value based on the variation
                    if isinstance(original_value, (int, float)):
                        # Apply percentage variation
                        new_value = original_value * (1 + variation / 100)
                        
                        # Update the config data
                        config_data[property_id] = new_value
                        
                        # Save the modified config
                        with open(config_path, 'w') as f:
                            json.dump(config_data, f, indent=4)
                        
                        files_modified += 1
                        logger.info(f"Modified {property_id} in {config_file}: {original_value} -> {new_value} ({variation_str}%)")
                    else:
                        logger.warning(f"Property {property_id} is not a number: {original_value}")
        
        logger.info(f"Modified {files_modified} configuration files")
        return files_modified
    
    def get_property_id(self, param_id):
        """
        Get the property ID for a sensitivity parameter.
        
        Args:
            param_id (str): Parameter ID (e.g., "S34")
            
        Returns:
            str: Property ID (e.g., "rawmaterialAmount34")
        """
        # Extract parameter number (e.g., S10 -> 10)
        if not (param_id.startswith('S') and param_id[1:].isdigit()):
            logger.warning(f"Invalid parameter ID format: {param_id}")
            return None
        
        param_num = int(param_id[1:])
        
        # Define parameter mappings
        param_mappings = {
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
            38: "insuranceAmount38"
        }
        
        # Get property ID
        property_id = param_mappings.get(param_num)
        if not property_id:
            logger.warning(f"No property mapping found for parameter {param_id}")
            return None
            
        return property_id

# Example usage
if __name__ == "__main__":
    # Create directory builder
    builder = EnhancedSensitivityDirectoryBuilder()
    
    # Example configuration data
    example_config = {
        "S34": {
            "mode": "symmetrical",
            "values": [20],
            "enabled": True,
            "compareToKey": "S13",
            "comparisonType": "primary",
            "waterfall": True,
            "bar": True,
            "point": True
        },
        "S35": {
            "mode": "symmetrical",
            "values": [20],
            "enabled": True,
            "compareToKey": "S13",
            "comparisonType": "primary",
            "waterfall": True,
            "bar": True,
            "point": True
        }
    }
    
    # Create sensitivity directories
    sensitivity_dir, reports_dir = builder.create_sensitivity_directories(1, example_config)
    
    # Copy configuration files
    builder.copy_config_files(1, sensitivity_dir)
    
    # Modify parameter values
    builder.modify_parameter_values(sensitivity_dir, example_config)
