from flask import Blueprint, request, jsonify
import logging
import csv
import os
import json
from pathlib import Path
import traceback

from ..utils.price_utils import parse_csv_for_price, calculate_price_range

# Configure logger
logger = logging.getLogger(__name__)

price_bp = Blueprint('price', __name__)

@price_bp.route('/data', methods=['GET'])
def get_price_data():
    """
    Get price data for a specific model version
    
    Query Parameters:
    - version: Model version
    - extension: Model extension (optional)
    """
    try:
        version = request.args.get('version')
        extension = request.args.get('extension')
        
        if not version:
            return jsonify({"error": "Version parameter is required"}), 400
        
        # Construct path to economic summary file
        version_path = f"Batch({version}.{extension})" if extension else f"Batch({version})"
        file_path = Path(f"Original/{version_path}/Results({version})/Economic_Summary({version}).csv")
        
        if not file_path.exists():
            return jsonify({
                "averageSellingPrice": 0,
                "isEstimate": True,
                "error": f"Economic summary file not found for version {version}"
            }), 200  # Return 200 with placeholder data instead of 404
        
        # Parse CSV file for price data
        price_data = parse_csv_for_price(file_path)
        
        # Calculate price range if not already present
        if 'minimumPrice' not in price_data or 'maximumPrice' not in price_data:
            price_range = calculate_price_range(file_path, price_data.get('averageSellingPrice', 0))
            price_data.update(price_range)
        
        return jsonify(price_data)
    
    except Exception as e:
        logger.error(f"Error fetching price data: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@price_bp.route('/comparison', methods=['POST'])
def compare_prices():
    """
    Compare prices between model variants
    
    Expected JSON:
    {
        "baseVersion": "1",
        "baseExtension": null,
        "variants": [
            {
                "version": "2",
                "extension": null
            },
            {
                "version": "1",
                "extension": "13"
            }
        ]
    }
    """
    try:
        data = request.get_json()
        logger.info(f"Received price comparison request: {data}")
        
        base_version = data.get('baseVersion')
        base_extension = data.get('baseExtension')
        variants = data.get('variants', [])
        
        if not base_version:
            return jsonify({"error": "Base version is required"}), 400
        
        if not variants:
            return jsonify({"error": "At least one variant is required"}), 400
        
        # Fetch base price data
        base_path = f"Batch({base_version}.{base_extension})" if base_extension else f"Batch({base_version})"
        base_file_path = Path(f"Original/{base_path}/Results({base_version})/Economic_Summary({base_version}).csv")
        
        if not base_file_path.exists():
            return jsonify({"error": f"Economic summary file not found for base version {base_version}"}), 404
        
        base_price_data = parse_csv_for_price(base_file_path)
        
        # Fetch variant price data and calculate differences
        comparison_results = {
            "basePrice": base_price_data,
            "variants": []
        }
        
        for variant in variants:
            version = variant.get('version')
            extension = variant.get('extension')
            
            if not version:
                continue
            
            variant_path = f"Batch({version}.{extension})" if extension else f"Batch({version})"
            variant_file_path = Path(f"Original/{variant_path}/Results({version})/Economic_Summary({version}).csv")
            
            if not variant_file_path.exists():
                # Skip this variant but log the issue
                logger.warning(f"Economic summary file not found for variant {version}")
                continue
            
            variant_price_data = parse_csv_for_price(variant_file_path)
            
            # Calculate percentage difference
            base_price = base_price_data.get('averageSellingPrice', 0)
            variant_price = variant_price_data.get('averageSellingPrice', 0)
            
            if base_price > 0:
                percentage_diff = ((variant_price - base_price) / base_price) * 100
            else:
                percentage_diff = 0
            
            comparison_results['variants'].append({
                "version": version,
                "extension": extension,
                "priceData": variant_price_data,
                "difference": variant_price - base_price,
                "percentageDifference": round(percentage_diff, 2)
            })
        
        return jsonify(comparison_results)
    
    except Exception as e:
        logger.error(f"Error in price comparison: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@price_bp.route('/impact', methods=['POST'])
def calculate_price_impact():
    """
    Calculate price impact from parameter changes
    
    Expected JSON:
    {
        "basePrice": 10000,
        "parameters": [
            {
                "name": "cost",
                "change": 10,
                "elasticity": 1.5
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        logger.info("Received price impact calculation request")
        
        base_price = data.get('basePrice', 0)
        parameters = data.get('parameters', [])
        
        if base_price <= 0:
            return jsonify({"error": "Valid base price is required"}), 400
        
        if not parameters:
            return jsonify({"error": "At least one parameter is required"}), 400
        
        # Import here to avoid circular imports
        from ..utils.price_utils import calculate_price_impact
        
        result = calculate_price_impact(base_price, parameters)
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error calculating price impact: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
