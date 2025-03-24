from flask import Blueprint, request, jsonify, send_file
import logging
import os
import subprocess
import json
import time
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from Sensitivity_File_Manager import SensitivityFileManager

# Configure logger
logger = logging.getLogger('sensitivity')

sensitivity_routes = Blueprint('sensitivity_routes', __name__)

# Add function for dynamic plot generation that can be imported by other modules
def generate_plot_from_results(version, param_id, compare_to_key, plot_type, mode, result_path):
    """
    Generate a plot from existing result data.
    
    Args:
        version (int): Version number
        param_id (str): Parameter ID
        compare_to_key (str): Comparison parameter ID
        plot_type (str): Type of plot to generate (waterfall, bar, point)
        mode (str): Analysis mode (symmetrical or multiple)
        result_path (str): Path to the result data file
        
    Returns:
        bool: True if plot was generated successfully, False otherwise
    """
    # Add detailed logging to help debug the process
    logger.info(f"=== PLOT GENERATION FROM RESULTS ===")
    logger.info(f"Version: {version}")
    logger.info(f"Parameter: {param_id}")
    logger.info(f"Compare to: {compare_to_key}")
    logger.info(f"Plot type: {plot_type}")
    logger.info(f"Mode: {mode}")
    logger.info(f"Result path: {result_path}")
    try:
        logger.info(f"Generating {plot_type} plot for {param_id} vs {compare_to_key} from {result_path}")
        
        # Ensure result file exists
        if not os.path.exists(result_path):
            logger.error(f"Result file not found: {result_path}")
            return False
            
        # Load result data
        with open(result_path, 'r') as f:
            result_data = json.load(f)
            
        # Extract necessary data for the plot
        variations = result_data.get('variations', [])
        if not variations:
            logger.error(f"No variation data found in {result_path}")
            return False
            
        # Normalize mode for directory path
        mode_dir = 'Symmetrical' if mode.lower() in ['symmetrical', 'percentage', 'multiple'] else 'Multipoint'
        comparison_type = result_data.get('comparison_type', 'primary')
        
        # Construct plot path
        plot_name = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}.png"
        
        # Define the directory structure
        base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'backend', 'Original')
        
        plot_path = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity',
            mode_dir,
            plot_type,
            plot_name
        )
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(plot_path), exist_ok=True)
        
        # Extract variation values and prices
        x_values = []
        y_values = []
        
        for variation in variations:
            var_value = variation.get('variation')
            if var_value is not None:
                x_values.append(var_value)
                
                price = None
                if 'values' in variation and 'price' in variation['values']:
                    price = variation['values']['price']
                    
                y_values.append(price)
        
        # Sort values by x to ensure proper ordering
        points = sorted(zip(x_values, y_values), key=lambda point: point[0])
        x_values = [point[0] for point in points]
        y_values = [point[1] for point in points]
        
        # Create and save the plot
        plt.figure(figsize=(10, 6))
        
        if plot_type == 'waterfall':
            # Create waterfall plot
            cumulative = 0
            for i, (x, y) in enumerate(points):
                if i == 0:
                    # First bar is the base
                    plt.bar(i, y, width=0.5, color='blue', label=f"{x}%")
                    cumulative = y
                else:
                    # Show difference from previous
                    diff = y - cumulative
                    color = 'green' if diff >= 0 else 'red'
                    plt.bar(i, diff, bottom=cumulative, width=0.5, color=color, label=f"{x}%")
                    cumulative = y
                    
            plt.title(f"Waterfall Analysis: {param_id} vs {compare_to_key}")
            plt.ylabel('Price')
            plt.xlabel('Variation')
            plt.xticks(range(len(x_values)), [f"{x}%" for x in x_values])
            
        elif plot_type == 'bar':
            # Create bar plot
            plt.bar(x_values, y_values, color='blue')
            plt.title(f"Bar Analysis: {param_id} vs {compare_to_key}")
            plt.ylabel('Price')
            plt.xlabel(f'{param_id} Variation (%)')
            
        elif plot_type == 'point':
            # Create point/line plot
            plt.plot(x_values, y_values, 'o-', color='blue')
            plt.title(f"Point Analysis: {param_id} vs {compare_to_key}")
            plt.ylabel('Price')
            plt.xlabel(f'{param_id} Variation (%)')
            
        # Add grid and save
        plt.grid(True, linestyle='--', alpha=0.7)
        plt.tight_layout()
        # Save the plot with higher quality
        plt.savefig(plot_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        # Verify the file was actually created
        if os.path.exists(plot_path) and os.path.getsize(plot_path) > 0:
            logger.info(f"Successfully generated {plot_type} plot at {plot_path}")
            # Log the file size and timestamp to help with debugging
            file_stats = os.stat(plot_path)
            logger.info(f"Plot file size: {file_stats.st_size} bytes")
            logger.info(f"Plot creation time: {time.ctime(file_stats.st_mtime)}")
            return True
        else:
            logger.error(f"Plot file creation failed or file is empty: {plot_path}")
            return False
        
    except Exception as e:
        logger.error(f"Error generating {plot_type} plot: {str(e)}")
        return False

# Base directory path - should be adjusted based on deployment context
base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend', 'Original')
file_manager = SensitivityFileManager(base_dir)

def find_economic_summary_price(version):
    """
    Extracts price (S13) value from economic summary.
    
    Args:
        version (int): Version number
        
    Returns:
        float: Price value or None if not found
    """
    try:
        economic_summary_path = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            f"Economic_Summary({version}).csv"
        )
        
        if not os.path.exists(economic_summary_path):
            logger.warning(f"Economic summary not found: {economic_summary_path}")
            return None
            
        economic_df = pd.read_csv(economic_summary_path)
        price_row = economic_df[economic_df['Metric'] == 'Average Selling Price (Project Life Cycle)']
        
        if price_row.empty:
            logger.warning("Price row not found in economic summary")
            return None
            
        price_value = price_row.iloc[0, 1]  # Assuming value is in second column
        logger.info(f"Extracted price value: {price_value}")
        return price_value
        
    except Exception as e:
        logger.error(f"Error extracting price from economic summary: {str(e)}")
        return None

@sensitivity_routes.route('/sensitivity/symmetrical', methods=['POST'])
def handle_symmetrical_analysis():
    """
    Processes symmetrical sensitivity analysis.
    
    Expected JSON payload:
    {
        "param_id": "S10",
        "values": [10.0],
        "compareToKey": "S13",
        "comparisonType": "primary",
        "version": 1,
        "waterfall": true,
        "bar": true,
        "point": true
    }
    """
    run_id = time.strftime("%Y%m%d_%H%M%S")
    logger.info(f"\n{'='*80}")
    logger.info(f"Symmetrical Analysis Request - Run ID: {run_id}")
    logger.info(f"{'='*80}")
    
    try:
        data = request.json
        logger.info(f"Request data: {data}")
        
        # Validate required parameters
        param_id = data.get('param_id')
        if not param_id or not param_id.startswith('S') or not param_id[1:].isdigit():
            return jsonify({"error": "Invalid parameter ID format"}), 400

        variation = data.get('values', [None])[0]
        if variation is None:
            return jsonify({"error": "No variation percentage provided"}), 400

        # Use S13 as default compareToKey if none provided
        compare_to_key = data.get('compareToKey', 'S13')
        version = data.get('version', 1)
        comparison_type = data.get('comparisonType', 'primary')
        
        logger.info(f"Processing {param_id} with {variation}% variation vs {compare_to_key}")
        
        # Define paths
        sensitivity_dir = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity',
            'Symmetrical'
        )
        os.makedirs(sensitivity_dir, exist_ok=True)
        
        # Prepare positive and negative variations
        variations = [variation, -variation]
        result_data = {
            'parameter': param_id,
            'compare_to_key': compare_to_key,
            'comparison_type': comparison_type,
            'mode': 'symmetrical',
            'version': version,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'variations': []
        }
        
        # Execute calculations for each variation
        for var in variations:
            var_str = f"{var:+.2f}"
            logger.info(f"Processing variation: {var_str}")
            
            # Execute the sensitivity calculation script
            calculation_script = os.path.join(base_dir, "Core_calculation_engines", "sensitivity_calculator.py")
            
            if not os.path.exists(calculation_script):
                logger.warning(f"Calculation script not found: {calculation_script}")
                # Use fallback to CFA.py if sensitivity_calculator.py doesn't exist
                calculation_script = os.path.join(base_dir, "Core_calculation_engines", "CFA.py")
            
            calc_result = subprocess.run(
                [
                    'python',
                    calculation_script,
                    str(version),
                    param_id,
                    str(var),
                    compare_to_key
                ],
                capture_output=True,
                text=True
            )
            
            if calc_result.returncode != 0:
                error_msg = f"Calculation failed for {param_id} ({var_str}): {calc_result.stderr}"
                logger.error(error_msg)
                result_data['variations'].append({
                    'variation': var,
                    'variation_str': var_str,
                    'status': 'error',
                    'error': error_msg
                })
                continue
            
            # Extract price from economic summary if needed
            price_value = find_economic_summary_price(version)
            
            # Add variation result
            result_data['variations'].append({
                'variation': var,
                'variation_str': var_str,
                'status': 'completed',
                'values': {
                    'price': price_value
                }
            })
            
            logger.info(f"Completed calculation for variation {var_str}")
        
        # Store calculation results
        result_path = file_manager.store_calculation_result(
            version=version,
            param_id=param_id,
            result_data=result_data,
            mode='symmetrical',
            compare_to_key=compare_to_key
        )
        
        logger.info(f"Stored calculation results at {result_path['path']}")
        
        # Generate requested plots
        plot_types = []
        if data.get('waterfall'): plot_types.append('waterfall')
        if data.get('bar'): plot_types.append('bar')
        if data.get('point'): plot_types.append('point')
        
        generated_plots = {}
        
        for plot_type in plot_types:
            plot_name = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}"
            plot_type_dir = os.path.join(sensitivity_dir, plot_type)
            os.makedirs(plot_type_dir, exist_ok=True)
            
            plot_path = os.path.join(plot_type_dir, f"{plot_name}.png")
            script_path = os.path.join(base_dir, "Visualization_generators", f"generate_{plot_type}_plot.py")
            
            if not os.path.exists(script_path):
                logger.warning(f"Plot generation script not found: {script_path}")
                generated_plots[plot_type] = {
                    'status': 'error',
                    'error': f"Plot generation script not found: {script_path}"
                }
                continue
            
            try:
                logger.info(f"Generating {plot_type} plot: {plot_name}")
                
                result = subprocess.run(
                    [
                        'python',
                        script_path,
                        str(version),
                        param_id,
                        str(variation),
                        compare_to_key,
                        comparison_type,
                        result_path['path'] if isinstance(result_path, dict) else result_path
                    ],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode != 0:
                    error_msg = f"Plot generation failed for {plot_type}: {result.stderr}"
                    logger.error(error_msg)
                    generated_plots[plot_type] = {
                        'status': 'error',
                        'error': error_msg
                    }
                else:
                    generated_plots[plot_type] = {
                        'status': 'completed',
                        'path': os.path.relpath(plot_path, base_dir)
                    }
                    logger.info(f"Generated {plot_type} plot at {plot_path}")
                    
            except Exception as e:
                error_msg = f"Error generating {plot_type} plot: {str(e)}"
                logger.error(error_msg)
                generated_plots[plot_type] = {
                    'status': 'error',
                    'error': error_msg
                }
        
        # Prepare response
        response = {
            "status": "success",
            "runId": run_id,
            "message": "Symmetrical analysis completed",
            "parameter": param_id,
            "compareToKey": compare_to_key,
            "variations": [var for var in variations],
            "plots": generated_plots,
            "directory": sensitivity_dir,
            "results_path": result_path['path'] if isinstance(result_path, dict) else result_path
        }
        
        logger.info(f"\n{'='*80}")
        logger.info(f"Symmetrical Analysis Completed - Run ID: {run_id}")
        logger.info(f"{'='*80}")
        
        return jsonify(response)

    except Exception as e:
        error_msg = f"Error in symmetrical analysis: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

@sensitivity_routes.route('/sensitivity/multipoint', methods=['POST'])
def handle_multipoint_analysis():
    """
    Processes multiple point sensitivity analysis.
    
    Expected JSON payload:
    {
        "param_id": "S10",
        "values": [5.0, 10.0, 15.0],
        "compareToKey": "S13",
        "comparisonType": "primary",
        "version": 1,
        "waterfall": true,
        "bar": true,
        "point": true
    }
    """
    run_id = time.strftime("%Y%m%d_%H%M%S")
    logger.info(f"\n{'='*80}")
    logger.info(f"Multipoint Analysis Request - Run ID: {run_id}")
    logger.info(f"{'='*80}")
    
    try:
        data = request.json
        logger.info(f"Request data: {data}")
        
        # Validate required parameters
        param_id = data.get('param_id')
        if not param_id or not param_id.startswith('S') or not param_id[1:].isdigit():
            return jsonify({"error": "Invalid parameter ID format"}), 400

        variations = data.get('values', [])
        if not variations:
            return jsonify({"error": "No variation points provided"}), 400

        # Use S13 as default compareToKey if none provided
        compare_to_key = data.get('compareToKey', 'S13')
        version = data.get('version', 1)
        comparison_type = data.get('comparisonType', 'primary')
        
        logger.info(f"Processing {param_id} with {len(variations)} variations vs {compare_to_key}")
        
        # Define paths
        sensitivity_dir = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity',
            'Multipoint'
        )
        os.makedirs(sensitivity_dir, exist_ok=True)
        
        result_data = {
            'parameter': param_id,
            'compare_to_key': compare_to_key,
            'comparison_type': comparison_type,
            'mode': 'multipoint',
            'version': version,
            'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'variations': []
        }
        
        # Execute calculations for each variation
        for var in variations:
            var_str = f"{var:+.2f}"
            logger.info(f"Processing variation: {var_str}")
            
            # Execute the sensitivity calculation script
            calculation_script = os.path.join(base_dir, "Core_calculation_engines", "sensitivity_calculator.py")
            
            if not os.path.exists(calculation_script):
                logger.warning(f"Calculation script not found: {calculation_script}")
                # Use fallback to CFA.py if sensitivity_calculator.py doesn't exist
                calculation_script = os.path.join(base_dir, "Core_calculation_engines", "CFA.py")
            
            calc_result = subprocess.run(
                [
                    'python',
                    calculation_script,
                    str(version),
                    param_id,
                    str(var),
                    compare_to_key
                ],
                capture_output=True,
                text=True
            )
            
            if calc_result.returncode != 0:
                error_msg = f"Calculation failed for {param_id} ({var_str}): {calc_result.stderr}"
                logger.error(error_msg)
                result_data['variations'].append({
                    'variation': var,
                    'variation_str': var_str,
                    'status': 'error',
                    'error': error_msg
                })
                continue
            
            # Extract price from economic summary if needed
            price_value = find_economic_summary_price(version)
            
            # Add variation result
            result_data['variations'].append({
                'variation': var,
                'variation_str': var_str,
                'status': 'completed',
                'values': {
                    'price': price_value
                }
            })
            
            logger.info(f"Completed calculation for variation {var_str}")
        
        # Store calculation results
        result_path = file_manager.store_calculation_result(
            version=version,
            param_id=param_id,
            result_data=result_data,
            mode='multipoint',
            compare_to_key=compare_to_key
        )
        
        logger.info(f"Stored calculation results at {result_path['path']}")
        
        # Generate requested plots
        plot_types = []
        if data.get('waterfall'): plot_types.append('waterfall')
        if data.get('bar'): plot_types.append('bar')
        if data.get('point'): plot_types.append('point')
        
        generated_plots = {}
        
        for plot_type in plot_types:
            plot_name = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}"
            plot_type_dir = os.path.join(sensitivity_dir, plot_type)
            os.makedirs(plot_type_dir, exist_ok=True)
            
            plot_path = os.path.join(plot_type_dir, f"{plot_name}.png")
            script_path = os.path.join(base_dir, "Visualization_generators", f"generate_{plot_type}_plot.py")
            
            if not os.path.exists(script_path):
                logger.warning(f"Plot generation script not found: {script_path}")
                generated_plots[plot_type] = {
                    'status': 'error',
                    'error': f"Plot generation script not found: {script_path}"
                }
                continue
            
            try:
                logger.info(f"Generating {plot_type} plot: {plot_name}")
                
                result = subprocess.run(
                    [
                        'python',
                        script_path,
                        str(version),
                        param_id,
                        json.dumps(variations),
                        compare_to_key,
                        comparison_type,
                        result_path['path'] if isinstance(result_path, dict) else result_path
                    ],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode != 0:
                    error_msg = f"Plot generation failed for {plot_type}: {result.stderr}"
                    logger.error(error_msg)
                    generated_plots[plot_type] = {
                        'status': 'error',
                        'error': error_msg
                    }
                else:
                    generated_plots[plot_type] = {
                        'status': 'completed',
                        'path': os.path.relpath(plot_path, base_dir)
                    }
                    logger.info(f"Generated {plot_type} plot at {plot_path}")
                    
            except Exception as e:
                error_msg = f"Error generating {plot_type} plot: {str(e)}"
                logger.error(error_msg)
                generated_plots[plot_type] = {
                    'status': 'error',
                    'error': error_msg
                }
        
        # Prepare response
        response = {
            "status": "success",
            "runId": run_id,
            "message": "Multipoint analysis completed",
            "parameter": param_id,
            "compareToKey": compare_to_key,
            "variations": variations,
            "plots": generated_plots,
            "directory": sensitivity_dir,
            "results_path": result_path['path'] if isinstance(result_path, dict) else result_path
        }
        
        logger.info(f"\n{'='*80}")
        logger.info(f"Multipoint Analysis Completed - Run ID: {run_id}")
        logger.info(f"{'='*80}")
        
        return jsonify(response)

    except Exception as e:
        error_msg = f"Error in multipoint analysis: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

@sensitivity_routes.route('/sensitivity/generate-report', methods=['POST'])
def generate_analysis_report():
    """
    Generates a comprehensive analysis report for all processed sensitivity parameters.
    
    Expected JSON payload:
    {
        "version": 1,
        "parameters": {
            "S10": {
                "mode": "symmetrical",
                "plotTypes": ["waterfall", "bar", "point"]
            },
            "S11": {
                "mode": "multipoint",
                "plotTypes": ["waterfall", "bar", "point"]
            }
        }
    }
    """
    run_id = time.strftime("%Y%m%d_%H%M%S")
    logger.info(f"\n{'='*80}")
    logger.info(f"Report Generation Request - Run ID: {run_id}")
    logger.info(f"{'='*80}")
    
    try:
        data = request.json
        version = data.get('version')
        parameters_data = data.get('parameters', {})
        
        if not version:
            return jsonify({"error": "Version number is required"}), 400
            
        if not parameters_data:
            return jsonify({"error": "No parameter data provided"}), 400
        
        # Process parameters and prepare report data
        report_data = {}
        
        for param_id, config in parameters_data.items():
            logger.info(f"Processing parameter: {param_id}")
            
            mode = config.get('mode', 'symmetrical')
            plot_types = config.get('plotTypes', [])
            
            # Use S13 as default compareToKey if none provided
            compare_to_key = config.get('compareToKey', 'S13')
            comparison_type = config.get('comparisonType', 'primary')
            
            # Load result data
            mode_dir = 'Symmetrical' if mode.lower() in ['symmetrical', 'percentage'] else 'Multipoint'
            result_path = os.path.join(
                base_dir,
                f'Batch({version})',
                f'Results({version})',
                'Sensitivity',
                mode_dir,
                f"{param_id}_vs_{compare_to_key}_{mode.lower()}_results.json"
            )
            
            if os.path.exists(result_path):
                with open(result_path, 'r') as f:
                    result_data = json.load(f)
            else:
                result_path_alt = os.path.join(
                    base_dir,
                    f'Batch({version})',
                    f'Results({version})',
                    'Sensitivity',
                    mode_dir,
                    f"{param_id}_results.json"
                )
                
                if os.path.exists(result_path_alt):
                    with open(result_path_alt, 'r') as f:
                        result_data = json.load(f)
                else:
                    logger.warning(f"No results found for {param_id}")
                    continue
            
            # Collect plots
            parameter_plots = {}
            
            for plot_type in plot_types:
                plot_name = f"{plot_type}_{param_id}_{compare_to_key}_{comparison_type}"
                plot_path = os.path.join(
                    base_dir,
                    f'Batch({version})',
                    f'Results({version})',
                    'Sensitivity',
                    mode_dir,
                    plot_type,
                    f"{plot_name}.png"
                )
                
                if os.path.exists(plot_path):
                    parameter_plots[plot_type] = os.path.relpath(plot_path, base_dir)
                else:
                    # Try alternative location (directly in mode directory)
                    alt_plot_path = os.path.join(
                        base_dir,
                        f'Batch({version})',
                        f'Results({version})',
                        'Sensitivity',
                        mode_dir,
                        f"{plot_name}.png"
                    )
                    
                    if os.path.exists(alt_plot_path):
                        parameter_plots[plot_type] = os.path.relpath(alt_plot_path, base_dir)
            
            # Prepare parameter report data
            report_data[param_id] = {
                'mode': mode,
                'compareToKey': compare_to_key,
                'results': result_data,
                'plots': parameter_plots,
                'variations': result_data.get('variations', [])
            }
            
            logger.info(f"Added {param_id} to report with {len(parameter_plots)} plots")
        
        # Generate the report using SensitivityFileManager
        report_path = file_manager.create_analysis_report(
            version=version,
            analysis_data=report_data
        )
        
        # Convert report path to relative path for frontend
        relative_path = os.path.relpath(
            report_path,
            base_dir
        )
        
        logger.info(f"\n{'='*80}")
        logger.info(f"Report Generation Completed - Run ID: {run_id}")
        logger.info(f"Report path: {report_path}")
        logger.info(f"{'='*80}")
        
        return jsonify({
            "status": "success",
            "runId": run_id,
            "message": "Analysis report generated successfully",
            "report_path": relative_path,
            "parameter_count": len(report_data)
        })
        
    except Exception as e:
        error_msg = f"Error generating analysis report: {str(e)}"
        logger.error(error_msg)
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

@sensitivity_routes.route('/sensitivity/plots/<mode>/<plot_type>', methods=['GET'])
def get_sensitivity_plot(mode, plot_type):
    """
    Retrieves a specific sensitivity plot.
    
    Query parameters:
    - param_id: Parameter ID (e.g., S10)
    - compareToKey: Comparison parameter ID (default: S13)
    - comparisonType: Comparison type (default: primary)
    - version: Version number
    """
    try:
        param_id = request.args.get('param_id')
        compare_to_key = request.args.get('compareToKey', 'S13')
        comparison_type = request.args.get('comparisonType', 'primary')
        version = request.args.get('version', '1')

        if not param_id:
            return jsonify({"error": "Parameter ID is required"}), 400

        logger.info(f"Retrieving {plot_type} plot for {param_id} vs {compare_to_key} in {mode} mode")
        
        # Get plot information from file manager
        plot_info = file_manager.get_plot_path(
            version=int(version),
            mode=mode,
            plot_type=plot_type,
            param_id=param_id,
            compare_to_key=compare_to_key,
            comparison_type=comparison_type
        )

        if plot_info['status'] != 'ready':
            return jsonify({
                "error": f"Plot not found: {plot_info.get('error', 'Unknown error')}"
            }), 404

        logger.info(f"Returning plot from {plot_info['full_path']}")
        return send_file(plot_info['full_path'], mimetype='image/png')

    except Exception as e:
        error_msg = f"Error retrieving plot: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@sensitivity_routes.route('/api/sensitivity-plots/<version>', methods=['GET'])
def get_sensitivity_plots_by_version(version):
    """Returns all sensitivity plots for a specific version."""
    try:
        # Define paths
        base_dir_results = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity'
        )
        
        if not os.path.exists(base_dir_results):
            return jsonify([])
        
        plots_data = []
        
        # Search in both Symmetrical and Multipoint directories
        for mode in ['Symmetrical', 'Multipoint']:
            mode_dir = os.path.join(base_dir_results, mode)
            
            if not os.path.exists(mode_dir):
                continue
                
            # Search for plot files in each plot type subdirectory
            for plot_type in ['waterfall', 'bar', 'point']:
                plot_type_dir = os.path.join(mode_dir, plot_type)
                
                if not os.path.exists(plot_type_dir):
                    continue
                    
                # Find all PNG files
                for root, _, files in os.walk(plot_type_dir):
                    for file in files:
                        if file.endswith('.png'):
                            # Extract parameter and comparison info from filename
                            file_parts = file.replace('.png', '').split('_')
                            
                            if len(file_parts) >= 4:
                                # Extract parts from filename (e.g., waterfall_S10_S13_primary.png)
                                plot_data = {
                                    'path': os.path.join(root, file),
                                    'title': f"{file_parts[0].capitalize()} Plot: {file_parts[1]} vs {file_parts[2]}",
                                    'category': file_parts[1],  # Parameter ID (e.g., S10)
                                    'group': plot_type.capitalize(),  # Plot type as group
                                    'description': f"Comparison type: {file_parts[3]}",
                                    'mode': mode
                                }
                                
                                plots_data.append(plot_data)
                
                # Also check for plots directly in mode directory
                for file in os.listdir(mode_dir):
                    if file.endswith('.png') and file.startswith(f"{plot_type}_"):
                        # Extract parameter and comparison info from filename
                        file_parts = file.replace('.png', '').split('_')
                        
                        if len(file_parts) >= 4:
                            plot_data = {
                                'path': os.path.join(mode_dir, file),
                                'title': f"{file_parts[0].capitalize()} Plot: {file_parts[1]} vs {file_parts[2]}",
                                'category': file_parts[1],  # Parameter ID (e.g., S10)
                                'group': plot_type.capitalize(),  # Plot type as group
                                'description': f"Comparison type: {file_parts[3]}",
                                'mode': mode
                            }
                            
                            plots_data.append(plot_data)
        
        return jsonify(plots_data)
        
    except Exception as e:
        logger.error(f"Error retrieving sensitivity plots: {str(e)}")
        return jsonify({
            "error": f"Error retrieving sensitivity plots: {str(e)}"
        }), 500

@sensitivity_routes.route('/api/sensitivity-plots/<version>/<param_id>', methods=['GET'])
def get_sensitivity_plots_by_parameter(version, param_id):
    """Returns sensitivity plots for a specific parameter."""
    try:
        # Define paths
        base_dir_results = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity'
        )
        
        if not os.path.exists(base_dir_results):
            return jsonify([])
        
        plots_data = []
        
        # Search in both Symmetrical and Multipoint directories
        for mode in ['Symmetrical', 'Multipoint']:
            mode_dir = os.path.join(base_dir_results, mode)
            
            if not os.path.exists(mode_dir):
                continue
                
            # Search for plot files in each plot type subdirectory
            for plot_type in ['waterfall', 'bar', 'point']:
                plot_type_dir = os.path.join(mode_dir, plot_type)
                
                if not os.path.exists(plot_type_dir):
                    continue
                    
                # Find all PNG files for this parameter
                for root, _, files in os.walk(plot_type_dir):
                    for file in files:
                        if file.endswith('.png') and f"_{param_id}_" in file:
                            # Extract parameter and comparison info from filename
                            file_parts = file.replace('.png', '').split('_')
                            
                            if len(file_parts) >= 4:
                                plot_data = {
                                    'path': os.path.join(root, file),
                                    'title': f"{file_parts[0].capitalize()} Plot: {file_parts[1]} vs {file_parts[2]}",
                                    'category': file_parts[1],  # Parameter ID (e.g., S10)
                                    'group': plot_type.capitalize(),  # Plot type as group
                                    'description': f"Comparison type: {file_parts[3]}",
                                    'mode': mode
                                }
                                
                                plots_data.append(plot_data)
                
                # Also check for plots directly in mode directory
                for file in os.listdir(mode_dir):
                    if file.endswith('.png') and file.startswith(f"{plot_type}_") and f"_{param_id}_" in file:
                        # Extract parameter and comparison info from filename
                        file_parts = file.replace('.png', '').split('_')
                        
                        if len(file_parts) >= 4:
                            plot_data = {
                                'path': os.path.join(mode_dir, file),
                                'title': f"{file_parts[0].capitalize()} Plot: {file_parts[1]} vs {file_parts[2]}",
                                'category': file_parts[1],  # Parameter ID (e.g., S10)
                                'group': plot_type.capitalize(),  # Plot type as group
                                'description': f"Comparison type: {file_parts[3]}",
                                'mode': mode
                            }
                            
                            plots_data.append(plot_data)
        
        return jsonify(plots_data)
        
    except Exception as e:
        logger.error(f"Error retrieving sensitivity plots: {str(e)}")
        return jsonify({
            "error": f"Error retrieving sensitivity plots: {str(e)}"
        }), 500

@sensitivity_routes.route('/api/sensitivity-plots/<version>/<category>/<group>', methods=['GET'])
def get_sensitivity_plots_by_category_and_group(version, category, group):
    """Returns sensitivity plots for a specific category and group."""
    try:
        # Define paths
        base_dir_results = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity'
        )
        
        if not os.path.exists(base_dir_results):
            return jsonify([])
        
        plots_data = []
        
        # Determine which mode directories to search
        if group.lower() == 'symmetrical':
            modes = ['Symmetrical']
        elif group.lower() == 'multipoint':
            modes = ['Multipoint']
        else:
            # If group is a plot type like 'Bar', 'Waterfall', or 'Point'
            modes = ['Symmetrical', 'Multipoint']
        
        for mode in modes:
            mode_dir = os.path.join(base_dir_results, mode)
            
            if not os.path.exists(mode_dir):
                continue
                
            # If group is a plot type, search in that directory
            if group.lower() in ['bar', 'waterfall', 'point']:
                plot_type_dir = os.path.join(mode_dir, group.lower())
                
                if not os.path.exists(plot_type_dir):
                    continue
                    
                # Find all PNG files for this category
                for root, _, files in os.walk(plot_type_dir):
                    for file in files:
                        if file.endswith('.png') and (f"_{category}_" in file or file.startswith(f"{group.lower()}_{category}_")):
                            # Extract parameter and comparison info from filename
                            file_parts = file.replace('.png', '').split('_')
                            
                            if len(file_parts) >= 4:
                                plot_data = {
                                    'path': os.path.join(root, file),
                                    'title': f"{file_parts[0].capitalize()} Plot: {file_parts[1]} vs {file_parts[2]}",
                                    'category': file_parts[1],  # Parameter ID (e.g., S10)
                                    'group': file_parts[0].capitalize(),  # Plot type as group
                                    'description': f"Comparison type: {file_parts[3]}",
                                    'mode': mode
                                }
                                
                                plots_data.append(plot_data)
            
            # Also check for plots directly in mode directory
            for file in os.listdir(mode_dir):
                if file.endswith('.png') and (f"_{category}_" in file or file.startswith(f"{group.lower()}_{category}_")):
                    # Extract parameter and comparison info from filename
                    file_parts = file.replace('.png', '').split('_')
                    
                    if len(file_parts) >= 4:
                        plot_data = {
                            'path': os.path.join(mode_dir, file),
                            'title': f"{file_parts[0].capitalize()} Plot: {file_parts[1]} vs {file_parts[2]}",
                            'category': file_parts[1],  # Parameter ID (e.g., S10)
                            'group': file_parts[0].capitalize(),  # Plot type as group
                            'description': f"Comparison type: {file_parts[3]}",
                            'mode': mode
                        }
                        
                        plots_data.append(plot_data)
        
        return jsonify(plots_data)
        
    except Exception as e:
        logger.error(f"Error retrieving sensitivity plots: {str(e)}")
        return jsonify({
            "error": f"Error retrieving sensitivity plots: {str(e)}"
        }), 500

@sensitivity_routes.route('/api/sensitivity-parameters/<version>', methods=['GET'])
def get_sensitivity_parameters(version):
    """Returns all sensitivity parameters for a specific version."""
    try:
        # Define paths
        base_dir_results = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity'
        )
        
        if not os.path.exists(base_dir_results):
            return jsonify([])
        
        parameters = {}
        
        # Check parameter directories
        for item in os.listdir(base_dir_results):
            item_path = os.path.join(base_dir_results, item)
            
            # Look for parameter directories (starting with S)
            if os.path.isdir(item_path) and item.startswith('S'):
                param_id = item
                
                # Determine mode from subdirectories
                modes = []
                if os.path.exists(os.path.join(item_path, 'symmetrical')):
                    modes.append('symmetrical')
                if os.path.exists(os.path.join(item_path, 'multipoint')):
                    modes.append('multipoint')
                
                # Get compare_to_key from result files
                compare_to_key = 'S13'  # Default
                for mode in ['Symmetrical', 'Multipoint']:
                    mode_dir = os.path.join(base_dir_results, mode)
                    
                    if not os.path.exists(mode_dir):
                        continue
                    
                    # Check result files
                    for file in os.listdir(mode_dir):
                        if file.startswith(f"{param_id}_vs_") and file.endswith('_results.json'):
                            parts = file.replace('_results.json', '').split('_vs_')
                            if len(parts) >= 2:
                                compare_to_key = parts[1].split('_')[0]
                                break
                                
                # Add parameter info
                parameters[param_id] = {
                    'id': param_id,
                    'modes': modes,
                    'compareToKey': compare_to_key
                }
        
        return jsonify(list(parameters.values()))
        
    except Exception as e:
        logger.error(f"Error retrieving sensitivity parameters: {str(e)}")
        return jsonify({
            "error": f"Error retrieving sensitivity parameters: {str(e)}"
        }), 500

@sensitivity_routes.route('/api/sensitivity-summary/<version>', methods=['GET'])
def get_sensitivity_summary(version):
    """Returns a summary of sensitivity analysis for a specific version."""
    try:
        # Define paths
        base_dir_results = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Sensitivity'
        )
        
        if not os.path.exists(base_dir_results):
            return jsonify({
                "version": version,
                "parameters": [],
                "plots": [],
                "status": "not_found"
            })
        
        # Get parameters
        parameters = []
        for item in os.listdir(base_dir_results):
            item_path = os.path.join(base_dir_results, item)
            
            # Look for parameter directories (starting with S)
            if os.path.isdir(item_path) and item.startswith('S'):
                param_id = item
                
                # Determine mode from subdirectories
                modes = []
                if os.path.exists(os.path.join(item_path, 'symmetrical')):
                    modes.append('symmetrical')
                if os.path.exists(os.path.join(item_path, 'multipoint')):
                    modes.append('multipoint')
                
                parameters.append({
                    'id': param_id,
                    'modes': modes
                })
        
        # Get plot counts
        plot_counts = {
            'waterfall': 0,
            'bar': 0,
            'point': 0,
            'total': 0
        }
        
        for mode in ['Symmetrical', 'Multipoint']:
            mode_dir = os.path.join(base_dir_results, mode)
            
            if not os.path.exists(mode_dir):
                continue
                
            for plot_type in ['waterfall', 'bar', 'point']:
                plot_type_dir = os.path.join(mode_dir, plot_type)
                
                if not os.path.exists(plot_type_dir):
                    continue
                    
                # Count PNG files
                for root, _, files in os.walk(plot_type_dir):
                    plot_files = [f for f in files if f.endswith('.png')]
                    plot_counts[plot_type] += len(plot_files)
                    plot_counts['total'] += len(plot_files)
                    
                # Also check mode directory directly
                for file in os.listdir(mode_dir):
                    if file.endswith('.png') and file.startswith(f"{plot_type}_"):
                        plot_counts[plot_type] += 1
                        plot_counts['total'] += 1
        
        # Get reports
        reports_dir = os.path.join(
            base_dir,
            f'Batch({version})',
            f'Results({version})',
            'Reports'
        )
        
        reports = []
        if os.path.exists(reports_dir):
            for file in os.listdir(reports_dir):
                if file.startswith('sensitivity_analysis_') and file.endswith('.html'):
                    report_path = os.path.join(reports_dir, file)
                    timestamp = datetime.fromtimestamp(os.path.getmtime(report_path))
                    
                    reports.append({
                        'name': file,
                        'path': os.path.relpath(report_path, base_dir),
                        'timestamp': timestamp.isoformat(),
                        'size': os.path.getsize(report_path)
                    })
        
        summary = {
            "version": version,
            "parameters": parameters,
            "plot_counts": plot_counts,
            "reports": reports,
            "status": "ready",
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(summary)
        
    except Exception as e:
        logger.error(f"Error retrieving sensitivity summary: {str(e)}")
        return jsonify({
            "error": f"Error retrieving sensitivity summary: {str(e)}",
            "version": version,
            "status": "error"
        }), 500
