"""
Utilities for price data processing and calculations
"""

import csv
import logging
import statistics
from pathlib import Path
from typing import Dict, Any, List

# Configure logger
logger = logging.getLogger(__name__)

def parse_csv_for_price(file_path: Path) -> Dict[str, Any]:
    """
    Parse CSV file to extract price information
    
    Args:
        file_path (Path): Path to the Economic_Summary CSV file
    
    Returns:
        Dict: Price data including average selling price and flags
    """
    logger.info(f"Parsing CSV for price data: {file_path}")
    
    try:
        with open(file_path, 'r') as f:
            csv_content = f.read()
            
        lines = csv_content.strip().split('\n')
        
        # Initialize result
        result = {
            "averageSellingPrice": 0,
            "isEstimate": True
        }
        
        # Parse CSV to get price information
        price_line = next((line for line in lines if "Average Selling Price" in line), None)
        total_revenue_line = next((line for line in lines if "Total Revenue" in line), None)
        total_output_line = next((line for line in lines if "Total Output" in line), None)
        
        if price_line:
            parts = price_line.split(',')
            if len(parts) > 1:
                try:
                    result["averageSellingPrice"] = float(parts[1])
                    result["isEstimate"] = False
                except ValueError:
                    logger.warning(f"Failed to parse average selling price: {parts[1]}")
        
        # If average selling price not found, try to calculate from revenue and output
        elif total_revenue_line and total_output_line:
            try:
                revenue_parts = total_revenue_line.split(',')
                output_parts = total_output_line.split(',')
                
                if len(revenue_parts) > 1 and len(output_parts) > 1:
                    revenue = float(revenue_parts[1])
                    output = float(output_parts[1])
                    
                    if output > 0:
                        result["averageSellingPrice"] = revenue / output
                        result["isEstimate"] = True  # Mark as estimate since it's calculated
            except ValueError:
                logger.warning("Failed to calculate average selling price from revenue and output")
        
        return result
    
    except Exception as e:
        logger.error(f"Error parsing CSV for price data: {str(e)}")
        return {
            "averageSellingPrice": 0,
            "isEstimate": True,
            "error": str(e)
        }

def calculate_price_range(file_path: Path, avg_price: float) -> Dict[str, float]:
    """
    Calculate price range (min/max) from economic data
    
    Args:
        file_path (Path): Path to the Economic_Summary CSV file
        avg_price (float): Average selling price
    
    Returns:
        Dict: Min and max prices
    """
    logger.info(f"Calculating price range from: {file_path}")
    
    try:
        # Default variation around average
        default_variation = 0.15  # 15% variation by default
        
        # Try to extract actual min/max from CSV
        with open(file_path, 'r') as f:
            csv_content = f.read()
            
        lines = csv_content.strip().split('\n')
        
        # Look for specific min/max price lines
        min_price_line = next((line for line in lines if "Minimum Price" in line), None)
        max_price_line = next((line for line in lines if "Maximum Price" in line), None)
        
        min_price = 0
        max_price = 0
        
        if min_price_line:
            parts = min_price_line.split(',')
            if len(parts) > 1:
                try:
                    min_price = float(parts[1])
                except ValueError:
                    logger.warning(f"Failed to parse minimum price: {parts[1]}")
        
        if max_price_line:
            parts = max_price_line.split(',')
            if len(parts) > 1:
                try:
                    max_price = float(parts[1])
                except ValueError:
                    logger.warning(f"Failed to parse maximum price: {parts[1]}")
        
        # If min/max not found in file, estimate based on average
        if min_price <= 0 or max_price <= 0:
            min_price = avg_price * (1 - default_variation)
            max_price = avg_price * (1 + default_variation)
        
        return {
            "minimumPrice": min_price,
            "maximumPrice": max_price
        }
    
    except Exception as e:
        logger.error(f"Error calculating price range: {str(e)}")
        # Fallback to estimated range
        return {
            "minimumPrice": avg_price * 0.85,
            "maximumPrice": avg_price * 1.15
        }

def calculate_price_impact(base_price: float, parameters: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate price impact from parameter changes and their elasticity
    
    Args:
        base_price (float): Base price to calculate impacts from
        parameters (List[Dict]): List of parameter changes and elasticity
            Each parameter should have:
            - name: Parameter name
            - change: Percentage change in the parameter
            - elasticity: Price elasticity for this parameter
    
    Returns:
        Dict: Price impact analysis
    """
    logger.info(f"Calculating price impact for {len(parameters)} parameters")
    
    # Calculate individual parameter impacts
    parameter_impacts = []
    total_impact = 0
    
    for param in parameters:
        name = param.get('name')
        change = param.get('change', 0)
        elasticity = param.get('elasticity', 1.0)
        
        # Calculate price impact using elasticity formula
        # Impact = Elasticity * Change * Base Price
        impact = (elasticity * change / 100) * base_price
        total_impact += impact
        
        parameter_impacts.append({
            "parameter": name,
            "change": change,
            "elasticity": elasticity,
            "impact": impact
        })
    
    # Calculate new price and percentage change
    new_price = base_price + total_impact
    percent_change = (total_impact / base_price) * 100 if base_price > 0 else 0
    
    return {
        "basePrice": base_price,
        "newPrice": new_price,
        "totalImpact": total_impact,
        "percentChange": round(percent_change, 2),
        "parameterImpacts": sorted(parameter_impacts, key=lambda x: abs(x.get('impact', 0)), reverse=True)
    }
