"""
Utilities for sensitivity analysis and Monte Carlo simulation
"""

import numpy as np
import random
import logging
import math
from typing import List, Dict, Any

# Configure logger
logger = logging.getLogger(__name__)

def run_sensitivity_analysis(parameters: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Run sensitivity analysis on provided parameters
    
    Args:
        parameters (List[Dict]): List of parameter configurations
            Each parameter should have:
            - type: Parameter type (e.g., 'cost', 'time', 'process')
            - range: Object with min and max values
            - steps: Number of steps to sample
    
    Returns:
        Dict: Sensitivity analysis results
    """
    logger.info(f"Running sensitivity analysis with {len(parameters)} parameters")
    
    results = []
    
    for param in parameters:
        param_type = param.get('type')
        param_range = param.get('range', {})
        steps = param.get('steps', 10)
        
        # Create range of values to test
        min_val = param_range.get('min', -10)
        max_val = param_range.get('max', 10)
        
        # Generate linear spacing of values
        values = np.linspace(min_val, max_val, steps)
        
        # Calculate impact for each value
        impact_values = []
        for val in values:
            # This is where we would implement actual impact calculation
            # For now, we'll use a simple deterministic function based on the value
            # In a real implementation, this would involve running economic models
            
            # Create a deterministic but seemingly random impact
            # Smaller changes usually have smaller impacts, but with some noise
            scale = abs(val) / max(abs(min_val), abs(max_val))
            impact = scale * math.sin(val * 0.8) * (1 + 0.3 * math.cos(val * 2.5))
            
            impact_values.append({
                "value": val,
                "impact": impact
            })
        
        # Add parameter results
        results.append({
            "parameter": param_type,
            "values": impact_values
        })
    
    return {
        "type": "sensitivity",
        "parameters": parameters,
        "results": results
    }

def run_monte_carlo(parameters: List[Dict[str, Any]], iterations: int = 1000) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation on provided parameters
    
    Args:
        parameters (List[Dict]): List of parameter configurations
            Each parameter should have:
            - type: Parameter type (e.g., 'cost', 'time', 'process')
            - distribution: Distribution type ('uniform', 'normal', 'triangular')
            - range: Object with min and max values
        iterations (int): Number of Monte Carlo iterations
    
    Returns:
        Dict: Monte Carlo simulation results
    """
    logger.info(f"Running Monte Carlo simulation with {len(parameters)} parameters and {iterations} iterations")
    
    # Random number generators for different distributions
    def sample_uniform(param_range):
        min_val = param_range.get('min', -10)
        max_val = param_range.get('max', 10)
        return random.uniform(min_val, max_val)
    
    def sample_normal(param_range):
        min_val = param_range.get('min', -10)
        max_val = param_range.get('max', 10)
        # Use the range to determine mean and stddev
        mean = (min_val + max_val) / 2
        stddev = (max_val - min_val) / 4  # So that ~95% of samples fall within the range
        # Clamp values to the range
        value = random.normalvariate(mean, stddev)
        return max(min_val, min(value, max_val))
    
    def sample_triangular(param_range):
        min_val = param_range.get('min', -10)
        max_val = param_range.get('max', 10)
        # Mode in the middle (can be customized)
        mode = (min_val + max_val) / 2
        return random.triangular(min_val, max_val, mode)
    
    # Generate random samples for each parameter and iteration
    npv_values = []
    irr_values = []
    
    for _ in range(iterations):
        # Sample parameter values for this iteration
        param_values = {}
        for param in parameters:
            param_type = param.get('type')
            distribution = param.get('distribution', 'uniform')
            param_range = param.get('range', {})
            
            # Sample from the specified distribution
            if distribution == 'normal':
                value = sample_normal(param_range)
            elif distribution == 'triangular':
                value = sample_triangular(param_range)
            else:  # Default to uniform
                value = sample_uniform(param_range)
            
            param_values[param_type] = value
        
        # Calculate NPV and IRR for this set of parameters
        # In a real implementation, this would involve an economic model
        # For now, we'll use a simple algorithm for demonstration
        
        # Base NPV
        base_npv = 500000
        
        # Adjust NPV based on parameters
        npv_multiplier = 1.0
        for param_type, value in param_values.items():
            # Different parameters affect NPV differently
            if param_type == 'cost':
                # Higher costs decrease NPV
                npv_multiplier *= (1 - value/100)
            elif param_type == 'time':
                # Longer times slightly decrease NPV
                npv_multiplier *= (1 - value/200)
            elif param_type == 'process':
                # Better processes increase NPV
                npv_multiplier *= (1 + value/150)
        
        # Apply multiplier with some randomness
        npv = base_npv * npv_multiplier * (0.9 + 0.2 * random.random())
        
        # Calculate IRR (in real world, would be based on cash flows)
        # For demo, IRR will be based on NPV and some randomness
        irr = (npv / base_npv) * 0.15 * (0.8 + 0.4 * random.random())
        
        # Add to results
        npv_values.append({
            "value": npv,
            "probability": 1/iterations
        })
        
        irr_values.append({
            "value": irr,
            "probability": 1/iterations
        })
    
    # Sort values for easier visualization
    npv_values.sort(key=lambda x: x["value"])
    irr_values.sort(key=lambda x: x["value"])
    
    # Add cumulative probability
    cum_prob = 0
    for val in npv_values:
        cum_prob += val["probability"]
        val["cumulativeProbability"] = cum_prob
    
    cum_prob = 0
    for val in irr_values:
        cum_prob += val["probability"]
        val["cumulativeProbability"] = cum_prob
    
    return {
        "type": "monteCarlo",
        "parameters": parameters,
        "iterations": iterations,
        "results": {
            "npv": npv_values,
            "irr": irr_values
        }
    }
