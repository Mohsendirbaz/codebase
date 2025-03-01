import os
import json
import subprocess
from pathlib import Path
from datetime import datetime

# Import our custom modules
from sensitivity_analysis_manager import sensitivity_manager
from sensitivity_plot_organizer import organize_sensitivity_plots
from sensitivity_html_organizer import organize_sensitivity_html
from calculations_sensitivity_adapter import calculation_adapter
from sensitivity_logging import get_integration_logger

# Get logger from centralized logging
logger = get_integration_logger()

class SensitivityIntegration:
    """
    Integrates sensitivity analysis with the main calculation pipeline.
    This class serves as the central coordinator for all sensitivity-related operations.
    """
    
    def __init__(self):
        self.manager = sensitivity_manager
        self.base_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        self.original_dir = self.base_dir.parent / 'public' / 'Original'
        self.logger = get_integration_logger()
        self.calculation_adapter = calculation_adapter
    
    def process_sensitivity_request(self, version, sensitivity_params):
        """
        Process a complete sensitivity analysis request.
        This handles the end-to-end flow from parameter processing to visualization.
        
        Args:
            version: The version number to process
            sensitivity_params: Dictionary of sensitivity parameters with their configurations
        
        Returns:
            dict: Results of the processing operation
        """
        self.logger.info(f"Processing sensitivity request for version {version}")
        
        results = {
            "version": version,
            "timestamp": datetime.now().isoformat(),
            "parameters_processed": [],
            "errors": []
        }
        
        # Filter enabled parameters
        enabled_params = {k: v for k, v in sensitivity_params.items() if v.get('enabled', True)}
        
        if not enabled_params:
            self.logger.info("No enabled sensitivity parameters found")
            return results
        
        # Process each enabled parameter
        for param_id, config in enabled_params.items():
            try:
                self.logger.info(f"Processing parameter {param_id}")
                
                # Validate parameter format
                if not param_id.startswith('S') or not param_id[1:].isdigit():
                    error = f"Invalid parameter ID format: {param_id}"
                    self.logger.error(error)
                    results["errors"].append({"param_id": param_id, "error": error})
                    continue
                
                # Extract and validate configuration
                mode = config.get('mode')
                if not mode:
                    error = f"No analysis mode specified for {param_id}"
                    self.logger.error(error)
                    results["errors"].append({"param_id": param_id, "error": error})
                    continue
                
                compare_to_key = config.get('compareToKey')
                if not compare_to_key:
                    error = f"No comparison key specified for {param_id}"
                    self.logger.error(error)
                    results["errors"].append({"param_id": param_id, "error": error})
                    continue
                
                values = config.get('values', [])
                if mode == 'symmetrical' and (not values or len(values) == 0):
                    # Default value for symmetrical mode
                    values = [10]  # Default to 10% variation
                elif mode == 'multipoint' and (not values or len(values) == 0):
                    error = f"No variation points specified for multipoint analysis of {param_id}"
                    self.logger.error(error)
                    results["errors"].append({"param_id": param_id, "error": error})
                    continue
                
                # Generate sensitivity configurations
                try:
                    configs = self.manager.generate_sensitivity_configs(
                        version, param_id, mode, values
                    )
                    self.logger.info(f"Generated {len(configs)} sensitivity configurations for {param_id}")
                except Exception as e:
                    error = f"Error generating sensitivity configurations for {param_id}: {str(e)}"
                    self.logger.error(error)
                    results["errors"].append({"param_id": param_id, "error": error})
                    continue
                
                # Run calculations for each configuration
                calculation_results = []
                
                # Use the calculation adapter to run the price calculation
                success, price, error = self.calculation_adapter.run_price_calculation(
                    version,
                    {},  # Default empty V state
                    {},  # Default empty F state
                    20,  # Default target row
                    -1000,  # Default tolerance_lower
                    1000,   # Default tolerance_upper
                    1.02,   # Default increase_rate
                    0.985   # Default decrease_rate
                )
                
                if not success:
                    error_msg = f"Base price calculation failed for {param_id}: {error}"
                    self.logger.error(error_msg)
                    results["errors"].append({"param_id": param_id, "error": error_msg})
                    continue
                
                # Run sensitivity analysis for each configuration
                for config_info in configs:
                    try:
                        # Use the calculation adapter to run sensitivity analysis
                        success, analysis_results, error = self.calculation_adapter.run_sensitivity_analysis(
                            version,
                            price,
                            param_id,
                            mode,
                            [config_info['variation']],
                            compare_to_key,
                            config.get('comparisonType', 'primary')
                        )
                        
                        if not success:
                            error_msg = f"Sensitivity analysis failed for {param_id} with variation {config_info['variation']}: {error}"
                            self.logger.error(error_msg)
                            results["errors"].append({"param_id": param_id, "error": error_msg})
                            continue
                        
                        # Store the calculation result
                        result_path = self.manager.store_calculation_result(
                            version, param_id, compare_to_key, analysis_results, mode
                        )
                        
                        calculation_results.append({
                            "config": config_info,
                            "result": analysis_results,
                            "result_path": str(result_path)
                        })
                        
                    except Exception as e:
                        error = f"Error calculating results for {param_id} with variation {config_info['variation']}: {str(e)}"
                        self.logger.error(error)
                        results["errors"].append({"param_id": param_id, "error": error})
                
                # Generate requested plot types
                plot_paths = []
                plot_types = []
                if config.get('waterfall'): plot_types.append('waterfall')
                if config.get('bar'): plot_types.append('bar')
                if config.get('point'): plot_types.append('point')
                
                comparison_type = config.get('comparisonType', 'primary')
                
                for plot_type in plot_types:
                    try:
                        # This would call the actual plotting function
                        # For now, we'll just log the intent
                        self.logger.info(f"Would generate {plot_type} plot for {param_id} vs {compare_to_key}")
                        
                        # In a full implementation, call the actual plotting function here
                        """
                        plot_path = self.manager.generate_plot(
                            version, param_id, compare_to_key, mode, 
                            plot_type, comparison_type, result_path
                        )
                        plot_paths.append(str(plot_path))
                        """
                        
                    except Exception as e:
                        error = f"Error generating {plot_type} plot for {param_id}: {str(e)}"
                        self.logger.error(error)
                        results["errors"].append({"param_id": param_id, "error": error})
                
                # Record successful processing
                results["parameters_processed"].append({
                    "param_id": param_id,
                    "configs": len(configs),
                    "calculations": len(calculation_results),
                    "plots": len(plot_types)
                })
                
            except Exception as e:
                error = f"Unexpected error processing {param_id}: {str(e)}"
                self.logger.error(error)
                results["errors"].append({"param_id": param_id, "error": error})
        
        # Organize all sensitivity outputs
        try:
            organize_plots_result = organize_sensitivity_plots(self.original_dir)
            organize_html_result = organize_sensitivity_html(self.original_dir)
            
            results["organization"] = {
                "plots": organize_plots_result,
                "html": organize_html_result
            }
        except Exception as e:
            error = f"Error organizing sensitivity outputs: {str(e)}"
            self.logger.error(error)
            results["errors"].append({"component": "organization", "error": error})
        
        return results
    
    def run_calculation_with_sensitivity(self, version, calculation_script_path, selected_v, selected_f, 
                                        target_row, calculation_option, tolerance_lower, tolerance_upper, 
                                        increase_rate, decrease_rate, sensitivity_params):
        """
        Run a calculation that includes sensitivity analysis.
        This is meant to be called from the main Calculations.py script.
        
        Args:
            version: Version number
            calculation_script_path: Path to the calculation script
            selected_v, selected_f: V and F state dictionaries
            target_row: Target row for calculation
            calculation_option: Calculation option (e.g., 'calculateForPrice')
            tolerance_lower, tolerance_upper: Tolerance bounds
            increase_rate, decrease_rate: Adjustment rates
            sensitivity_params: Sensitivity parameters
            
        Returns:
            tuple: (success, error_message)
        """
        try:
            # Use the calculation adapter to run the price calculation
            self.logger.info(f"Running baseline calculation for version {version}")
            
            success, price, error = self.calculation_adapter.run_price_calculation(
                version,
                selected_v,
                selected_f,
                target_row,
                tolerance_lower,
                tolerance_upper,
                increase_rate,
                decrease_rate
            )
            
            if not success:
                error_msg = f"Baseline calculation failed: {error}"
                self.logger.error(error_msg)
                return False, error_msg
            
            # If no sensitivity parameters, we're done
            if not sensitivity_params:
                return True, None
                
            # Process the sensitivity parameters
            sensitivity_result = self.process_sensitivity_request(version, sensitivity_params)
            
            # Check for errors
            if sensitivity_result["errors"]:
                error_msg = f"Sensitivity analysis completed with {len(sensitivity_result['errors'])} errors"
                self.logger.warning(error_msg)
                # We don't fail the whole operation for sensitivity errors
            
            return True, None
            
        except Exception as e:
            error_msg = f"Error running calculation with sensitivity: {str(e)}"
            self.logger.exception(error_msg)
            return False, error_msg

# Create a singleton instance
sensitivity_integration = SensitivityIntegration()