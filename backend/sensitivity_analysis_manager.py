"""
Sensitivity analysis manager module.

This module serves as the main entry point for the sensitivity analysis workflow,
coordinating the various components of the system.
"""

import os
import json
import time
import logging
import sys
from datetime import datetime

# Import sensitivity modules
from sensitivity_logging import log_execution_flow, log_sensitivity_config_status
from sensitivity_integration import SensitivityIntegration
from sensitivity_plot_organizer import SensitivityPlotOrganizer
from sensitivity_html_organizer import SensitivityHTMLOrganizer

# Configure logging
logger = logging.getLogger(__name__)

class SensitivityAnalysisManager:
    """Manager for sensitivity analysis."""
    
    def __init__(self, api_base_url="http://localhost:25007", version=1):
        """Initialize the manager with the API base URL and version."""
        self.api_base_url = api_base_url
        self.version = version
        self.logger = logger
        
        # Initialize components
        self.integration = SensitivityIntegration(api_base_url)
        self.plot_organizer = SensitivityPlotOrganizer(version=version)
        self.html_organizer = SensitivityHTMLOrganizer(version=version)
        
        # Create base directories
        self.base_dir = os.path.join(
            os.path.dirname(__file__),
            'Original',
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity'
        )
        os.makedirs(self.base_dir, exist_ok=True)
        
        self.logger.info(f"Initialized sensitivity analysis manager for version {version}")
        
    def setup_directories(self):
        """Set up the directory structure for sensitivity analysis."""
        try:
            # Create plot directories
            self.plot_organizer.create_plot_directories()
            
            # Create additional directories
            os.makedirs(os.path.join(self.base_dir, 'Configuration'), exist_ok=True)
            os.makedirs(os.path.join(self.base_dir, 'Reports'), exist_ok=True)
            os.makedirs(os.path.join(self.base_dir, 'Cache'), exist_ok=True)
            
            self.logger.info(f"Set up directory structure in {self.base_dir}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error setting up directories: {str(e)}")
            return False
            
    def generate_configurations(self, config_data):
        """Generate sensitivity configurations."""
        log_execution_flow('enter', "Generating sensitivity configurations")
        
        try:
            # Set up directories
            self.setup_directories()
            
            # Generate configurations
            result = self.integration.adapter.generate_configurations(config_data)
            
            if result.get('status') == 'success':
                self.logger.info("Successfully generated sensitivity configurations")
                log_execution_flow('exit', "Successfully generated sensitivity configurations")
                return result
            else:
                self.logger.error(f"Failed to generate configurations: {result.get('error', 'Unknown error')}")
                log_execution_flow('error', f"Failed to generate configurations: {result.get('error', 'Unknown error')}")
                return result
                
        except Exception as e:
            error_msg = f"Error generating configurations: {str(e)}"
            self.logger.error(error_msg)
            log_execution_flow('error', error_msg)
            return {
                'status': 'error',
                'error': error_msg
            }
            
    def run_calculations(self):
        """Run sensitivity calculations."""
        log_execution_flow('enter', "Running sensitivity calculations")
        
        try:
            # Check if configurations exist
            if not self.integration.is_configured():
                error_msg = "Cannot run calculations: configurations don't exist"
                self.logger.error(error_msg)
                log_execution_flow('error', error_msg)
                return {
                    'status': 'error',
                    'error': error_msg,
                    'message': "Please generate sensitivity configurations first"
                }
                
            # Run calculations
            result = self.integration.adapter.run_calculations()
            
            if result.get('status') == 'success':
                self.logger.info("Successfully ran sensitivity calculations")
                log_execution_flow('exit', "Successfully ran sensitivity calculations")
                return result
            else:
                self.logger.error(f"Failed to run calculations: {result.get('error', 'Unknown error')}")
                log_execution_flow('error', f"Failed to run calculations: {result.get('error', 'Unknown error')}")
                return result
                
        except Exception as e:
            error_msg = f"Error running calculations: {str(e)}"
            self.logger.error(error_msg)
            log_execution_flow('error', error_msg)
            return {
                'status': 'error',
                'error': error_msg
            }
            
    def generate_visualizations(self):
        """Generate sensitivity visualizations."""
        log_execution_flow('enter', "Generating sensitivity visualizations")
        
        try:
            # Check if configurations exist
            if not self.integration.is_configured():
                error_msg = "Cannot generate visualizations: configurations don't exist"
                self.logger.error(error_msg)
                log_execution_flow('error', error_msg)
                return {
                    'status': 'error',
                    'error': error_msg,
                    'message': "Please generate sensitivity configurations first"
                }
                
            # Get visualization data
            result = self.integration.get_visualization_data()
            
            if 'error' in result:
                self.logger.error(f"Failed to get visualization data: {result.get('error', 'Unknown error')}")
                log_execution_flow('error', f"Failed to get visualization data: {result.get('error', 'Unknown error')}")
                return result
                
            # Generate HTML report
            report_path = os.path.join(self.base_dir, 'Reports', 'sensitivity_report.html')
            self.html_organizer.generate_summary_report(result, report_path)
            
            self.logger.info("Successfully generated sensitivity visualizations")
            log_execution_flow('exit', "Successfully generated sensitivity visualizations")
            
            # Add report path to result
            result['reportPath'] = report_path
            return result
                
        except Exception as e:
            error_msg = f"Error generating visualizations: {str(e)}"
            self.logger.error(error_msg)
            log_execution_flow('error', error_msg)
            return {
                'status': 'error',
                'error': error_msg
            }
            
    def run_full_analysis(self, config_data):
        """Run the full sensitivity analysis workflow."""
        log_execution_flow('enter', "Running full sensitivity analysis")
        
        try:
            # Step 1: Generate configurations
            self.logger.info("Step 1: Generating configurations")
            config_result = self.generate_configurations(config_data)
            
            if config_result.get('status') != 'success':
                return config_result
                
            # Step 2: Run calculations
            self.logger.info("Step 2: Running calculations")
            calc_result = self.run_calculations()
            
            if calc_result.get('status') != 'success':
                return calc_result
                
            # Step 3: Generate visualizations
            self.logger.info("Step 3: Generating visualizations")
            vis_result = self.generate_visualizations()
            
            # Return combined results
            result = {
                'status': 'success',
                'message': "Full sensitivity analysis completed successfully",
                'configuration': config_result,
                'calculations': calc_result,
                'visualization': vis_result
            }
            
            self.logger.info("Successfully completed full sensitivity analysis")
            log_execution_flow('exit', "Successfully completed full sensitivity analysis")
            return result
                
        except Exception as e:
            error_msg = f"Error running full analysis: {str(e)}"
            self.logger.error(error_msg)
            log_execution_flow('error', error_msg)
            return {
                'status': 'error',
                'error': error_msg
            }
    
    def generate_parameter_variations(self, param_id, mode, values):
        """Generate parameter variations for sensitivity analysis."""
        log_execution_flow('enter', f"Generating parameter variations for {param_id}")
        
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
                
            # Create variation configurations
            variations = []
            for variation in variation_list:
                var_str = f"{variation:+.2f}"
                variations.append({
                    'param_id': param_id,
                    'variation': variation,
                    'variation_str': var_str,
                    'mode': mode
                })
                
            self.logger.info(f"Generated {len(variations)} variations for {param_id}")
            log_execution_flow('exit', f"Successfully generated parameter variations for {param_id}")
            return variations
            
        except Exception as e:
            error_msg = f"Error generating parameter variations: {str(e)}"
            self.logger.error(error_msg)
            log_execution_flow('error', error_msg)
            return []
    
    def get_parameter_info(self, param_id):
        """Get information about a sensitivity parameter."""
        try:
            # Extract parameter number (e.g., S10 -> 10)
            if not (param_id.startswith('S') and param_id[1:].isdigit()):
                raise ValueError(f"Invalid parameter ID format: {param_id}")
            
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
                self.logger.warning(f"No property mapping found for parameter {param_id}")
                return {"id": param_id, "property_id": None, "display_name": param_id}
            
            # Define display names
            display_names = {
                "plantLifetimeAmount10": "Plant Lifetime",
                "bECAmount11": "BEC",
                "numberOfUnitsAmount12": "Number of Units",
                "initialSellingPriceAmount13": "Initial Selling Price",
                "totalOperatingCostPercentageAmount14": "Total Operating Cost Percentage",
                "engineering_Procurement_and_Construction_EPC_Amount15": "EPC",
                "process_contingency_PC_Amount16": "Process Contingency",
                "project_Contingency_PT_BEC_EPC_PCAmount17": "Project Contingency",
                "use_direct_operating_expensesAmount18": "Direct Operating Expenses",
                "depreciationMethodAmount20": "Depreciation Method",
                "loanTypeAmount21": "Loan Type",
                "interestTypeAmount22": "Interest Type",
                "generalInflationRateAmount23": "General Inflation Rate",
                "interestProportionAmount24": "Interest Proportion",
                "principalProportionAmount25": "Principal Proportion",
                "loanPercentageAmount26": "Loan Percentage",
                "repaymentPercentageOfRevenueAmount27": "Repayment Percentage of Revenue",
                "numberofconstructionYearsAmount28": "Number of Construction Years",
                "iRRAmount30": "IRR",
                "annualInterestRateAmount31": "Annual Interest Rate",
                "stateTaxRateAmount32": "State Tax Rate",
                "federalTaxRateAmount33": "Federal Tax Rate",
                "rawmaterialAmount34": "Raw Material",
                "laborAmount35": "Labor",
                "utilityAmount36": "Utility",
                "maintenanceAmount37": "Maintenance",
                "insuranceAmount38": "Insurance"
            }
            
            # Get display name
            display_name = display_names.get(property_id, property_id)
            
            return {
                "id": param_id,
                "property_id": property_id,
                "display_name": display_name
            }
            
        except Exception as e:
            self.logger.error(f"Error getting parameter info: {str(e)}")
            return {"id": param_id, "property_id": None, "display_name": param_id}
    
    def generate_comparison_report(self, param_ids, compare_to_key, mode):
        """Generate a comparison report for sensitivity analysis."""
        log_execution_flow('enter', f"Generating comparison report for {param_ids} vs {compare_to_key}")
        
        try:
            # Get parameter info
            parameters = []
            for param_id in param_ids:
                param_info = self.get_parameter_info(param_id)
                parameters.append(param_info)
                
            # Get compare_to info
            compare_to_info = self.get_parameter_info(compare_to_key)
            
            # Create report structure
            report = {
                'version': self.version,
                'compare_to_key': compare_to_key,
                'compare_to_info': compare_to_info,
                'mode': mode,
                'parameters': parameters,
                'timestamp': datetime.now().isoformat()
            }
            
            # Generate HTML report
            report_path = os.path.join(self.base_dir, 'Reports', f'comparison_{compare_to_key}_{mode}.html')
            self.html_organizer.generate_report(report, None, report_path)
            
            self.logger.info(f"Generated comparison report at {report_path}")
            log_execution_flow('exit', f"Successfully generated comparison report for {param_ids} vs {compare_to_key}")
            
            # Add report path to result
            report['reportPath'] = report_path
            return report
            
        except Exception as e:
            error_msg = f"Error generating comparison report: {str(e)}"
            self.logger.error(error_msg)
            log_execution_flow('error', error_msg)
            return {
                'status': 'error',
                'error': error_msg
            }

# Create a singleton instance for easy import
sensitivity_manager = SensitivityAnalysisManager()

# Example usage
if __name__ == "__main__":
    # Example configuration data
    example_config = {
        "selectedVersions": [1],
        "selectedV": {"V1": "on", "V2": "off"},
        "selectedF": {"F1": "on", "F2": "on", "F3": "on", "F4": "on", "F5": "on"},
        "selectedCalculationOption": "calculateForPrice",
        "targetRow": 20,
        "SenParameters": {
            "S34": {
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
    }
    
    # Create manager and run analysis
    manager = SensitivityAnalysisManager()
    
    # Option 1: Run full analysis
    # result = manager.run_full_analysis(example_config)
    
    # Option 2: Run steps individually
    # config_result = manager.generate_configurations(example_config)
    # calc_result = manager.run_calculations()
    # vis_result = manager.generate_visualizations()
    
    # print(json.dumps(result, indent=2))
