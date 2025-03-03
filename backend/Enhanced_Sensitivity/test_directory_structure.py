"""
Test Enhanced Sensitivity Directory Structure

This script tests the enhanced sensitivity directory structure creation functionality.
"""

import os
import sys
import json
import logging
import shutil
from enhanced_sensitivity_directory_builder import EnhancedSensitivityDirectoryBuilder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def test_directory_creation():
    """Test directory creation."""
    try:
        # Create directory builder
        builder = EnhancedSensitivityDirectoryBuilder()
        
        # Sample sensitivity parameters
        sen_parameters = {
            "S1": {
                "enabled": True,
                "file": "config.json",
                "path": "parameters.interest_rate",
                "baseValue": 0.05,
                "step": 10,
                "stepsUp": 2,
                "stepsDown": 2
            },
            "S2": {
                "enabled": True,
                "file": "CFA.csv",
                "row": 5,
                "col": 3,
                "baseValue": 100,
                "step": 5,
                "stepsUp": 1,
                "stepsDown": 1
            },
            "S3": {
                "enabled": False,
                "file": "Economic_Summary.csv",
                "row": 10,
                "col": 2,
                "baseValue": 50,
                "step": 20,
                "stepsUp": 2,
                "stepsDown": 2
            }
        }
        
        # Create sensitivity directories
        version = 1
        sensitivity_dir, reports_dir = builder.create_sensitivity_directories(version, sen_parameters)
        
        # Verify directories were created
        logger.info(f"Sensitivity directory: {sensitivity_dir}")
        logger.info(f"Reports directory: {reports_dir}")
        
        # Check if sensitivity directory exists
        if not os.path.exists(sensitivity_dir):
            logger.error(f"Sensitivity directory not created: {sensitivity_dir}")
            return False
            
        # Check if reports directory exists
        if not os.path.exists(reports_dir):
            logger.error(f"Reports directory not created: {reports_dir}")
            return False
            
        # Check if parameter directories exist
        for param_id, param_config in sen_parameters.items():
            if not param_config.get('enabled', False):
                continue
                
            param_dir = os.path.join(sensitivity_dir, param_id)
            if not os.path.exists(param_dir):
                logger.error(f"Parameter directory not created: {param_dir}")
                return False
                
            # Check if variation directories exist
            variations = ['base']
            step = param_config.get('step', 10)
            steps_up = param_config.get('stepsUp', 2)
            steps_down = param_config.get('stepsDown', 2)
            
            for i in range(1, steps_up + 1):
                variations.append(f'plus_{step * i}')
                
            for i in range(1, steps_down + 1):
                variations.append(f'minus_{step * i}')
                
            for variation in variations:
                variation_dir = os.path.join(param_dir, variation)
                if not os.path.exists(variation_dir):
                    logger.error(f"Variation directory not created: {variation_dir}")
                    return False
        
        logger.info("All directories created successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error during directory creation: {str(e)}")
        return False

def test_config_file_copy():
    """Test configuration file copying."""
    try:
        # Create directory builder
        builder = EnhancedSensitivityDirectoryBuilder()
        
        # Sample sensitivity parameters
        sen_parameters = {
            "S1": {
                "enabled": True,
                "file": "config.json",
                "path": "parameters.interest_rate",
                "baseValue": 0.05,
                "step": 10,
                "stepsUp": 1,
                "stepsDown": 1
            }
        }
        
        # Create sensitivity directories
        version = 1
        sensitivity_dir, _ = builder.create_sensitivity_directories(version, sen_parameters)
        
        # Copy configuration files
        copied_files = builder.copy_config_files(version, sensitivity_dir)
        
        # Verify files were copied
        logger.info(f"Copied files: {copied_files}")
        
        # Check if files were copied
        if not copied_files:
            logger.warning("No files were copied")
            
        # Check if at least one file was copied to each variation directory
        for param_id, param_config in sen_parameters.items():
            if not param_config.get('enabled', False):
                continue
                
            param_dir = os.path.join(sensitivity_dir, param_id)
            
            # Check variations
            variations = ['base', 'plus_10', 'minus_10']
            for variation in variations:
                variation_dir = os.path.join(param_dir, variation)
                
                # Check if any file was copied to this variation directory
                files_in_dir = [f for f in copied_files if variation_dir in f]
                if not files_in_dir:
                    logger.warning(f"No files copied to variation directory: {variation_dir}")
        
        logger.info("Configuration files copied successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error during configuration file copying: {str(e)}")
        return False

def test_parameter_value_modification():
    """Test parameter value modification."""
    try:
        # Create directory builder
        builder = EnhancedSensitivityDirectoryBuilder()
        
        # Sample sensitivity parameters
        sen_parameters = {
            "S1": {
                "enabled": True,
                "file": "config.json",
                "path": "parameters.interest_rate",
                "baseValue": 0.05,
                "step": 10,
                "stepsUp": 1,
                "stepsDown": 1
            }
        }
        
        # Create sensitivity directories
        version = 1
        sensitivity_dir, _ = builder.create_sensitivity_directories(version, sen_parameters)
        
        # Copy configuration files
        builder.copy_config_files(version, sensitivity_dir)
        
        # Modify parameter values
        modified_files = builder.modify_parameter_values(sensitivity_dir, sen_parameters)
        
        # Verify files were modified
        logger.info(f"Modified files: {modified_files}")
        
        # Check if files were modified
        if not modified_files:
            logger.warning("No files were modified")
            
        # Check if parameter values were modified correctly
        for param_id, param_config in sen_parameters.items():
            if not param_config.get('enabled', False):
                continue
                
            param_dir = os.path.join(sensitivity_dir, param_id)
            param_file = param_config.get('file', 'config.json')
            param_path = param_config.get('path', '')
            param_base_value = float(param_config.get('baseValue', 0))
            
            # Check variations
            variations = ['base', 'plus_10', 'minus_10']
            for variation in variations:
                variation_dir = os.path.join(param_dir, variation)
                config_file = os.path.join(variation_dir, param_file)
                
                # Skip if file doesn't exist
                if not os.path.exists(config_file):
                    logger.warning(f"Config file not found: {config_file}")
                    continue
                    
                # Check if file was modified
                if config_file not in modified_files:
                    logger.warning(f"File not modified: {config_file}")
                    continue
                    
                # Calculate expected value
                if variation == 'base':
                    expected_value = param_base_value
                elif variation == 'plus_10':
                    expected_value = param_base_value * 1.1
                elif variation == 'minus_10':
                    expected_value = param_base_value * 0.9
                else:
                    expected_value = param_base_value
                    
                # Check if value was modified correctly
                if param_file.endswith('.json'):
                    # Read JSON file
                    with open(config_file, 'r') as f:
                        data = json.load(f)
                        
                    # Navigate to parameter path
                    if param_path:
                        keys = param_path.split('.')
                        target = data
                        for key in keys:
                            if key not in target:
                                logger.warning(f"Key not found in JSON: {key}")
                                break
                            target = target[key]
                            
                        # Check value
                        if target != expected_value:
                            logger.warning(f"Value not modified correctly in {config_file}: expected {expected_value}, got {target}")
                            
                elif param_file.endswith('.csv'):
                    # Read CSV file
                    with open(config_file, 'r') as f:
                        lines = f.readlines()
                        
                    # Check if row exists
                    row = param_config.get('row', 0)
                    if row >= len(lines):
                        logger.warning(f"Row {row} out of range in {config_file}")
                        continue
                        
                    # Split row into columns
                    columns = lines[row].strip().split(',')
                    
                    # Check if column exists
                    col = param_config.get('col', 0)
                    if col >= len(columns):
                        logger.warning(f"Column {col} out of range in {config_file}")
                        continue
                        
                    # Check value
                    value = float(columns[col])
                    if abs(value - expected_value) > 0.0001:
                        logger.warning(f"Value not modified correctly in {config_file}: expected {expected_value}, got {value}")
        
        logger.info("Parameter values modified successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error during parameter value modification: {str(e)}")
        return False

def cleanup_test_directories():
    """Clean up test directories."""
    try:
        # Get base directory
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Get sensitivity directory
        sensitivity_dir = os.path.join(
            base_dir,
            "Original",
            "Batch(1)",
            "Results(1)",
            "Sensitivity"
        )
        
        # Check if sensitivity directory exists
        if os.path.exists(sensitivity_dir):
            # Remove sensitivity directory
            shutil.rmtree(sensitivity_dir)
            logger.info(f"Removed sensitivity directory: {sensitivity_dir}")
            
        return True
        
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        return False

def main():
    """Main function."""
    logger.info("Testing enhanced sensitivity directory structure")
    
    # Clean up test directories
    cleanup_test_directories()
    
    # Test directory creation
    if not test_directory_creation():
        logger.error("Directory creation failed")
        return
        
    # Test configuration file copying
    if not test_config_file_copy():
        logger.error("Configuration file copying failed")
        return
        
    # Test parameter value modification
    if not test_parameter_value_modification():
        logger.error("Parameter value modification failed")
        return
        
    # Clean up test directories
    cleanup_test_directories()
    
    logger.info("All tests completed successfully")

if __name__ == "__main__":
    main()
