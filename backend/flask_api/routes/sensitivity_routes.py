from flask import Blueprint, request, jsonify
import logging
import numpy as np
import json
import os
from pathlib import Path
import traceback

from ..utils.sensitivity_utils import run_sensitivity_analysis, run_monte_carlo
from ..utils.validation import validate_sensitivity_params, validate_monte_carlo_params

# Configure logger
logger = logging.getLogger(__name__)

sensitivity_bp = Blueprint('sensitivity', __name__)

@sensitivity_bp.route('/analyze', methods=['POST'])
def analyze():
    """
    Run sensitivity analysis on provided parameters
    
    Expected JSON:
    {
        "parameters": [
            {
                "type": "cost",
                "range": { "min": -20, "max": 20 },
                "steps": 10
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        logger.info(f"Received sensitivity analysis request: {data}")
        
        # Validate input
        validation_result = validate_sensitivity_params(data)
        if validation_result != "valid":
            return jsonify({"error": validation_result}), 400
        
        # Run sensitivity analysis
        result = run_sensitivity_analysis(data.get('parameters', []))
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in sensitivity analysis: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@sensitivity_bp.route('/monte-carlo', methods=['POST'])
def monte_carlo():
    """
    Run Monte Carlo simulation on provided parameters
    
    Expected JSON:
    {
        "parameters": [
            {
                "type": "cost",
                "distribution": "uniform",
                "range": { "min": -20, "max": 20 }
            },
            ...
        ],
        "iterations": 1000
    }
    """
    try:
        data = request.get_json()
        logger.info(f"Received Monte Carlo simulation request: {data}")
        
        # Validate input
        validation_result = validate_monte_carlo_params(data)
        if validation_result != "valid":
            return jsonify({"error": validation_result}), 400
        
        # Run Monte Carlo simulation
        iterations = data.get('iterations', 1000)
        result = run_monte_carlo(data.get('parameters', []), iterations)
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in Monte Carlo simulation: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@sensitivity_bp.route('/derivatives/<parameter>', methods=['GET'])
def get_derivatives(parameter):
    """
    Get derivative data for a specific parameter type
    
    URL Parameters:
    - parameter: Parameter type (e.g., 'cost', 'time', 'process')
    
    Query Parameters:
    - version: Model version
    - extension: Model extension (optional)
    """
    try:
        version = request.args.get('version')
        extension = request.args.get('extension')
        
        if not version:
            return jsonify({"error": "Version parameter is required"}), 400
        
        if not parameter:
            return jsonify({"error": "Parameter type is required"}), 400
        
        # Construct path to derivatives file
        version_path = f"Batch({version}.{extension})" if extension else f"Batch({version})"
        derivatives_path = Path(f"Original/{version_path}/Results({version})/Sensitivity/Multipoint/{parameter}_derivatives.json")
        
        if not derivatives_path.exists():
            return jsonify({"error": f"No derivatives data found for {parameter}"}), 404
        
        with open(derivatives_path, 'r') as f:
            data = json.load(f)
        
        return jsonify(data)
    
    except Exception as e:
        logger.error(f"Error fetching derivatives: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@sensitivity_bp.route('/efficacy', methods=['POST'])
def calculate_efficacy():
    """
    Calculate efficacy metrics from sensitivity data and price data
    
    Expected JSON:
    {
        "sensitivityData": {
            "parameters": ["cost", "time", ...],
            "derivatives": [
                {
                    "parameter": "cost",
                    "data": [{"impact": 0.1}, {"impact": 0.2}, ...]
                },
                ...
            ]
        },
        "priceData": {
            "averageSellingPrice": 10000,
            "minimumPrice": 9000,
            "maximumPrice": 11000
        }
    }
    """
    try:
        data = request.get_json()
        logger.info("Received efficacy calculation request")
        
        sensitivity_data = data.get('sensitivityData')
        price_data = data.get('priceData')
        
        if not sensitivity_data:
            return jsonify({"error": "Sensitivity data is required"}), 400
        
        if not price_data:
            return jsonify({"error": "Price data is required"}), 400
        
        # Import here to avoid circular imports
        from ..utils.efficacy_utils import calculate_efficacy_metrics
        
        result = calculate_efficacy_metrics(sensitivity_data, price_data)
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error calculating efficacy: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
