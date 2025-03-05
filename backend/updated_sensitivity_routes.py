"""
Updated sensitivity routes module.

This module provides updated routes for sensitivity analysis in the Flask application,
ensuring that configurations are generated and saved before sensitivity runs can be performed.
"""

import os
import json
import time
import logging
from flask import Flask, request, jsonify, Blueprint
from sensitivity_analysis_manager import sensitivity_manager
from sensitivity_logging import log_execution_flow

# Configure logging
logger = logging.getLogger(__name__)

# Create a blueprint for sensitivity routes
sensitivity_bp = Blueprint('sensitivity', __name__)

@sensitivity_bp.route('/configure', methods=['POST'])
def configure_sensitivity():
    """Generate and save sensitivity configurations."""
    log_execution_flow('enter', "Handling /sensitivity/configure request")
    
    try:
        data = request.get_json()
        if not data:
            log_execution_flow('error', "No data provided in request")
            return jsonify({"error": "No data provided"}), 400
            
        # Generate configurations
        result = sensitivity_manager.generate_configurations(data)
        
        log_execution_flow('exit', "Completed /sensitivity/configure request")
        return jsonify(result)
        
    except Exception as e:
        error_msg = f"Error in /sensitivity/configure: {str(e)}"
        logger.exception(error_msg)
        log_execution_flow('error', error_msg)
        return jsonify({
            "error": error_msg
        }), 500

@sensitivity_bp.route('/run', methods=['POST'])
def run_sensitivity_calculations():
    """Run sensitivity calculations."""
    log_execution_flow('enter', "Handling /sensitivity/run request")
    
    try:
        # Run calculations
        result = sensitivity_manager.run_calculations()
        
        log_execution_flow('exit', "Completed /sensitivity/run request")
        return jsonify(result)
        
    except Exception as e:
        error_msg = f"Error in /sensitivity/run: {str(e)}"
        logger.exception(error_msg)
        log_execution_flow('error', error_msg)
        return jsonify({
            "error": error_msg
        }), 500

@sensitivity_bp.route('/visualize', methods=['POST'])
def visualize_sensitivity():
    """Generate visualizations for sensitivity analysis."""
    log_execution_flow('enter', "Handling /sensitivity/visualize request")
    
    try:
        # Generate visualizations
        result = sensitivity_manager.generate_visualizations()
        
        log_execution_flow('exit', "Completed /sensitivity/visualize request")
        return jsonify(result)
        
    except Exception as e:
        error_msg = f"Error in /sensitivity/visualize: {str(e)}"
        logger.exception(error_msg)
        log_execution_flow('error', error_msg)
        return jsonify({
            "error": error_msg
        }), 500

@sensitivity_bp.route('/full-analysis', methods=['POST'])
def run_full_sensitivity_analysis():
    """Run the full sensitivity analysis workflow."""
    log_execution_flow('enter', "Handling /sensitivity/full-analysis request")
    
    try:
        data = request.get_json()
        if not data:
            log_execution_flow('error', "No data provided in request")
            return jsonify({"error": "No data provided"}), 400
            
        # Run full analysis
        result = sensitivity_manager.run_full_analysis(data)
        
        log_execution_flow('exit', "Completed /sensitivity/full-analysis request")
        return jsonify(result)
        
    except Exception as e:
        error_msg = f"Error in /sensitivity/full-analysis: {str(e)}"
        logger.exception(error_msg)
        log_execution_flow('error', error_msg)
        return jsonify({
            "error": error_msg
        }), 500

@sensitivity_bp.route('/status', methods=['GET'])
def get_sensitivity_status():
    """Get the status of sensitivity analysis."""
    log_execution_flow('enter', "Handling /sensitivity/status request")
    
    try:
        # Check if configurations exist
        is_configured = sensitivity_manager.integration.is_configured()
        
        status = {
            "configured": is_configured,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        log_execution_flow('exit', "Completed /sensitivity/status request")
        return jsonify(status)
        
    except Exception as e:
        error_msg = f"Error in /sensitivity/status: {str(e)}"
        logger.exception(error_msg)
        log_execution_flow('error', error_msg)
        return jsonify({
            "error": error_msg
        }), 500

@sensitivity_bp.route('/parameter-info/<param_id>', methods=['GET'])
def get_parameter_info(param_id):
    """Get information about a sensitivity parameter."""
    log_execution_flow('enter', f"Handling /sensitivity/parameter-info/{param_id} request")
    
    try:
        # Get parameter info
        param_info = sensitivity_manager.get_parameter_info(param_id)
        
        log_execution_flow('exit', f"Completed /sensitivity/parameter-info/{param_id} request")
        return jsonify(param_info)
        
    except Exception as e:
        error_msg = f"Error in /sensitivity/parameter-info/{param_id}: {str(e)}"
        logger.exception(error_msg)
        log_execution_flow('error', error_msg)
        return jsonify({
            "error": error_msg
        }), 500

def register_routes(app):
    """Register sensitivity routes with the Flask application."""
    app.register_blueprint(sensitivity_bp, url_prefix='/sensitivity')
    logger.info("Registered sensitivity routes")
