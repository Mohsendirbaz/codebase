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
from flask import Flask, request, jsonify, Response, stream_with_context
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
    # Create logs directory if it doesn't exist
    os.makedirs(LOGS_DIR, exist_ok=True)
    
    # Run the Flask application
    app.run(debug=True, port=27890)
