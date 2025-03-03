"""
Enhanced Sensitivity Executor

This module provides functionality for executing sensitivity calculations
and generating summary reports.
"""

import os
import json
import csv
import logging
import subprocess
import time
import re
from collections import defaultdict

logger = logging.getLogger(__name__)

class EnhancedSensitivityExecutor:
    """
    Class for executing sensitivity calculations and generating reports.
    """
    
    def __init__(self):
        """
        Initialize the executor.
        """
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
    def run_baseline_calculation(self, version, selected_v, selected_f, target_row, calculation_option):
        """
        Run baseline calculation for sensitivity analysis.
        
        Args:
            version (int): Version number
            selected_v (dict): Selected V parameters
            selected_f (dict): Selected F parameters
            target_row (int): Target row for price extraction
            calculation_option (str): Calculation option
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Get calculation script path
            calculation_script = os.path.join(
                self.base_dir,
                "API_endpoints_and_controllers",
                "Calculations_and_Sensitivity.py"
            )
            
            # Prepare command arguments
            args = [
                "python",
                calculation_script,
                "--version", str(version),
                "--calculation", calculation_option,
                "--target-row", str(target_row)
            ]
            
            # Add V parameters
            for v_name, v_value in selected_v.items():
                if v_value != 'off':
                    args.extend(["--" + v_name.lower(), v_value])
                    
            # Add F parameters
            for f_name, f_value in selected_f.items():
                if f_value != 'off':
                    args.extend(["--" + f_name.lower(), f_value])
            
            # Run calculation
            logger.info(f"Running baseline calculation: {' '.join(args)}")
            result = subprocess.run(args, capture_output=True, text=True)
            
            # Check result
            if result.returncode != 0:
                logger.error(f"Baseline calculation failed: {result.stderr}")
                return False
                
            logger.info(f"Baseline calculation completed: {result.stdout}")
            return True
            
        except Exception as e:
            logger.error(f"Error running baseline calculation: {str(e)}")
            return False
    
    def run_variation_calculations(self, version, sensitivity_dir, selected_v, selected_f, target_row, calculation_option):
        """
        Run variation calculations for sensitivity analysis.
        
        Args:
            version (int): Version number
            sensitivity_dir (str): Path to sensitivity directory
            selected_v (dict): Selected V parameters
            selected_f (dict): Selected F parameters
            target_row (int): Target row for price extraction
            calculation_option (str): Calculation option
            
        Returns:
            dict: Dictionary of calculated prices
        """
        calculated_prices = {}
        
        # Get calculation script path
        calculation_script = os.path.join(
            self.base_dir,
            "API_endpoints_and_controllers",
            "Calculations_and_Sensitivity.py"
        )
        
        # Process each parameter directory
        for param_dir in os.listdir(sensitivity_dir):
            # Skip Reports directory
            if param_dir == "Reports":
                continue
                
            param_path = os.path.join(sensitivity_dir, param_dir)
            
            # Skip if not a directory
            if not os.path.isdir(param_path):
                continue
                
            # Process each variation directory
            for variation in os.listdir(param_path):
                variation_path = os.path.join(param_path, variation)
                
                # Skip if not a directory
                if not os.path.isdir(variation_path):
                    continue
                    
                # Prepare command arguments
                args = [
                    "python",
                    calculation_script,
                    "--version", str(version),
                    "--calculation", calculation_option,
                    "--target-row", str(target_row),
                    "--config-dir", variation_path
                ]
                
                # Add V parameters
                for v_name, v_value in selected_v.items():
                    if v_value != 'off':
                        args.extend(["--" + v_name.lower(), v_value])
                        
                # Add F parameters
                for f_name, f_value in selected_f.items():
                    if f_value != 'off':
                        args.extend(["--" + f_name.lower(), f_value])
                
                # Run calculation
                logger.info(f"Running calculation for {param_dir}/{variation}: {' '.join(args)}")
                
                try:
                    result = subprocess.run(args, capture_output=True, text=True)
                    
                    # Check result
                    if result.returncode != 0:
                        logger.error(f"Calculation failed for {param_dir}/{variation}: {result.stderr}")
                        continue
                        
                    # Extract price from output
                    price = self._extract_price_from_output(result.stdout)
                    
                    # Store price
                    key = f"{param_dir}_{variation}"
                    calculated_prices[key] = price
                    
                    logger.info(f"Calculation completed for {param_dir}/{variation}: Price = {price}")
                    
                except Exception as e:
                    logger.error(f"Error running calculation for {param_dir}/{variation}: {str(e)}")
        
        return calculated_prices
    
    def generate_summary_report(self, sensitivity_dir, calculated_prices):
        """
        Generate summary report for sensitivity analysis.
        
        Args:
            sensitivity_dir (str): Path to sensitivity directory
            calculated_prices (dict): Dictionary of calculated prices
            
        Returns:
            str: Path to summary report
        """
        # Create reports directory if it doesn't exist
        reports_dir = os.path.join(sensitivity_dir, "Reports")
        os.makedirs(reports_dir, exist_ok=True)
        
        # Prepare report data
        report_data = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "parameters": defaultdict(lambda: defaultdict(dict))
        }
        
        # Process calculated prices
        for key, price in calculated_prices.items():
            # Parse key to get parameter and variation
            parts = key.split('_')
            if len(parts) < 2:
                continue
                
            param_id = parts[0]
            variation = '_'.join(parts[1:])
            
            # Determine mode based on variation
            if variation == 'base':
                mode = 'base'
            elif variation.startswith('plus_'):
                mode = 'increase'
            elif variation.startswith('minus_'):
                mode = 'decrease'
            else:
                mode = 'other'
                
            # Add to report data
            report_data["parameters"][param_id][mode][variation] = price
        
        # Write summary report
        report_path = os.path.join(reports_dir, "sensitivity_summary.json")
        with open(report_path, 'w') as f:
            json.dump(report_data, f, indent=2)
            
        logger.info(f"Generated summary report: {report_path}")
        
        # Generate CSV report
        csv_report_path = os.path.join(reports_dir, "sensitivity_summary.csv")
        self._generate_csv_report(csv_report_path, report_data)
        
        return report_path
    
    def _extract_price_from_output(self, output):
        """
        Extract price from calculation output.
        
        Args:
            output (str): Calculation output
            
        Returns:
            float: Extracted price
        """
        try:
            # Look for price in output
            price_match = re.search(r'Price:\s*(\d+\.\d+)', output)
            if price_match:
                return float(price_match.group(1))
                
            # If no price found, look for any float
            float_match = re.search(r'(\d+\.\d+)', output)
            if float_match:
                return float(float_match.group(1))
                
            # If no float found, return 0
            return 0.0
            
        except Exception as e:
            logger.error(f"Error extracting price from output: {str(e)}")
            return 0.0
    
    def _generate_csv_report(self, csv_path, report_data):
        """
        Generate CSV report from report data.
        
        Args:
            csv_path (str): Path to CSV report
            report_data (dict): Report data
        """
        try:
            # Prepare CSV data
            csv_data = []
            
            # Add header row
            header = ["Parameter", "Mode", "Variation", "Price"]
            csv_data.append(header)
            
            # Add data rows
            for param_id, modes in report_data["parameters"].items():
                for mode, variations in modes.items():
                    for variation, price in variations.items():
                        row = [param_id, mode, variation, price]
                        csv_data.append(row)
            
            # Write CSV file
            with open(csv_path, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerows(csv_data)
                
            logger.info(f"Generated CSV report: {csv_path}")
            
        except Exception as e:
            logger.error(f"Error generating CSV report: {str(e)}")
