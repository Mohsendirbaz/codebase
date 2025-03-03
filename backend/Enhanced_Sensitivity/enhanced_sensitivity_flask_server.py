"""
Enhanced Sensitivity Flask Server

This module provides Flask API endpoints for the enhanced sensitivity analysis,
including endpoints for configuring, running, and getting results.
"""

import os
import json
import logging
import time
import sys
import pickle
from flask import Flask, request, jsonify, Response, stream_with_context, send_file
from flask_cors import CORS

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import enhanced sensitivity modules
from Enhanced_Sensitivity.enhanced_sensitivity_directory_builder import EnhancedSensitivityDirectoryBuilder
from Enhanced_Sensitivity.enhanced_sensitivity_executor import EnhancedSensitivityExecutor

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

# Configuration constants
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Logs")
os.makedirs(LOGS_DIR, exist_ok=True)

# Sensitivity configuration status file
SENSITIVITY_CONFIG_STATUS_PATH = os.path.join(LOGS_DIR, "enhanced_sensitivity_config_status.json")
SENSITIVITY_CONFIG_DATA_PATH = os.path.join(LOGS_DIR, "enhanced_sensitivity_config_data.pkl")

# Initialize Flask application
app = Flask(__name__)
CORS(app)

# Initialize sensitivity components
directory_builder = EnhancedSensitivityDirectoryBuilder()
executor = EnhancedSensitivityExecutor()

# Store calculated prices for each version
calculated_prices = {}

@app.route('/enhanced/sensitivity/configure', methods=['POST'])
def configure_sensitivity():
    """
    Generate and save sensitivity configurations with their applied variations.
    This must be called before running sensitivity calculations.
    """
    run_id = time.strftime("%Y%m%d_%H%M%S")
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Extract configuration
        config = {
            'versions': data.get('selectedVersions', [1]),
            'selectedV': data.get('selectedV', {f'V{i+1}': 'off' for i in range(10)}),
            'selectedF': data.get('selectedF', {f'F{i+1}': 'off' for i in range(5)}),
            'calculationOption': data.get('selectedCalculationOption', 'freeFlowNPV'),
            'targetRow': int(data.get('targetRow', 20)),
            'SenParameters': data.get('SenParameters', {})
        }
        
        version = config['versions'][0]
        
        logger.info(f"\n{'='*80}")
        logger.info(f"Enhanced Sensitivity Configuration Generation - Run ID: {run_id}")
        logger.info(f"{'='*80}")
        logger.info(f"Version: {version}")
        logger.info(f"Calculation Mode: {config['calculationOption']}")
        logger.info(f"Target Row: {config['targetRow']}")
        
        # Create sensitivity directories
        sensitivity_dir, reports_dir = directory_builder.create_sensitivity_directories(version, config['SenParameters'])
        
        # Copy configuration files
        files_copied = directory_builder.copy_config_files(version, sensitivity_dir)
        
        # Modify parameter values
        files_modified = directory_builder.modify_parameter_values(sensitivity_dir, config['SenParameters'])
        
        # Save configuration status
        with open(SENSITIVITY_CONFIG_STATUS_PATH, 'w') as f:
            json.dump({
                'configured': True,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'runId': run_id,
                'version': version,
                'reportsDir': reports_dir,
                'sensitivityDir': sensitivity_dir
            }, f, indent=2)
            
        # Save configuration data for later use
        with open(SENSITIVITY_CONFIG_DATA_PATH, 'wb') as f:
            pickle.dump(config, f)
            
        logger.info(f"\nEnhanced sensitivity configuration completed successfully")
        logger.info(f"Files copied: {files_copied}")
        logger.info(f"Files modified: {files_modified}")
        logger.info(f"Configuration status saved to: {SENSITIVITY_CONFIG_STATUS_PATH}")
        logger.info(f"{'='*80}\n")
        
        return jsonify({
            "status": "success",
            "message": "Enhanced sensitivity configurations generated and saved successfully",
            "runId": run_id,
            "reportsDir": reports_dir,
            "sensitivityDir": sensitivity_dir,
            "filesCopied": files_copied,
            "filesModified": files_modified,
            "nextStep": "Visit /enhanced/runs to execute sensitivity calculations"
        })
        
    except Exception as e:
        error_msg = f"Error generating enhanced sensitivity configurations: {str(e)}"
        logger.error(error_msg)
        
        # Update configuration status to indicate failure
        with open(SENSITIVITY_CONFIG_STATUS_PATH, 'w') as f:
            json.dump({
                'configured': False,
                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
                'runId': run_id,
                'error': error_msg
            }, f, indent=2)
            
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

@app.route('/enhanced/runs', methods=['POST'])
def run_calculations():
    """
    Run sensitivity calculations for all variations.
    """
    run_id = time.strftime("%Y%m%d_%H%M%S")
    
    try:
        # Check if sensitivity configurations have been generated
        if not os.path.exists(SENSITIVITY_CONFIG_STATUS_PATH):
            return jsonify({
                "error": "Sensitivity configurations have not been generated yet",
                "message": "Please call /enhanced/sensitivity/configure endpoint first",
                "nextStep": "Call /enhanced/sensitivity/configure endpoint first"
            }), 400
            
        with open(SENSITIVITY_CONFIG_STATUS_PATH, 'r') as f:
            status = json.load(f)
            
        if not status.get('configured', False):
            return jsonify({
                "error": "Sensitivity configurations have not been generated yet",
                "message": "Please call /enhanced/sensitivity/configure endpoint first",
                "nextStep": "Call /enhanced/sensitivity/configure endpoint first"
            }), 400
            
        # Load configuration data
        if not os.path.exists(SENSITIVITY_CONFIG_DATA_PATH):
            return jsonify({
                "error": "Configuration data not found",
                "message": "Please call /enhanced/sensitivity/configure endpoint first",
                "nextStep": "Call /enhanced/sensitivity/configure endpoint first"
            }), 400
            
        with open(SENSITIVITY_CONFIG_DATA_PATH, 'rb') as f:
            config = pickle.load(f)
            
        version = config['versions'][0]
        selected_v = config['selectedV']
        selected_f = config['selectedF']
        target_row = config['targetRow']
        calculation_option = config['calculationOption']
        
        logger.info(f"\n{'='*80}")
        logger.info(f"Enhanced Sensitivity Calculation Run - Run ID: {run_id}")
        logger.info(f"{'='*80}")
        logger.info(f"Version: {version}")
        logger.info(f"Calculation Mode: {calculation_option}")
        logger.info(f"Target Row: {target_row}")
        
        # Run baseline calculation
        logger.info("\nRunning baseline calculation...")
        baseline_success = executor.run_baseline_calculation(
            version,
            selected_v,
            selected_f,
            target_row,
            calculation_option
        )
        
        if not baseline_success:
            return jsonify({
                "error": "Failed to run baseline calculation",
                "runId": run_id
            }), 500
            
        logger.info("Baseline calculation completed successfully")
        
        # Get sensitivity directory
        sensitivity_dir = os.path.join(
            BASE_DIR,
            "Original",
            f"Batch({version})",
            f"Results({version})",
            "Sensitivity"
        )
        
        # Run variation calculations
        logger.info("\nRunning variation calculations...")
        calculated_prices[version] = executor.run_variation_calculations(
            version,
            sensitivity_dir,
            selected_v,
            selected_f,
            target_row,
            calculation_option
        )
        
        # Generate summary report
        logger.info("\nGenerating summary report...")
        report_path = executor.generate_summary_report(
            sensitivity_dir,
            calculated_prices[version]
        )
        
        logger.info(f"\nEnhanced sensitivity calculations completed successfully")
        logger.info(f"Calculated prices: {len(calculated_prices[version])}")
        logger.info(f"Summary report: {report_path}")
        logger.info(f"{'='*80}\n")
        
        return jsonify({
            "status": "success",
            "message": "Enhanced sensitivity calculations completed successfully",
            "runId": run_id,
            "calculatedPrices": len(calculated_prices[version]),
            "summaryReport": report_path,
            "nextStep": "Visit /enhanced/sensitivity/results to view results"
        })
        
    except Exception as e:
        error_msg = f"Error running enhanced sensitivity calculations: {str(e)}"
        logger.error(error_msg)
        
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

@app.route('/enhanced/sensitivity/results', methods=['GET'])
def get_sensitivity_results():
    """
    Get sensitivity results for all variations.
    """
    try:
        # Check if sensitivity calculations have been run
        if not calculated_prices:
            return jsonify({
                "error": "Sensitivity calculations have not been run yet",
                "message": "Please call /enhanced/runs endpoint first",
                "nextStep": "Call /enhanced/runs endpoint first"
            }), 400
            
        # Get version from query parameter or use the first available version
        version = request.args.get('version')
        if version:
            version = int(version)
        else:
            version = list(calculated_prices.keys())[0]
            
        # Check if results exist for the specified version
        if version not in calculated_prices:
            return jsonify({
                "error": f"No results found for version {version}",
                "availableVersions": list(calculated_prices.keys())
            }), 404
            
        # Get sensitivity directory
        sensitivity_dir = os.path.join(
            BASE_DIR,
            "Original",
            f"Batch({version})",
            f"Results({version})",
            "Sensitivity"
        )
        
        # Get summary report path
        report_path = os.path.join(sensitivity_dir, "Reports", "sensitivity_summary.json")
        
        # Check if summary report exists
        if not os.path.exists(report_path):
            return jsonify({
                "error": f"Summary report not found for version {version}",
                "message": "Please call /enhanced/runs endpoint first",
                "nextStep": "Call /enhanced/runs endpoint first"
            }), 404
            
        # Load summary report
        with open(report_path, 'r') as f:
            report_data = json.load(f)
            
        return jsonify({
            "status": "success",
            "version": version,
            "results": report_data
        })
        
    except Exception as e:
        error_msg = f"Error getting enhanced sensitivity results: {str(e)}"
        logger.error(error_msg)
        
        return jsonify({
            "error": error_msg
        }), 500

@app.route('/enhanced/prices/<int:version>', methods=['GET'])
def get_prices(version):
    """
    Get calculated prices for a specific version.
    """
    try:
        # Check if sensitivity calculations have been run
        if not calculated_prices:
            return jsonify({
                "error": "Sensitivity calculations have not been run yet",
                "message": "Please call /enhanced/runs endpoint first",
                "nextStep": "Call /enhanced/runs endpoint first"
            }), 400
            
        # Check if results exist for the specified version
        if version not in calculated_prices:
            return jsonify({
                "error": f"No results found for version {version}",
                "availableVersions": list(calculated_prices.keys())
            }), 404
            
        return jsonify({
            "status": "success",
            "version": version,
            "prices": calculated_prices[version]
        })
        
    except Exception as e:
        error_msg = f"Error getting prices for version {version}: {str(e)}"
        logger.error(error_msg)
        
        return jsonify({
            "error": error_msg
        }), 500

@app.route('/enhanced/stream_prices/<int:version>', methods=['GET'])
def stream_prices(version):
    """
    Stream calculated prices for a specific version.
    """
    def generate():
        try:
            # Check if sensitivity calculations have been run
            if not calculated_prices or version not in calculated_prices:
                yield f"data: {json.dumps({'error': f'No results found for version {version}'})}\n\n"
                return
                
            # Stream each price
            for key, price in calculated_prices[version].items():
                yield f"data: {json.dumps({'key': key, 'price': price})}\n\n"
                time.sleep(0.1)  # Small delay to prevent flooding
                
            # Signal completion
            yield f"data: {json.dumps({'complete': True})}\n\n"
            
        except Exception as e:
            error_msg = f"Error streaming prices for version {version}: {str(e)}"
            logger.error(error_msg)
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
    
    return Response(stream_with_context(generate()), mimetype='text/event-stream')

@app.route('/enhanced/sensitivity/visualize', methods=['POST'])
def visualize_sensitivity():
    """
    Generate visualizations for sensitivity analysis results.
    Supports point, bar, and waterfall plots based on the sensitivity parameters.
    """
    run_id = time.strftime("%Y%m%d_%H%M%S")
    
    try:
        # Check if sensitivity calculations have been run
        if not os.path.exists(SENSITIVITY_CONFIG_STATUS_PATH):
            return jsonify({
                "error": "Sensitivity configurations have not been generated yet",
                "message": "Please call /enhanced/sensitivity/configure endpoint first",
                "nextStep": "Call /enhanced/sensitivity/configure endpoint first"
            }), 400
            
        with open(SENSITIVITY_CONFIG_STATUS_PATH, 'r') as f:
            status = json.load(f)
            
        if not status.get('configured', False):
            return jsonify({
                "error": "Sensitivity configurations have not been generated yet",
                "message": "Please call /enhanced/sensitivity/configure endpoint first",
                "nextStep": "Call /enhanced/sensitivity/configure endpoint first"
            }), 400
            
        # Load configuration data
        if not os.path.exists(SENSITIVITY_CONFIG_DATA_PATH):
            return jsonify({
                "error": "Configuration data not found",
                "message": "Please call /enhanced/sensitivity/configure endpoint first",
                "nextStep": "Call /enhanced/sensitivity/configure endpoint first"
            }), 400
            
        with open(SENSITIVITY_CONFIG_DATA_PATH, 'rb') as f:
            config = pickle.load(f)
            
        # Get sensitivity parameters
        sen_parameters = config.get('SenParameters', {})
        
        # Get version
        version = config['versions'][0]
        
        # Get sensitivity directory
        sensitivity_dir = os.path.join(
            BASE_DIR,
            "Original",
            f"Batch({version})",
            f"Results({version})",
            "Sensitivity"
        )
        
        # Get reports directory
        reports_dir = os.path.join(sensitivity_dir, "Reports")
        
        # Check if summary report exists
        summary_report_path = os.path.join(reports_dir, "sensitivity_summary.json")
        if not os.path.exists(summary_report_path):
            return jsonify({
                "error": "Summary report not found",
                "message": "Please call /enhanced/runs endpoint first",
                "nextStep": "Call /enhanced/runs endpoint first"
            }), 400
            
        # Load summary report
        with open(summary_report_path, 'r') as f:
            report_data = json.load(f)
            
        # Generate visualizations directory
        visualizations_dir = os.path.join(reports_dir, "Visualizations")
        os.makedirs(visualizations_dir, exist_ok=True)
        
        # Generate visualizations for each parameter
        visualization_paths = {}
        
        import matplotlib
        matplotlib.use('Agg')  # Use non-interactive backend
        import matplotlib.pyplot as plt
        import numpy as np
        
        for param_id, param_config in sen_parameters.items():
            if not param_config.get('enabled', False):
                continue
                
            # Skip parameters that don't have any visualization type enabled
            if not (param_config.get('point', False) or 
                   param_config.get('bar', False) or 
                   param_config.get('waterfall', False)):
                continue
                
            # Get parameter data from report
            if param_id not in report_data.get('parameters', {}):
                logger.warning(f"No data found for parameter {param_id}")
                continue
                
            param_data = report_data['parameters'][param_id]
            
            # Generate point plot if enabled
            if param_config.get('point', False):
                try:
                    point_plot_path = os.path.join(visualizations_dir, f"{param_id}_point.png")
                    
                    plt.figure(figsize=(10, 6))
                    
                    for mode, variations in param_data.items():
                        x_values = []
                        y_values = []
                        
                        for variation, price in variations.items():
                            # Extract variation value (assuming format like 'minus_20' or 'plus_20')
                            if 'minus_' in variation:
                                x_value = -float(variation.replace('minus_', ''))
                            elif 'plus_' in variation:
                                x_value = float(variation.replace('plus_', ''))
                            else:
                                x_value = float(variation)
                                
                            x_values.append(x_value)
                            y_values.append(price)
                            
                        # Sort points by x value
                        points = sorted(zip(x_values, y_values))
                        x_values = [p[0] for p in points]
                        y_values = [p[1] for p in points]
                        
                        plt.plot(x_values, y_values, 'o-', label=f"{mode}")
                        
                    plt.title(f"Sensitivity Analysis - {param_id} (Point Plot)")
                    plt.xlabel("Parameter Variation (%)")
                    plt.ylabel("Price ($)")
                    plt.grid(True)
                    plt.legend()
                    
                    plt.savefig(point_plot_path)
                    plt.close()
                    
                    visualization_paths[f"{param_id}_point"] = point_plot_path
                    logger.info(f"Generated point plot for {param_id}: {point_plot_path}")
                    
                except Exception as e:
                    logger.error(f"Error generating point plot for {param_id}: {str(e)}")
            
            # Generate bar plot if enabled
            if param_config.get('bar', False):
                try:
                    bar_plot_path = os.path.join(visualizations_dir, f"{param_id}_bar.png")
                    
                    plt.figure(figsize=(12, 6))
                    
                    all_variations = []
                    all_prices = []
                    all_labels = []
                    
                    for mode, variations in param_data.items():
                        for variation, price in variations.items():
                            # Extract variation value
                            if 'minus_' in variation:
                                label = f"-{variation.replace('minus_', '')}%"
                            elif 'plus_' in variation:
                                label = f"+{variation.replace('plus_', '')}%"
                            else:
                                label = f"{variation}%"
                                
                            all_variations.append(variation)
                            all_prices.append(price)
                            all_labels.append(f"{mode} {label}")
                    
                    # Sort by price
                    sorted_data = sorted(zip(all_variations, all_prices, all_labels), key=lambda x: x[1])
                    all_variations = [d[0] for d in sorted_data]
                    all_prices = [d[1] for d in sorted_data]
                    all_labels = [d[2] for d in sorted_data]
                    
                    plt.bar(all_labels, all_prices)
                    plt.title(f"Sensitivity Analysis - {param_id} (Bar Plot)")
                    plt.xlabel("Parameter Variation")
                    plt.ylabel("Price ($)")
                    plt.xticks(rotation=45, ha='right')
                    plt.tight_layout()
                    
                    plt.savefig(bar_plot_path)
                    plt.close()
                    
                    visualization_paths[f"{param_id}_bar"] = bar_plot_path
                    logger.info(f"Generated bar plot for {param_id}: {bar_plot_path}")
                    
                except Exception as e:
                    logger.error(f"Error generating bar plot for {param_id}: {str(e)}")
            
            # Generate waterfall plot if enabled
            if param_config.get('waterfall', False):
                try:
                    waterfall_plot_path = os.path.join(visualizations_dir, f"{param_id}_waterfall.png")
                    
                    plt.figure(figsize=(12, 6))
                    
                    # Get baseline price (assuming it's the first price in the first mode)
                    baseline_price = None
                    for mode, variations in param_data.items():
                        for variation, price in variations.items():
                            baseline_price = price
                            break
                        if baseline_price is not None:
                            break
                            
                    if baseline_price is None:
                        logger.warning(f"No baseline price found for {param_id}")
                        continue
                        
                    # Prepare data for waterfall plot
                    all_variations = []
                    all_diffs = []
                    all_labels = []
                    
                    for mode, variations in param_data.items():
                        for variation, price in variations.items():
                            # Skip baseline
                            if price == baseline_price:
                                continue
                                
                            # Extract variation value
                            if 'minus_' in variation:
                                label = f"-{variation.replace('minus_', '')}%"
                            elif 'plus_' in variation:
                                label = f"+{variation.replace('plus_', '')}%"
                            else:
                                label = f"{variation}%"
                                
                            all_variations.append(variation)
                            all_diffs.append(price - baseline_price)
                            all_labels.append(f"{mode} {label}")
                    
                    # Sort by absolute difference
                    sorted_data = sorted(zip(all_variations, all_diffs, all_labels), key=lambda x: abs(x[1]), reverse=True)
                    all_variations = [d[0] for d in sorted_data]
                    all_diffs = [d[1] for d in sorted_data]
                    all_labels = [d[2] for d in sorted_data]
                    
                    # Limit to top 10 for readability
                    if len(all_variations) > 10:
                        all_variations = all_variations[:10]
                        all_diffs = all_diffs[:10]
                        all_labels = all_labels[:10]
                    
                    # Create waterfall plot
                    fig, ax = plt.subplots(figsize=(12, 6))
                    
                    # Start with baseline
                    ax.bar(0, baseline_price, bottom=0, color='blue', label='Baseline')
                    ax.text(0, baseline_price/2, f"Baseline\n${baseline_price:.2f}", ha='center', va='center', color='white')
                    
                    # Add each variation
                    for i, (label, diff) in enumerate(zip(all_labels, all_diffs)):
                        color = 'green' if diff > 0 else 'red'
                        ax.bar(i+1, diff, bottom=baseline_price, color=color)
                        ax.text(i+1, baseline_price + diff/2, f"{label}\n${diff:.2f}", ha='center', va='center', color='white')
                    
                    # Add final price
                    final_price = baseline_price + sum(all_diffs)
                    ax.bar(len(all_labels)+1, final_price, bottom=0, color='purple', label='Final')
                    ax.text(len(all_labels)+1, final_price/2, f"Final\n${final_price:.2f}", ha='center', va='center', color='white')
                    
                    ax.set_title(f"Sensitivity Analysis - {param_id} (Waterfall Plot)")
                    ax.set_ylabel("Price ($)")
                    ax.set_xticks([])
                    ax.grid(axis='y')
                    
                    plt.tight_layout()
                    plt.savefig(waterfall_plot_path)
                    plt.close()
                    
                    visualization_paths[f"{param_id}_waterfall"] = waterfall_plot_path
                    logger.info(f"Generated waterfall plot for {param_id}: {waterfall_plot_path}")
                    
                except Exception as e:
                    logger.error(f"Error generating waterfall plot for {param_id}: {str(e)}")
        
        # Create visualization index
        visualization_index_path = os.path.join(visualizations_dir, "visualization_index.json")
        with open(visualization_index_path, 'w') as f:
            json.dump({
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "runId": run_id,
                "version": version,
                "visualizations": visualization_paths
            }, f, indent=2)
            
        logger.info(f"Generated visualization index: {visualization_index_path}")
        
        return jsonify({
            "status": "success",
            "message": "Sensitivity visualizations generated successfully",
            "runId": run_id,
            "version": version,
            "visualizationsDir": visualizations_dir,
            "visualizationCount": len(visualization_paths),
            "visualizationIndex": visualization_index_path
        })
        
    except Exception as e:
        error_msg = f"Error generating sensitivity visualizations: {str(e)}"
        logger.error(error_msg)
        
        return jsonify({
            "error": error_msg,
            "runId": run_id
        }), 500

@app.route('/enhanced/sensitivity/visualization/<param_id>/<plot_type>', methods=['GET'])
def get_sensitivity_visualization(param_id, plot_type):
    """
    Get a specific sensitivity visualization.
    
    Args:
        param_id (str): Parameter ID (e.g., S34)
        plot_type (str): Plot type (point, bar, or waterfall)
    """
    try:
        # Get version from query parameter or use the first available version
        version = request.args.get('version')
        if version:
            version = int(version)
        else:
            # Check if sensitivity configurations have been generated
            if not os.path.exists(SENSITIVITY_CONFIG_STATUS_PATH):
                return jsonify({
                    "error": "Sensitivity configurations have not been generated yet",
                    "message": "Please call /enhanced/sensitivity/configure endpoint first",
                    "nextStep": "Call /enhanced/sensitivity/configure endpoint first"
                }), 400
                
            with open(SENSITIVITY_CONFIG_STATUS_PATH, 'r') as f:
                status = json.load(f)
                
            if not status.get('configured', False):
                return jsonify({
                    "error": "Sensitivity configurations have not been generated yet",
                    "message": "Please call /enhanced/sensitivity/configure endpoint first",
                    "nextStep": "Call /enhanced/sensitivity/configure endpoint first"
                }), 400
                
            # Load configuration data
            if not os.path.exists(SENSITIVITY_CONFIG_DATA_PATH):
                return jsonify({
                    "error": "Configuration data not found",
                    "message": "Please call /enhanced/sensitivity/configure endpoint first",
                    "nextStep": "Call /enhanced/sensitivity/configure endpoint first"
                }), 400
                
            with open(SENSITIVITY_CONFIG_DATA_PATH, 'rb') as f:
                config = pickle.load(f)
                
            version = config['versions'][0]
            
        # Get sensitivity directory
        sensitivity_dir = os.path.join(
            BASE_DIR,
            "Original",
            f"Batch({version})",
            f"Results({version})",
            "Sensitivity"
        )
        
        # Get reports directory
        reports_dir = os.path.join(sensitivity_dir, "Reports")
        
        # Get visualizations directory
        visualizations_dir = os.path.join(reports_dir, "Visualizations")
        
        # Check if visualization exists
        visualization_path = os.path.join(visualizations_dir, f"{param_id}_{plot_type}.png")
        if not os.path.exists(visualization_path):
            return jsonify({
                "error": f"Visualization not found: {param_id}_{plot_type}",
                "message": "Please call /enhanced/sensitivity/visualize endpoint first",
                "nextStep": "Call /enhanced/sensitivity/visualize endpoint first"
            }), 404
            
        # Return the visualization
        return send_file(visualization_path, mimetype='image/png')
        
    except Exception as e:
        error_msg = f"Error getting sensitivity visualization: {str(e)}"
        logger.error(error_msg)
        
        return jsonify({
            "error": error_msg
        }), 500

@app.route('/enhanced/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for server detection.
    Returns a 200 OK response with basic server information.
    """
    return jsonify({
        "status": "ok",
        "server": "enhanced-sensitivity-analysis-server",
        "version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

# Application entry point
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=25007, debug=True)
