"""
Enhanced Sensitivity Executor

This module handles running the 4 common scripts and CFA.py for the baseline,
running CFA.py for each variation, and extracting and storing the "Average Selling Price"
from Economic_Summary.csv.
"""

import os
import json
import csv
import subprocess
import logging
import time
import sys
from pathlib import Path

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

class EnhancedSensitivityExecutor:
    """
    Handles running the 4 common scripts and CFA.py for the baseline,
    running CFA.py for each variation, and extracting and storing the
    "Average Selling Price" from Economic_Summary.csv.
    """
    
    def __init__(self, base_dir=None):
        """
        Initialize the executor with the base directory.
        
        Args:
            base_dir (str, optional): Base directory for sensitivity analysis.
                If not provided, uses the default directory structure.
        """
        if base_dir:
            self.base_dir = base_dir
        else:
            # Default directory structure
            current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.base_dir = current_dir
            
        # Define script paths
        self.script_dir = os.path.join(self.base_dir, "Configuration_management")
        self.calculation_dir = os.path.join(self.base_dir, "Core_calculation_engines")
        
        # Define common scripts
        self.common_scripts = [
            os.path.join(self.script_dir, "formatter.py"),
            os.path.join(self.script_dir, "module1.py"),
            os.path.join(self.script_dir, "config_modules.py"),
            os.path.join(self.script_dir, "Table.py")
        ]
        
        # Define calculation script
        self.calculation_script = os.path.join(self.calculation_dir, "CFA.py")
        
        logger.info(f"Initialized EnhancedSensitivityExecutor with base directory: {self.base_dir}")
        logger.info(f"Common scripts: {self.common_scripts}")
        logger.info(f"Calculation script: {self.calculation_script}")
    
    def run_baseline_calculation(self, version, selected_v, selected_f, target_row, calculation_option):
        """
        Run the 4 common scripts and CFA.py for the baseline calculation.
        
        Args:
            version (int): Version number
            selected_v (dict): Dictionary of selected V parameters
            selected_f (dict): Dictionary of selected F parameters
            target_row (int): Target row for calculation
            calculation_option (str): Calculation option (e.g., "calculateForPrice")
            
        Returns:
            bool: True if successful, False otherwise
        """
        logger.info(f"Running baseline calculation for version {version}")
        
        try:
            # Run common scripts
            for script in self.common_scripts:
                script_name = os.path.basename(script)
                logger.info(f"Running common script: {script_name}")
                
                result = subprocess.run(
                    ["python", script, str(version)],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode != 0:
                    logger.error(f"Error running {script_name}: {result.stderr}")
                    return False
                
                logger.info(f"Successfully ran {script_name}")
                time.sleep(0.5)  # Small delay to ensure proper sequencing
            
            # Run calculation script
            logger.info(f"Running calculation script: {os.path.basename(self.calculation_script)}")
            
            result = subprocess.run(
                [
                    "python",
                    self.calculation_script,
                    str(version),
                    json.dumps(selected_v),
                    json.dumps(selected_f),
                    str(target_row),
                    calculation_option,
                    "{}"  # Empty SenParameters for baseline
                ],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                logger.error(f"Error running calculation script: {result.stderr}")
                return False
            
            logger.info("Successfully ran baseline calculation")
            return True
            
        except Exception as e:
            logger.error(f"Error running baseline calculation: {str(e)}")
            return False
    
    def run_variation_calculations(self, version, sensitivity_dir, selected_v, selected_f, target_row, calculation_option):
        """
        Run CFA.py for each variation and extract the "Average Selling Price" from Economic_Summary.csv.
        
        Args:
            version (int): Version number
            sensitivity_dir (str): Path to the sensitivity directory
            selected_v (dict): Dictionary of selected V parameters
            selected_f (dict): Dictionary of selected F parameters
            target_row (int): Target row for calculation
            calculation_option (str): Calculation option (e.g., "calculateForPrice")
            
        Returns:
            dict: Dictionary of calculated prices for each variation
        """
        logger.info(f"Running variation calculations for version {version}")
        
        # Dictionary to store calculated prices
        calculated_prices = {}
        
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
                
                # Create a unique key for this variation
                variation_key = f"{param_id}_{mode}_{variation_str}"
                
                logger.info(f"Running calculation for variation: {variation_key}")
                
                try:
                    # Change to the variation directory
                    original_dir = os.getcwd()
                    os.chdir(root)
                    
                    # Run calculation script
                    result = subprocess.run(
                        [
                            "python",
                            self.calculation_script,
                            str(version),
                            json.dumps(selected_v),
                            json.dumps(selected_f),
                            str(target_row),
                            calculation_option,
                            "{}"  # Empty SenParameters since we've already modified the config
                        ],
                        capture_output=True,
                        text=True
                    )
                    
                    # Change back to the original directory
                    os.chdir(original_dir)
                    
                    if result.returncode != 0:
                        logger.error(f"Error running calculation for {variation_key}: {result.stderr}")
                        continue
                    
                    # Extract the "Average Selling Price" from Economic_Summary.csv
                    economic_summary_path = os.path.join(root, f"Economic_Summary({version}).csv")
                    if os.path.exists(economic_summary_path):
                        price = self.extract_average_selling_price(economic_summary_path)
                        if price is not None:
                            calculated_prices[variation_key] = price
                            logger.info(f"Calculated price for {variation_key}: {price}")
                            
                            # Save the price to a JSON file in the variation directory
                            price_file = os.path.join(root, "calculated_price.json")
                            with open(price_file, 'w') as f:
                                json.dump({
                                    "parameter_id": param_id,
                                    "mode": mode,
                                    "variation": variation_str,
                                    "price": price
                                }, f, indent=4)
                            
                            logger.info(f"Saved price to {price_file}")
                    else:
                        logger.warning(f"Economic_Summary({version}).csv not found in {root}")
                    
                except Exception as e:
                    logger.error(f"Error running calculation for {variation_key}: {str(e)}")
                    continue
        
        logger.info(f"Completed {len(calculated_prices)} variation calculations")
        return calculated_prices
    
    def extract_average_selling_price(self, economic_summary_path):
        """
        Extract the "Average Selling Price" from Economic_Summary.csv.
        
        Args:
            economic_summary_path (str): Path to the Economic_Summary.csv file
            
        Returns:
            float: Average Selling Price, or None if not found
        """
        try:
            with open(economic_summary_path, 'r') as f:
                reader = csv.reader(f)
                for row in reader:
                    if len(row) >= 2 and row[0] == "Average Selling Price (Project Life Cycle)":
                        # Remove $ and convert to float
                        price_str = row[1].replace('$', '').replace(',', '')
                        return float(price_str)
            
            logger.warning(f"Average Selling Price not found in {economic_summary_path}")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting Average Selling Price from {economic_summary_path}: {str(e)}")
            return None
    
    def generate_summary_report(self, sensitivity_dir, calculated_prices):
        """
        Generate a summary report of all calculated prices.
        
        Args:
            sensitivity_dir (str): Path to the sensitivity directory
            calculated_prices (dict): Dictionary of calculated prices for each variation
            
        Returns:
            str: Path to the generated report
        """
        logger.info("Generating summary report")
        
        # Create the report directory if it doesn't exist
        reports_dir = os.path.join(sensitivity_dir, "Reports")
        os.makedirs(reports_dir, exist_ok=True)
        
        # Create the report file
        report_path = os.path.join(reports_dir, "sensitivity_summary.json")
        
        # Group prices by parameter
        grouped_prices = {}
        for key, price in calculated_prices.items():
            param_id, mode, variation_str = key.split('_')
            
            if param_id not in grouped_prices:
                grouped_prices[param_id] = {}
                
            if mode not in grouped_prices[param_id]:
                grouped_prices[param_id][mode] = {}
                
            grouped_prices[param_id][mode][variation_str] = price
        
        # Create the report data
        report_data = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "parameters": grouped_prices,
            "raw_prices": calculated_prices
        }
        
        # Save the report
        with open(report_path, 'w') as f:
            json.dump(report_data, f, indent=4)
            
        logger.info(f"Generated summary report: {report_path}")
        return report_path

# Example usage
if __name__ == "__main__":
    # Create executor
    executor = EnhancedSensitivityExecutor()
    
    # Example configuration
    version = 1
    selected_v = {"V1": "on", "V2": "off"}
    selected_f = {"F1": "on", "F2": "on", "F3": "on", "F4": "on", "F5": "on"}
    target_row = 20
    calculation_option = "calculateForPrice"
    
    # Run baseline calculation
    executor.run_baseline_calculation(version, selected_v, selected_f, target_row, calculation_option)
    
    # Get sensitivity directory
    sensitivity_dir = os.path.join(
        executor.base_dir,
        "Original",
        f"Batch({version})",
        f"Results({version})",
        "Sensitivity"
    )
    
    # Run variation calculations
    calculated_prices = executor.run_variation_calculations(
        version,
        sensitivity_dir,
        selected_v,
        selected_f,
        target_row,
        calculation_option
    )
    
    # Generate summary report
    executor.generate_summary_report(sensitivity_dir, calculated_prices)
