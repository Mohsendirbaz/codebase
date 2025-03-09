"""
Validation utilities for API request parameters
"""

def validate_sensitivity_params(data):
    """
    Validate parameters for sensitivity analysis
    
    Args:
        data (dict): Request data containing parameters
        
    Returns:
        str: "valid" if valid, error message otherwise
    """
    if not data:
        return "Request body is required"
    
    parameters = data.get('parameters')
    if not parameters:
        return "Parameters are required"
    
    if not isinstance(parameters, list):
        return "Parameters must be an array"
    
    if len(parameters) == 0:
        return "At least one parameter is required"
    
    for i, param in enumerate(parameters):
        # Check parameter type
        if 'type' not in param:
            return f"Parameter {i} is missing 'type'"
        
        if not isinstance(param['type'], str):
            return f"Parameter {i} 'type' must be a string"
        
        # Check range
        if 'range' not in param:
            return f"Parameter {i} is missing 'range'"
        
        range_obj = param.get('range')
        if not isinstance(range_obj, dict):
            return f"Parameter {i} 'range' must be an object"
        
        if 'min' not in range_obj:
            return f"Parameter {i} 'range' is missing 'min'"
        
        if 'max' not in range_obj:
            return f"Parameter {i} 'range' is missing 'max'"
        
        if not (isinstance(range_obj['min'], (int, float)) and isinstance(range_obj['max'], (int, float))):
            return f"Parameter {i} 'range' 'min' and 'max' must be numbers"
        
        if range_obj['min'] >= range_obj['max']:
            return f"Parameter {i} 'range' 'min' must be less than 'max'"
        
        # Check steps
        if 'steps' not in param:
            return f"Parameter {i} is missing 'steps'"
        
        if not isinstance(param['steps'], int):
            return f"Parameter {i} 'steps' must be an integer"
        
        if param['steps'] < 2:
            return f"Parameter {i} 'steps' must be at least 2"
    
    return "valid"

def validate_monte_carlo_params(data):
    """
    Validate parameters for Monte Carlo simulation
    
    Args:
        data (dict): Request data containing parameters
        
    Returns:
        str: "valid" if valid, error message otherwise
    """
    if not data:
        return "Request body is required"
    
    parameters = data.get('parameters')
    if not parameters:
        return "Parameters are required"
    
    if not isinstance(parameters, list):
        return "Parameters must be an array"
    
    if len(parameters) == 0:
        return "At least one parameter is required"
    
    for i, param in enumerate(parameters):
        # Check parameter type
        if 'type' not in param:
            return f"Parameter {i} is missing 'type'"
        
        if not isinstance(param['type'], str):
            return f"Parameter {i} 'type' must be a string"
        
        # Check distribution
        if 'distribution' not in param:
            return f"Parameter {i} is missing 'distribution'"
        
        if not isinstance(param['distribution'], str):
            return f"Parameter {i} 'distribution' must be a string"
        
        if param['distribution'] not in ['uniform', 'normal', 'triangular']:
            return f"Parameter {i} 'distribution' must be one of: uniform, normal, triangular"
        
        # Check range
        if 'range' not in param:
            return f"Parameter {i} is missing 'range'"
        
        range_obj = param.get('range')
        if not isinstance(range_obj, dict):
            return f"Parameter {i} 'range' must be an object"
        
        if 'min' not in range_obj:
            return f"Parameter {i} 'range' is missing 'min'"
        
        if 'max' not in range_obj:
            return f"Parameter {i} 'range' is missing 'max'"
        
        if not (isinstance(range_obj['min'], (int, float)) and isinstance(range_obj['max'], (int, float))):
            return f"Parameter {i} 'range' 'min' and 'max' must be numbers"
        
        if range_obj['min'] >= range_obj['max']:
            return f"Parameter {i} 'range' 'min' must be less than 'max'"
    
    # Check iterations (optional)
    iterations = data.get('iterations')
    if iterations is not None:
        if not isinstance(iterations, int):
            return "Iterations must be an integer"
        
        if iterations < 100:
            return "Iterations must be at least 100"
        
        if iterations > 10000:
            return "Iterations must be no more than 10000"
    
    return "valid"
